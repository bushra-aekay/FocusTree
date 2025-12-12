import React, { useState } from 'react';
import { InterventionState } from '../hooks/useIntervention';
import { Button } from './Button';
import { AlertTriangle, Bell, Brain } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useActiveSession } from '../context/ActiveSessionContext';
import { RecoveryTask } from '../services/aiService';

// Recovery Components
import { ContextTaskRecovery } from './recovery/ContextTaskRecovery';
import { PhysicalResetRecovery } from './recovery/PhysicalResetRecovery';
import { ReflectionRecovery } from './recovery/ReflectionRecovery';
import { MathChallengeRecovery } from './recovery/MathChallengeRecovery';
import { SimpleClickRecovery } from './recovery/SimpleClickRecovery';

interface DistractionOverlayProps {
  state: InterventionState;
  distractionType: string;
  recoveryTask: RecoveryTask | null;
  onImBack: () => void;
  onResolve: () => void;
  onFalseAlarm: () => void;
}

export const DistractionOverlay: React.FC<DistractionOverlayProps> = ({
  state,
  distractionType,
  recoveryTask,
  onImBack,
  onResolve,
  onFalseAlarm
}) => {
  const { config } = useSession();
  const { state: sessionState } = useActiveSession();
  
  // We determine the specific component to render for RECOVERY state
  const renderRecoveryComponent = () => {
    let method = config.recoveryMethod;
    const count = sessionState.distractionCount;

    // Progressive Difficulty Logic
    if (method === 'progressive' || (config.mode === 'hardcore' && method === 'context_aware')) {
       if (count <= 1) method = 'simple_click';
       else if (count === 2) method = 'reflection'; 
       else if (count === 3) method = 'math_easy';
       else if (count >= 4) method = 'math_hard';
    }

    // Mapping to Components
    switch (method) {
      case 'context_aware':
        return <ContextTaskRecovery onComplete={onResolve} preloadedTask={recoveryTask} />;
      case 'physical_reset':
        return <PhysicalResetRecovery onComplete={onResolve} />;
      case 'reflection':
        return <ReflectionRecovery onComplete={onResolve} />;
      case 'math_easy':
        return <MathChallengeRecovery onComplete={onResolve} difficulty="easy" />;
      case 'math_hard':
        return <MathChallengeRecovery onComplete={onResolve} difficulty="hard" />;
      case 'simple_click':
        return <SimpleClickRecovery onComplete={onResolve} />;
      default:
        return <SimpleClickRecovery onComplete={onResolve} />;
    }
  };

  const handleFalseAlarm = () => {
      console.log("LOG: User reported false alarm. Feedback recorded.");
      // In future: Send this to backend to tune model
      onFalseAlarm(); // This triggers resolveIntervention in parent
  };

  if (state === 'IDLE') return null;

  const getDistractionLabel = (type: string) => {
    switch (type) {
      case 'phone': return 'Phone Detected';
      case 'leftDesk': return 'Left Desk';
      case 'sleeping': return 'Eyes Closed';
      case 'lookingAway': return 'Looking Away';
      case 'conversation': return 'Conversation';
      default: return 'Distraction Detected';
    }
  };

  if (state === 'WARNING') {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border-l-8 border-orange-500 relative">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Focus Check</h2>
          <p className="text-lg text-orange-600 font-medium mb-6">
            {getDistractionLabel(distractionType)}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={onImBack} className="w-full text-lg py-4">
              I'm Back
            </Button>
            <button onClick={handleFalseAlarm} className="text-gray-400 text-sm hover:text-gray-600">
              False Alarm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'ALARM') {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-red-600/90 animate-pulse-fast">
        <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl border-8 border-red-500 transform scale-105">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Bell className="w-10 h-10 text-red-600 animate-ring" />
          </div>
          <h1 className="text-4xl font-black text-red-600 mb-4">GET BACK TO WORK</h1>
          <Button onClick={onImBack} className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-6 font-bold shadow-xl">
            I'M BACK!
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'RECOVERY') {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-emerald-900/80 backdrop-blur-md">
        {renderRecoveryComponent()}
      </div>
    );
  }

  return null;
};