import { User } from '../types';

export const authService = {
  /**
   * Creates a new local user profile
   */
  createLocalUser: (name: string): User => {
    const newUser: User = {
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: "local@focustree.app", // Placeholder
      displayName: name,
      // Generate a simple avatar
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
      createdAt: new Date().toISOString(),
      totalFocusHours: 0,
      treeProgress: 0,
      treeLevel: 1,
      achievements: [],
      preferences: {
        defaultMode: "focused",
        defaultPersonality: "supportive_friend"
      },
      sessions: []
    };
    
    try {
      localStorage.setItem('focustree_user', JSON.stringify(newUser));
    } catch (e) {
      console.error("Failed to save new user to local storage", e);
    }
    
    return newUser;
  },

  /**
   * Clears local user data
   */
  logout: (): void => {
    localStorage.removeItem('focustree_user');
  },

  /**
   * Checks for an existing session
   */
  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem('focustree_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }
};