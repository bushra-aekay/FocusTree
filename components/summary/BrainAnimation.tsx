import React, { useEffect, useState, useRef } from 'react';
import { Brain, Zap, Sparkles } from 'lucide-react';

export const BrainAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const sequence = [
      { t: 2000, s: 1 }, // Neural pathways
      { t: 4000, s: 2 }, // Dopamine
      { t: 6000, s: 3 }, // Memory
      { t: 8000, s: 4 }, // Prefrontal
      { t: 10000, s: 5 } // Complete
    ];

    timeoutsRef.current = sequence.map(({ t, s }) => setTimeout(() => setStep(s), t));
    
    // Safety finish
    const finish = setTimeout(onComplete, 12000); 
    timeoutsRef.current.push(finish);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [onComplete]);

  const messages = [
    "Analyzing brain activity...",
    "✨ Strengthening neural pathways...",
    "✨ Regulating dopamine receptors...",
    "✨ Enhancing working memory...",
    "✨ Reinforcing self-control...",
    "Your brain is stronger now."
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
      <div className="relative w-64 h-64 mb-8">
        {/* Base Brain */}
        <Brain className={`w-full h-full transition-all duration-1000 ${
          step >= 5 ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-gray-200'
        }`} />

        {/* Neural Pathways (Step 1) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full absolute inset-0 text-emerald-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
             <path d="M12 4C14 4 16 6 16 8M9 9C9 9 10 7 12 7" />
             <path d="M6 12C6 10 8 9 9 9M18 12C18 14 16 15 15 15" />
             <path d="M12 16C10 16 8 15 8 13" />
          </svg>
        </div>

        {/* Dopamine Sparks (Step 2) */}
        <div className={`absolute top-1/3 left-1/4 transition-opacity duration-500 ${step === 2 ? 'opacity-100' : 'opacity-0'}`}>
          <Zap className="w-8 h-8 text-yellow-400 animate-bounce" fill="currentColor" />
        </div>
        <div className={`absolute top-1/4 right-1/4 transition-opacity duration-500 ${step === 2 ? 'opacity-100' : 'opacity-0'}`}>
          <Zap className="w-6 h-6 text-yellow-400 animate-bounce [animation-delay:0.1s]" fill="currentColor" />
        </div>

        {/* Memory Centers (Step 3) */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${step === 3 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
        </div>

        {/* Prefrontal Cortex (Step 4) */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-20 bg-emerald-400/30 rounded-full blur-xl transition-opacity duration-1000 ${step === 4 ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Final Glow (Step 5) */}
         <div className={`absolute inset-0 bg-emerald-400/10 rounded-full blur-3xl transition-opacity duration-1000 ${step >= 5 ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 text-center transition-all duration-500 h-16">
        {messages[step]}
      </h2>
    </div>
  );
};