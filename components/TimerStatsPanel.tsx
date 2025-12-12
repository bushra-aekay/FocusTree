import React, { useRef, useEffect, useState } from 'react';
import { useActiveSession } from '../context/ActiveSessionContext';
import { useSession } from '../context/SessionContext';
import { Clock, Target, Flame, Sprout, Coffee, PictureInPicture, Maximize2 } from 'lucide-react';
import { Button } from './Button';

export const TimerStatsPanel: React.FC = () => {
  const { state } = useActiveSession();
  const { config } = useSession();
  
  // PiP Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPipActive, setIsPipActive] = useState(false);

  // Format Helpers
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatShortTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      if (hrs > 0) return `${hrs}h ${mins}m`;
      return `${mins}m`;
  };

  const progressPercentage = Math.min(100, (state.elapsedTime / (config.duration * 60)) * 100);
  const nextBreakMins = Math.ceil(state.nextBreakIn / 60);

  // --- Picture in Picture Logic ---
  const togglePip = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
    } else {
        try {
            // Ensure stream is active before requesting PiP
            const stream = canvasRef.current.captureStream(30); // 30 FPS
            videoRef.current.srcObject = stream;
            
            // Wait for metadata to load to prevent "Metadata not loaded" errors
            await new Promise((resolve) => {
                if (videoRef.current!.readyState >= 1) resolve(true);
                else videoRef.current!.onloadedmetadata = () => resolve(true);
            });

            await videoRef.current.play();
            await videoRef.current.requestPictureInPicture();
            setIsPipActive(true);
        } catch (error) {
            console.error("PiP failed", error);
            alert("Picture-in-Picture failed. Try using Chrome or Edge.");
        }
    }
  };

  // Listen for external PiP exit (e.g., clicking X on the floating window)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLeavePip = () => {
       setIsPipActive(false);
    };

    video.addEventListener('leavepictureinpicture', onLeavePip);
    return () => video.removeEventListener('leavepictureinpicture', onLeavePip);
  }, []);

  // Draw to Canvas for PiP (High Contrast for Small Window)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Loop
    const draw = () => {
        // Clear background with theme color (dark slate)
        ctx.fillStyle = '#1e293b'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Status Indicator (Top Bar)
        const isFocus = state.status === 'active';
        ctx.fillStyle = isFocus ? '#10b981' : '#f59e0b'; // Green or Amber
        ctx.fillRect(0, 0, canvas.width, 10);

        // Time (Big and Bold)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 90px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const timeStr = formatTime(state.elapsedTime);
        ctx.fillText(timeStr, canvas.width / 2, canvas.height / 2 - 30);

        // Subtext (Current Status)
        ctx.font = 'bold 30px sans-serif';
        if (state.status === 'active') {
             ctx.fillStyle = '#34d399';
             ctx.fillText("FOCUSED", canvas.width / 2, canvas.height / 2 + 50);
        } else if (state.status === 'break') {
             ctx.fillStyle = '#60a5fa';
             ctx.fillText("ON BREAK", canvas.width / 2, canvas.height / 2 + 50);
        } else if (state.status === 'distracted') {
             ctx.fillStyle = '#f87171';
             ctx.fillText("DISTRACTED", canvas.width / 2, canvas.height / 2 + 50);
        }

        // Progress Bar (Bottom)
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        ctx.fillStyle = isFocus ? '#10b981' : '#64748b';
        ctx.fillRect(0, canvas.height - 20, canvas.width * (progressPercentage / 100), 20);
    };

    const interval = setInterval(draw, 1000);
    draw(); // Initial draw

    return () => clearInterval(interval);
  }, [state.elapsedTime, state.status, progressPercentage]);


  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-8 shadow-sm border border-emerald-100 dark:border-gray-700 h-full flex flex-col justify-between transition-colors relative overflow-hidden">
      
      {/* Hidden Elements for PiP */}
      <canvas ref={canvasRef} width={400} height={300} className="hidden" />
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* Main Timer Display */}
      <div className="text-center py-4 md:py-6 relative group">
        <div className="text-5xl md:text-7xl font-bold text-gray-800 dark:text-white tabular-nums tracking-tight">
            {formatTime(state.elapsedTime)}
        </div>
        <div className="text-emerald-600 dark:text-emerald-400 font-medium mt-1 md:mt-2 flex items-center justify-center text-sm md:text-base">
            <Clock className="w-4 h-4 mr-1.5" />
            Focus Time: {formatShortTime(state.focusTime)}
        </div>
        
        {/* PiP Button - Visible on hover on desktop, always visible if active */}
        <button 
           onClick={togglePip}
           className={`absolute top-0 right-0 p-2 rounded-full transition-all ${
               isPipActive 
               ? 'bg-emerald-100 text-emerald-600 opacity-100' 
               : 'text-gray-300 hover:text-emerald-500 opacity-100 md:opacity-0 md:group-hover:opacity-100'
           }`}
           title="Mini Timer (Overlay)"
        >
           {isPipActive ? <Maximize2 className="w-5 h-5" /> : <PictureInPicture className="w-5 h-5" />}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 my-4 md:my-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 md:p-4 border border-emerald-100 dark:border-emerald-800/50">
            <div className="flex items-center text-emerald-800 dark:text-emerald-300 text-xs md:text-sm font-semibold mb-1">
                <Target className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Distractions
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{state.distractionCount}</div>
            <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">caught by AI</div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 md:p-4 border border-orange-100 dark:border-orange-800/50">
            <div className="flex items-center text-orange-800 dark:text-orange-300 text-xs md:text-sm font-semibold mb-1">
                <Flame className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Streak
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{Math.floor(state.currentStreak)}m</div>
            <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">current focus</div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 md:p-4 border border-blue-100 dark:border-blue-800/50">
            <div className="flex items-center text-blue-800 dark:text-blue-300 text-xs md:text-sm font-semibold mb-1">
                <Coffee className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Next Break
            </div>
            <div className={`text-xl md:text-2xl font-bold ${nextBreakMins < 5 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-white'}`}>
                {config.breakSchedule.type === 'none' ? 'None' : `${nextBreakMins}m`}
            </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 md:p-4 border border-purple-100 dark:border-purple-800/50">
            <div className="flex items-center text-purple-800 dark:text-purple-300 text-xs md:text-sm font-semibold mb-1">
                <Sprout className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Progress
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{Math.floor(progressPercentage)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mb-2 font-medium">
            <span>Start</span>
            <span>Target: {formatShortTime(config.duration * 60)}</span>
        </div>
        <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                style={{ width: `${progressPercentage}%` }}
            >
                <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
            </div>
        </div>
      </div>

      {/* Overlay hint if PiP inactive */}
      {!isPipActive && (
          <div className="mt-4 text-center">
             <button onClick={togglePip} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                 Open Mini Timer (Always on Top)
             </button>
          </div>
      )}
    </div>
  );
};
