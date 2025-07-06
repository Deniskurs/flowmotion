'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWhisper } from './useWhisper';
import { useSpeech } from './useSpeech';

export interface VoiceConversationState {
  isActive: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  aiResponse: string;
  error: string | null;
  conversationMode: 'idle' | 'listening' | 'processing' | 'speaking' | 'waiting';
}

export interface UseVoiceConversationOptions {
  onTranscript?: (transcript: string) => void;
  onSendMessage?: (message: string) => void;
  onAIResponse?: (response: string) => void;
  autoResumeDelay?: number;
  speechOptions?: {
    voice?: 'rachel' | 'adam' | 'domi' | 'bella' | 'antoni' | 'elli' | 'josh' | 'arnold' | 'charlotte' | 'matilda';
    model?: 'eleven_turbo_v2' | 'eleven_monolingual_v1' | 'eleven_multilingual_v2';
    stability?: number;
    similarity_boost?: number;
  };
}

export interface UseVoiceConversationReturn {
  state: VoiceConversationState;
  startConversation: () => void;
  stopConversation: () => void;
  stopRecording: () => void;
  handleAIResponse: (response: string) => void;
  clearTranscript: () => void;
}

export const useVoiceConversation = (
  options: UseVoiceConversationOptions = {}
): UseVoiceConversationReturn => {
  const {
    onTranscript,
    onSendMessage,
    onAIResponse,
    autoResumeDelay = 1000,
    speechOptions = {}
  } = options;

  const [state, setState] = useState<VoiceConversationState>({
    isActive: false,
    isRecording: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    aiResponse: '',
    error: null,
    conversationMode: 'idle'
  });

  const autoResumeTimeoutRef = useRef<NodeJS.Timeout>();

  const handleWhisperTranscript = useCallback((transcript: string) => {
    console.log('🎤 Voice transcript received:', transcript);
    setState(prev => ({ ...prev, transcript }));
    onTranscript?.(transcript);
    
    // Auto-send transcript after user stops speaking
    if (transcript.trim()) {
      console.log('📤 Sending transcript to AI:', transcript);
      setTimeout(() => {
        onSendMessage?.(transcript);
        setState(prev => ({ 
          ...prev, 
          conversationMode: 'processing',
          isProcessing: true 
        }));
      }, 1500); // Small delay to allow for continuation
    }
  }, [onTranscript, onSendMessage]);

  const handleWhisperError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const whisper = useWhisper({
    onTranscript: handleWhisperTranscript,
    onError: handleWhisperError,
  });

  const handleSpeechStart = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isSpeaking: true, 
      conversationMode: 'speaking',
      error: null 
    }));
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isSpeaking: false, 
      conversationMode: 'waiting' 
    }));

    // Auto-resume listening after AI finishes speaking
    if (autoResumeTimeoutRef.current) {
      clearTimeout(autoResumeTimeoutRef.current);
    }
    
    autoResumeTimeoutRef.current = setTimeout(() => {
      if (state.isActive && !whisper.state.isRecording) {
        whisper.startRecording();
        setState(prev => ({ 
          ...prev, 
          conversationMode: 'listening',
          transcript: '' // Clear previous transcript
        }));
      }
    }, autoResumeDelay);
  }, [state.isActive, whisper, autoResumeDelay]);

  const handleSpeechError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const speech = useSpeech({
    voice: speechOptions.voice || 'rachel',
    model: speechOptions.model || 'eleven_turbo_v2',
    stability: speechOptions.stability || 0.5,
    similarity_boost: speechOptions.similarity_boost || 0.5,
    onStart: handleSpeechStart,
    onEnd: handleSpeechEnd,
    onError: handleSpeechError
  });

  // Update state based on whisper and speech states
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isRecording: whisper.state.isRecording,
      isProcessing: whisper.state.isProcessing,
      isSpeaking: speech.state.isSpeaking,
      error: whisper.state.error || speech.state.error,
    }));

    // Update conversation mode based on current states
    if (whisper.state.isRecording) {
      setState(prev => ({ ...prev, conversationMode: 'listening' }));
    } else if (whisper.state.isProcessing) {
      setState(prev => ({ ...prev, conversationMode: 'processing' }));
    } else if (speech.state.isSpeaking) {
      setState(prev => ({ ...prev, conversationMode: 'speaking' }));
    }
  }, [
    whisper.state.isRecording,
    whisper.state.isProcessing,
    whisper.state.error,
    speech.state.isSpeaking,
    speech.state.error
  ]);

  const startConversation = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isActive: true, 
      conversationMode: 'listening',
      error: null 
    }));
    whisper.startRecording();
  }, [whisper]);

  const stopConversation = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isActive: false, 
      conversationMode: 'idle',
      transcript: '',
      aiResponse: '' 
    }));
    
    whisper.stopRecording();
    speech.stop();
    
    if (autoResumeTimeoutRef.current) {
      clearTimeout(autoResumeTimeoutRef.current);
    }
  }, [whisper, speech]);

  const handleAIResponse = useCallback((response: string) => {
    console.log('🤖 AI response received:', response);
    setState(prev => ({ 
      ...prev, 
      aiResponse: response, 
      isProcessing: false,
      transcript: '' // Clear transcript after AI responds
    }));
    
    onAIResponse?.(response);
    
    if (state.isActive && response.trim()) {
      console.log('🔊 Speaking AI response:', response);
      speech.speak(response);
    }
  }, [state.isActive, speech, onAIResponse]);

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '' }));
    whisper.clearTranscript();
  }, [whisper]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping recording only (keeping conversation active)');
    whisper.stopRecording();
  }, [whisper]);

  return {
    state,
    startConversation,
    stopConversation,
    stopRecording,
    handleAIResponse,
    clearTranscript
  };
};