import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { ChatMessage, PersonalityId, SessionRecord, SessionInsights, SessionConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Utilities ---

// 1. ROBUST JSON PARSER
// Handles markdown, conversational prefixes, and dirty strings
const cleanAndParseJSON = (text: string) => {
  if (!text) throw new Error("Empty response from AI");

  // Step 1: Remove markdown code blocks
  let clean = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // Step 2: Try parsing strictly
  try {
    return JSON.parse(clean);
  } catch (e) {
    // Step 3: If failed, try to extract the JSON object using regex/substring
    // This handles "Here is the JSON: { ... }" cases
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1) {
        const potentialJson = clean.substring(firstOpen, lastClose + 1);
        try {
            return JSON.parse(potentialJson);
        } catch (e2) {
            console.error("Deep JSON Parse Failed:", clean);
            throw new Error("Invalid JSON structure in response");
        }
    }
    
    console.error("JSON Parse Failed (No object found):", text);
    throw new Error("No JSON object found in response");
  }
};

// 2. TIMEOUT WRAPPER
// Prevents the detection loop from hanging indefinitely if the network stalls.
const withTimeout = async <T>(promise: Promise<T>, ms: number, fallbackValue?: T): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
        if (fallbackValue !== undefined) {
             reject(new Error("Timeout")); 
        } else {
             reject(new Error("Request timed out"));
        }
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (error) {
    clearTimeout(timer);
    if (fallbackValue !== undefined) return fallbackValue;
    throw error;
  }
};

// --- Schemas ---

const multimodalAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isDistracted: { type: Type.BOOLEAN },
    distractionType: { type: Type.STRING, enum: ["phone", "leftDesk", "none"] },
    confidence: { type: Type.INTEGER },
  },
  required: ["isDistracted", "distractionType", "confidence"],
};

const interventionPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    interventionTone: { type: Type.STRING, enum: ["gentle", "firm", "strict", "humorous"] },
    customMessage: { type: Type.STRING },
    recommendedRecovery: { type: Type.STRING, enum: ["context_aware", "physical_reset", "reflection", "simple_click"] },
    shouldAlarm: { type: Type.BOOLEAN }
  },
  required: ["interventionTone", "customMessage", "recommendedRecovery", "shouldAlarm"]
};

const sessionSuggestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recommendedDuration: { type: Type.INTEGER },
    recommendedMode: { type: Type.STRING, enum: ["hardcore", "focused", "chill"] },
    recommendedPersonality: { type: Type.STRING },
    reasoning: { type: Type.STRING },
    tips: { type: Type.STRING }
  },
  required: ["recommendedDuration", "recommendedMode", "reasoning"]
};

const recoveryTaskSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    taskType: { type: Type.STRING, enum: ["definition", "explanation", "listing", "planning"] },
    taskPrompt: { type: Type.STRING },
    estimatedTime: { type: Type.INTEGER },
  },
  required: ["taskType", "taskPrompt", "estimatedTime"],
};

const recoveryTaskBatchSchema: Schema = {
  type: Type.ARRAY,
  items: recoveryTaskSchema
};

const insightsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    positive: { type: Type.STRING },
    improvement: { type: Type.STRING },
    pattern: { type: Type.STRING },
  },
  required: ["positive", "improvement", "pattern"],
};

export interface RecoveryTask {
  taskType: "definition" | "explanation" | "listing" | "planning";
  taskPrompt: string;
  expectedAnswerType?: "text" | "shortText" | "list";
  estimatedTime: number;
}

// --- Module Cache ---
let recoveryTaskCache: RecoveryTask[] = [];

// --- Service ---

export const aiService = {
  
  analyzeMultimodalFrames: async (
    frames: string[], 
    context: { workingOn: string; elapsedTime: number; currentStreak: number }
  ) => {
    // Fallback: If timeout (5s) occurs, assume User is SAFE to keep loop running
    const fallback = { isDistracted: false, distractionType: "none", confidence: 0 };

    return withTimeout(
      (async () => {
        try {
          const cleanFrames = frames.map(f => f.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""));
          
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              { 
                role: "user", 
                parts: [
                  // Updated Prompt: More specific rules to avoid false positives
                  { text: `Analyze image for productivity. Return ONLY JSON: { "isDistracted": boolean, "distractionType": "phone" | "leftDesk" | "none", "confidence": number (0-100) }. 
                  
                  Rules:
                  1. "phone": ONLY trigger if user is actively HOLDING phone near face or typing. Phone simply lying on desk is NOT a distraction.
                  2. "leftDesk": Trigger if chair is clearly empty. If person is partially visible or reaching for something, return "none".
                  3. "none": Drinking water, writing notes, or looking at monitor are NOT distractions.
                  
                  Be lenient. If unsure, return "none".` },
                  { inlineData: { mimeType: "image/jpeg", data: cleanFrames[0] }}
                ]
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: multimodalAnalysisSchema,
              maxOutputTokens: 100, 
            },
          }) as GenerateContentResponse;

          if (response.text) {
            return cleanAndParseJSON(response.text);
          }
          return fallback;
        } catch (error: any) {
          console.error("AI Analysis Failed:", error);
          return fallback;
        }
      })(),
      5000, // 5 Second Timeout
      fallback
    );
  },

  planIntervention: async (
    distractionType: string,
    context: { 
      workingOn: string; 
      personality: PersonalityId; 
      distractionCount: number;
      history: any 
    }
  ) => {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: `User distracted (${distractionType}). Task: ${context.workingOn}. Personality: ${context.personality}. Plan intervention.` }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: interventionPlanSchema,
            maxOutputTokens: 200,
          }
        }),
        8000
      ) as GenerateContentResponse;
      
      return cleanAndParseJSON(response.text!);
    } catch (e) {
      return {
        interventionTone: "firm",
        customMessage: "Focus check. Let's get back to work.",
        recommendedRecovery: "simple_click",
        shouldAlarm: true
      };
    }
  },

  suggestSessionConfig: async (
    userHistory: SessionRecord[],
    currentGoal: string
  ): Promise<Partial<SessionConfig> & { reasoning: string, tips: string }> => {
    try {
      const recentHistory = userHistory.slice(0, 3).map(s => ({
        d: s.totalDuration,
        f: s.focusPercentage,
      }));

      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: `Suggest config. History: ${JSON.stringify(recentHistory)}. Goal: "${currentGoal}"` }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: sessionSuggestionSchema,
          }
        }),
        6000
      ) as GenerateContentResponse;

      const result = cleanAndParseJSON(response.text!);
      return {
        duration: result.recommendedDuration,
        mode: result.recommendedMode,
        personality: result.recommendedPersonality,
        reasoning: result.reasoning,
        tips: result.tips
      } as any;
    } catch (e) {
      return {
        duration: 25,
        mode: 'focused',
        personality: 'supportive_friend',
        reasoning: "Starting with a standard focused session.",
        tips: "Clear your desk."
      } as any;
    }
  },

  generateRecoveryTask: async (workingOn: string): Promise<RecoveryTask> => {
    if (recoveryTaskCache.length > 0) return recoveryTaskCache.pop()!;

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Generate 5 quick engagement tasks for: "${workingOn}".`,
          config: {
            responseMimeType: "application/json",
            responseSchema: recoveryTaskBatchSchema,
          }
        }),
        8000
      ) as GenerateContentResponse;
      
      const tasks = cleanAndParseJSON(response.text!) as RecoveryTask[];
      if (tasks && tasks.length > 0) {
        const first = tasks.pop()!;
        recoveryTaskCache = tasks; 
        return first;
      }
      throw new Error("No tasks");
    } catch (error) {
      return {
        taskType: "planning",
        taskPrompt: "What is the next immediate step?",
        estimatedTime: 20
      };
    }
  },

  validateRecoveryAnswer: async (task: string, answer: string, workingOn: string) => {
    if (answer.trim().length < 3) return { isValid: false, feedback: "Too short." };
    if (answer.length > 10) return { isValid: true, feedback: "Good." };
    
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Task: "${task}". Ans: "${answer}". Valid? JSON {isValid: bool}`,
          config: { responseMimeType: "application/json", maxOutputTokens: 20 }
        }),
        5000
      ) as GenerateContentResponse;
      return cleanAndParseJSON(response.text!);
    } catch (e) { 
        return { isValid: true, feedback: "Accepted." }; 
    }
  },

  chatWithAssistant: async (userMessage: string, history: ChatMessage[], context: any) => {
    try {
      // Limit context to save tokens
      const recentHistory = history.slice(-6).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [...recentHistory, { role: 'user', parts: [{ text: userMessage }] }],
          config: {
            systemInstruction: `Assistant for: ${context.workingOn}. Be brief.`,
            maxOutputTokens: 100,
          }
        }),
        6000
      ) as GenerateContentResponse;
      return response.text || "Let's focus.";
    } catch (e) { 
        return "Let's get back to work."; 
    }
  },

  generateSessionInsights: async (sessionData: SessionRecord): Promise<SessionInsights> => {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Insights for: ${JSON.stringify({t: sessionData.totalDuration, f: sessionData.focusPercentage, d: sessionData.distractionCount})}`,
          config: { responseMimeType: "application/json", responseSchema: insightsSchema },
        }),
        8000
      ) as GenerateContentResponse;
      return cleanAndParseJSON(response.text!);
    } catch (e) {
      return { 
          positive: "Good focus session.", 
          improvement: "Try to reduce interruptions.", 
          pattern: "Consistent effort." 
      };
    }
  }
};