/**
 * Advanced Audio Visualization Hook
 * 
 * Provides real-time audio analysis for the voice visualizer
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioVisualizationData {
  audioLevel: number;
  frequencyData: number[];
  waveformData: number[];
  isActive: boolean;
}

export const useAudioVisualization = (
  mediaStream: MediaStream | null,
  isListening: boolean
) => {
  const [audioData, setAudioData] = useState<AudioVisualizationData>({
    audioLevel: 0,
    frequencyData: new Array(64).fill(0),
    waveformData: new Array(64).fill(0),
    isActive: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const initializeAudioAnalysis = useCallback(async () => {
    if (!mediaStream || !isListening) return;

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as unknown as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create analyser
      analyserRef.current = audioContext.createAnalyser();
      const analyser = analyserRef.current;
      
      // Configure analyser for high-quality visualization
      analyser.fftSize = 512; // Higher resolution
      analyser.smoothingTimeConstant = 0.3; // Smoother transitions
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      // Connect media stream
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      // Initialize data array
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setAudioData(prev => ({ ...prev, isActive: true }));
    } catch (error) {
      console.error('Audio analysis initialization failed:', error);
    }
  }, [mediaStream, isListening]);

  const updateAudioData = useCallback(() => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    if (!analyser || !dataArray || !isListening) {
      animationFrameRef.current = requestAnimationFrame(updateAudioData);
      return;
    }

    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate audio level (RMS)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const audioLevel = rms / 255; // Normalize to 0-1
    
    // Process frequency data for visualization
    const frequencyData = Array.from(dataArray.slice(0, 64)).map(value => value / 255);
    
    // Create waveform data (simplified from frequency data)
    const waveformData = frequencyData.map((value, index) => 
      Math.sin(Date.now() * 0.001 + index * 0.1) * value
    );

    setAudioData({
      audioLevel: Math.max(audioLevel, 0.1), // Minimum level for visualization
      frequencyData,
      waveformData,
      isActive: true
    });

    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  }, [isListening]);

  // Initialize when media stream becomes available
  useEffect(() => {
    if (mediaStream && isListening) {
      initializeAudioAnalysis();
    }
  }, [mediaStream, isListening, initializeAudioAnalysis]);

  // Start/stop audio analysis
  useEffect(() => {
    if (isListening && analyserRef.current) {
      updateAudioData();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioData(prev => ({ ...prev, isActive: false, audioLevel: 0 }));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, updateAudioData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return audioData;
};