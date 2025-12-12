import React, { useState } from 'react';
import { Button } from '../Button';
import { Calculator, X, Check } from 'lucide-react';

interface Props {
  onComplete: () => void;
  difficulty: 'easy' | 'hard';
}

export const MathChallengeRecovery: React.FC<Props> = ({ onComplete, difficulty }) => {
  const generateProblem = () => {
    if (difficulty === 'easy') {
      const a = Math.floor(Math.random() * 10) + 2;
      const b = Math.floor(Math.random() * 10) + 2;
      return { q: `${a} × ${b}`, a: a * b };
    } else {
      const ops = ['+', '-', '×'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      if (op === '×') {
        const a = Math.floor(Math.random() * 12) + 5;
        const b = Math.floor(Math.random() * 12) + 5;
        return { q: `${a} × ${b}`, a: a * b };
      } else {
        const a = Math.floor(Math.random() * 50) + 20;
        const b = Math.floor(Math.random() * 50) + 10;
        return { q: `${a} ${op} ${b}`, a: op === '+' ? a + b : a - b };
      }
    }
  };

  const [problems] = useState(() => Array(difficulty === 'easy' ? 3 : 5).fill(0).map(generateProblem));
  const [answers, setAnswers] = useState<string[]>(Array(problems.length).fill(''));
  const [error, setError] = useState<string | null>(null);

  const checkAnswers = () => {
    const allCorrect = problems.every((p, i) => parseInt(answers[i]) === p.a);
    if (allCorrect) {
      onComplete();
    } else {
      setError("Some answers are incorrect. Try again.");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600">
          <Calculator className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Focus Check</h3>
        <p className="text-sm text-gray-500">Solve these to prove you're focused.</p>
      </div>

      <div className="space-y-4 mb-6">
        {problems.map((p, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
            <span className="font-mono text-lg font-bold text-gray-700 w-24">{p.q} = </span>
            <input
              type="number"
              value={answers[i]}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[i] = e.target.value;
                setAnswers(newAnswers);
                setError(null);
              }}
              className="w-24 p-2 rounded-lg border border-gray-300 text-center font-bold outline-none focus:border-orange-500"
              placeholder="?"
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-center text-rose-500 text-sm mb-4">
          <X className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}

      <Button onClick={checkAnswers} className="w-full bg-orange-500 hover:bg-orange-600">
        Check Answers
      </Button>
    </div>
  );
};