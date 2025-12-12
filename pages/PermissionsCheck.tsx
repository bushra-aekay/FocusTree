import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { SessionWizardLayout } from '../components/SessionWizardLayout';
import { Button } from '../components/Button';
import { Camera, Mic, Bell, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

type PermissionStatus = 'prompt' | 'granted' | 'denied';

export const PermissionsCheck: React.FC = () => {
  const navigate = useNavigate();
  const { config, updateConfig } = useSession();
  
  const [camStatus, setCamStatus] = useState<PermissionStatus>('prompt');
  const [micStatus, setMicStatus] = useState<PermissionStatus>('prompt');
  const [notifStatus, setNotifStatus] = useState<PermissionStatus>('prompt');
  const [isTestOpen, setIsTestOpen] = useState(false);

  // Check initial notification status
  useEffect(() => {
    if (Notification.permission === 'granted') {
      setNotifStatus('granted');
      updateConfig({ permissions: { ...config.permissions, notifications: true } });
    } else if (Notification.permission === 'denied') {
      setNotifStatus('denied');
    }
  }, []);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setCamStatus('granted');
      updateConfig({ permissions: { ...config.permissions, camera: true } });
    } catch (err) {
      console.error(err);
      setCamStatus('denied');
      updateConfig({ permissions: { ...config.permissions, camera: false } });
    }
  };

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicStatus('granted');
      updateConfig({ permissions: { ...config.permissions, microphone: true } });
    } catch (err) {
      console.error(err);
      setMicStatus('denied');
      updateConfig({ permissions: { ...config.permissions, microphone: false } });
    }
  };

  const requestNotifications = async () => {
    if (Notification.permission === 'denied') {
      alert("Notifications are blocked in your browser settings. Please click the lock icon in your URL bar to allow them.");
      setNotifStatus('denied');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setNotifStatus('granted');
        updateConfig({ permissions: { ...config.permissions, notifications: true } });
      } else {
        setNotifStatus('denied');
        updateConfig({ permissions: { ...config.permissions, notifications: false } });
      }
    } catch (err) {
      console.error(err);
      setNotifStatus('denied');
    }
  };

  const CameraTestModal = ({ onClose }: { onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let stream: MediaStream | null = null;
      const start = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (e) {
          setError("Could not access camera. Please ensure permissions are granted.");
        }
      };
      start();
      return () => {
        stream?.getTracks().forEach(t => t.stop());
      };
    }, []);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-bold text-gray-800">Camera Test</h3>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
               <XCircle className="w-6 h-6" />
             </button>
          </div>
          <div className="bg-black aspect-video relative flex items-center justify-center">
             {error ? (
                <div className="text-rose-400 p-4 text-center">
                   <p>{error}</p>
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
          </div>
          <div className="p-4 flex justify-end bg-gray-50">
             <Button onClick={onClose}>Looks Good</Button>
          </div>
        </div>
      </div>
    );
  };

  const PermissionCard = ({ 
    icon, 
    title, 
    desc, 
    status, 
    onEnable, 
    required = false 
  }: { 
    icon: React.ReactNode, 
    title: string, 
    desc: string, 
    status: PermissionStatus, 
    onEnable: () => void,
    required?: boolean 
  }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl ${status === 'granted' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 flex items-center">
            {title}
            {required && <span className="ml-2 text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">Required</span>}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">{desc}</p>
        </div>
      </div>
      
      <div>
        {status === 'granted' ? (
          <div className="flex items-center text-emerald-600 font-medium px-4 py-2">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Granted
          </div>
        ) : status === 'denied' ? (
           <div className="flex items-center text-rose-500 font-medium px-4 py-2">
            <XCircle className="w-5 h-5 mr-2" />
            Denied
          </div>
        ) : (
          <Button onClick={onEnable} variant="secondary" className="px-6">
            Enable
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <SessionWizardLayout 
      currentStep={3} 
      title="Permissions Check" 
      subtitle="We need access to your devices to monitor your focus."
      onBack={() => navigate('/session/setup')}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        
        <PermissionCard 
          icon={<Camera className="w-6 h-6" />}
          title="Camera Access"
          desc="Used to analyze focus level and detect distractions locally."
          status={camStatus}
          onEnable={requestCamera}
          required={true}
        />

        <PermissionCard 
          icon={<Mic className="w-6 h-6" />}
          title="Microphone Access"
          desc="Talk to your AI coach without leaving your keyboard."
          status={micStatus}
          onEnable={requestMic}
        />

        <PermissionCard 
          icon={<Bell className="w-6 h-6" />}
          title="Notifications"
          desc="Get alerts when you're distracted, even if tabs are switched."
          status={notifStatus}
          onEnable={requestNotifications}
        />

        <div className="pt-8 space-y-4">
          <div className="bg-emerald-50 p-4 rounded-xl flex items-center justify-center text-sm text-emerald-800">
            <ShieldCheck className="w-5 h-5 mr-2" />
            <span>Privacy First: All AI processing happens locally in your browser.</span>
          </div>

          <div className="flex gap-4">
             <Button 
                variant="outline" 
                className="flex-1"
                disabled={camStatus !== 'granted'}
                onClick={() => setIsTestOpen(true)}
             >
                Test Camera
             </Button>
             <Button 
                className="flex-[2] text-lg shadow-xl"
                disabled={camStatus !== 'granted'}
                onClick={() => navigate('/session/active')}
             >
                START SESSION
             </Button>
          </div>
          {camStatus !== 'granted' && (
            <p className="text-center text-xs text-rose-500">
              Camera access is required to start the session.
            </p>
          )}
        </div>
      </div>

      {isTestOpen && <CameraTestModal onClose={() => setIsTestOpen(false)} />}
    </SessionWizardLayout>
  );
};