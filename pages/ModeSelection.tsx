import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { SessionWizardLayout } from '../components/SessionWizardLayout';
import { SessionModeId } from '../types';
import { Flame, Crosshair, Coffee, Settings, Zap, Shield, Sparkles } from 'lucide-react';

interface ModeOption {
  id: SessionModeId;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  description: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  darkBgColor: string;
  darkColor: string;
  badge?: { text: string; color: string; darkColor: string };
}

export const ModeSelection: React.FC = () => {
  const navigate = useNavigate();
  const { updateConfig } = useSession();

  const handleSelectMode = (mode: SessionModeId) => {
    updateConfig({ mode });
    navigate('/session/setup');
  };

  const modes: ModeOption[] = [
    {
      id: 'hardcore',
      name: 'Hardcore Mode',
      icon: <Flame className="w-8 h-8" />,
      tagline: "No mercy. No excuses. Lock yourself in.",
      description: [
        "Cannot quit session early",
        "10-second distraction tolerance",
        "Loud alarm immediately",
        "Mandatory breaks"
      ],
      color: "text-rose-600",
      darkColor: "dark:text-rose-400",
      bgColor: "bg-rose-50",
      darkBgColor: "dark:bg-rose-900/40",
      borderColor: "hover:border-rose-300 dark:hover:border-rose-700",
      badge: { text: "⚠️ EXTREME", color: "bg-rose-100 text-rose-800", darkColor: "dark:bg-rose-900 dark:text-rose-200" }
    },
    {
      id: 'focused',
      name: 'Focused Mode',
      icon: <Crosshair className="w-8 h-8" />,
      tagline: "Serious focus with reasonable flexibility.",
      description: [
        "Quit with exit friction",
        "1-minute distraction tolerance",
        "Firm alerts",
        "Recommended breaks"
      ],
      color: "text-emerald-600",
      darkColor: "dark:text-emerald-400",
      bgColor: "bg-emerald-50",
      darkBgColor: "dark:bg-emerald-900/40",
      borderColor: "hover:border-emerald-400 dark:hover:border-emerald-700",
      badge: { text: "✨ RECOMMENDED", color: "bg-emerald-100 text-emerald-800", darkColor: "dark:bg-emerald-900 dark:text-emerald-200" }
    },
    {
      id: 'chill',
      name: 'Chill Mode',
      icon: <Coffee className="w-8 h-8" />,
      tagline: "Focus with compassion. Life happens.",
      description: [
        "End session anytime",
        "2-minute distraction tolerance",
        "Gentle reminders",
        "Optional breaks"
      ],
      color: "text-sky-600",
      darkColor: "dark:text-sky-400",
      bgColor: "bg-sky-50",
      darkBgColor: "dark:bg-sky-900/40",
      borderColor: "hover:border-sky-300 dark:hover:border-sky-700"
    },
    {
      id: 'custom',
      name: 'Custom Mode',
      icon: <Settings className="w-8 h-8" />,
      tagline: "You set the rules.",
      description: [
        "Configure every parameter",
        "Set your own tolerance",
        "Full control over breaks",
        "Custom friction"
      ],
      color: "text-violet-600",
      darkColor: "dark:text-violet-400",
      bgColor: "bg-violet-50",
      darkBgColor: "dark:bg-violet-900/40",
      borderColor: "hover:border-violet-300 dark:hover:border-violet-700"
    }
  ];

  return (
    <SessionWizardLayout 
      currentStep={1} 
      title="Choose Your Focus Mode" 
      subtitle="Select the intensity level that fits your goals for this session."
      onBack={() => navigate('/dashboard')}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleSelectMode(mode.id)}
            className={`group relative text-left p-6 rounded-2xl border-2 border-transparent shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white dark:bg-gray-800 ${mode.borderColor}`}
          >
            {/* Background tint on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none ${mode.bgColor} ${mode.darkBgColor}`} />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-700 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors ${mode.color} ${mode.darkColor}`}>
                  {mode.icon}
                </div>
                {mode.badge && (
                  <span className={`px-2 py-1 rounded-md text-xs font-bold tracking-wide ${mode.badge.color} ${mode.badge.darkColor}`}>
                    {mode.badge.text}
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{mode.name}</h3>
              <p className={`text-sm font-medium mb-4 ${mode.color} ${mode.darkColor}`}>{mode.tagline}</p>
              
              <ul className="space-y-2">
                {mode.description.map((item, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${mode.color.replace('text-', 'bg-')}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </SessionWizardLayout>
  );
};