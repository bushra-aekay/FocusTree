import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useActiveSession } from '../context/ActiveSessionContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Minimize2, Settings, X, LogOut, Volume2 } from 'lucide-react';
import { SessionRecord } from '../types';

export const SessionControls: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { config, updateConfig } = useSession();
  const { state, minimizeApp, resetSession } = useActiveSession();
  const { user } = useAuth();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const modeColors = {
    hardcore: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800',
    focused: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
    chill: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800',
    custom: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800'
  };

  const handleEndSession = () => {
    if (config.mode === 'hardcore') return;
    if (config.mode === 'chill') {
      confirmExit();
      return;
    }
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    if (!user) return;

    const sessionRecord: SessionRecord = {
      sessionId: crypto.randomUUID(),
      userId: user.userId,
      startTime: state.startTime,
      endTime: Date.now(),
      totalDuration: Math.round(state.elapsedTime / 60),
      focusTime: Math.round(state.focusTime / 60),
      distractedTime: Math.round(state.distractionTime / 60),
      focusPercentage: state.elapsedTime > 0 ? (state.focusTime / state.elapsedTime) * 100 : 0,
      distractionCount: state.distractionCount,
      distractionBreakdown: state.distractionBreakdown,
      longestStreak: Math.round(state.longestStreak),
      mode: config.mode,
      workingOn: config.workingOn
    };

    resetSession(); 
    navigate('/session/summary', { state: sessionRecord });
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-sm border border-emerald-50 dark:border-gray-700 mb-4 md:mb-6 transition-colors gap-2">
        <div className="flex gap-2">
          <button 
            onClick={minimizeApp}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors tooltip"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            title="Settings"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full border text-[10px] md:text-xs font-bold uppercase tracking-wider ${modeColors[config.mode]} whitespace-nowrap`}>
          <span className="hidden sm:inline">Mode: </span>{config.mode}
        </div>

        <div>
          <button
            onClick={handleEndSession}
            disabled={config.mode === 'hardcore'}
            className={`flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              config.mode === 'hardcore' 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                : 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40'
            }`}
          >
            <LogOut className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">End Session</span>
            <span className="sm:hidden">End</span>
          </button>
        </div>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Leave Session?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You're doing great! Are you sure you want to stop growing your tree?
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => setShowExitConfirm(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-rose-500 hover:bg-rose-600 border-none text-white" onClick={confirmExit}>
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quick Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                   <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Volume</label>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      defaultValue={config.customSettings?.alertVolume || 80}
                      onChange={(e) => updateConfig({ customSettings: { ...config.customSettings, alertVolume: parseInt(e.target.value) } as any })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal</label>
                     <input 
                       type="text"
                       value={config.workingOn}
                       onChange={(e) => updateConfig({ workingOn: e.target.value })}
                       className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                     />
                  </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
});