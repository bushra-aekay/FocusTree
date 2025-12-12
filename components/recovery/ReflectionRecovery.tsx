import React, { useState } from 'react';
import { Button } from '../Button';
import { Compass } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const QUESTIONS = [
  "Why did you start this focus session today?",
  "What is the single most important thing you need to finish?",
  "What distracted you, and was it worth it?",
  "How will you feel if you don't finish this work?"
];

export const ReflectionRecovery: React.FC<Props> = ({ onComplete }) => {
  const [question] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const [answer, setAnswer] = useState('');
  
  const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
  const MIN_WORDS = 15;

  const handleSubmit = () => {
    if (wordCount >= MIN_WORDS) {
      onComplete();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-violet-100 p-2 rounded-lg">
          <Compass className="w-6 h-6 text-violet-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Reconnect to Purpose</h3>
      </div>

      <p className="text-lg font-medium text-gray-800 mb-6 leading-relaxed">
        {question}
      </p>

      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full p-4 rounded-xl border border-gray-300 min-h-[120px] focus:ring-2 focus:ring-violet-500 outline-none resize-none"
          placeholder="I want to finish this because..."
          autoFocus
        />
        <div className={`absolute bottom-3 right-3 text-xs font-medium px-2 py-1 rounded ${
          wordCount >= MIN_WORDS ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {wordCount} / {MIN_WORDS} words
        </div>
      </div>

      <div className="mt-6">
        <Button 
          onClick={handleSubmit} 
          disabled={wordCount < MIN_WORDS} 
          className="w-full"
        >
          {wordCount < MIN_WORDS ? 'Keep writing...' : 'I\'m Refocused'}
        </Button>
      </div>
    </div>
  );
};