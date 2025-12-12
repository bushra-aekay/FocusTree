import { useState, useEffect, useRef } from 'react';

export const useWebcam = (enabled: boolean) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If disabled, do nothing (or cleanup handled by previous effect teardown)
    if (!enabled) return;

    let activeStream: MediaStream | null = null;
    let isMounted = true;

    const startWebcam = async () => {
      setIsLoading(true);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });

        // If component unmounted while we were waiting for camera, stop immediately
        if (!isMounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        if (isMounted) {
          console.error("Error accessing webcam:", err);
          setError("Camera access denied or unavailable.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    startWebcam();

    // Cleanup function
    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        console.log("LOG: Camera stopped recording");
      }
      setStream(null);
    };
  }, [enabled]);

  return { videoRef, stream, error, isLoading };
};