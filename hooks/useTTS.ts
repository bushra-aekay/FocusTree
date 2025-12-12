import { useState, useCallback, useEffect, useRef } from 'react';
import { PersonalityId } from '../types';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Ensure voices are loaded (Chrome quirk)
  useEffect(() => {
    const loadVoices = () => {
       window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (synth && synth.speaking) {
        synth.cancel();
      }
    };
  }, [synth]);

  const getBestVoice = (personality: PersonalityId, voices: SpeechSynthesisVoice[]) => {
    // Helper to score voices based on quality keywords
    const scoreVoice = (voice: SpeechSynthesisVoice) => {
      let score = 0;
      if (voice.lang === 'en-US' || voice.lang === 'en-GB') score += 5;
      
      // Keywords that usually indicate higher quality neural voices
      if (voice.name.includes('Google')) score += 10;
      if (voice.name.includes('Natural')) score += 15;
      if (voice.name.includes('Online')) score += 12; // "Microsoft Ryan Online (Natural)" etc.
      if (voice.name.includes('Enhanced')) score += 8;
      
      return score;
    };

    // Filter for English
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    
    // Sort by quality score
    englishVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));

    if (englishVoices.length === 0) return voices[0];

    // Personality specific selection
    // We try to match gender/accent to personality if possible
    switch (personality) {
      case 'drill_sergeant':
         // Prefer Male, maybe UK for sternness
         const maleUK = englishVoices.find(v => (v.name.includes('Male') || v.name.includes('Ryan') || v.name.includes('Daniel')) && v.lang === 'en-GB');
         if (maleUK) return maleUK;
         break;
      case 'supportive_friend':
         // Prefer Female, warm
         const femaleUS = englishVoices.find(v => (v.name.includes('Female') || v.name.includes('Ava') || v.name.includes('Samantha')) && v.lang === 'en-US');
         if (femaleUS) return femaleUS;
         break;
      case 'calm_coach':
          // Prefer Soft/Natural
          const natural = englishVoices.find(v => v.name.includes('Natural') || v.name.includes('Google US English'));
          if (natural) return natural;
          break;
    }

    // Default to the highest scored voice
    return englishVoices[0];
  };

  const getPitchRate = (personality: PersonalityId) => {
    switch (personality) {
      case 'supportive_friend': return { pitch: 1.1, rate: 1.0 };
      case 'drill_sergeant': return { pitch: 0.8, rate: 1.2 };
      case 'roast_mode': return { pitch: 0.9, rate: 1.1 };
      case 'calm_coach': return { pitch: 1.0, rate: 0.9 };
      case 'hype_mode': return { pitch: 1.2, rate: 1.2 };
      default: return { pitch: 1.0, rate: 1.0 };
    }
  };

  const speak = useCallback((text: string, personality: PersonalityId) => {
    if (!synth || !text.trim()) return;
    
    // Cancel existing speech
    synth.cancel();

    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        let voices = synth.getVoices();
        
        // Retry logic
        if (voices.length === 0) {
            setTimeout(() => {
                voices = synth.getVoices();
                const voice = getBestVoice(personality, voices);
                const { pitch, rate } = getPitchRate(personality);
                if (voice) utterance.voice = voice;
                utterance.pitch = pitch;
                utterance.rate = rate;
                synth.speak(utterance);
            }, 100);
            return;
        }

        const voice = getBestVoice(personality, voices);
        const { pitch, rate } = getPitchRate(personality);

        if (voice) utterance.voice = voice;
        utterance.pitch = pitch;
        utterance.rate = rate;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synth.speak(utterance);
    }, 10);
  }, [synth]);

  const stop = useCallback(() => {
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
    }
  }, [synth]);

  return { speak, stop, isSpeaking };
};