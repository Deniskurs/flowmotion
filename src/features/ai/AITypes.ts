/**
 * AI Intelligence Types
 * 
 * Type definitions for AI-powered features using Google Gemini
 * Used by: AI service layer, task intelligence, voice processing
 */

import { TaskFormData } from '@/features/tasks/TaskTypes';

export interface AITaskAnalysis {
  estimatedDuration: number; // in minutes
  difficultyLevel: 'trivial' | 'easy' | 'moderate' | 'complex' | 'expert';
  cognitiveLoad: 'low' | 'medium' | 'high';
  optimalTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  recommendedBreaks: number; // number of breaks needed
  prerequisites: string[]; // what needs to be done first
  resources: string[]; // tools, people, or materials needed
  confidence: number; // 0-1, how confident the AI is in the analysis
}

export interface AIScheduleSuggestion {
  suggestedStart: Date;
  suggestedEnd: Date;
  reasoning: string;
  energyAlignment: number; // 0-1, how well it matches user energy
  priorityScore: number; // 0-1, importance-urgency matrix score
  conflictRisk: 'low' | 'medium' | 'high';
  alternatives: Array<{
    start: Date;
    end: Date;
    reasoning: string;
  }>;
}

export interface UserContext {
  energyPattern: 'morning' | 'afternoon' | 'evening' | 'night';
  workingHours: { start: string; end: string };
  preferredBreakDuration: number;
  deepWorkCapacity: number; // hours per day
  interruptionTolerance: 'low' | 'medium' | 'high';
  currentStressLevel: 'relaxed' | 'normal' | 'stressed' | 'overwhelmed';
  recentCompletionRate: number; // 0-1
  averageTaskDuration: Record<string, number>; // category -> avg minutes
}

export interface VoiceTaskInput {
  transcription: string;
  confidence: number;
  extractedTasks: TaskFormData[];
  context: {
    urgency: 'low' | 'medium' | 'high';
    mood: 'excited' | 'neutral' | 'stressed' | 'tired';
    location?: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

export interface SmartSuggestion {
  id: string;
  type: 'reschedule' | 'break' | 'priority_change' | 'split_task' | 'defer';
  title: string;
  description: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionData: Record<string, unknown>;
  userFeedback?: 'accepted' | 'rejected' | 'modified';
}

export interface AIInsight {
  id: string;
  category: 'productivity' | 'wellness' | 'efficiency' | 'balance';
  title: string;
  message: string;
  data: {
    trend: 'improving' | 'stable' | 'declining';
    metric: string;
    value: number;
    comparison: string; // "vs last week", "vs your average"
  };
  actionable: boolean;
  suggestedActions?: string[];
}

export interface DocumentTaskExtraction {
  extractedTasks: TaskFormData[];
  deadlines: Array<{
    task: string;
    deadline: Date;
    confidence: number;
  }>;
  people: string[]; // mentioned stakeholders
  context: string; // meeting notes, email subject, etc.
  priority: 'low' | 'medium' | 'high';
}

export interface AIPromptTemplates {
  taskAnalysis: string;
  voiceTaskExtraction: string;
  scheduleOptimization: string;
  documentParsing: string;
  contextualSuggestions: string;
  habitPattern: string;
  burnoutPrevention: string;
}

// Gemini API Configuration
export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-pro-vision';
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

// Learning and Adaptation
export interface UserLearningData {
  userId: string;
  taskCompletionPatterns: Array<{
    category: string;
    estimatedDuration: number;
    actualDuration: number;
    difficulty: string;
    timeOfDay: string;
    completed: boolean;
  }>;
  energyPatterns: Array<{
    time: string;
    energyLevel: number; // 1-10
    productivity: number; // 1-10
    date: Date;
  }>;
  interruptionFrequency: Array<{
    timeOfDay: string;
    interruptions: number;
    date: Date;
  }>;
  preferences: {
    breakFrequency: number;
    maxConsecutiveHours: number;
    preferredTaskOrder: 'easy-first' | 'hard-first' | 'mixed';
    notificationTiming: string[];
  };
}

export const DEFAULT_AI_CONFIG: GeminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
};