'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface VoiceOverlayProps {
  isOpen: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  aiResponse: string;
  error: string | null;
  onClose: () => void;
  onToggleRecording: () => void;
  onSend: () => void;
}

export function VoiceOverlay({
  isOpen,
  isRecording,
  isProcessing,
  isSpeaking,
  transcript,
  aiResponse,
  error,
  onClose,
  onToggleRecording,
  onSend
}: VoiceOverlayProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(8).fill(0));
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize real-time audio visualization
  useEffect(() => {
    if (!isRecording && !isSpeaking) {
      setAudioLevel(0);
      setWaveformBars(new Array(8).fill(0));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    if (isRecording) {
      // User speaking - capture microphone
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          
          analyser.fftSize = 32;
          analyser.smoothingTimeConstant = 0.9;
          source.connect(analyser);
          
          analyserRef.current = analyser;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const animate = () => {
            if (!analyserRef.current) return;
            
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calculate audio level
            const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            setAudioLevel(Math.min(average / 128, 1));
            
            // Update waveform (8 bars for minimalism)
            const newBars = Array.from(dataArray).slice(0, 8).map(value => Math.min(value / 128, 1));
            setWaveformBars(newBars);
            
            animationFrameRef.current = requestAnimationFrame(animate);
          };
          
          animate();
          
          return () => {
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
          };
        })
        .catch(console.error);
    } else if (isSpeaking) {
      // AI speaking - simulate visualization
      const simulate = () => {
        const newBars = Array.from({ length: 8 }, () => Math.random() * 0.8 + 0.2);
        setWaveformBars(newBars);
        setAudioLevel(Math.random() * 0.6 + 0.3);
        
        animationFrameRef.current = requestAnimationFrame(simulate);
      };
      simulate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isSpeaking]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (!isProcessing && !isSpeaking) {
          onToggleRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRecording, isProcessing, isSpeaking, onClose, onToggleRecording]);

  const getStatusText = () => {
    if (error) return 'Error occurred';
    if (isSpeaking) return 'AI is speaking';
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Listening';
    if (transcript) return 'Tap to continue';
    return 'Tap to speak';
  };

  const getMainCircleSize = () => {
    if (isRecording) return 120 + audioLevel * 40;
    if (isSpeaking) return 120 + audioLevel * 30;
    if (isProcessing) return 120;
    return 100;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-50 bg-black"
        >
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onClose}
            className="absolute top-8 right-8 z-10 w-10 h-10 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/10"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Main content */}
          <div className="flex flex-col items-center justify-center min-h-screen px-8">
            
            {/* Central visualization */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}
              className="relative mb-16"
            >
              {/* Outer breathing ring */}
              <motion.div
                animate={{
                  scale: isRecording || isSpeaking ? [1, 1.1, 1] : 1,
                  opacity: isRecording || isSpeaking ? [0.3, 0.1, 0.3] : 0.1,
                }}
                transition={{
                  duration: isRecording || isSpeaking ? 3 : 0,
                  repeat: isRecording || isSpeaking ? Infinity : 0,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 w-64 h-64 border border-white/20 rounded-full"
                style={{
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                }}
              />

              {/* Main circle */}
              <motion.div
                animate={{
                  width: getMainCircleSize(),
                  height: getMainCircleSize(),
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`
                  relative rounded-full flex items-center justify-center cursor-pointer
                  border transition-all duration-500
                  ${isRecording 
                    ? 'bg-white border-white shadow-2xl shadow-white/20' 
                    : isSpeaking
                    ? 'bg-white/10 border-white/30 backdrop-blur-xl'
                    : isProcessing
                    ? 'bg-white/5 border-white/20 backdrop-blur-xl'
                    : 'bg-white/5 border-white/20 backdrop-blur-xl hover:bg-white/10'
                  }
                `}
                onClick={() => {
                  if (!isProcessing && !isSpeaking) {
                    onToggleRecording();
                  }
                }}
              >
                {/* Processing animation */}
                {isProcessing && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                  />
                )}

                {/* Waveform visualization */}
                {(isRecording || isSpeaking) && !isProcessing && (
                  <div className="flex items-center justify-center gap-1">
                    {waveformBars.map((bar, index) => (
                      <motion.div
                        key={index}
                        className={`w-1 rounded-full ${isRecording ? 'bg-black' : 'bg-white'}`}
                        animate={{
                          height: Math.max(4, bar * 24),
                        }}
                        transition={{
                          duration: 0.1,
                          ease: 'easeOut',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Idle state dot */}
                {!isRecording && !isSpeaking && !isProcessing && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                )}
              </motion.div>
            </motion.div>

            {/* Status text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
              className="text-center mb-8"
            >
              <h2 className="text-xl font-light text-white/90 tracking-wide">
                {getStatusText()}
              </h2>
            </motion.div>

            {/* Transcript display */}
            {transcript && !isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                className="max-w-2xl mb-8"
              >
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <p className="text-white/90 text-lg font-light leading-relaxed">
                    {transcript}
                  </p>
                </div>
              </motion.div>
            )}

            {/* AI Response display */}
            {aiResponse && isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                className="max-w-2xl mb-8"
              >
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <p className="text-white text-lg font-light leading-relaxed">
                    {aiResponse}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mb-8"
              >
                <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-4 border border-red-500/20">
                  <p className="text-red-300 text-sm font-light">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Minimal instruction */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <p className="text-white/40 text-sm font-light tracking-wide">
                Hold space to speak • Esc to close
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}