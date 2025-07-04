/**
 * Enhanced Voice Visualizer - AI-Driven Dynamic Interface
 * 
 * Features:
 * - AI-controlled visual themes based on conversation context
 * - Real-time confidence visualization with particle systems
 * - Dynamic color schemes that adapt to processing stages
 * - Advanced waveform analysis with frequency-based animations
 * - Smart visual feedback for different conversation phases
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { openaiService } from './openaiService';

// Utility function for class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface EnhancedVoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  audioLevel?: number;
  transcriptionText?: string;
  confidence?: number;
  processingStage?: 'analyzing' | 'understanding' | 'thinking' | 'responding';
  conversationStage?: 'greeting' | 'extracting' | 'confirming' | 'clarifying' | 'scheduling';
  onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void;
}

interface AIVisualConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  particleCount: number;
  animationSpeed: number;
  visualMode: 'minimal' | 'moderate' | 'intense';
  theme: 'professional' | 'creative' | 'energetic' | 'calm';
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
  opacity: number;
  type: 'wave' | 'confidence' | 'thought' | 'response' | 'energy';
}

export const EnhancedVoiceVisualizer: React.FC<EnhancedVoiceVisualizerProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  audioLevel = 0,
  transcriptionText = '',
  confidence = 0,
  processingStage = 'analyzing',
  conversationStage = 'greeting',
  onStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const [visualConfig, setVisualConfig] = useState<AIVisualConfig>({
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#a855f7',
    particleCount: 50,
    animationSpeed: 1,
    visualMode: 'moderate',
    theme: 'professional'
  });

  // Voice state management
  const getCurrentState = () => {
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  };

  const currentState = getCurrentState();

  // AI-driven visual configuration
  const updateVisualConfig = useCallback(async () => {
    try {
      const contextPrompt = `
Generate optimal visual configuration for voice interface:

Current Context:
- State: ${currentState}
- Processing Stage: ${processingStage}
- Conversation Stage: ${conversationStage}
- Confidence: ${confidence}
- Audio Level: ${audioLevel}

Generate JSON for visual optimization:
{
  "primaryColor": "hex color for main elements",
  "secondaryColor": "hex color for secondary elements", 
  "accentColor": "hex color for highlights",
  "particleCount": number between 20-100,
  "animationSpeed": number between 0.5-2.0,
  "visualMode": "minimal" | "moderate" | "intense",
  "theme": "professional" | "creative" | "energetic" | "calm"
}

Rules:
- High confidence = vibrant colors
- Low confidence = muted colors
- Processing = dynamic/energetic
- Listening = warm/inviting
- Speaking = cool/confident
- Professional context = blues/purples
- Creative context = rainbow/multi-color
`;

      const response = await openaiService.chatCompletion([
        { role: 'system', content: 'You are a visual design AI. Return only valid JSON.' },
        { role: 'user', content: contextPrompt }
      ]);

      try {
        const newConfig = JSON.parse(response);
        setVisualConfig(prev => ({ ...prev, ...newConfig }));
      } catch {
        console.log('Failed to parse visual config, using adaptive fallback');
        // Smart fallback based on state
        setVisualConfig(prev => ({
          ...prev,
          primaryColor: confidence > 0.8 ? '#00ff88' : confidence > 0.5 ? '#6366f1' : '#ff6b6b',
          particleCount: isProcessing ? 80 : isListening ? 60 : 40,
          animationSpeed: isProcessing ? 1.8 : isListening ? 1.2 : 1.0,
          visualMode: confidence > 0.7 ? 'intense' : 'moderate'
        }));
      }
    } catch {
      console.log('AI visual config failed, using adaptive mode');
    }
  }, [currentState, processingStage, conversationStage, confidence, audioLevel, isListening, isProcessing]);

  // Update configuration when context changes
  useEffect(() => {
    updateVisualConfig();
  }, [updateVisualConfig]);

  // Enhanced particle generation with AI-driven parameters
  const generateParticles = useCallback((count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Date.now() * 0.001;
      const radius = 80 + Math.sin(Date.now() * 0.003 + i) * 60;
      
      // AI-driven particle characteristics
      const particleType = confidence > 0.8 ? 'confidence' : 
                          isProcessing ? 'thought' : 
                          isListening ? 'wave' : 
                          isSpeaking ? 'response' : 'energy';

      particlesRef.current.push({
        id: Date.now() + i,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: Math.cos(angle) * (visualConfig.animationSpeed * 2),
        vy: Math.sin(angle) * (visualConfig.animationSpeed * 2),
        life: 1,
        maxLife: 40 + Math.random() * 40,
        size: confidence > 0.7 ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
        color: i % 3 === 0 ? visualConfig.primaryColor : 
               i % 3 === 1 ? visualConfig.secondaryColor : visualConfig.accentColor,
        opacity: confidence > 0.5 ? 0.8 + Math.random() * 0.2 : 0.4 + Math.random() * 0.3,
        type: particleType
      });
    }
  }, [visualConfig, confidence, isProcessing, isListening, isSpeaking]);

  // Advanced waveform with AI-enhanced visuals
  const drawAdvancedWaveform = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas;
    const centerY = height / 2;
    
    // Create dynamic gradient based on confidence
    const gradient = ctx.createLinearGradient(0, centerY - 150, 0, centerY + 150);
    const alpha = confidence > 0.7 ? 1 : confidence > 0.4 ? 0.8 : 0.6;
    
    gradient.addColorStop(0, visualConfig.primaryColor + Math.round(alpha * 255).toString(16));
    gradient.addColorStop(0.5, visualConfig.secondaryColor + Math.round(alpha * 255).toString(16));
    gradient.addColorStop(1, visualConfig.accentColor + Math.round(alpha * 255).toString(16));
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = confidence > 0.8 ? 4 : confidence > 0.5 ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.shadowColor = visualConfig.primaryColor;
    ctx.shadowBlur = confidence * 30;
    
    // Main enhanced waveform
    ctx.beginPath();
    const points = 128;
    for (let i = 0; i < points; i++) {
      const x = (width / points) * i;
      const baseAmplitude = isListening ? 120 : isProcessing ? 80 : isSpeaking ? 100 : 40;
      const confidenceMultiplier = 0.5 + (confidence * 1.5);
      const amplitude = baseAmplitude * confidenceMultiplier * (1 + audioLevel);
      
      // Complex wave function with multiple harmonics
      const wave1 = Math.sin((i + Date.now() * visualConfig.animationSpeed * 0.01) * 0.1) * amplitude;
      const wave2 = Math.sin((i + Date.now() * visualConfig.animationSpeed * 0.02) * 0.05) * amplitude * 0.5;
      const wave3 = Math.sin((i + Date.now() * visualConfig.animationSpeed * 0.015) * 0.08) * amplitude * 0.3;
      
      const y = centerY + wave1 + wave2 + wave3;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Secondary confidence-based layers
    if (confidence > 0.6) {
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const x = (width / points) * i;
        const amplitude = 60 * confidence * (1 + audioLevel * 0.5);
        const y = centerY + Math.sin((i + Date.now() * 0.025) * 0.15) * amplitude;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [visualConfig, confidence, isListening, isProcessing, isSpeaking, audioLevel]);

  // AI-powered central core with dynamic complexity
  const drawAICore = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const time = Date.now() * 0.001 * visualConfig.animationSpeed;
    const baseRadius = 80;
    const confidenceRadius = baseRadius + (confidence * 40);
    const pulseRadius = confidenceRadius + Math.sin(time * 2) * (isListening ? 25 : isProcessing ? 20 : 15);
    
    // Dynamic glow based on AI state
    const glowIntensity = confidence > 0.8 ? 60 : confidence > 0.5 ? 40 : 25;
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius + glowIntensity);
    glowGradient.addColorStop(0, visualConfig.primaryColor + '80');
    glowGradient.addColorStop(0.4, visualConfig.secondaryColor + '40');
    glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Multi-layered core with AI complexity
    const layers = confidence > 0.7 ? 4 : confidence > 0.4 ? 3 : 2;
    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = pulseRadius * (0.3 + (layer * 0.2));
      const layerAlpha = (layers - layer) / layers;
      
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, layerRadius);
      coreGradient.addColorStop(0, visualConfig.primaryColor + Math.round(layerAlpha * 255).toString(16));
      coreGradient.addColorStop(0.6, visualConfig.secondaryColor + Math.round(layerAlpha * 128).toString(16));
      coreGradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, layerRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Advanced geometric patterns based on confidence
    const patternComplexity = Math.floor(8 + (confidence * 16)); // 8-24 patterns
    ctx.strokeStyle = visualConfig.accentColor;
    ctx.lineWidth = confidence > 0.6 ? 2 : 1;
    ctx.globalAlpha = 0.6 + (confidence * 0.4);
    
    for (let i = 0; i < patternComplexity; i++) {
      const angle = (Math.PI * 2 * i) / patternComplexity + time;
      const innerRadius = pulseRadius * 0.2;
      const outerRadius = pulseRadius * (0.5 + Math.sin(time + i) * 0.2);
      
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
  }, [visualConfig, confidence, isListening, isProcessing]);

  // Enhanced particle rendering with AI-driven behaviors
  const drawEnhancedParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((particle, index) => {
      // AI-driven particle physics
      const speedMultiplier = visualConfig.animationSpeed * (1 + confidence * 0.5);
      particle.x += particle.vx * speedMultiplier;
      particle.y += particle.vy * speedMultiplier;
      particle.life--;
      
      // Dynamic particle behavior based on type
      if (particle.type === 'confidence' && confidence > 0.7) {
        particle.size += 0.1;
        particle.opacity = Math.min(1, particle.opacity * 1.02);
      } else if (particle.type === 'thought' && isProcessing) {
        particle.vx += (Math.random() - 0.5) * 0.2;
        particle.vy += (Math.random() - 0.5) * 0.2;
      }
      
      if (particle.life <= 0) {
        particlesRef.current.splice(index, 1);
        return;
      }
      
      // Enhanced rendering with AI-driven effects
      const alpha = (particle.life / particle.maxLife) * particle.opacity;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = confidence > 0.6 ? 15 : 8;
      
      // Dynamic particle shapes based on type
      ctx.beginPath();
      if (particle.type === 'confidence') {
        // Star shape for high confidence
        const spikes = 5;
        const outerRadius = particle.size;
        const innerRadius = particle.size * 0.5;
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes;
          const x = particle.x + Math.cos(angle) * radius;
          const y = particle.y + Math.sin(angle) * radius;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        // Circle for other types
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      }
      ctx.fill();
      
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });
  }, [visualConfig, confidence, isProcessing]);

  // Main animation loop with AI optimization
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear with subtle background based on confidence
    const bgAlpha = Math.round((0.05 + confidence * 0.1) * 255).toString(16);
    ctx.fillStyle = '#000000' + bgAlpha;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw enhanced components
    drawAdvancedWaveform(ctx, canvas);
    drawAICore(ctx, canvas);
    drawEnhancedParticles(ctx);
    
    // AI-driven particle generation
    const shouldGenerateParticles = Math.random() < (0.05 + confidence * 0.1);
    if (shouldGenerateParticles) {
      const particleCount = Math.floor(2 + confidence * 4);
      generateParticles(particleCount);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [confidence, drawAdvancedWaveform, drawAICore, drawEnhancedParticles, generateParticles]);

  // Canvas setup and animation management
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
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

  // State change notifications
  useEffect(() => {
    if (onStateChange) {
      onStateChange(currentState as 'idle' | 'listening' | 'processing' | 'speaking');
    }
  }, [currentState, onStateChange]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 overflow-hidden">
      {/* Enhanced Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          filter: confidence > 0.7 ? 'blur(0px)' : 'blur(0.5px)',
          opacity: 0.9 + (confidence * 0.1)
        }}
      />
      
      {/* AI-Enhanced State Indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "px-6 py-3 rounded-full backdrop-blur-md border shadow-2xl transition-all duration-500",
            visualConfig.theme === 'professional' && "bg-blue-500/20 border-blue-400/30 text-blue-300",
            visualConfig.theme === 'creative' && "bg-purple-500/20 border-purple-400/30 text-purple-300",
            visualConfig.theme === 'energetic' && "bg-orange-500/20 border-orange-400/30 text-orange-300",
            visualConfig.theme === 'calm' && "bg-green-500/20 border-green-400/30 text-green-300"
          )}
          style={{
            boxShadow: `0 0 ${confidence * 30}px ${visualConfig.primaryColor}40`
          }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: visualConfig.animationSpeed * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: visualConfig.primaryColor }}
            />
            <span className="font-medium">
              {currentState === 'listening' && 'Analyzing your voice...'}
              {currentState === 'processing' && `AI ${processingStage}...`}
              {currentState === 'speaking' && 'Responding intelligently...'}
              {currentState === 'idle' && 'Ready for voice input'}
            </span>
            <div className="text-xs opacity-75">
              {Math.round(confidence * 100)}%
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Transcription with AI Confidence */}
      <AnimatePresence>
        {transcriptionText && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-8 z-10"
          >
            <div 
              className="bg-black/40 backdrop-blur-xl border rounded-3xl p-6 shadow-2xl"
              style={{ 
                borderColor: visualConfig.primaryColor + '40',
                boxShadow: `0 0 ${confidence * 40}px ${visualConfig.primaryColor}20`
              }}
            >
              <div className="text-center">
                <div className="text-white text-xl mb-4 font-medium">
                  {transcriptionText}
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-sm opacity-75">Confidence</div>
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence * 100}%` }}
                      transition={{ type: "spring", stiffness: 100 }}
                      className="h-2 rounded-full transition-colors duration-500"
                      style={{
                        backgroundColor: confidence > 0.8 ? '#00ff88' :
                                        confidence > 0.6 ? '#ffaa00' : '#ff4444'
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium">
                    {Math.round(confidence * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};