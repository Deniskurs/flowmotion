/**
 * ChatInput - Ultra-premium Apple-style input component
 * Minimalistic design with sophisticated interactions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, ArrowUp } from 'lucide-react';
import { FormEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  confidence: number;
  isSpeaking: boolean;
  isSupported: boolean;
}

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  voiceState: VoiceState;
  onVoiceToggle: () => void;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  voiceState,
  onVoiceToggle
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when voice stops listening
  useEffect(() => {
    if (!voiceState.isListening && inputRef.current) {
      inputRef.current.focus();
    }
  }, [voiceState.isListening]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const canSubmit = input.trim().length > 0 && !isLoading;

  return (
    <div className="relative border-t border-black/5 bg-white/80 backdrop-blur-xl">
      {/* Voice recording indicator */}
      <AnimatePresence>
        {voiceState.isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-8 py-3 bg-black/2 border-b border-black/5"
          >
            <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
              <div className="flex gap-1">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    animate={{
                      height: [4, 16, 4],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: index * 0.15,
                      ease: 'easeInOut',
                    }}
                    className="w-1 bg-black rounded-full"
                  />
                ))}
              </div>
              <p className="text-sm text-black/60 font-light">
                Listening... Speak clearly into your microphone
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input area */}
      <div className="px-8 py-6">
        <form id="chat-form" onSubmit={handleSubmit}>
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            
            {/* Voice button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onVoiceToggle}
                disabled={isLoading}
                className={`
                  w-11 h-11 rounded-full border transition-all duration-300 shrink-0
                  ${voiceState.isListening
                    ? 'bg-black text-white border-black shadow-lg shadow-black/20' 
                    : 'bg-white/50 text-black/70 border-black/10 hover:bg-black/5 hover:border-black/20'
                  }
                `}
              >
                {voiceState.isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            </motion.div>

            {/* Input field */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  voiceState.isListening 
                    ? 'Listening...' 
                    : 'Message FlowMotion AI...'
                }
                disabled={isLoading || voiceState.isListening}
                className={`
                  w-full px-6 py-4 text-base rounded-2xl border transition-all duration-300
                  bg-black/2 border-black/10 text-black placeholder:text-black/40
                  focus:bg-white focus:border-black/20 focus:shadow-lg focus:shadow-black/5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  font-light leading-relaxed
                `}
                autoFocus
              />
              
              {/* Character indicator for long messages */}
              {input.length > 100 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs text-black/40 font-light">
                    {input.length}
                  </span>
                </div>
              )}
            </div>

            {/* Send button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="submit"
                size="icon"
                disabled={!canSubmit}
                className={`
                  w-11 h-11 rounded-full transition-all duration-300 shrink-0
                  ${canSubmit
                    ? 'bg-black text-white hover:bg-black/90 shadow-lg shadow-black/20' 
                    : 'bg-black/10 text-black/30 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          </div>
        </form>

        {/* Hint text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center mt-4"
        >
          <p className="text-xs text-black/30 font-light tracking-wide">
            Press Enter to send • Click mic for voice • Built with ultra-premium design
          </p>
        </motion.div>
      </div>

      {/* Error display */}
      <AnimatePresence>
        {voiceState.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-8 py-3 bg-red-50/50 border-t border-red-100/50"
          >
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-red-600 font-light text-center">
                {voiceState.error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}