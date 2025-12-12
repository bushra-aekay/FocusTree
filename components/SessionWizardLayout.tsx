import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from './Button';

interface SessionWizardLayoutProps {
  children: React.ReactNode;
  currentStep: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export const SessionWizardLayout: React.FC<SessionWizardLayoutProps> = ({ 
  children, 
  currentStep, 
  title, 
  subtitle,
  onBack 
}) => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (window.confirm('Exit session setup? Your progress will be lost.')) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 bg-emerald-50/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 transition-colors">
        <div className="flex items-center w-1/4 md:w-1/3">
          {onBack ? (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9"></div> 
          )}
        </div>
        
        <div className="flex flex-col items-center w-1/2 md:w-1/3">
          <div className="text-[10px] md:text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider mb-1">
            STEP {currentStep} OF 3
          </div>
          <div className="flex space-x-1.5 md:space-x-2">
            {[1, 2, 3].map((step) => (
              <div 
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === currentStep ? 'w-6 md:w-8 bg-emerald-500' : 
                  step < currentStep ? 'w-3 md:w-4 bg-emerald-300 dark:bg-emerald-800' : 'w-1.5 md:w-2 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end w-1/4 md:w-1/3">
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 pb-12 pt-4 max-w-4xl">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">{title}</h1>
          {subtitle && <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
};