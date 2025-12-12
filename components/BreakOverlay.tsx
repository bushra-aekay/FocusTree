import React from 'react';
import { useActiveSession } from '../context/ActiveSessionContext';
import { useSession } from '../context/SessionContext';
import { Button } from './Button';
import { Coffee, SkipForward, Plus } from 'lucide-react';

export const BreakOverlay: React.FC = () => {
  const { state, endBreak, extendBreak } = useActiveSession();
  const { config } = useSession();

  if (state.status !== 'break') return null;

  const mins = Math.floor(state.nextBreakIn / 60);
  const secs = state.nextBreakIn % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;

  const canSkip = config.mode !== 'hardcore';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-lg w-full text-center border-4 border-emerald-100">
        
        <div className="inline-flex p-4 rounded-full bg-blue-100 text-blue-600 mb-6 animate-bounce-slow">
            <Coffee className="w-12 h-12" />
        </div>
        
        <h2 className="text-4xl font-bold text-gray-800 mb-2">Break Time</h2>
        <p className="text-gray-500 mb-8">Recharge your brain to grow your tree.</p>

        <div className="text-6xl font-black text-blue-500 mb-8 tabular-nums font-mono">
            {timeString}
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-8 text-blue-800 text-sm">
            <p className="font-semibold mb-2">Suggestion:</p>
            <p>Stand up • Stretch • Hydrate • Look at something 20ft away</p>
        </div>

        <div className="flex gap-4 justify-center">
            {canSkip ? (
                <Button onClick={endBreak} variant="outline" icon={<SkipForward className="w-4 h-4" />}>
                    End Break
                </Button>
            ) : (
                <div className="text-xs text-gray-400 italic py-3 px-4">
                    Hardcore Mode: Break cannot be skipped
                </div>
            )}
            
            <Button onClick={extendBreak} variant="secondary" icon={<Plus className="w-4 h-4" />}>
                +5 Mins
            </Button>
        </div>
      </div>
    </div>
  );
};