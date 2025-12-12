import React from 'react';
import { useActiveSession } from '../context/ActiveSessionContext';
import { Maximize2, Target } from 'lucide-react';

export const FloatingTimer: React.FC = () => {
  const { state, maximizeApp } = useActiveSession();

  if (!state.isMinimized) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div 
        className="bg-gray-900/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-gray-700 w-48 cursor-pointer hover:bg-gray-900 transition-colors group"
        onClick={maximizeApp}
      >
        <div className="flex justify-between items-start mb-2">
           <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">FocusTree</span>
           <Maximize2 className="w-3 h-3 text-gray-500 group-hover:text-white" />
        </div>
        
        <div className="text-3xl font-mono font-bold mb-2 tabular-nums">
           {formatTime(state.elapsedTime)}
        </div>

        <div className="flex justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {state.distractionCount}
            </div>
            <div>
                Break: {Math.ceil(state.nextBreakIn / 60)}m
            </div>
        </div>
      </div>
    </div>
  );
};