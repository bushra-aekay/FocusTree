import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Activity, Play, Check, RefreshCw } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const EXERCISES = [
  { id: 1, text: "Stand up and do 10 jumping jacks", duration: 20 },
  { id: 2, text: "Stretch your arms above your head", duration: 15 },
  { id: 3, text: "Take 5 deep breaths", duration: 20 },
  { id: 4, text: "Roll your shoulders 10 times", duration: 15 },
  { id: 5, text: "Stand on one foot for 15 seconds", duration: 15 },
];

export const PhysicalResetRecovery: React.FC<Props> = ({ onComplete }) => {
  const [exercise] = useState(() => EXERCISES[Math.floor(Math.random() * EXERCISES.length)]);
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setCompleted(true);
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  return (
    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center animate-fade-in-up">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
        <Activity className="w-8 h-8" />
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-2">Physical Reset</h3>
      <p className="text-gray-500 mb-8">Move your body to reset your focus.</p>

      <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
        <p className="text-xl font-medium text-gray-900 mb-4">{exercise.text}</p>
        
        <div className="text-4xl font-black tabular-nums text-blue-500">
          0:{timeLeft.toString().padStart(2, '0')}
        </div>
      </div>

      {!isActive && !completed && (
        <Button onClick={() => setIsActive(true)} className="w-full text-lg py-4" icon={<Play className="w-5 h-5" />}>
          Start Timer
        </Button>
      )}

      {isActive && (
        <Button disabled variant="secondary" className="w-full text-lg py-4">
          In Progress...
        </Button>
      )}

      {completed && (
        <Button onClick={onComplete} className="w-full bg-emerald-500 hover:bg-emerald-600 text-lg py-4" icon={<Check className="w-5 h-5" />}>
          Done! Resume Work
        </Button>
      )}
    </div>
  );
};