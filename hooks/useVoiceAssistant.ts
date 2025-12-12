import { useState, useCallback, useRef } from 'react';
import { useActiveSession } from '../context/ActiveSessionContext';
import { useSession } from '../context/SessionContext';
import { aiService } from '../services/aiService';
import { useTTS } from './useTTS';

interface UseVoiceAssistantResult {
  isThinking: boolean;
  handleUserMessage: (text: string, isVoice?: boolean) => Promise<void>;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  rateLimitWarning: string | null;
}

const MAX_REQUESTS_PER_HOUR = 15;

export const useVoiceAssistant = (): UseVoiceAssistantResult => {
  const { state, sendMessage, addAiMessage } = useActiveSession();
  const { config } = useSession();
  const { speak, stop, isSpeaking } = useTTS();
  
  const [isThinking, setIsThinking] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  
  const isProcessingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  
  // --- FIX 4: RESPONSE CACHE ---
  const responseCacheRef = useRef<Map<string, string>>(new Map());
  
  const usageRef = useRef({
    count: 0,
    resetTime: Date.now() + 3600000 
  });

  const processQueue = async () => {
    if (queueRef.current.length === 0) {
        isProcessingRef.current = false;
        setIsThinking(false);
        return;
    }

    isProcessingRef.current = true;
    setIsThinking(true);
    const text = queueRef.current.shift();

    if (text) {
        try {
            await processRequest(text);
        } catch (e) {
            console.error("Queue process error", e);
        }
    }

    await processQueue();
  };

  const processRequest = async (text: string) => {
      sendMessage(text);

      const cacheKey = text.trim().toLowerCase();
      // Check Cache
      if (responseCacheRef.current.has(cacheKey)) {
          console.log("LOG: Using cached response for assistant");
          const cachedResponse = responseCacheRef.current.get(cacheKey)!;
          addAiMessage(cachedResponse);
          speak(cachedResponse, config.personality);
          return;
      }

      try {
        const aiResponse = await aiService.chatWithAssistant(
          text,
          state.chatHistory,
          {
            workingOn: config.workingOn,
            elapsedTime: state.elapsedTime,
            personality: config.personality,
            questionCount: usageRef.current.count
          }
        );

        // Store in Cache
        responseCacheRef.current.set(cacheKey, aiResponse);

        addAiMessage(aiResponse);
        speak(aiResponse, config.personality);
      } catch (error) {
        console.error("Assistant Error", error);
        addAiMessage("I'm having trouble connecting. Let's focus on work for now.");
      }
  };

  const handleUserMessage = useCallback(async (text: string, isVoice: boolean = false) => {
    // 1. Check Rate Limit
    const now = Date.now();
    if (now > usageRef.current.resetTime) {
        usageRef.current.count = 0;
        usageRef.current.resetTime = now + 3600000;
    }

    // Only count if not cached (approximated, since queue processes async, but good enough)
    const cacheKey = text.trim().toLowerCase();
    if (!responseCacheRef.current.has(cacheKey)) {
         if (usageRef.current.count >= MAX_REQUESTS_PER_HOUR) {
            const warning = `Rate limit reached. ${MAX_REQUESTS_PER_HOUR} questions per hour max.`;
            setRateLimitWarning(warning);
            speak("I can't answer any more questions right now. Focus on your work.", config.personality);
            return;
        }
        usageRef.current.count++;
    }

    if (isProcessingRef.current) {
        if (queueRef.current.length > 2) return; 
        queueRef.current.push(text);
    } else {
        queueRef.current.push(text);
        processQueue();
    }
    
    setRateLimitWarning(null);
  }, [state.chatHistory, config, sendMessage, addAiMessage, speak]);

  const stopSpeaking = () => {
    stop();
  };

  return {
    isThinking,
    handleUserMessage,
    isSpeaking,
    stopSpeaking,
    rateLimitWarning
  };
};