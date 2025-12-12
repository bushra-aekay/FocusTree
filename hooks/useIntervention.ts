import { useState, useRef, useCallback, useEffect } from 'react';
import { aiService, RecoveryTask } from '../services/aiService';
import { useSession } from '../context/SessionContext';
import { useActiveSession } from '../context/ActiveSessionContext';

export type InterventionState = 'IDLE' | 'WARNING' | 'ALARM' | 'RECOVERY';

export const useIntervention = () => {
  const { config, updateConfig } = useSession();
  const { state: sessionState, resolveDistraction } = useActiveSession();
  const [interventionState, setInterventionState] = useState<InterventionState>('IDLE');
  const [distractionType, setDistractionType] = useState<string>('');
  const [recoveryTask, setRecoveryTask] = useState<RecoveryTask | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // B. The Grace Period Timer Reference
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Text-to-Speech
  const speak = useCallback((text: string, tone?: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Simple tone mapping
    if (tone === 'strict') { utterance.rate = 1.2; utterance.pitch = 0.8; }
    else if (tone === 'gentle') { utterance.rate = 0.9; utterance.pitch = 1.1; }
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const startAlarm = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    // Stop existing
    stopAlarm();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
    
    // Volume from settings (0-100) -> 0.0 - 0.5 (max gain safety)
    const volumePercent = config.customSettings?.alertVolume ?? 80;
    const safeGain = (volumePercent / 100) * 0.5;
    
    gain.gain.setValueAtTime(safeGain, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    
    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
  }, [config.customSettings?.alertVolume]);

  const stopAlarm = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      stopAlarm();
    };
  }, [stopAlarm]);

  // OPTIMIZATION: Agentic Intervention
  const triggerIntervention = async (type: string) => {
    // Clear any pending alarms from previous triggers to prevent overlaps
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    
    setDistractionType(type);
    
    // 1. Ask Gemini to plan the intervention
    // While waiting (latency), set state to WARNING to block UI
    setInterventionState('WARNING'); 

    try {
        const plan = await aiService.planIntervention(type, {
            workingOn: config.workingOn,
            personality: config.personality,
            distractionCount: sessionState.distractionCount,
            history: sessionState.distractionBreakdown // Pass meaningful history
        });

        // 2. Execute Plan
        speak(plan.customMessage, plan.interventionTone);
        
        // Dynamically update recovery method based on AI recommendation
        if (plan.recommendedRecovery && plan.recommendedRecovery !== config.recoveryMethod) {
            updateConfig({ recoveryMethod: plan.recommendedRecovery as any });
        }

        // 3. Pre-load task if needed
        if (plan.recommendedRecovery === 'context_aware') {
            aiService.generateRecoveryTask(config.workingOn).then(setRecoveryTask);
        }

        // 4. Schedule Alarm based on AI decision
        if (plan.shouldAlarm) {
            // B. The Grace Period Timer
            warningTimeoutRef.current = setTimeout(() => {
                setInterventionState(current => {
                    // Critical Check: Only escalate if we are still in WARNING
                    // If user clicked "I'm Back", current will be IDLE or RECOVERY
                    if (current === 'WARNING') {
                        startAlarm();
                        return 'ALARM';
                    }
                    return current;
                });
            }, 6000); // Give time for TTS to finish
        }

    } catch (e) {
        console.error("Intervention plan failed", e);
        // Fallback
        speak("Focus check. Get back to work.");
        warningTimeoutRef.current = setTimeout(() => {
             startAlarm();
             setInterventionState('ALARM');
        }, 5000);
    }
  };

  const resolveIntervention = () => {
    // C. The State Reset
    if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
    }
    stopAlarm();
    setInterventionState('IDLE');
    setDistractionType('');
    setRecoveryTask(null); // Clear used task
    resolveDistraction(); // Resume session time
  };

  const handleImBack = () => {
    // C. The State Reset (Partial)
    if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
    }
    stopAlarm();
    
    if (config.recoveryMethod === 'context_aware' || config.recoveryMethod === 'physical_reset' || config.recoveryMethod === 'reflection') {
      setInterventionState('RECOVERY');
    } else {
      resolveIntervention();
    }
  };

  return {
    interventionState,
    distractionType,
    recoveryTask,
    triggerIntervention,
    handleImBack,
    resolveIntervention,
    stopAlarm
  };
};