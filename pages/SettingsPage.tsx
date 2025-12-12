import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { Button } from '../components/Button';
import { userService } from '../services/userService';
import { ThemeToggle } from '../components/ThemeToggle';
import { ArrowLeft, Bell, Volume2, Shield, User as UserIcon, Save, Eye, Layout } from 'lucide-react';

type SettingsTab = 'general' | 'audio' | 'notifications' | 'privacy' | 'account';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config, updateConfig } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Local state for settings form before saving
  const [formData, setFormData] = useState({
    defaultMode: user?.preferences.defaultMode || 'focused',
    defaultDuration: 25,
    notificationsEnabled: true,
    soundEnabled: true,
    volume: 80,
    aiVoice: 'supportive_friend'
  });

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await userService.updatePreferences({
         defaultMode: formData.defaultMode
      });
      await new Promise(r => setTimeout(r, 800));
      alert("Settings saved!");
    } catch (e) {
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const NavItem = ({ id, icon, label }: { id: SettingsTab; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h1>
          </div>
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <Button onClick={handleSave} isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
               Save Changes
             </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <nav className="space-y-2">
            <NavItem id="general" icon={<Layout className="w-5 h-5" />} label="General" />
            <NavItem id="audio" icon={<Volume2 className="w-5 h-5" />} label="Audio & Voice" />
            <NavItem id="notifications" icon={<Bell className="w-5 h-5" />} label="Notifications" />
            <NavItem id="privacy" icon={<Shield className="w-5 h-5" />} label="Privacy" />
            <NavItem id="account" icon={<UserIcon className="w-5 h-5" />} label="Account" />
          </nav>

          {/* Content Area */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-h-[500px] transition-colors">
              
              {activeTab === 'general' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Default Session Settings</h2>
                    <div className="grid gap-6 max-w-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Mode</label>
                        <select 
                          value={formData.defaultMode}
                          onChange={(e) => setFormData({...formData, defaultMode: e.target.value as any})}
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="focused">Focused Mode (Balanced)</option>
                          <option value="hardcore">Hardcore Mode (Strict)</option>
                          <option value="chill">Chill Mode (Relaxed)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Duration (Minutes)</label>
                        <input 
                          type="number"
                          value={formData.defaultDuration}
                          onChange={(e) => setFormData({...formData, defaultDuration: parseInt(e.target.value)})}
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detection Sensitivity</h2>
                    <div className="flex items-center gap-4">
                      <input type="range" min="1" max="10" className="w-full max-w-md accent-emerald-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Medium</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Adjust how sensitive the AI is to head movement.</p>
                  </div>
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sound Settings</h2>
                    <div className="flex items-center justify-between max-w-lg mb-6">
                      <span className="text-gray-700 dark:text-gray-300">Master Volume</span>
                      <input 
                        type="range" 
                        value={formData.volume} 
                        onChange={(e) => setFormData({...formData, volume: parseInt(e.target.value)})}
                        className="w-48 accent-emerald-500" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">AI Assistant Voice</h2>
                     <div className="grid grid-cols-2 gap-4 max-w-lg">
                       {['supportive_friend', 'drill_sergeant', 'calm_coach'].map(v => (
                         <div 
                            key={v}
                            onClick={() => setFormData({...formData, aiVoice: v})}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                formData.aiVoice === v 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                                : 'border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-600'
                            }`}
                         >
                            <div className="font-medium text-gray-800 dark:text-white capitalize">{v.replace('_', ' ')}</div>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              )}
              
              {/* Other tabs placeholders */}
              {activeTab === 'notifications' && (
                 <div className="animate-fade-in text-center py-12 text-gray-400 dark:text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Notification settings coming soon.</p>
                 </div>
              )}
              
              {activeTab === 'privacy' && (
                 <div className="animate-fade-in space-y-6">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                       <h3 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center mb-2">
                          <Shield className="w-5 h-5 mr-2" />
                          Privacy First
                       </h3>
                       <p className="text-sm text-emerald-700 dark:text-emerald-400">
                          FocusTree processes all webcam data locally in your browser. Images are never sent to our servers.
                       </p>
                    </div>
                    
                    <div>
                       <h3 className="font-bold text-gray-900 dark:text-white mb-4">Data Management</h3>
                       <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-900/30">
                          Delete All Session Data
                       </Button>
                    </div>
                 </div>
              )}

              {activeTab === 'account' && (
                 <div className="animate-fade-in">
                    <div className="flex items-center gap-4 mb-8">
                       <img src={user?.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-gray-700" />
                       <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.displayName}</h2>
                          <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                       </div>
                    </div>
                    
                    <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20">
                       Log Out
                    </Button>
                 </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};