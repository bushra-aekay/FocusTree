import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { useTTS } from '../hooks/useTTS';
import { SessionWizardLayout } from '../components/SessionWizardLayout';
import { Button } from '../components/Button';
import { PersonalityId } from '../types';
import { Clock, Coffee, Sparkles, Volume2, User, Play, RefreshCw, Zap, Lightbulb, Sliders, Info, Bell, Square } from 'lucide-react';

const PersonalityCard = ({ id, name, desc, emoji, selected, isPlaying, onClick, onPreview }: any) => (
  <div 
    onClick={onClick}
    className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group ${
      selected 
        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500' 
        : 'border-gray-100 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="text-3xl mb-2">{emoji}</div>
      <button 
        onClick={onPreview}
        className={`transition-colors p-1 rounded-full ${
          isPlaying 
            ? 'text-emerald-600 bg-emerald-100 animate-pulse' 
            : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
      >
        <Volume2 className="w-5 h-5" />
      </button>
    </div>
    <h4 className="font-bold text-gray-900 dark:text-white">{name}</h4>
    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{desc}</p>
    {selected && (
      <div className="absolute bottom-0 right-0 p-1">
        <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
      </div>
    )}
  </div>
);

// --- Audio Helper for Alarm Previews ---
// Using oscillator for portability, or standard URLs if available
const playAlarmPreview = (type: string, ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'gentle_chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        osc.start(now);
        osc.stop(now + 1);
    } else if (type === 'standard_beep') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(now);
        osc.stop(now + 0.3);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(800, now + 0.4);
        gain2.gain.setValueAtTime(0.1, now + 0.4);
        osc2.start(now + 0.4);
        osc2.stop(now + 0.7);
    } else if (type === 'aggressive_siren') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(now);
        osc.stop(now + 1);
    }
};

export const SessionSetup: React.FC = () => {
  const navigate = useNavigate();
  const { config, updateConfig } = useSession();
  const { user } = useAuth();
  const { speak, stop, isSpeaking } = useTTS();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const [suggestion, setSuggestion] = useState<{reasoning: string, tips: string} | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Validate break schedule when duration changes
  useEffect(() => {
    // If duration is less than the required work interval for the selected break type, reset to 'none'
    if (config.breakSchedule.type === 'pomodoro' && config.duration < 25) {
       updateConfig({ breakSchedule: { type: 'none', workInterval: config.duration, breakDuration: 0 } });
    }
    if (config.breakSchedule.type === 'extended' && config.duration < 50) {
       updateConfig({ breakSchedule: { type: 'none', workInterval: config.duration, breakDuration: 0 } });
    }
  }, [config.duration, config.breakSchedule.type]);

  useEffect(() => {
    if (!isSpeaking && playingId && !['gentle_chime','standard_beep','aggressive_siren'].includes(playingId)) {
        setPlayingId(null);
    }
  }, [isSpeaking, playingId]);

  const handleGetSuggestion = async () => {
    if (!config.workingOn || !user) return;
    setLoadingSuggestion(true);
    try {
        const result = await aiService.suggestSessionConfig(user.sessions, config.workingOn);
        if (result) {
            setSuggestion({ reasoning: result.reasoning, tips: result.tips });
            updateConfig({
                duration: result.duration || 25,
                mode: result.mode as any || 'focused',
                personality: result.personality as any || 'supportive_friend'
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingSuggestion(false);
    }
  };

  const handleContinue = () => {
    stop();
    navigate('/session/permissions');
  };

  const playPreview = (type: 'voice' | 'alarm', id: string) => {
    if (playingId === id) { 
        stop(); 
        setPlayingId(null); 
        return; 
    }
    setPlayingId(id);
    
    if (type === 'voice') {
        const texts: Record<string, string> = {
          supportive_friend: "You've got this! I'll be right here with you.",
          drill_sergeant: "Listen up! No distractions allowed on my watch!",
          roast_mode: "Don't even think about opening Instagram. I see you.",
          calm_coach: "Take a deep breath. Let's find your flow together.",
          hype_mode: "Let's GOOO! We're crushing this session!"
        };
        speak(texts[id] || "Ready to focus?", id as PersonalityId);
    } else {
        // Play Alarm
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current) {
            if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
            playAlarmPreview(id, audioCtxRef.current);
            setTimeout(() => setPlayingId(null), 1000);
        }
    }
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  };

  return (
    <SessionWizardLayout 
      currentStep={2} 
      title="Setup Your Session" 
      subtitle={`Configure your ${config.mode} session parameters.`}
      onBack={() => navigate('/session/mode')}
    >
      <div className="space-y-8 max-w-3xl mx-auto pb-12">
        
        {/* Working On Input (Top Priority) */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex items-center mb-4">
            <Sparkles className="w-5 h-5 text-emerald-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Goal</h3>
           </div>
           <div className="flex flex-col sm:flex-row gap-2">
             <input 
                type="text"
                placeholder="What are you working on? (e.g. Studying Math, Writing Code)"
                value={config.workingOn}
                onChange={(e) => updateConfig({ workingOn: e.target.value })}
                className="flex-grow px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all"
             />
             <div className="flex items-center gap-2">
                <Button 
                    onClick={handleGetSuggestion} 
                    isLoading={loadingSuggestion}
                    disabled={!config.workingOn}
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20 whitespace-nowrap"
                    icon={<Lightbulb className="w-4 h-4" />}
                >
                    AI Suggest
                </Button>
                <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">(Optional)</span>
             </div>
           </div>
           <div className="sm:hidden text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">(AI Suggest is Optional)</div>
           
           {suggestion && (
             <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 text-sm rounded-lg border border-violet-100 dark:border-violet-700">
                <strong>💡 AI Plan:</strong> {suggestion.reasoning}
             </div>
           )}
        </section>

        {/* Custom Mode Settings (Only visible if mode is custom) */}
        {config.mode === 'custom' && (
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-violet-500 animate-fade-in">
             <div className="flex items-center mb-6">
               <Sliders className="w-5 h-5 text-violet-500 mr-2" />
               <h3 className="text-lg font-bold text-gray-800 dark:text-white">Custom Rules</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Distraction Tolerance (Seconds)
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" min="5" max="120" step="5"
                      value={config.customSettings?.distractionTolerance || 30}
                      onChange={(e) => updateConfig({ customSettings: { ...config.customSettings, distractionTolerance: parseInt(e.target.value) } as any })}
                      className="w-full accent-violet-500"
                    />
                    <span className="font-mono font-bold w-12 text-right text-gray-800 dark:text-white">{config.customSettings?.distractionTolerance}s</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Time before AI alerts you.</p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exit Friction
                  </label>
                  <select 
                    value={config.customSettings?.exitFriction || 'mild'}
                    onChange={(e) => updateConfig({ customSettings: { ...config.customSettings, exitFriction: e.target.value } as any })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-violet-500 outline-none"
                  >
                    <option value="none">None (Easy Exit)</option>
                    <option value="mild">Mild (Confirmation)</option>
                    <option value="severe">Severe (Math Problem)</option>
                  </select>
                </div>
             </div>
          </section>
        )}

        {/* Focus Duration */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-emerald-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Total Duration</h3>
          </div>
          <div className="px-2">
            <div className="flex justify-between items-end mb-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatTime(config.duration)}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Minutes</span>
            </div>
            <input 
              type="range" min="15" max="720" step="15"
              value={config.duration} 
              onChange={(e) => updateConfig({ duration: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </section>

        {/* Break Schedule */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Coffee className="w-5 h-5 text-emerald-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Break Schedule</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             {[
                { id: 'pomodoro', name: 'Pomodoro', desc: '25m Focus / 5m Break', work: 25, break: 5 },
                { id: 'extended', name: 'Extended', desc: '50m Focus / 10m Break', work: 50, break: 10 },
                { id: 'none', name: 'No Breaks', desc: 'Continuous Flow', work: config.duration, break: 0 },
             ].map((b) => {
                const isDisabled = b.work > config.duration && b.id !== 'none';
                return (
                  <div
                    key={b.id}
                    onClick={() => !isDisabled && updateConfig({
                       breakSchedule: {
                           type: b.id as any,
                           workInterval: b.work === 0 ? config.duration : b.work,
                           breakDuration: b.break
                       }
                    })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      config.breakSchedule.type === b.id 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-500' 
                        : isDisabled 
                          ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                          : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                     <div className="flex justify-between items-start">
                        <div className="font-bold text-gray-900 dark:text-white">{b.name}</div>
                        {isDisabled && (
                          <div title={`Requires at least ${b.work} minutes`}>
                             <Info className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                     </div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{b.desc}</div>
                     {isDisabled && <div className="text-[10px] text-rose-500 mt-1">Duration too short</div>}
                  </div>
                );
             })}
          </div>
        </section>

        {/* Alarm Sound */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-emerald-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Alarm Sound</h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'gentle_chime', name: 'Gentle Chime', desc: 'Soft & Calm' },
                { id: 'standard_beep', name: 'Standard', desc: 'Classic Alert' },
                { id: 'aggressive_siren', name: 'Siren', desc: 'Hardcore Only' },
              ].map(sound => (
                 <div 
                   key={sound.id}
                   onClick={() => updateConfig({ alarmSound: sound.id })}
                   className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                     config.alarmSound === sound.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                   }`}
                 >
                    <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{sound.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{sound.desc}</div>
                    </div>
                    <button 
                       onClick={(e) => { e.stopPropagation(); playPreview('alarm', sound.id); }}
                       className={`p-2 rounded-full ${playingId === sound.id ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}
                    >
                       {playingId === sound.id ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    </button>
                 </div>
              ))}
           </div>
        </section>

        {/* AI Personality */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-emerald-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">AI Coach Personality</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { id: 'supportive_friend', name: 'Friend', desc: 'Warm & Encouraging', emoji: '🤝' },
              { id: 'drill_sergeant', name: 'Sergeant', desc: 'Intense & Strict', emoji: '🪖' },
              { id: 'roast_mode', name: 'Roast', desc: 'Sarcastic & Funny', emoji: '💀' },
              { id: 'calm_coach', name: 'Zen', desc: 'Mindful & Peaceful', emoji: '🧘' },
              { id: 'hype_mode', name: 'Hype', desc: 'High Energy', emoji: '🔥' },
            ].map((p) => (
              <PersonalityCard 
                key={p.id}
                id={p.id as PersonalityId}
                name={p.name}
                desc={p.desc}
                emoji={p.emoji}
                selected={config.personality === p.id}
                isPlaying={playingId === p.id}
                onClick={() => updateConfig({ personality: p.id as PersonalityId })}
                onPreview={(e: any) => { e.stopPropagation(); playPreview('voice', p.id); }}
              />
            ))}
          </div>
        </section>

        {/* Recovery Method */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <RefreshCw className="w-5 h-5 text-emerald-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recovery Method</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {[
               { id: 'context_aware', name: 'Context Task', desc: 'AI generates a quick work-related task', icon: <Sparkles className="w-4 h-4" />, rec: true },
               { id: 'physical_reset', name: 'Physical Reset', desc: 'Quick exercise to wake up', icon: <Zap className="w-4 h-4" /> },
               { id: 'reflection', name: 'Reflection', desc: 'Think about why you lost focus', icon: <User className="w-4 h-4" /> },
               { id: 'simple_click', name: 'Simple Click', desc: 'Just click a button to resume', icon: <Play className="w-4 h-4" /> },
             ].map((r) => (
               <div
                 key={r.id}
                 onClick={() => updateConfig({ recoveryMethod: r.id })}
                 className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex items-start gap-3 ${
                   config.recoveryMethod === r.id
                     ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                     : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-200 dark:hover:border-emerald-700'
                 }`}
               >
                 <div className={`p-2 rounded-lg ${config.recoveryMethod === r.id ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {r.icon}
                 </div>
                 <div>
                    <div className="flex items-center gap-2">
                       <h4 className="font-bold text-gray-900 dark:text-white text-sm">{r.name}</h4>
                       {r.rec && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">BEST</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p>
                 </div>
               </div>
             ))}
          </div>
        </section>

        <div className="pt-4 pb-8" title={!config.workingOn.trim() ? "Please enter your goal to continue" : ""}>
          <Button 
            onClick={handleContinue} 
            className="w-full py-4 text-lg shadow-xl"
            disabled={!config.workingOn.trim()} 
          >
            Continue to Permissions
          </Button>
          {!config.workingOn.trim() && (
            <p className="text-center text-xs text-gray-400 mt-2">
              Please enter what you're working on to continue.
            </p>
          )}
        </div>
      </div>
    </SessionWizardLayout>
  );
};