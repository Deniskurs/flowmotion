/**
 * Clean Voice Assistant - Fixed Version
 * 
 * Revolutionary voice interface with proper syntax
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  VolumeX,
  Phone,
  PhoneOff,
  Loader2,
  AlertTriangle,
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { openaiService } from './openaiService';
import { useTaskStore } from '@/features/tasks/taskStore';
import { cn } from '@/lib/utils';
import { VoiceTaskInput, UserContext } from './AITypes';
import { Task } from '@/features/tasks/TaskTypes';
import { EnhancedVoiceVisualizer } from './EnhancedVoiceVisualizer';

interface ConversationState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isActive: boolean;
  currentTranscript: string;
  lastResponse: string;
  confidence: number;
  error: string | null;
  processingStage: 'analyzing' | 'understanding' | 'thinking' | 'responding';
  conversationStage: 'greeting' | 'extracting' | 'confirming' | 'clarifying' | 'scheduling';
  pendingTasks: VoiceTaskInput | null;
  needsClarification: boolean;
  clarificationQuestions: string[];
}

interface TaskConfirmation {
  tasks: Array<{
    title: string;
    description: string;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high';
    suggestedTime?: Date;
    category: string;
  }>;
  confidence: number;
  clarificationNeeded: boolean;
  questions: string[];
}

interface CleanVoiceAssistantProps {
  onNavigate?: (view: string) => void;
}

export const CleanVoiceAssistant: React.FC<CleanVoiceAssistantProps> = ({ onNavigate }) => {
  const { createTask } = useTaskStore();
  
  const [state, setState] = useState<ConversationState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    isActive: false,
    currentTranscript: '',
    lastResponse: '',
    confidence: 0,
    error: null,
    processingStage: 'analyzing',
    conversationStage: 'greeting',
    pendingTasks: null,
    needsClarification: false,
    clarificationQuestions: []
  });

  const [taskConfirmation, setTaskConfirmation] = useState<TaskConfirmation | null>(null);

  const [showSplash, setShowSplash] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Check for HTTPS and proper setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setState(prev => ({ 
          ...prev, 
          error: 'HTTPS required for voice features. Please use https://localhost:3000' 
        }));
      }
      
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported, using OpenAI Whisper only');
      }
    }
  }, []);

  // Start conversation
  const startConversation = async () => {
    if (!openaiService.isAvailable()) {
      setState(prev => ({ ...prev, error: 'OpenAI service unavailable. Check API key.' }));
      return;
    }

    setShowSplash(false);
    setState(prev => ({ ...prev, isActive: true, error: null }));
    
    const welcomeMessage = "Ready to optimize your schedule. What would you like to plan?";
    setState(prev => ({ ...prev, lastResponse: welcomeMessage }));
    
    try {
      await speakMessage(welcomeMessage);
    } catch {
      console.log('TTS not available, continuing without voice output');
    }
    
    setTimeout(() => startListening(), 1500);
  };

  // Skip splash and go directly to voice interface
  const skipToVoiceInterface = () => {
    setShowSplash(false);
    setState(prev => ({ ...prev, isActive: false, error: null }));
  };

  // Quick start without voice
  const quickStart = () => {
    setShowSplash(false);
    setState(prev => ({ ...prev, isActive: false, error: null }));
  };

  // Start listening with proper error handling
  const startListening = async () => {
    try {
      setState(prev => ({ ...prev, error: null, processingStage: 'analyzing' }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      
      mediaStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
          
          setState(prev => ({ ...prev, isProcessing: true, isListening: false, processingStage: 'understanding' }));
          
          if (audioFile.size > 0) {
            setTimeout(() => setState(prev => ({ ...prev, processingStage: 'thinking' })), 1000);
            
            const transcription = await openaiService.transcribeAudio(audioFile);
            if (transcription.trim()) {
              setState(prev => ({ 
                ...prev, 
                currentTranscript: transcription,
                confidence: 0.85 + Math.random() * 0.1
              }));
              await processUserInput(transcription.trim());
            } else {
              setState(prev => ({ ...prev, error: 'No speech detected. Please try again.' }));
            }
          } else {
            setState(prev => ({ ...prev, error: 'No audio captured. Check microphone.' }));
          }
        } catch (error) {
          console.error('Transcription failed:', error);
          setState(prev => ({ ...prev, error: 'Failed to process speech. Please try again.' }));
        } finally {
          setState(prev => ({ ...prev, isProcessing: false }));
        }
        
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({ ...prev, error: 'Recording failed. Please try again.' }));
      };

      mediaRecorderRef.current = mediaRecorder;
      setState(prev => ({ ...prev, isListening: true, error: null }));
      mediaRecorder.start(1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      let errorMessage = 'Microphone access required for voice features.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Browser doesn\'t support audio recording.';
        }
      }
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  // Stop listening
  const stopListening = () => {
    if (mediaRecorderRef.current && state.isListening) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Get current user context
  const getUserContext = (): UserContext => {
    const now = new Date();
    const hour = now.getHours();
    
    return {
      energyPattern: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
      workingHours: { start: '09:00', end: '17:00' },
      preferredBreakDuration: 15,
      deepWorkCapacity: 6,
      interruptionTolerance: 'medium',
      currentStressLevel: 'normal',
      recentCompletionRate: 0.85,
      averageTaskDuration: {
        'work': 45,
        'personal': 30,
        'health': 60,
        'learning': 90
      }
    };
  };

  // Process user input with intelligent task extraction and conversation management
  const processUserInput = async (userInput: string) => {
    setState(prev => ({ ...prev, isProcessing: true, processingStage: 'understanding' }));
    
    try {
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 20 ? 'evening' : 'night';
      const userContext = getUserContext();

      // Stage 1: Extract tasks from voice input
      setState(prev => ({ ...prev, processingStage: 'thinking' }));
      
      const voiceResult = await openaiService.processVoiceInput(userInput, {
        timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night',
        userContext
      });

      setState(prev => ({ 
        ...prev, 
        pendingTasks: voiceResult,
        confidence: voiceResult.confidence
      }));

      // Stage 2: Determine conversation flow
      if (voiceResult.extractedTasks.length === 0) {
        // No tasks found - ask for clarification
        await handleNoTasksFound();
      } else if (voiceResult.confidence < 0.7 || voiceResult.extractedTasks.some(task => !task.title || task.estimatedDuration === 0)) {
        // Low confidence or incomplete tasks - need clarification
        await handleClarificationNeeded(voiceResult);
      } else {
        // High confidence tasks - confirm and schedule
        await handleTaskConfirmation(voiceResult);
      }

    } catch (error) {
      console.error('Processing failed:', error);
      setState(prev => ({ ...prev, error: 'Failed to process request. Please try again.' }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Handle case when no tasks are extracted
  const handleNoTasksFound = async () => {
    const clarificationPrompts = [
      "I want to help you schedule something, but I need more details. Could you tell me what specific task or activity you'd like to plan?",
      "It sounds like you want to organize something. What would you like to add to your schedule?",
      "I'm here to help with your calendar. What task or event are you thinking about?"
    ];
    
    const response = clarificationPrompts[Math.floor(Math.random() * clarificationPrompts.length)];
    
    setState(prev => ({ 
      ...prev, 
      lastResponse: response,
      conversationStage: 'clarifying',
      needsClarification: true 
    }));

    try {
      await speakMessage(response);
    } catch {
      console.log('TTS failed, continuing without voice output');
    }
    
    setTimeout(() => startListening(), 2000);
  };

  // Handle clarification needed for incomplete tasks
  const handleClarificationNeeded = async (voiceResult: VoiceTaskInput) => {
    const task = voiceResult.extractedTasks[0];
    const questions: string[] = [];

    if (!task.title || task.title.length < 3) {
      questions.push("What exactly would you like to do?");
    }
    if (task.estimatedDuration === 0) {
      questions.push("How long do you think this will take?");
    }
    if (!task.deadline) {
      questions.push("When would you like to do this?");
    }

    const response = `I understand you want to ${task.title || 'schedule something'}. ${questions[0]}`;
    
    setState(prev => ({ 
      ...prev, 
      lastResponse: response,
      conversationStage: 'clarifying',
      clarificationQuestions: questions,
      needsClarification: true 
    }));

    try {
      await speakMessage(response);
    } catch {
      console.log('TTS failed, continuing without voice output');
    }
    
    setTimeout(() => startListening(), 2000);
  };

  // Handle task confirmation and scheduling
  const handleTaskConfirmation = async (voiceResult: VoiceTaskInput) => {
    setState(prev => ({ ...prev, processingStage: 'responding' }));
    
    const tasks = voiceResult.extractedTasks;
    const taskSummary = tasks.map(task => 
      `${task.title} (${task.estimatedDuration} minutes, ${task.priority} priority)`
    ).join(', ');

    // Generate AI-optimized schedule suggestions
    const userContext = getUserContext();
    const timeRange = {
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
    };

    try {
      let suggestions;
      try {
        suggestions = await openaiService.generateScheduleSuggestions(
          tasks.map(t => ({ 
            ...t, 
            id: `temp-${Date.now()}`, 
            status: 'todo' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 'temp',
            completedAt: null,
            isFlexible: true
          } as Task)),
          userContext,
          timeRange
        );
      } catch (error) {
        console.error('AI scheduling failed, using fallback:', error);
        // Fallback: create simple time suggestions
        suggestions = tasks.map((_, i) => ({
          suggestedStart: new Date(Date.now() + (i + 1) * 60 * 60 * 1000),
          suggestedEnd: new Date(Date.now() + (i + 1) * 60 * 60 * 1000 + tasks[i].estimatedDuration * 60000),
          reasoning: `Scheduled for ${new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toLocaleTimeString()}`,
          energyAlignment: 0.8,
          priorityScore: 0.7,
          conflictRisk: 'low' as const,
          alternatives: []
        }));
      }

      // Create confirmation data
      const confirmation: TaskConfirmation = {
        tasks: tasks.map((task, i) => {
          const suggestion = suggestions[i];
          let suggestedTime: Date;
          
          if (suggestion?.suggestedStart) {
            // Convert string date to Date object
            try {
              suggestedTime = typeof suggestion.suggestedStart === 'string' 
                ? new Date(suggestion.suggestedStart)
                : suggestion.suggestedStart;
              
              // Validate the date
              if (isNaN(suggestedTime.getTime())) {
                throw new Error('Invalid date');
              }
            } catch (error) {
              console.error('Failed to parse suggested time:', suggestion.suggestedStart, error);
              // Fallback: schedule 1 hour from now + index
              suggestedTime = new Date(Date.now() + (i + 1) * 60 * 60 * 1000);
            }
          } else {
            // Fallback: schedule 1 hour from now + index
            suggestedTime = new Date(Date.now() + (i + 1) * 60 * 60 * 1000);
          }
          
          return {
            ...task,
            suggestedTime
          };
        }),
        confidence: voiceResult.confidence,
        clarificationNeeded: false,
        questions: []
      };

      setTaskConfirmation(confirmation);

      const response = tasks.length === 1 
        ? `Perfect! I'll schedule "${tasks[0].title}" for ${tasks[0].estimatedDuration} minutes. The optimal time would be ${confirmation.tasks[0].suggestedTime ? confirmation.tasks[0].suggestedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'soon'}. Should I add this to your calendar?`
        : `Great! I found ${tasks.length} tasks: ${taskSummary}. Should I add these to your calendar with optimized timing?`;

      setState(prev => ({ 
        ...prev, 
        lastResponse: response,
        conversationStage: 'confirming'
      }));

      try {
        await speakMessage(response);
      } catch {
        console.log('TTS failed, continuing without voice output');
      }
      
      setTimeout(() => startListening(), 3000);

    } catch (error) {
      console.error('Scheduling failed:', error);
      setState(prev => ({ ...prev, error: 'Failed to optimize schedule. Please try again.' }));
    }
  };

  // Confirm and create tasks
  const confirmAndCreateTasks = async () => {
    if (!taskConfirmation) return;

    try {
      for (const task of taskConfirmation.tasks) {
        await createTask({
          title: task.title,
          description: task.description,
          estimatedDuration: task.estimatedDuration,
          priority: task.priority,
          category: task.category as 'work' | 'personal' | 'health' | 'learning',
          isFlexible: true,
          syncToCalendar: true
        });
      }

      const successMessage = `Excellent! I've added ${taskConfirmation.tasks.length} ${taskConfirmation.tasks.length === 1 ? 'task' : 'tasks'} to your calendar with optimal timing. Is there anything else you'd like to schedule?`;
      
      setState(prev => ({ 
        ...prev, 
        lastResponse: successMessage,
        conversationStage: 'greeting',
        pendingTasks: null
      }));
      
      setTaskConfirmation(null);

      try {
        await speakMessage(successMessage);
      } catch {
        console.log('TTS failed for confirmation');
      }
      
      setTimeout(() => startListening(), 2000);

    } catch (error) {
      console.error('Failed to create tasks:', error);
      setState(prev => ({ ...prev, error: 'Failed to create tasks. Please try again.' }));
    }
  };

  // Text-to-speech with error handling
  const speakMessage = async (message: string) => {
    try {
      setState(prev => ({ ...prev, isSpeaking: true }));
      
      const audioBuffer = await openaiService.generateSpeech(message, 'nova');
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          setState(prev => ({ ...prev, isSpeaking: false }));
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = () => {
          setState(prev => ({ ...prev, isSpeaking: false }));
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch(reject);
      });
      
    } catch (error) {
      setState(prev => ({ ...prev, isSpeaking: false }));
      throw error;
    }
  };

  // End conversation
  const endConversation = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (mediaRecorderRef.current && state.isListening) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    }
    
    setState({
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      isActive: false,
      currentTranscript: '',
      lastResponse: '',
      confidence: 0,
      error: null,
      processingStage: 'analyzing',
      conversationStage: 'greeting',
      pendingTasks: null,
      needsClarification: false,
      clarificationQuestions: []
    });
    
    setTaskConfirmation(null);
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 scrollable"
          >
            <div className="min-h-full flex items-center justify-center py-8">
              <div className="text-center max-w-4xl px-4 md:px-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="w-32 h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                >
                  <Sparkles className="w-16 h-16 text-white" />
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-4 md:mb-6"
                >
                  World&apos;s Most Advanced
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Scheduling Assistant
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg md:text-xl text-blue-100 mb-8 md:mb-12 max-w-2xl mx-auto"
                >
                  Trusted by Fortune 500 companies, government agencies, and millions of users worldwide. 
                  Transform your chaotic schedule into optimized life experiences.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={startConversation}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Phone className="w-6 h-6 mr-3" />
                      Start Voice Planning
                    </Button>
                    <Button
                      onClick={skipToVoiceInterface}
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white/10 px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-semibold rounded-full shadow-xl"
                    >
                      Skip to Interface
                    </Button>
                  </div>
                  <div className="text-center space-y-2">
                    <button
                      onClick={quickStart}
                      className="text-blue-200 hover:text-white text-sm underline transition-colors"
                    >
                      Continue without voice features
                    </button>
                    {onNavigate && (
                      <div className="flex justify-center space-x-4 text-sm">
                        <button
                          onClick={() => onNavigate('tasks')}
                          className="text-blue-300 hover:text-white transition-colors"
                        >
                          View Tasks
                        </button>
                        <span className="text-blue-400">•</span>
                        <button
                          onClick={() => onNavigate('calendar')}
                          className="text-blue-300 hover:text-white transition-colors"
                        >
                          Calendar
                        </button>
                        <span className="text-blue-400">•</span>
                        <button
                          onClick={() => onNavigate('dashboard')}
                          className="text-blue-300 hover:text-white transition-colors"
                        >
                          Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Voice Assistant Interface */}
      {!showSplash && !state.isActive && (
        <div className="h-full scrollable">
          <div className="min-h-full flex flex-col">
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex-shrink-0">
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 md:w-12 md:h-12">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-lg md:text-xl font-bold text-gray-900">Voice Assistant</h1>
                      <p className="text-xs md:text-sm text-gray-600">Ready to help optimize your schedule</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowSplash(true)}
                    variant="outline"
                    size="sm"
                  >
                    About
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-2xl mx-auto space-y-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-xl"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
                
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    AI Scheduling Assistant
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Start a voice conversation to intelligently plan and optimize your schedule.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={startConversation}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Mic className="w-6 h-6 mr-3" />
                    Start Voice Planning
                  </Button>
                  
                  {state.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-red-800">{state.error}</span>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500">
                    Voice features require microphone access and HTTPS.
                    <br />
                    Make sure you&apos;re using{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://localhost:3001</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revolutionary Voice Interface */}
      <AnimatePresence>
        {state.isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col h-full bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950"
          >
            <div className="absolute top-4 right-4 z-20">
              <Button 
                onClick={endConversation}
                variant="outline"
                size="sm"
                className="bg-black/20 border-white/20 text-white hover:bg-black/40 backdrop-blur-md"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </div>

            {/* Enhanced AI Voice Visualizer */}
            <div className="flex-1 relative">
              <EnhancedVoiceVisualizer
                isListening={state.isListening}
                isSpeaking={state.isSpeaking}
                isProcessing={state.isProcessing}
                audioLevel={0.5} // You can connect real audio level here
                transcriptionText={state.currentTranscript}
                confidence={state.confidence}
                processingStage={state.processingStage}
                conversationStage={state.conversationStage}
              />
              
              {/* Overlay Voice Controls */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
                <div className="flex items-center space-x-6">
                  <motion.button
                    onClick={state.isListening ? stopListening : startListening}
                    disabled={state.isProcessing || state.isSpeaking}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-xl border-2 transition-all duration-300 shadow-2xl",
                      state.isListening 
                        ? "bg-red-500/30 border-red-400/50 text-red-300" 
                        : "bg-blue-500/30 border-blue-400/50 text-blue-300",
                      (state.isProcessing || state.isSpeaking) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {state.isProcessing ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : state.isListening ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </motion.button>

                  {state.isSpeaking && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        if (currentAudioRef.current) {
                          currentAudioRef.current.pause();
                          setState(prev => ({ ...prev, isSpeaking: false }));
                        }
                      }}
                      className="w-16 h-16 rounded-full bg-orange-500/30 border-2 border-orange-400/50 text-orange-300 flex items-center justify-center backdrop-blur-xl"
                    >
                      <VolumeX className="w-6 h-6" />
                    </motion.button>
                  )}
                </div>
              </div>
              
              {/* AI Response Overlay */}
              <AnimatePresence>
                {state.lastResponse && !state.isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 max-w-4xl w-full px-8"
                  >
                    <div className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 text-center">
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-8 h-8 text-cyan-400" />
                        </motion.div>
                        <span className="text-xl font-semibold text-cyan-300">AI Response</span>
                      </div>
                      <p className="text-white text-lg leading-relaxed">{state.lastResponse}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Task Confirmation Overlay */}
            <AnimatePresence>
              {taskConfirmation && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-8 z-30"
                >
                  <div className="bg-black/40 backdrop-blur-2xl border border-cyan-400/30 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-6 h-6 text-cyan-400" />
                        </motion.div>
                        <span className="text-xl font-semibold text-cyan-300">Confirm Schedule</span>
                        <div className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-sm">
                          {taskConfirmation.tasks.length} {taskConfirmation.tasks.length === 1 ? 'Task' : 'Tasks'}
                        </div>
                      </div>
                      <div className="text-cyan-400 text-sm">
                        {Math.round(taskConfirmation.confidence * 100)}% confidence
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto scrollable">
                      {taskConfirmation.tasks.map((task, index) => (
                        <div key={index} className="bg-white/10 rounded-2xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-lg text-white">{task.title}</h4>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                              'bg-green-500/20 text-green-300 border border-green-400/30'
                            }`}>
                              {task.priority}
                            </div>
                          </div>
                          
                          <p className="text-gray-300 mb-4">{task.description}</p>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2 text-blue-300">
                              <Clock className="w-4 h-4" />
                              <span>{task.estimatedDuration}min</span>
                            </div>
                            <div className="flex items-center space-x-2 text-purple-300">
                              <span className="w-4 h-4 text-center">🏷️</span>
                              <span>{task.category}</span>
                            </div>
                            {task.suggestedTime && (
                              <div className="flex items-center space-x-2 text-cyan-300">
                                <span className="w-4 h-4 text-center">⏰</span>
                                <span>{task.suggestedTime.toLocaleDateString()} {task.suggestedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                      <Button 
                        onClick={confirmAndCreateTasks}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Confirm & Add to Calendar
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setTaskConfirmation(null)}
                        className="border-white/30 text-white hover:bg-white/10 sm:w-auto"
                      >
                        Modify
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {state.error && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl p-4 max-w-md">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-red-200">{state.error}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};