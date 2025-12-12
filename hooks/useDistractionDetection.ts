import React, { useEffect, useRef, useState, useCallback } from 'react';
import { aiService } from '../services/aiService';
import { useSession } from '../context/SessionContext';
import { useActiveSession } from '../context/ActiveSessionContext';
import { useToast } from '../context/ToastContext';
import { useTTS } from './useTTS';

declare global {
  interface Window {
    FaceDetector: any;
  }
}

// OPTIMIZATION: RGB Motion Score
const getMotionScore = (ctx: CanvasRenderingContext2D, width: number, height: number, prevData: Uint8ClampedArray | null): { score: number, data: Uint8ClampedArray } => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  if (!prevData) return { score: 1.0, data }; // First frame always counts as full motion

  let diffPixels = 0;
  let totalSampled = 0;

  // Sample every 8th pixel (32 bytes stride)
  for (let i = 0; i < data.length; i += 32) {
    const rDiff = Math.abs(data[i] - prevData[i]);
    const gDiff = Math.abs(data[i+1] - prevData[i+1]);
    const bDiff = Math.abs(data[i+2] - prevData[i+2]);
    
    // Sensitivity Threshold: Sum of diffs > 60
    if (rDiff + gDiff + bDiff > 60) {
        diffPixels++;
    }
    totalSampled++;
  }

  return { score: diffPixels / totalSampled, data };
};

const captureFrame = (video: HTMLVideoElement): string | null => {
  const canvas = document.createElement('canvas');
  canvas.width = 320; 
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.6);
};

export const useDistractionDetection = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  triggerIntervention: (type: string) => void,
  isInterventionActive: boolean
) => {
  const { config } = useSession();
  const { state } = useActiveSession();
  const { showToast } = useToast();
  const { speak } = useTTS();
  const [isMonitoring, setIsMonitoring] = useState(true);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Refs to prevent stale closures
  const stateRef = useRef(state);
  const configRef = useRef(config);
  const isInterventionActiveRef = useRef(isInterventionActive);
  const isMonitoringRef = useRef(isMonitoring);
  
  // -- TEMPORAL SMOOTHING REFS --
  // Tracks when a distraction TYPE was first detected.
  // We only trigger if Date.now() - timestamp > tolerance
  const firstDistractionTimestampRef = useRef<number | null>(null);
  
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const apiBackoffMultiplierRef = useRef<number>(1); 
  
  // Sync refs
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { isInterventionActiveRef.current = isInterventionActive; }, [isInterventionActive]);
  useEffect(() => { isMonitoringRef.current = isMonitoring; }, [isMonitoring]);

  // Reset tracking on state change
  useEffect(() => {
    if (isInterventionActive) {
        firstDistractionTimestampRef.current = null;
        prevFrameDataRef.current = null;
    }
  }, [state.status, isInterventionActive]);

  useEffect(() => {
    const handleVisibilityChange = () => setIsMonitoring(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleDetectedDistraction = (type: string, confidence: number) => {
    if (isInterventionActiveRef.current) return;

    // Default tolerance from config or fallback
    const toleranceSec = configRef.current.customSettings?.distractionTolerance || 30;
    
    // ADJUSTMENT: Hardcore mode is stricter
    const finalTolerance = configRef.current.mode === 'hardcore' ? Math.min(toleranceSec, 10) : toleranceSec;
    
    const now = Date.now();

    if (!firstDistractionTimestampRef.current) {
        // First time seeing this distraction. Start the timer.
        firstDistractionTimestampRef.current = now;
        console.log(`LOG: Potential ${type} detected. Timer started. Need ${finalTolerance}s to trigger.`);
    } else {
        // We have seen this before. How long has it been?
        const duration = (now - firstDistractionTimestampRef.current) / 1000;
        
        if (duration > finalTolerance) {
            // Threshold met! Trigger.
            console.log(`LOG: Triggering Intervention for ${type} after ${duration.toFixed(1)}s`);
            triggerIntervention(type);
            firstDistractionTimestampRef.current = null; // Reset
        } else {
             console.log(`LOG: Distraction persisting... ${duration.toFixed(1)}s / ${finalTolerance}s`);
        }
    }
  };

  const checkLoop = useCallback(async () => {
    // Guards
    if (isInterventionActiveRef.current || !videoRef.current || !isMonitoringRef.current || stateRef.current.status !== 'active') {
      timeoutRef.current = setTimeout(checkLoop, 2000);
      return;
    }

    // 1. Motion Detection
    if (!motionCanvasRef.current) {
        motionCanvasRef.current = document.createElement('canvas');
        motionCanvasRef.current.width = 64; 
        motionCanvasRef.current.height = 48;
    }
    const motionCtx = motionCanvasRef.current.getContext('2d');
    let motionScore = 0;

    if (motionCtx && videoRef.current.videoWidth > 0) {
        motionCtx.drawImage(videoRef.current, 0, 0, 64, 48);
        const { score, data } = getMotionScore(motionCtx, 64, 48, prevFrameDataRef.current);
        prevFrameDataRef.current = data;
        motionScore = score;
    }

    // 2. Adaptive Polling Interval
    // If we suspect a distraction (timer running), poll faster (3s).
    // If movement is high, poll medium (5s).
    // If static (reading), poll slow (15s).
    let nextInterval = 10000; 

    if (firstDistractionTimestampRef.current) {
        nextInterval = 3000; // Fast poll to confirm distraction
    } else if (motionScore > 0.05) {
        nextInterval = 5000; // Active movement
    } else {
        nextInterval = 15000; // Still/Reading
    }
    
    // Apply backoff if API is struggling
    nextInterval = nextInterval * apiBackoffMultiplierRef.current;

    // 3. API Call
    const frame = captureFrame(videoRef.current);
    
    if (frame) {
        try {
            const result = await aiService.analyzeMultimodalFrames(
                [frame], 
                {
                    workingOn: configRef.current.workingOn,
                    elapsedTime: stateRef.current.elapsedTime,
                    currentStreak: stateRef.current.currentStreak
                }
            );
            
            apiBackoffMultiplierRef.current = 1;

            if (!isInterventionActiveRef.current) {
                // High confidence threshold (75%)
                if (result.isDistracted && result.confidence > 75 && result.distractionType !== 'none') {
                    handleDetectedDistraction(result.distractionType, result.confidence);
                } else {
                    // SAFE: Reset the timer immediately. 
                    // This gives the user the benefit of the doubt.
                    if (firstDistractionTimestampRef.current) {
                        console.log("LOG: Distraction cleared. Timer reset.");
                        firstDistractionTimestampRef.current = null;
                    }
                }
            }
        } catch (e: any) {
            console.error("Analysis Error", e);
            if (e.message?.includes('429') || e.status === 429) {
                    apiBackoffMultiplierRef.current = Math.min(apiBackoffMultiplierRef.current * 2, 8);
            }
        }
    }

    timeoutRef.current = setTimeout(checkLoop, nextInterval);
  }, [videoRef, triggerIntervention]);

  useEffect(() => {
    checkLoop();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [checkLoop]);

  return { isMonitoring, setIsMonitoring };
};
