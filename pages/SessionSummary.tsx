import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SessionRecord, User } from '../types';
import { BrainAnimation } from '../components/summary/BrainAnimation';
import { SessionStats } from '../components/summary/SessionStats';
import { TreeGrowthAnimation } from '../components/summary/TreeGrowthAnimation';
import { InsightsPanel } from '../components/summary/InsightsPanel';
import { Button } from '../components/Button';
import { Home, Share2, AlertTriangle, Loader2 } from 'lucide-react';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

type ViewStage = 'brain' | 'stats' | 'tree' | 'insights';

export const SessionSummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [stage, setStage] = useState<ViewStage>('brain');
  const [userData, setUserData] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(true);
  const [saveError, setSaveError] = useState(false);
  
  // Guard against double-execution in Strict Mode or re-renders
  const hasProcessedRef = useRef(false);

  // Retrieve data passed from navigation
  const sessionData = location.state as SessionRecord;

  useEffect(() => {
    // 1. Redirect if no data
    if (!sessionData) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // 2. Prevent double save
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const processSession = async () => {
      setIsSaving(true);
      setSaveError(false);
      try {
        // Save to local storage
        const updatedUser = await userService.saveSession(sessionData);
        setUserData(updatedUser);
        
        // Update global context safely
        refreshUser();
      } catch (e) {
        console.error("Failed to save session", e);
        setSaveError(true);
        // Fallback: Try to get current user so UI doesn't crash completely
        const currentUser = userService.getUser();
        if (currentUser) {
            setUserData(currentUser);
        }
      } finally {
        setIsSaving(false);
      }
    };

    processSession();
  }, [sessionData, navigate, refreshUser]);

  const handleShare = async () => {
      if (!userData) return;
      const text = `I just focused for ${sessionData.focusTime} minutes on FocusTree! 🌳\nLevel: ${userData.treeLevel} | Mode: ${sessionData.mode}`;
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'FocusTree Session',
                  text: text,
                  url: window.location.origin
              });
          } catch (e) {}
      } else {
          try {
             await navigator.clipboard.writeText(text);
             alert("Stats copied to clipboard!");
          } catch(e) {
             alert("Could not copy stats.");
          }
      }
  };

  if (!sessionData) return null;

  // Render Logic
  const renderContent = () => {
    switch (stage) {
      case 'brain':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
             <BrainAnimation onComplete={() => setStage('stats')} />
             {isSaving && (
               <div className="absolute bottom-10 flex items-center gap-2 text-emerald-600 text-sm animate-pulse">
                 <Loader2 className="w-4 h-4 animate-spin" /> Saving your growth...
               </div>
             )}
             {saveError && (
               <div className="absolute bottom-10 flex items-center gap-2 text-rose-500 text-sm bg-rose-50 px-3 py-1 rounded-full">
                 <AlertTriangle className="w-4 h-4" /> Sync issue (Data saved locally)
               </div>
             )}
             <button 
                onClick={() => setStage('stats')} 
                className="absolute top-4 right-4 text-gray-400 text-xs hover:text-gray-600 z-50 p-2"
             >
                Skip Animation
             </button>
          </div>
        );
      
      case 'stats':
        return (
          <div className="flex flex-col items-center w-full max-w-2xl animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Session Complete!</h1>
            <SessionStats data={sessionData} />
            <div className="mt-8 w-full">
              <Button onClick={() => setStage('tree')} className="w-full py-4 text-lg">
                See Your Growth
              </Button>
            </div>
          </div>
        );

      case 'tree':
        if (!userData) {
             if (saveError && !isSaving) {
                 return (
                     <div className="flex flex-col items-center justify-center text-gray-500">
                         <AlertTriangle className="w-12 h-12 text-rose-400 mb-4" />
                         <p>Could not load tree data.</p>
                         <Button onClick={() => setStage('insights')} className="mt-4">Skip to Insights</Button>
                     </div>
                 )
             }
             return <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />;
        }
        
        const currentHours = userData.totalFocusHours;
        const sessionHours = sessionData.focusTime / 60;
        const prevHours = Math.max(0, currentHours - sessionHours);

        return (
          <div className="flex flex-col items-center w-full max-w-xl animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Forest Growth</h1>
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-emerald-100 w-full mb-8">
              <TreeGrowthAnimation hoursBefore={prevHours} hoursAfter={currentHours} />
            </div>
            <div className="w-full">
              <Button onClick={() => setStage('insights')} className="w-full py-4 text-lg">
                View AI Insights
              </Button>
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className="flex flex-col items-center w-full max-w-2xl animate-fade-in pb-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Insights</h1>
            <InsightsPanel data={sessionData} />
            
            <div className="flex gap-4 mt-8 w-full">
               <Button onClick={handleShare} variant="secondary" className="flex-1" icon={<Share2 className="w-4 h-4" />}>
                 Share
               </Button>
               <Button onClick={() => navigate('/dashboard')} className="flex-1" icon={<Home className="w-4 h-4" />}>
                 Dashboard
               </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6">
      {renderContent()}
    </div>
  );
};