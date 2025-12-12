import { User, SessionRecord, Achievement, UserPreferences } from '../types';

export const userService = {
  // Mock saving session to local storage with Quota Safety
  saveSession: async (session: SessionRecord): Promise<User> => {
    const userStr = localStorage.getItem('focustree_user');
    if (!userStr) throw new Error("User not found");

    let user: User = JSON.parse(userStr);

    // Prevent duplicates (React Strict Mode or Loop protection)
    if (user.sessions.some(s => s.sessionId === session.sessionId)) {
        return user;
    }

    // 1. Add session
    user.sessions = [session, ...user.sessions];

    // 2. Update Aggregates
    const hours = session.focusTime / 60;
    user.totalFocusHours = Math.round((user.totalFocusHours + hours) * 100) / 100;

    // 3. Tree Progress Logic
    const HOURS_PER_LEVEL = 5;
    const currentLevelProgress = (user.totalFocusHours % HOURS_PER_LEVEL) / HOURS_PER_LEVEL * 100;
    user.treeProgress = Math.round(currentLevelProgress);
    user.treeLevel = Math.floor(user.totalFocusHours / HOURS_PER_LEVEL) + 1;

    // 4. Check Achievements
    const newAchievements = checkAchievements(user, session);
    user.achievements = [...(user.achievements || []), ...newAchievements];

    // 5. Safe Save with Quota Handling
    try {
      localStorage.setItem('focustree_user', JSON.stringify(user));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Storage quota exceeded. Pruning old sessions...");
        
        // Keep only last 50 sessions if full
        if (user.sessions.length > 50) {
            user.sessions = user.sessions.slice(0, 50);
            try {
               localStorage.setItem('focustree_user', JSON.stringify(user));
            } catch (retryErr) {
               console.error("Critical: Could not save session even after pruning.");
               // Worst case: Don't save history, just stats
               // In a real app, this is where we'd error out or use IndexedDB
            }
        }
      } else {
        throw e;
      }
    }
    
    return user;
  },

  updatePreferences: async (prefs: Partial<UserPreferences> & any): Promise<User> => {
    const userStr = localStorage.getItem('focustree_user');
    if (!userStr) throw new Error("User not found");
    
    let user: User = JSON.parse(userStr);
    user.preferences = { ...user.preferences, ...prefs };
    
    localStorage.setItem('focustree_user', JSON.stringify(user));
    return user;
  },

  getUser: (): User | null => {
    const stored = localStorage.getItem('focustree_user');
    return stored ? JSON.parse(stored) : null;
  },

  getDashboardStats: (user: User) => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
    
    // Today's Stats
    const todaySessions = user.sessions.filter(s => s.startTime >= todayStart);
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.focusTime, 0);
    const todayDistractions = todaySessions.reduce((acc, s) => acc + s.distractionCount, 0);
    const todayLongestStreak = Math.max(...todaySessions.map(s => s.longestStreak), 0);

    // Weekly Stats
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    let weekTotalMinutes = 0;

    // Relative Week View (Mon-Sun or relative to today)
    const currentDay = new Date().getDay(); // 0 = Sun
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Distance to last Monday
    const mondayDate = new Date(new Date().setDate(new Date().getDate() + mondayOffset));
    mondayDate.setHours(0,0,0,0);

    for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        const dStart = d.getTime();
        const dEnd = dStart + 86400000;
        
        const dayMins = user.sessions
            .filter(s => s.startTime >= dStart && s.startTime < dEnd)
            .reduce((acc, s) => acc + s.focusTime, 0);
        
        weekTotalMinutes += dayMins;
        weeklyData.push({
            day: days[d.getDay()],
            minutes: dayMins,
            isToday: d.toDateString() === new Date().toDateString()
        });
    }

    return {
        todayMinutes,
        todayDistractions,
        todayLongestStreak,
        weeklyData,
        weekTotalMinutes,
        recentSessions: user.sessions.slice(0, 5)
    };
  }
};

const checkAchievements = (user: User, currentSession: SessionRecord): Achievement[] => {
  const newUnlocked: Achievement[] = [];
  const existingIds = new Set(user.achievements?.map(a => a.id) || []);

  const add = (id: string, name: string, description: string, icon: string) => {
    if (!existingIds.has(id)) {
      newUnlocked.push({ id, name, description, icon, unlockedAt: Date.now() });
    }
  };

  // First Session
  if (user.sessions.length === 1) {
    add('first_session', 'First Step', 'Completed your first focus session', '🌱');
  }

  // First Hour
  if (currentSession.focusTime >= 60) {
    add('first_hour', 'Power Hour', 'Focused for 60+ minutes in one go', '⏰');
  }

  // Streak Master (25 min uninterrupted)
  if (currentSession.longestStreak >= 25) {
    add('streak_master', 'In The Zone', 'Achieved a 25+ minute focus streak', '🔥');
  }

  // Zero Distractions
  if (currentSession.distractionCount === 0 && currentSession.totalDuration >= 20) {
    add('laser_focus', 'Laser Focus', 'Completed a session with 0 distractions', '🎯');
  }

  // 10 Hours Total
  if (user.totalFocusHours >= 10) {
    add('dedication_10', 'Dedicated', 'Reached 10 total hours of focus', '🌳');
  }
  
  // Early Bird (Before 8am)
  const hour = new Date(currentSession.startTime).getHours();
  if (hour < 8 && hour >= 4) {
      add('early_bird', 'Early Bird', 'Completed a session before 8 AM', '🌅');
  }
  
  // Night Owl (After 10pm)
  if (hour >= 22 || hour < 4) {
      add('night_owl', 'Night Owl', 'Completed a session late at night', '🦉');
  }

  return newUnlocked;
};