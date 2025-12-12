
import React from 'react';
import { SessionRecord } from '../../types';
import { Clock, Target, Flame, AlertCircle } from 'lucide-react';

export const SessionStats: React.FC<{ data: SessionRecord }> = ({ data }) => {
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-2xl animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Total Duration</h2>
        <div className="text-5xl font-black text-gray-900">{formatTime(data.totalDuration)}</div>
      </div>

      {/* Main Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-emerald-600">Focus ({Math.round(data.focusPercentage)}%)</span>
          <span className="text-rose-500">Distracted ({100 - Math.round(data.focusPercentage)}%)</span>
        </div>
        <div className="h-4 bg-rose-100 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-emerald-500" 
            style={{ width: `${data.focusPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center text-gray-500 mb-2">
            <Target className="w-4 h-4 mr-2" />
            <span className="text-xs font-bold uppercase">Distractions</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{data.distractionCount}</div>
          <div className="text-xs text-gray-400 mt-1">
             {data.distractionBreakdown.phone > 0 && `${data.distractionBreakdown.phone} Phone `}
             {data.distractionBreakdown.leftDesk > 0 && `${data.distractionBreakdown.leftDesk} Left `}
          </div>
        </div>

        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
          <div className="flex items-center text-orange-600 mb-2">
            <Flame className="w-4 h-4 mr-2" />
            <span className="text-xs font-bold uppercase">Longest Streak</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{data.longestStreak}m</div>
          <div className="text-xs text-gray-400 mt-1">Uninterrupted focus</div>
        </div>
      </div>
    </div>
  );
};
