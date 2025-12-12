import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SessionConfig, SessionModeId, BreakSchedule, PersonalityId } from '../types';

interface SessionContextType {
  config: SessionConfig;
  updateConfig: (updates: Partial<SessionConfig>) => void;
  resetConfig: () => void;
}

const DEFAULT_CONFIG: SessionConfig = {
  mode: 'focused',
  duration: 60,
  breakSchedule: {
    type: 'pomodoro',
    workInterval: 25,
    breakDuration: 5
  },
  personality: 'supportive_friend',
  alarmSound: 'gentle_chime',
  recoveryMethod: 'context_aware',
  workingOn: '',
  permissions: {
    camera: false,
    microphone: false,
    notifications: false
  },
  customSettings: {
    distractionTolerance: 60,
    alertVolume: 70,
    exitFriction: 'mild'
  }
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SessionConfig>(() => {
    try {
      const saved = localStorage.getItem('focustree_session_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem('focustree_session_config', JSON.stringify(config));
  }, [config]);

  const updateConfig = (updates: Partial<SessionConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates,
      // If updating custom settings, merge them instead of overwriting
      customSettings: updates.customSettings 
        ? { ...prev.customSettings, ...updates.customSettings }
        : prev.customSettings
    }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <SessionContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};