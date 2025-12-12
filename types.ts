
export interface UserPreferences {
  defaultMode: 'focused' | 'relaxed';
  defaultPersonality: 'supportive_friend' | 'strict_coach';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface SessionInsights {
  positive: string;
  improvement: string;
  pattern: string;
}

export interface SessionRecord {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime: number;
  
  // Core metrics
  totalDuration: number; // minutes
  focusTime: number; // minutes
  distractedTime: number; // minutes
  focusPercentage: number;
  
  // Distraction data
  distractionCount: number;
  distractionBreakdown: DistractionBreakdown;
  longestStreak: number; // minutes
  
  // Context
  mode: SessionModeId;
  workingOn: string;
  
  // Derived
  insights?: SessionInsights;
}

export interface Session {
  id: string;
  startTime: string;
  durationMinutes: number;
  completed: boolean;
  // ... other fields mapped from SessionRecord if needed for dashboard list
}

export interface User {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  totalFocusHours: number;
  treeProgress: number; // 0-100 representing progress to next level
  treeLevel: number; // 1 = Seed, 2 = Sprout, etc.
  preferences: UserPreferences;
  sessions: SessionRecord[];
  achievements: Achievement[];
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Session Configuration Types
export type SessionModeId = 'hardcore' | 'focused' | 'chill' | 'custom';

export interface BreakSchedule {
  type: 'pomodoro' | 'extended' | 'custom' | 'none';
  workInterval: number; // minutes
  breakDuration: number; // minutes
}

export type PersonalityId = 'supportive_friend' | 'drill_sergeant' | 'roast_mode' | 'calm_coach' | 'hype_mode';

export interface SessionConfig {
  mode: SessionModeId;
  duration: number; // minutes
  breakSchedule: BreakSchedule;
  personality: PersonalityId;
  alarmSound: string;
  recoveryMethod: string;
  workingOn: string;
  permissions: {
    camera: boolean;
    microphone: boolean;
    notifications: boolean;
  };
  customSettings?: {
    distractionTolerance: number; // seconds
    alertVolume: number; // 0-100
    exitFriction: 'none' | 'mild' | 'severe';
  };
}

// Active Session State Types
export type SessionStatus = 'active' | 'paused' | 'break' | 'distracted' | 'completed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

export interface DistractionBreakdown {
  phone: number;
  leftDesk: number;
  socialMedia: number;
  other: number;
}

export interface ActiveSessionState {
  status: SessionStatus;
  startTime: number;
  elapsedTime: number; // Total seconds since start
  focusTime: number; // Productive seconds
  distractionTime: number;
  distractionCount: number;
  distractionBreakdown: DistractionBreakdown;
  currentStreak: number; // minutes
  longestStreak: number; // minutes
  nextBreakIn: number; // seconds remaining until break
  breaksTaken: number;
  chatHistory: ChatMessage[];
  isMinimized: boolean; // For the floating overlay view
}
