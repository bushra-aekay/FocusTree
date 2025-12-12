import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { userService } from '../services/userService';
import { ThemeToggle } from '../components/ThemeToggle';
import { 
  LogOut, User as UserIcon, Clock, Sprout, Play, 
  Settings, TrendingUp, Calendar, Trophy, ChevronRight, Zap
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { updateConfig } = useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!user) return null;
    return userService.getDashboardStats(user);
  }, [user]);

  if (!user || !stats) return null;

  const handleQuickStart = () => {
    updateConfig({
       mode: user.preferences.defaultMode as any || 'focused',
       duration: 25,
       personality: user.preferences.defaultPersonality as any || 'supportive_friend',
       workingOn: 'Quick Session' 
    });
    showToast("Quick start settings loaded!", "success");
    navigate('/session/permissions');
  };

  const handleLogout = async () => {
    await logout();
    showToast("Logged out successfully", "info");
    navigate('/login');
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getTreeIcon = () => {
     if (user.treeLevel === 1) return "🌱";
     if (user.treeLevel === 2) return "🌿";
     if (user.treeLevel === 3) return "🌲";
     if (user.treeLevel === 4) return "🌳";
     return "🌳";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
      {/* Header - Increased z-index to 50 to prevent overlap */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-700 transition-colors">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer" onClick={() => window.location.reload()}>
             <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 md:p-2 rounded-lg">
                <Sprout className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
             </div>
             <span className="font-bold text-lg md:text-xl text-gray-800 dark:text-white tracking-tight">FocusTree</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
               <img 
                 src={user.photoURL} 
                 alt={user.displayName} 
                 className="w-6 h-6 rounded-full"
               />
               <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">{user.displayName}</span>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-sm hidden sm:flex dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 md:px-6 py-6 md:py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* LEFT COLUMN (Profile & Quick Stats) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Tree Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-100 dark:border-gray-700 text-center relative overflow-hidden group hover:shadow-md transition-all">
               <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent"></div>
               <div className="relative z-10">
                 <div className="text-5xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-500 cursor-default">{getTreeIcon()}</div>
                 <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">Your Tree</h2>
                 <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-6">Level {user.treeLevel}</p>
                 
                 <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 mb-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${user.treeProgress}%` }}
                    ></div>
                 </div>
                 <p className="text-xs text-gray-400 dark:text-gray-500">
                    {user.treeProgress}% to Level {user.treeLevel + 1}
                 </p>
               </div>
            </div>

            {/* Today's Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
               <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-emerald-500" />
                  Today's Summary
               </h3>
               {stats.todayMinutes === 0 ? (
                 <div className="text-center py-4 text-gray-400 text-sm">
                   <p>No activity yet today.</p>
                   <p>Start a session to fill this!</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                       <span className="text-sm text-gray-600 dark:text-gray-300">Focus Time</span>
                       <span className="font-bold text-gray-900 dark:text-white">{formatTime(stats.todayMinutes)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                       <span className="text-sm text-gray-600 dark:text-gray-300">Distractions</span>
                       <span className="font-bold text-gray-900 dark:text-white">{stats.todayDistractions}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                       <span className="text-sm text-gray-600 dark:text-gray-300">Best Streak</span>
                       <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.todayLongestStreak}m</span>
                    </div>
                 </div>
               )}
            </div>

            {/* Achievements Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-amber-500" />
                    Achievements
                  </h3>
                  <span className="text-xs font-medium text-gray-400">{user.achievements.length} Unlocked</span>
               </div>
               
               <div className="grid grid-cols-4 gap-2">
                 {user.achievements.slice(0, 8).map(ach => (
                   <div key={ach.id} className="aspect-square bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-2xl cursor-help hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-transparent dark:border-amber-900/30" title={`${ach.name}: ${ach.description}`}>
                     {ach.icon}
                   </div>
                 ))}
                 {[...Array(Math.max(0, 4 - user.achievements.length))].map((_, i) => (
                   <div key={i} className="aspect-square bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-600">
                     <span className="opacity-20 select-none">🔒</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Main Content) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Welcome & CTA - relative z-10 works here because header is z-50 */}
            <div className="bg-emerald-600 dark:bg-emerald-700 rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-emerald-500/10 relative overflow-hidden transition-all hover:shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-black opacity-10 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                 <div>
                   <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {user.displayName.split(' ')[0]}! 👋</h1>
                   <p className="text-emerald-100 max-w-md leading-relaxed text-sm md:text-base">
                      Ready to grow your forest? A 25-minute session is the perfect way to start your day.
                   </p>
                 </div>
                 <div className="flex flex-col gap-2 w-full md:w-auto">
                    <Button 
                      onClick={() => navigate('/session/mode')}
                      className="bg-white text-emerald-700 hover:bg-emerald-50 border-none px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold shadow-lg w-full"
                      icon={<Play className="w-5 h-5 fill-current" />}
                    >
                      Start Session
                    </Button>
                    <button 
                      onClick={handleQuickStart}
                      className="flex items-center justify-center text-emerald-100 text-xs hover:text-white transition-colors py-2"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Quick Start (Saved Settings)
                    </button>
                 </div>
               </div>
            </div>

            {/* Weekly Progress Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-emerald-500" />
                    This Week
                  </h3>
                  <div className="text-sm font-medium">
                    <span className="text-gray-900 dark:text-white">{formatTime(stats.weekTotalMinutes)}</span>
                    <span className="text-gray-400 dark:text-gray-500"> / 10h Goal</span>
                  </div>
               </div>
               
               <div className="flex items-end justify-between h-40 gap-1 md:gap-2">
                 {stats.weeklyData.map((day, i) => {
                   const heightPercent = Math.min(100, Math.max(5, (day.minutes / 120) * 100));
                   const isZero = day.minutes === 0;
                   return (
                     <div key={i} className="flex flex-col items-center flex-1">
                       <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-t-lg relative group h-full flex items-end overflow-hidden">
                          {!isZero && (
                            <div 
                                className={`w-full transition-all duration-1000 ${day.isToday ? 'bg-emerald-500' : 'bg-emerald-300 dark:bg-emerald-600 group-hover:bg-emerald-400 dark:group-hover:bg-emerald-500'}`}
                                style={{ height: `${heightPercent}%` }}
                            ></div>
                          )}
                       </div>
                       <span className={`text-[10px] md:text-xs mt-3 font-medium ${day.isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400'}`}>
                         {day.day}
                       </span>
                     </div>
                   );
                 })}
               </div>
            </div>

            {/* Recent Sessions List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
               <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800 dark:text-white">Recent Sessions</h3>
                 {stats.recentSessions.length > 0 && (
                    <Button variant="ghost" className="text-xs h-8 px-3 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => showToast("History view coming soon!", "info")}>
                        View All
                    </Button>
                 )}
               </div>
               
               {stats.recentSessions.length === 0 ? (
                 <div className="p-12 text-center text-gray-400">
                   <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p className="font-medium text-gray-500">No sessions recorded yet.</p>
                   <p className="text-sm mt-1">Start a session to begin your journey.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-gray-50 dark:divide-gray-700">
                   {stats.recentSessions.map((session) => (
                     <div key={session.sessionId} className="px-4 md:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                             session.focusPercentage > 80 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                           }`}>
                             {session.focusPercentage > 80 ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <Clock className="w-4 h-4 md:w-5 md:h-5" />}
                           </div>
                           <div className="min-w-0">
                             <p className="font-bold text-gray-800 dark:text-gray-200 text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">{session.workingOn || 'Focus Session'}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                               {new Date(session.startTime).toLocaleDateString()} • {formatTime(session.totalDuration)}
                             </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                           <div className="text-right hidden sm:block">
                             <p className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(session.focusPercentage)}% Focus</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{session.distractionCount} distractions</p>
                           </div>
                           <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};