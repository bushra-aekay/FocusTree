import React, { useEffect } from 'react';
import { ActiveSessionProvider, useActiveSession } from '../context/ActiveSessionContext';
import { SessionControls } from '../components/SessionControls';
import { WebcamFeed } from '../components/WebcamFeed';
import { TimerStatsPanel } from '../components/TimerStatsPanel';
import { FocusAssistantChat } from '../components/FocusAssistantChat';
import { BreakOverlay } from '../components/BreakOverlay';
import { FloatingTimer } from '../components/FloatingTimer';
import { DistractionOverlay } from '../components/DistractionOverlay';
import { useWebcam } from '../hooks/useWebcam';
import { useDistractionDetection } from '../hooks/useDistractionDetection';
import { useIntervention } from '../hooks/useIntervention';

const SessionLayout: React.FC = () => {
  const { state, togglePause } = useActiveSession();
  
  // 1. Webcam State
  const { videoRef, error: camError, isLoading: camLoading } = useWebcam(true);

  // 2. Intervention Logic
  const { 
    interventionState, 
    distractionType, 
    recoveryTask,
    triggerIntervention, 
    handleImBack, 
    resolveIntervention,
    stopAlarm
  } = useIntervention();

  // 3. Detection Logic (connects webcam -> intervention)
  const isInterventionActive = interventionState !== 'IDLE';
  useDistractionDetection(videoRef, triggerIntervention, isInterventionActive);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space to toggle pause (if not in input)
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && !isInterventionActive) {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopAlarm(); // Cleanup audio on unmount
    };
  }, [togglePause, isInterventionActive, stopAlarm]);

  if (state.isMinimized) {
      return (
          <div className="min-h-screen bg-emerald-50 dark:bg-gray-900 flex items-center justify-center p-8 transition-colors">
              <div className="text-center text-gray-400 dark:text-gray-500">
                  <p className="text-xl font-medium mb-2">Focus Session Minimized</p>
                  <p className="text-sm">Check the floating timer in the corner.</p>
              </div>
              <FloatingTimer />
          </div>
      );
  }

  return (
    // FIX: Use 100dvh for proper mobile full-screen height handling avoiding address bar issues
    <div className="h-[100dvh] bg-emerald-50/50 dark:bg-gray-900 p-4 md:p-6 flex flex-col overflow-hidden relative transition-colors duration-300">
      <SessionControls />
      
      <div className="flex-grow grid grid-cols-12 gap-4 md:gap-6 min-h-0">
        
        {/* Left Column: Webcam */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col order-1 max-h-[30vh] md:max-h-full">
          <WebcamFeed 
             videoRef={videoRef} 
             error={camError} 
             isLoading={camLoading}
          />
          <div className="mt-4 md:mt-6 hidden md:flex flex-grow">
             <div className="bg-emerald-100/50 dark:bg-emerald-900/10 rounded-2xl h-full w-full border border-emerald-100/50 dark:border-gray-700/50 p-6 flex items-center justify-center text-emerald-800/20 dark:text-emerald-400/20 text-sm font-medium text-center">
                Your tree grows as you focus.<br/>(Visuals coming soon)
             </div>
          </div>
        </div>

        {/* Middle Column: Timer */}
        <div className="col-span-12 md:col-span-8 lg:col-span-6 h-full order-2 flex flex-col min-h-0">
          <TimerStatsPanel />
        </div>

        {/* Right Column: Chat */}
        <div className="col-span-12 lg:col-span-3 h-full order-3 hidden lg:block">
          <FocusAssistantChat />
        </div>
      </div>

      <BreakOverlay />
      
      <DistractionOverlay 
        state={interventionState}
        distractionType={distractionType}
        recoveryTask={recoveryTask}
        onImBack={handleImBack}
        onResolve={resolveIntervention}
        onFalseAlarm={() => {
           resolveIntervention();
        }}
      />
    </div>
  );
};

export const FocusSession: React.FC = () => {
  return (
    <ActiveSessionProvider>
      <SessionLayout />
    </ActiveSessionProvider>
  );
};