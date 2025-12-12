import React, { useState } from 'react';
import { Camera, Maximize2, Minimize2 } from 'lucide-react';

interface WebcamFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  isLoading: boolean;
}

export const WebcamFeed: React.FC<WebcamFeedProps> = React.memo(({ videoRef, error, isLoading }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const baseClasses = "relative bg-black rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ease-in-out border border-emerald-100";
  const sizeClasses = isMinimized ? "w-40 h-32" : "w-full aspect-[4/3]";

  return (
    <div className={`${baseClasses} ${sizeClasses} group`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 p-4 text-center">
          <Camera className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover transform -scale-x-100" 
        />
      )}

      {/* Overlays */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-white tracking-wider">LIVE</span>
        </div>
      </div>

      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-white hover:bg-black/60"
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute bottom-3 left-3 right-3 text-center">
        <p className="text-[10px] text-white/40">AI Monitoring Active</p>
      </div>
    </div>
  );
});