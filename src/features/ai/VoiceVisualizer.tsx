/**
 * Next-Generation Voice Visualizer
 * 
 * Revolutionary voice interface that combines:
 * - Real-time audio waveform visualization
 * - Particle-based state animations
 * - Intelligent transcription flow
 * - Futuristic AI processing states
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Utility function for class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  audioLevel?: number;
  transcriptionText?: string;
  confidence?: number;
  processingStage?: 'analyzing' | 'understanding' | 'thinking' | 'responding';
  onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'wave' | 'process' | 'thought' | 'response';
}

interface TranscriptionWord {
  text: string;
  confidence: number;
  timestamp: number;
  id: string;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  audioLevel = 0,
  transcriptionText = '',
  confidence = 0,
  processingStage = 'analyzing',
  onStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const [transcriptionWords, setTranscriptionWords] = useState<TranscriptionWord[]>([]);
  const [audioData, setAudioData] = useState<number[]>(new Array(64).fill(0));
  
  // Voice state management
  const getCurrentState = () => {
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  };

  const currentState = getCurrentState();

  // Color schemes for different states
  const stateColors = {
    idle: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#a855f7',
      glow: 'rgba(99, 102, 241, 0.3)'
    },
    listening: {
      primary: '#ef4444',
      secondary: '#f97316',
      accent: '#eab308',
      glow: 'rgba(239, 68, 68, 0.4)'
    },
    processing: {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      accent: '#c084fc',
      glow: 'rgba(139, 92, 246, 0.4)'
    },
    speaking: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#0e7490',
      glow: 'rgba(6, 182, 212, 0.4)'
    }
  };

  // Generate particles based on state
  const generateParticles = (state: string, count: number = 5) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const colors = stateColors[currentState as keyof typeof stateColors];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Date.now() * 0.001;
      const radius = 100 + Math.sin(Date.now() * 0.002 + i) * 50;
      
      particlesRef.current.push({
        id: Date.now() + i,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        size: 2 + Math.random() * 4,
        color: i % 2 === 0 ? colors.primary : colors.secondary,
        type: state === 'listening' ? 'wave' : 
              state === 'processing' ? 'process' : 
              state === 'speaking' ? 'response' : 'thought'
      });
    }
  };

  // Advanced waveform visualization
  const drawWaveform = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas;
    const centerY = height / 2;
    const colors = stateColors[currentState as keyof typeof stateColors];
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, centerY - 100, 0, centerY + 100);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(0.5, colors.secondary);
    gradient.addColorStop(1, colors.accent);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 20;
    
    // Draw main waveform
    ctx.beginPath();
    for (let i = 0; i < audioData.length; i++) {
      const x = (width / audioData.length) * i;
      const amplitude = audioData[i] * (isListening ? 100 : 30) * (1 + audioLevel);
      const y = centerY + Math.sin((i + Date.now() * 0.01) * 0.1) * amplitude;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw secondary harmonic waves
    if (isListening || isProcessing) {
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < audioData.length; i++) {
        const x = (width / audioData.length) * i;
        const amplitude = audioData[i] * 50 * (1 + audioLevel * 0.5);
        const y = centerY + Math.sin((i + Date.now() * 0.02) * 0.2) * amplitude;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  // Draw central AI core
  const drawAICore = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const colors = stateColors[currentState as keyof typeof stateColors];
    
    const time = Date.now() * 0.001;
    const baseRadius = 60;
    const pulseRadius = baseRadius + Math.sin(time * 2) * (isListening ? 20 : isProcessing ? 15 : 10);
    
    // Outer glow ring
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius + 40);
    glowGradient.addColorStop(0, colors.glow);
    glowGradient.addColorStop(0.7, 'rgba(0,0,0,0)');
    glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Main core gradient
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
    coreGradient.addColorStop(0, colors.primary);
    coreGradient.addColorStop(0.6, colors.secondary);
    coreGradient.addColorStop(1, 'rgba(0,0,0,0.1)');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner geometric patterns
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + time;
      const innerRadius = pulseRadius * 0.3;
      const outerRadius = pulseRadius * 0.7;
      
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * innerRadius,
        centerY + Math.sin(angle) * innerRadius
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * outerRadius,
        centerY + Math.sin(angle) * outerRadius
      );
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  };

  // Draw particles
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((particle, index) => {
      // Update particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      
      if (particle.life <= 0) {
        particlesRef.current.splice(index, 1);
        return;
      }
      
      // Draw particle
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });
  };

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update audio data simulation
    setAudioData(prev => prev.map((_, i) => 
      Math.sin(Date.now() * 0.01 + i * 0.1) * 
      (isListening ? (0.5 + audioLevel) : isProcessing ? 0.3 : 0.1)
    ));
    
    // Draw components
    drawWaveform(ctx, canvas);
    drawAICore(ctx, canvas);
    drawParticles(ctx);
    
    // Generate new particles
    if (Math.random() < 0.1) {
      generateParticles(currentState, 2);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [currentState, audioLevel, isListening, isProcessing]);

  // Process transcription into words
  useEffect(() => {
    if (transcriptionText) {
      const words = transcriptionText.split(' ').filter(word => word.trim());
      const newWords = words.map((word, index) => ({
        text: word,
        confidence: confidence * (0.8 + Math.random() * 0.2), // Simulate per-word confidence
        timestamp: Date.now() + index * 100,
        id: `${Date.now()}-${index}`
      }));
      setTranscriptionWords(newWords);
    }
  }, [transcriptionText, confidence]);

  // Start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    animate();
    
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Notify state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(currentState as 'idle' | 'listening' | 'processing' | 'speaking');
    }
  }, [currentState, onStateChange]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 overflow-hidden">
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'blur(0.5px)' }}
      />
      
      {/* State Indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "px-6 py-3 rounded-full backdrop-blur-md border shadow-2xl",
            currentState === 'listening' && "bg-red-500/20 border-red-400/30 text-red-300",
            currentState === 'processing' && "bg-purple-500/20 border-purple-400/30 text-purple-300",
            currentState === 'speaking' && "bg-cyan-500/20 border-cyan-400/30 text-cyan-300",
            currentState === 'idle' && "bg-blue-500/20 border-blue-400/30 text-blue-300"
          )}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn(
                "w-3 h-3 rounded-full",
                currentState === 'listening' && "bg-red-400",
                currentState === 'processing' && "bg-purple-400", 
                currentState === 'speaking' && "bg-cyan-400",
                currentState === 'idle' && "bg-blue-400"
              )}
            />
            <span className="font-medium">
              {currentState === 'listening' && 'Listening to your voice...'}
              {currentState === 'processing' && `AI ${processingStage}...`}
              {currentState === 'speaking' && 'AI responding...'}
              {currentState === 'idle' && 'Ready to assist'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Revolutionary Transcription Display */}
      <AnimatePresence>
        {transcriptionWords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-8 z-10"
          >
            <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-wrap gap-2 justify-center">
                {transcriptionWords.map((word, index) => (
                  <motion.span
                    key={word.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      color: word.confidence > 0.8 ? '#ffffff' : 
                             word.confidence > 0.6 ? '#fbbf24' : '#ef4444'
                    }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    className={cn(
                      "text-xl font-medium px-2 py-1 rounded-lg transition-all duration-300",
                      word.confidence > 0.8 && "bg-green-500/20 text-green-300",
                      word.confidence > 0.6 && word.confidence <= 0.8 && "bg-yellow-500/20 text-yellow-300",
                      word.confidence <= 0.6 && "bg-red-500/20 text-red-300"
                    )}
                  >
                    {word.text}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${word.confidence * 100}%` }}
                      className="h-0.5 bg-current mt-1 rounded-full"
                    />
                  </motion.span>
                ))}
              </div>
              
              {/* Confidence Meter */}
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-400 mb-2">
                  Understanding Confidence: {Math.round(confidence * 100)}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className={cn(
                      "h-2 rounded-full transition-colors duration-500",
                      confidence > 0.8 ? "bg-green-400" :
                      confidence > 0.6 ? "bg-yellow-400" : "bg-red-400"
                    )}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Stage Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="text-6xl text-purple-300 mb-4"
              >
                🧠
              </motion.div>
              <div className="text-purple-300 text-lg font-medium">
                {processingStage === 'analyzing' && 'Analyzing your request...'}
                {processingStage === 'understanding' && 'Understanding context...'}
                {processingStage === 'thinking' && 'AI thinking deeply...'}
                {processingStage === 'responding' && 'Crafting response...'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};