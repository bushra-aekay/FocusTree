import React, { useEffect, useState } from 'react';
import { Trees, Sprout, Leaf } from 'lucide-react';

interface Props {
  hoursBefore: number;
  hoursAfter: number;
}

export const TreeGrowthAnimation: React.FC<Props> = ({ hoursBefore, hoursAfter }) => {
  const [currentHours, setCurrentHours] = useState(hoursBefore);
  
  // Calculate Levels (Every 5 hours = 1 level)
  const levelBefore = Math.floor(hoursBefore / 5) + 1;
  const levelAfter = Math.floor(hoursAfter / 5) + 1;
  const isLevelUp = levelAfter > levelBefore;

  // Progress within current level (0-100)
  const progressPercent = ((currentHours % 5) / 5) * 100;

  useEffect(() => {
    // Animate the number up
    const duration = 2000;
    const steps = 60;
    const increment = (hoursAfter - hoursBefore) / steps;
    let current = hoursBefore;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        current = hoursAfter;
        clearInterval(timer);
      }
      setCurrentHours(current);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [hoursBefore, hoursAfter]);

  const getTreeIcon = () => {
    if (levelAfter === 1) return <Sprout className="w-32 h-32 text-emerald-400" />;
    if (levelAfter < 5) return <Trees className="w-32 h-32 text-emerald-500" />;
    return <Trees className="w-40 h-40 text-emerald-700" />;
  };

  const getStageName = (lvl: number) => {
    if (lvl === 1) return "Seedling";
    if (lvl === 2) return "Sprout";
    if (lvl === 3) return "Sapling";
    if (lvl === 4) return "Young Tree";
    return "Mature Tree";
  };
  
  const formatDisplayTime = (h: number) => {
      if (h < 1) {
          const m = Math.round(h * 60);
          return `${m} Mins`;
      }
      return `${h.toFixed(1)} Hours`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">
      <div className="relative mb-6">
        {/* Tree Icon with potential growth animation */}
        <div className={`transition-transform duration-500 ${isLevelUp ? 'scale-110' : ''}`}>
          {getTreeIcon()}
        </div>
        
        {isLevelUp && (
          <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
            LEVEL UP!
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          {getStageName(levelAfter)} (Lvl {levelAfter})
        </h3>
        <p className="text-gray-500 text-sm">
          {formatDisplayTime(currentHours)} Total Focus
        </p>
      </div>

      <div className="w-64">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Level {levelAfter}</span>
          <span>Level {levelAfter + 1}</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-emerald-600 mt-2 text-center font-medium">
          {(5 - (currentHours % 5)).toFixed(1)} hours to next stage
        </p>
      </div>
    </div>
  );
};