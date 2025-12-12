import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ActiveSessionState, ChatMessage, SessionConfig, DistractionBreakdown } from '../types';
import { useSession } from './SessionContext';

interface ActiveSessionContextType {
  state: ActiveSessionState;
  sendMessage: (content: string) => void;
  addAiMessage: (content: string) => void;
  togglePause: () => void;
  endSession: () => void;
  minimizeApp: () => void;
  maximizeApp: () => void;
  startBreak: () => void;
  endBreak: () => void;
  extendBreak: () => void;
  registerDistraction: (type: string) => void;
  resolveDistraction: () => void;
  resetSession: () => void;
}

const ActiveSessionContext = createContext<ActiveSessionContextType | undefined>(undefined);

const DEFAULT_STATE: ActiveSessionState = {
    status: 'completed', // Default to completed so we don't start a timer automatically
    startTime: 0,
    elapsedTime: 0,
    focusTime: 0,
    distractionTime: 0,
    distractionCount: 0,
    distractionBreakdown: { phone: 0, leftDesk: 0, socialMedia: 0, other: 0 },
    currentStreak: 0,
    longestStreak: 0,
    nextBreakIn: 0,
    breaksTaken: 0,
    chatHistory: [],
    isMinimized: false
};

export const ActiveSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { config } = useSession();
  
  // Initialize state from local storage if available
  const [state, setState] = useState<ActiveSessionState>(() => {
    try {
      const saved = localStorage.getItem('focustree_active_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if it was active/paused/break/distracted and created less than 24h ago
        // AND not 'completed'
        if (['active', 'paused', 'break', 'distracted'].includes(parsed.status) && (Date.now() - parsed.startTime < 86400000)) {
           return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load session", e);
    }
    return DEFAULT_STATE;
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistence Effect
  useEffect(() => {
    if (state.status === 'completed') {
        localStorage.removeItem('focustree_active_session');
    } else {
        localStorage.setItem('focustree_active_session', JSON.stringify(state));
    }
  }, [state]);

  // Auto-Start Logic
  // If we mount and the state is "completed" or "fresh", we assume a NEW session is requested
  useEffect(() => {
    if (state.status === 'completed' || state.startTime === 0) {
       // Start Fresh
       setState({
         ...DEFAULT_STATE,
         status: 'active',
         startTime: Date.now(),
         nextBreakIn: config.breakSchedule.type !== 'none' ? config.breakSchedule.workInterval * 60 : Infinity
       });
    }
  }, []); // Only on mount

  // Timer Logic
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (state.status === 'active') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          const isBreakDue = prev.nextBreakIn <= 1;
          if (isBreakDue && config.breakSchedule.type !== 'none') {
             return {
               ...prev,
               status: 'break',
               nextBreakIn: config.breakSchedule.breakDuration * 60,
               breaksTaken: prev.breaksTaken + 1
             };
          }
          const newStreak = prev.currentStreak + (1/60);
          return {
            ...prev,
            elapsedTime: prev.elapsedTime + 1,
            focusTime: prev.focusTime + 1,
            nextBreakIn: prev.nextBreakIn - 1,
            currentStreak: newStreak,
            longestStreak: Math.max(prev.longestStreak, newStreak)
          };
        });
      }, 1000);
    } else if (state.status === 'distracted') {
      // While distracted, we count elapsed time and distraction time, but NOT focus time
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
          distractionTime: prev.distractionTime + 1,
          // We do not decrement nextBreakIn to avoid giving breaks during distractions? 
          // Actually let's decrement it to keep schedule aligned, but maybe pause it? 
          // Let's pause break timer while distracted.
        }));
      }, 1000);
    } else if (state.status === 'break') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.nextBreakIn <= 1) {
             const nextWorkInterval = config.breakSchedule.workInterval * 60;
             new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => {});
             return {
               ...prev,
               status: 'active',
               nextBreakIn: nextWorkInterval
             };
          }
          return { ...prev, nextBreakIn: prev.nextBreakIn - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, config.breakSchedule]);

  const sendMessage = (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMsg]
    }));
  };

  const addAiMessage = (content: string) => {
    const aiMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'ai',
      content,
      timestamp: Date.now()
    };
    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, aiMsg]
    }));
  };

  const togglePause = () => setState(prev => {
      if (prev.status === 'active' || prev.status === 'distracted') return { ...prev, status: 'paused' };
      if (prev.status === 'paused') return { ...prev, status: 'active' };
      return prev;
  });
  
  const endSession = () => {
      setState(prev => ({ ...prev, status: 'completed' }));
      localStorage.removeItem('focustree_active_session');
  };

  const minimizeApp = () => setState(prev => ({ ...prev, isMinimized: true }));
  const maximizeApp = () => setState(prev => ({ ...prev, isMinimized: false }));

  const startBreak = () => setState(prev => ({
      ...prev,
      status: 'break',
      nextBreakIn: config.breakSchedule.breakDuration * 60,
      breaksTaken: prev.breaksTaken + 1
  }));

  const endBreak = () => setState(prev => ({
      ...prev,
      status: 'active',
      nextBreakIn: config.breakSchedule.workInterval * 60
  }));

  const extendBreak = () => setState(prev => ({ ...prev, nextBreakIn: prev.nextBreakIn + 300 }));

  const registerDistraction = (rawType: string) => {
    // Map raw AI types to our Breakdown keys
    let type: keyof DistractionBreakdown = 'other';
    const lowerType = rawType.toLowerCase();

    if (lowerType.includes('phone') || lowerType.includes('texting')) type = 'phone';
    else if (lowerType.includes('left') || lowerType.includes('missing')) type = 'leftDesk';
    else if (lowerType.includes('social')) type = 'socialMedia';
    else type = 'other';

    // NOTIFICATION LOGIC
    // 1. Phone detected? -> Notify (All modes)
    // 2. Left Desk? -> Notify only if Hardcore
    if (Notification.permission === 'granted' && !document.hasFocus()) {
       let shouldNotify = false;
       
       if (type === 'phone') {
           shouldNotify = true;
       } else if (type === 'leftDesk' && config.mode === 'hardcore') {
           shouldNotify = true;
       }

       if (shouldNotify) {
          new Notification("Focus Lost!", { 
              body: type === 'phone' ? "Put the phone down!" : "Get back to your tree.", 
              icon: '/favicon.ico' 
          });
       }
    }

    setState(prev => ({
      ...prev,
      status: 'distracted',
      distractionCount: prev.distractionCount + 1,
      currentStreak: 0,
      distractionBreakdown: {
        ...prev.distractionBreakdown,
        [type]: (prev.distractionBreakdown[type] || 0) + 1
      }
    }));
  };

  const resolveDistraction = () => {
    setState(prev => ({
        ...prev,
        status: 'active'
    }));
  };
  
  const resetSession = () => {
      setState(DEFAULT_STATE);
      localStorage.removeItem('focustree_active_session');
  };

  return (
    <ActiveSessionContext.Provider 
      value={{ 
        state, 
        sendMessage, 
        addAiMessage,
        togglePause, 
        endSession, 
        minimizeApp, 
        maximizeApp,
        startBreak,
        endBreak,
        extendBreak,
        registerDistraction,
        resolveDistraction,
        resetSession
      }}
    >
      {children}
    </ActiveSessionContext.Provider>
  );
};

export const useActiveSession = (): ActiveSessionContextType => {
  const context = useContext(ActiveSessionContext);
  if (context === undefined) {
    throw new Error('useActiveSession must be used within an ActiveSessionProvider');
  }
  return context;
};