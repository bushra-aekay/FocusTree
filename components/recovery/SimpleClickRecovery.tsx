import React from 'react';
import { Button } from '../Button';
import { CheckCircle } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const SimpleClickRecovery: React.FC<Props> = ({ onComplete }) => {
  return (
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">You seemed distracted.</h3>
      <p className="text-gray-500 mb-8">Ready to get back in the zone?</p>
      
      <Button onClick={onComplete} className="w-full py-4 text-lg" icon={<CheckCircle className="w-5 h-5" />}>
        I'M BACK
      </Button>
    </div>
  );
};