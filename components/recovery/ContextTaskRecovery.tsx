import React, { useState, useEffect } from 'react';
import { aiService, RecoveryTask } from '../../services/aiService';
import { Button } from '../Button';
import { Brain, Loader2, Send } from 'lucide-react';
import { useSession } from '../../context/SessionContext';

interface Props {
  onComplete: () => void;
  preloadedTask?: RecoveryTask | null;
}

export const ContextTaskRecovery: React.FC<Props> = ({ onComplete, preloadedTask }) => {
  const { config } = useSession();
  const [task, setTask] = useState<RecoveryTask | null>(preloadedTask || null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(!preloadedTask);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preloadedTask) {
      setTask(preloadedTask);
      setLoading(false);
      return;
    }

    const loadTask = async () => {
      try {
        const generatedTask = await aiService.generateRecoveryTask(config.workingOn);
        setTask(generatedTask);
      } catch (err) {
        console.error(err);
        // Fallback
        setTask({
            taskType: 'planning',
            taskPrompt: `What is the next immediate step for "${config.workingOn}"?`,
            expectedAnswerType: 'shortText',
            estimatedTime: 15
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we don't have a task yet
    if (!task) {
        loadTask();
    }
  }, [config.workingOn, preloadedTask]);

  const handleSubmit = async () => {
    if (!task || !answer.trim()) return;
    setValidating(true);
    setError(null);

    try {
      const result = await aiService.validateRecoveryAnswer(task.taskPrompt, answer, config.workingOn);
      if (result.isValid) {
        onComplete();
      } else {
        setError(result.feedback || "Please provide a more specific answer.");
      }
    } catch (err) {
      onComplete(); // Fail open if API fails
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-500">Generating recovery task...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <Brain className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Re-engage Your Brain</h3>
          <p className="text-xs text-gray-500">Task: {task?.taskType}</p>
        </div>
      </div>

      <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 mb-6">
        <p className="font-medium text-emerald-900 text-lg leading-relaxed">
          {task?.taskPrompt}
        </p>
      </div>

      <textarea
        value={answer}
        onChange={(e) => {
           setAnswer(e.target.value);
           setError(null);
        }}
        className="w-full p-4 rounded-xl border border-gray-300 mb-2 min-h-[100px] focus:ring-2 focus:ring-emerald-500 outline-none"
        placeholder="Type your answer here..."
        autoFocus
      />
      
      {error && (
        <p className="text-rose-500 text-sm mb-4 animate-pulse">{error}</p>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={validating || answer.length < 3} 
          className="w-full"
          icon={validating ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
        >
          {validating ? 'Checking...' : 'Submit & Resume'}
        </Button>
      </div>
    </div>
  );
};