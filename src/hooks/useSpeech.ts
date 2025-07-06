'use client';

import { useState, useRef, useCallback } from 'react';

export interface SpeechState {
  isSpeaking: boolean;
  currentText: string;
  error: string | null;
}

export interface UseSpeechOptions {
  voice?: 'rachel' | 'adam' | 'domi' | 'bella' | 'antoni' | 'elli' | 'josh' | 'arnold' | 'charlotte' | 'matilda';
  model?: 'eleven_turbo_v2' | 'eleven_monolingual_v1' | 'eleven_multilingual_v2';
  stability?: number;
  similarity_boost?: number;
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
}

export const useSpeech = (options: UseSpeechOptions = {}): UseSpeechReturn => {
  const {
    voice = 'rachel',
    model = 'eleven_turbo_v2',
    stability = 0.5,
    similarity_boost = 0.5,
    onStart,
    onEnd,
    onError
  } = options;

  const [state, setState] = useState<SpeechState>({
    isSpeaking: false,
    currentText: '',
    error: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    try {
      console.log('🔊 Starting TTS for:', text);
      
      // Stop any current speech
      stop();

      setState(prev => ({ 
        ...prev, 
        isSpeaking: true, 
        currentText: text, 
        error: null 
      }));
      
      onStart?.();

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Call ElevenLabs TTS API
      const response = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: voice,
          model: model,
          stability: stability,
          similarity_boost: similarity_boost
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS API failed: ${response.status}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        console.log('🔊 TTS finished');
        setState(prev => ({ 
          ...prev, 
          isSpeaking: false, 
          currentText: '' 
        }));
        onEnd?.();
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error('🔊 Audio playback error');
        const errorMsg = 'Audio playback failed';
        setState(prev => ({ 
          ...prev, 
          error: errorMsg, 
          isSpeaking: false,
          currentText: ''
        }));
        onError?.(errorMsg);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error('🔊 TTS error:', error);
      
      let errorMessage = 'Speech synthesis failed';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Speech cancelled';
        } else {
          errorMessage = error.message;
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isSpeaking: false,
        currentText: ''
      }));
      onError?.(errorMessage);
    }
  }, [voice, model, stability, similarity_boost, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    console.log('🔊 Stopping speech');
    
    // Abort any pending TTS request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isSpeaking: false, 
      currentText: '' 
    }));
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
    }
  }, []);

  return {
    state,
    speak,
    stop,
    pause,
    resume
  };
};