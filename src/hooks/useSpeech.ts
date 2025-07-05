'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface SpeechState {
  isSpeaking: boolean;
  currentText: string;
  error: string | null;
}

export interface UseSpeechOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseSpeechReturn {
  state: SpeechState;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  getVoices: () => SpeechSynthesisVoice[];
}

export const useSpeech = (options: UseSpeechOptions = {}): UseSpeechReturn => {
  const {
    voice,
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    onStart,
    onEnd,
    onError
  } = options;

  const [state, setState] = useState<SpeechState>({
    isSpeaking: false,
    currentText: '',
    error: null
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Wait for voices to load
  useEffect(() => {
    const waitForVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        setTimeout(waitForVoices, 100);
      }
    };
    
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', waitForVoices);
      waitForVoices();
    }

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', waitForVoices);
    };
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!text.trim()) {
        resolve();
        return;
      }

      console.log('🔊 Starting speech synthesis for:', text.substring(0, 50) + '...');

      // Stop any current speech
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }

      // Wait a moment for cancellation to complete
      setTimeout(() => {
        try {
          // Create new utterance
          const utterance = new SpeechSynthesisUtterance(text);
          utteranceRef.current = utterance;

          // Configure voice settings
          utterance.rate = rate;
          utterance.pitch = pitch;
          utterance.volume = volume;

          // Set voice if specified, otherwise use best available
          const voices = speechSynthesis.getVoices();
          console.log('🔊 Available voices:', voices.length);

          if (voice) {
            const selectedVoice = voices.find(v => v.name.includes(voice) || v.lang.includes(voice));
            if (selectedVoice) {
              utterance.voice = selectedVoice;
              console.log('🔊 Using voice:', selectedVoice.name);
            }
          } else {
            // Find the best English voice
            const englishVoices = voices.filter(v => v.lang.startsWith('en'));
            const preferredVoice = englishVoices.find(v => 
              v.name.includes('Enhanced') || 
              v.name.includes('Premium') || 
              v.name.includes('Neural') ||
              v.name.includes('Google') ||
              v.default
            ) || englishVoices[0];
            
            if (preferredVoice) {
              utterance.voice = preferredVoice;
              console.log('🔊 Using preferred voice:', preferredVoice.name);
            }
          }

          // Set up event handlers
          utterance.onstart = () => {
            console.log('🔊 Speech started');
            setState(prev => ({ 
              ...prev, 
              isSpeaking: true, 
              currentText: text, 
              error: null 
            }));
            onStart?.();
          };

          utterance.onend = () => {
            console.log('🔊 Speech ended');
            setState(prev => ({ 
              ...prev, 
              isSpeaking: false, 
              currentText: '' 
            }));
            onEnd?.();
            resolve();
          };

          utterance.onerror = (event) => {
            console.error('🔊 Speech error:', event.error);
            const errorMessage = `Speech synthesis error: ${event.error}`;
            setState(prev => ({ 
              ...prev, 
              isSpeaking: false, 
              error: errorMessage 
            }));
            onError?.(errorMessage);
            reject(new Error(errorMessage));
          };

          // Start speaking with retry mechanism
          console.log('🔊 Starting speechSynthesis.speak()');
          speechSynthesis.speak(utterance);

          // Fallback: Check if speech actually started
          setTimeout(() => {
            if (!speechSynthesis.speaking && !speechSynthesis.pending) {
              console.warn('🔊 Speech may not have started, retrying...');
              speechSynthesis.speak(utterance);
            }
          }, 100);

        } catch (error) {
          console.error('🔊 Failed to create speech:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to start speech synthesis';
          setState(prev => ({ 
            ...prev, 
            error: errorMessage 
          }));
          onError?.(errorMessage);
          reject(new Error(errorMessage));
        }
      }, 100);
    });
  }, [rate, pitch, volume, voice, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    console.log('🔊 Stopping speech');
    speechSynthesis.cancel();
    setState(prev => ({ 
      ...prev, 
      isSpeaking: false, 
      currentText: '' 
    }));
  }, []);

  const pause = useCallback(() => {
    speechSynthesis.pause();
  }, []);

  const resume = useCallback(() => {
    speechSynthesis.resume();
  }, []);

  const getVoices = useCallback((): SpeechSynthesisVoice[] => {
    return speechSynthesis.getVoices();
  }, []);

  return {
    state,
    speak,
    stop,
    pause,
    resume,
    getVoices
  };
};