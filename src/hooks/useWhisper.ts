'use client';

import { useState, useRef, useCallback } from 'react';

export interface WhisperState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}

export interface UseWhisperOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  apiKey?: string;
}

export interface UseWhisperReturn {
  state: WhisperState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscript: () => void;
}

export const useWhisper = (options: UseWhisperOptions = {}): UseWhisperReturn => {
  const { onTranscript, onError } = options;
  
  const [state, setState] = useState<WhisperState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    error: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Clear previous state
      setState(prev => ({ 
        ...prev, 
        error: null, 
        transcript: '', 
        isRecording: true 
      }));

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        await processAudioWithWhisper(audioBlob);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({ 
          ...prev, 
          error: 'Recording failed', 
          isRecording: false 
        }));
        onError?.('Recording failed');
      };

      mediaRecorder.start(100); // Collect data every 100ms

    } catch (error) {
      console.error('Failed to start recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to access microphone';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isRecording: false 
      }));
      onError?.(errorMessage);
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      setState(prev => ({ ...prev, isProcessing: true }));
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [state.isRecording]);

  const processAudioWithWhisper = async (audioBlob: Blob) => {
    try {
      console.log('🎙️ Processing audio with Whisper, blob size:', audioBlob.size);
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

      // Convert to the format Whisper expects
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      console.log('📡 Sending to Whisper API...');
      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API failed: ${response.status}`);
      }

      const result = await response.json();
      const transcript = result.text || '';
      console.log('📝 Whisper transcript:', transcript);

      setState(prev => ({ 
        ...prev, 
        transcript, 
        isProcessing: false, 
        error: null 
      }));

      if (transcript) {
        console.log('✅ Calling onTranscript callback with:', transcript);
        onTranscript?.(transcript);
      }

    } catch (error) {
      console.error('Whisper processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Speech processing failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      onError?.(errorMessage);
    }
  };

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', error: null }));
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    clearTranscript
  };
};