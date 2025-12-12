import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Sprout, ShieldCheck, Zap, Trees } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="container mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
            <Trees className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold text-gray-800 dark:text-white tracking-tight">FocusTree</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          {user && (
             <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-sm md:text-base dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800">
                Dashboard
             </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8 md:py-24 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="flex-1 space-y-6 md:space-y-8 text-center md:text-left">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs md:text-sm font-medium border border-emerald-200 dark:border-emerald-800">
            <Sprout className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Grow while you work
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Focus better. <br />
            <span className="text-emerald-600 dark:text-emerald-400">Grow your tree.</span> <br />
            Transform your productivity.
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto md:mx-0 leading-relaxed">
            Harness the power of AI to stay on track. FocusTree monitors your sessions, alerts you when you're distracted, and visualizes your progress as a thriving digital forest.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <Button onClick={handleStart} className="w-full sm:w-auto text-lg px-8 py-4 shadow-xl shadow-emerald-500/20">
              {user ? "Go to Dashboard" : "Get Started"}
            </Button>
            {!user && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">Free • No account needed</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-8 text-left">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-700 transition-colors">
              <Zap className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Monitoring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Smart webcam detection for distractions.</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-700 transition-colors">
              <Sprout className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Gamified Growth</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your focus nurtures your personal tree.</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-700 transition-colors">
              <ShieldCheck className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Privacy First</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Analysis happens locally. Secure & private.</p>
            </div>
          </div>
        </div>

        {/* Visual / Illustration Placeholder */}
        <div className="flex-1 w-full max-w-lg">
          <div className="relative aspect-square bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-gray-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 flex items-center justify-center border border-emerald-100 dark:border-gray-700">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 dark:opacity-5"></div>
            {/* Abstract Tree Representation */}
            <div className="flex flex-col items-center animate-pulse-slow">
               <Trees className="w-48 h-48 md:w-64 md:h-64 text-emerald-600 dark:text-emerald-400 drop-shadow-xl" />
            </div>
            
            {/* Floating UI Elements mimicking dashboard */}
            <div className="absolute top-8 right-8 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg animate-bounce-slow border border-gray-100 dark:border-gray-700">
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 <span className="text-xs font-bold text-gray-700 dark:text-gray-300">REC</span>
               </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-800">
        © 2024 FocusTree. All rights reserved.
      </footer>
    </div>
  );
};