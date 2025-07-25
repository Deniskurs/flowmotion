/**
 * ChatWindow - Ultra-premium Apple-style chat interface
 * Minimalistic design with sophisticated interactions
 */

'use client';

import { useChat } from 'ai/react';
import { useVoiceConversation } from '@/hooks/useVoiceConversation';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { useRef, useCallback, useState, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { VoiceOverlay } from './VoiceOverlay';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  mode?: 'chat' | 'scheduling';
  className?: string;
}

export function ChatWindow({ mode = 'scheduling', className }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  
  // Use refs to store chat functions for voice callbacks
  const chatFunctionsRef = useRef<{
    setInput: ((input: string) => void) | null;
    handleSubmit: ((e: any) => void) | null;
  }>({ setInput: null, handleSubmit: null });

  const handleVoiceTranscript = useCallback((transcript: string) => {
    console.log('📝 Setting input to:', transcript);
    if (chatFunctionsRef.current.setInput) {
      chatFunctionsRef.current.setInput(transcript);
    }
  }, []);

  const handleVoiceSendMessage = useCallback((message: string) => {
    console.log('📨 Voice message to send:', message);
    if (message.trim() && chatFunctionsRef.current.setInput && chatFunctionsRef.current.handleSubmit) {
      chatFunctionsRef.current.setInput(message);
      // Create a synthetic form event to trigger the chat submission
      const formEvent = {
        preventDefault: () => {},
        target: { value: message }
      } as any;
      
      // Trigger the chat submission directly
      setTimeout(() => {
        console.log('🚀 Submitting voice message to chat API');
        if (chatFunctionsRef.current.handleSubmit) {
          chatFunctionsRef.current.handleSubmit(formEvent);
        }
      }, 100);
    }
  }, []);

  const voiceConversation = useVoiceConversation({
    onTranscript: handleVoiceTranscript,
    onSendMessage: handleVoiceSendMessage,
    autoResumeDelay: 1500,
    speechOptions: {
      voice: 'rachel', // Clear, natural female voice
      model: 'eleven_turbo_v2', // Fast, high-quality model
      stability: 0.4, // Slight variation for naturalness
      similarity_boost: 0.7 // Higher clarity
    }
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
    body: { mode },
    onFinish: (message) => {
      // Auto-speak AI responses when voice conversation is active
      console.log('💬 Chat onFinish called, voiceActive:', voiceConversation.state.isActive, 'showOverlay:', showVoiceInterface, 'message:', message.content?.substring(0, 100));
      if (voiceConversation.state.isActive && message.content) {
        console.log('✅ AI response received, will speak with ElevenLabs');
        
        // Extract just the conversational response, not JSON
        let textToSpeak = message.content;
        try {
          const jsonMatch = message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            textToSpeak = parsed.response || message.content;
          }
        } catch {
          // Use full content if not JSON
        }
        
        console.log('🔊 Speaking with ElevenLabs:', textToSpeak.substring(0, 50) + '...');
        voiceConversation.handleAIResponse(textToSpeak);
      } else {
        console.log('❌ Not speaking because voiceActive:', voiceConversation.state.isActive);
      }
    },
  });

  // Update chat functions ref when they're available
  useEffect(() => {
    chatFunctionsRef.current.setInput = setInput;
    chatFunctionsRef.current.handleSubmit = handleSubmit;
  }, [setInput, handleSubmit]);

  // Auto-scroll to latest message when overlay closes or new messages arrive
  useEffect(() => {
    if (!showVoiceInterface && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [showVoiceInterface, messages.length]);

  const handleVoiceSubmit = useCallback(() => {
    if (voiceConversation.state.transcript.trim()) {
      setInput(voiceConversation.state.transcript);
      // Don't close voice interface - keep conversation flowing
      // Trigger form submission
      setTimeout(() => {
        const form = document.getElementById('chat-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }, 100);
    }
  }, [voiceConversation.state.transcript, setInput]);

  const handleVoiceToggle = useCallback(async () => {
    if (showVoiceInterface) {
      // Close overlay and stop voice conversation
      console.log('🚪 Closing voice overlay and stopping conversation');
      setShowVoiceInterface(false);
      voiceConversation.stopConversation();
    } else {
      // Enter voice mode and start recording
      console.log('🎤 Opening voice overlay and starting conversation');
      setShowVoiceInterface(true);
      setTimeout(() => {
        voiceConversation.startConversation();
      }, 300); // Small delay for UI animation
    }
  }, [showVoiceInterface, voiceConversation]);

  const handleTextMode = () => {
    console.log('💬 Switching to text mode');
    setShowVoiceInterface(false);
    voiceConversation.stopConversation();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header - Ultra-minimal */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative"
      >
        {/* Subtle background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent backdrop-blur-xl" />
        
        <div className="relative flex items-center justify-between px-8 py-6 border-b border-black/5">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: isLoading ? [1, 1.1, 1] : 1,
                opacity: isLoading ? [0.7, 1, 0.7] : 1 
              }}
              transition={{ 
                duration: 2, 
                repeat: isLoading ? Infinity : 0,
                ease: 'easeInOut' 
              }}
              className="flex items-center justify-center w-8 h-8 bg-black rounded-full"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-medium text-black tracking-tight">
                {mode === 'scheduling' ? 'FlowMotion AI' : 'Assistant'}
              </h1>
              <p className="text-sm text-black/60 font-light">
                {isLoading ? 'Thinking...' : 'Ready to help'}
              </p>
            </div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceToggle}
              className={`
                w-10 h-10 rounded-full border transition-all duration-300
                ${voiceConversation.state.isRecording || showVoiceInterface
                  ? 'bg-black text-white border-black shadow-lg shadow-black/20' 
                  : 'bg-white/50 text-black/70 border-black/10 hover:bg-black/5 hover:border-black/20'
                }
              `}
            >
              {voiceConversation.state.isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative bg-white">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative h-full overflow-y-auto" ref={scrollRef}>
          <div className="max-w-4xl mx-auto px-8 py-8">
            
            {/* Welcome State */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                {/* Floating logo */}
                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, 1, 0, -1, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="mb-8 relative"
                >
                  <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* Subtle glow */}
                  <div className="absolute inset-0 bg-black rounded-2xl blur-xl opacity-20 scale-110" />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mb-6"
                >
                  <h2 className="text-4xl font-light text-black mb-2 tracking-tight">
                    Welcome to FlowMotion
                  </h2>
                  <p className="text-lg text-black/60 font-light max-w-2xl leading-relaxed">
                    {mode === 'scheduling' 
                      ? 'Your intelligent scheduling assistant. Speak naturally or type to organize your day with AI precision.'
                      : 'Your personal AI assistant. Ask questions, get help, and boost your productivity.'
                    }
                  </p>
                </motion.div>

                {/* Feature highlights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl"
                >
                  {[
                    {
                      title: 'Voice First',
                      description: 'Natural conversation with AI',
                      delay: 0.1
                    },
                    {
                      title: 'Smart Scheduling',
                      description: 'Intelligent calendar management',
                      delay: 0.2
                    },
                    {
                      title: 'Seamless Flow',
                      description: 'Effortless productivity',
                      delay: 0.3
                    }
                  ].map((feature) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.6 + feature.delay,
                        duration: 0.5,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className="p-6 bg-black/2 backdrop-blur-sm rounded-2xl border border-black/5"
                    >
                      <h3 className="font-medium text-black mb-2">{feature.title}</h3>
                      <p className="text-sm text-black/60 font-light">{feature.description}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Call to action */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 items-center"
                >
                  <Button
                    onClick={handleVoiceToggle}
                    className="bg-black text-white hover:bg-black/90 rounded-xl px-8 py-6 text-base font-medium shadow-lg shadow-black/20 transition-all duration-300 transform hover:scale-105"
                  >
                    <Mic className="w-5 h-5 mr-3" />
                    Start Voice Chat
                  </Button>
                  
                  <p className="text-sm text-black/40 font-light">
                    or type a message below
                  </p>
                </motion.div>
              </motion.div>
            )}
            
            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ 
                    duration: 0.4,
                    ease: [0.23, 1, 0.32, 1],
                    delay: index * 0.05
                  }}
                  layout
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Loading message */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ChatMessage 
                  message={{ 
                    id: 'loading', 
                    role: 'assistant', 
                    content: '...' 
                  }} 
                  isLoading 
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Voice Status Indicators */}
      <AnimatePresence>
        {voiceConversation.state.transcript && !showVoiceInterface && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-8 py-4 bg-black/2 backdrop-blur-xl border-t border-black/5"
          >
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <p className="text-sm text-black/60 font-light">
                Voice: {voiceConversation.state.transcript}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleVoiceSubmit}
                className="text-xs bg-black text-white hover:bg-black/90 rounded-lg px-4 py-2"
              >
                Send
              </Button>
            </div>
          </motion.div>
        )}

        {voiceConversation.state.isProcessing && !showVoiceInterface && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-8 py-4 bg-blue-50/50 backdrop-blur-xl border-t border-blue-100/50"
          >
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-blue-600 font-light animate-pulse">
                Processing speech...
              </p>
            </div>
          </motion.div>
        )}

        {voiceConversation.state.error && !showVoiceInterface && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-8 py-4 bg-red-50/50 backdrop-blur-xl border-t border-red-100/50"
          >
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-red-600 font-light">
                {voiceConversation.state.error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        voiceState={{
          isListening: voiceConversation.state.isRecording,
          transcript: voiceConversation.state.transcript,
          error: voiceConversation.state.error,
          confidence: 1,
          isSpeaking: voiceConversation.state.isSpeaking,
          isSupported: true
        }}
        onVoiceToggle={handleVoiceToggle}
      />

      {/* Voice Overlay */}
      <VoiceOverlay
        isOpen={showVoiceInterface}
        isRecording={voiceConversation.state.isRecording}
        isProcessing={voiceConversation.state.isProcessing || isLoading}
        isSpeaking={voiceConversation.state.isSpeaking}
        transcript={voiceConversation.state.transcript}
        aiResponse={voiceConversation.state.aiResponse}
        error={voiceConversation.state.error}
        onClose={handleTextMode}
        onToggleRecording={() => {
          if (voiceConversation.state.isRecording) {
            voiceConversation.stopRecording();
          } else if (!voiceConversation.state.isSpeaking && !isLoading) {
            voiceConversation.startConversation();
          }
        }}
        onSend={handleVoiceSubmit}
      />
    </div>
  );
}