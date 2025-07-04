/**
 * OpenAI AI Service
 * 
 * Core AI intelligence layer using OpenAI's APIs
 * Handles task analysis, voice processing, and intelligent suggestions
 * 
 * Used by: AI-powered features across the app
 * Related: Task management, scheduling, voice processing
 */

import OpenAI from 'openai';
import { 
  AITaskAnalysis, 
  AIScheduleSuggestion, 
  VoiceTaskInput,
  AIInsight,
  DocumentTaskExtraction,
  UserContext,
  UserLearningData
} from './AITypes';
import { Task, TaskFormData } from '@/features/tasks/TaskTypes';

class OpenAIService {
  private openai: OpenAI | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // For client-side usage
      });
      this.isConfigured = true;
      console.log('OpenAI service initialized');
    } else {
      console.warn('OpenAI API key not found. AI features will be disabled.');
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.isConfigured && this.openai !== null;
  }

  /**
   * Analyze a task for duration, difficulty, and scheduling recommendations
   */
  async analyzeTask(
    taskData: TaskFormData, 
    userContext?: UserContext,
    userHistory?: UserLearningData
  ): Promise<AITaskAnalysis> {
    if (!this.isAvailable()) {
      return this.getFallbackTaskAnalysis(taskData);
    }

    try {
      const prompt = this.buildTaskAnalysisPrompt(taskData, userContext, userHistory);
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity AI expert. Analyze tasks and provide detailed insights in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content;
      return this.parseTaskAnalysisResponse(result || '{}', taskData);
    } catch (error) {
      console.error('OpenAI task analysis failed:', error);
      return this.getFallbackTaskAnalysis(taskData);
    }
  }

  /**
   * Process voice input and extract tasks
   */
  async processVoiceInput(
    transcription: string,
    context: {
      timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      userContext?: UserContext;
    }
  ): Promise<VoiceTaskInput> {
    if (!this.isAvailable()) {
      return this.getFallbackVoiceProcessing(transcription, context);
    }

    try {
      const prompt = this.buildVoiceExtractionPrompt(transcription, context);
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a voice processing AI that extracts actionable tasks from speech. Respond in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content;
      return this.parseVoiceExtractionResponse(result || '{}', transcription, context);
    } catch (error) {
      console.error('OpenAI voice processing failed:', error);
      return this.getFallbackVoiceProcessing(transcription, context);
    }
  }

  /**
   * Generate smart scheduling suggestions
   */
  async generateScheduleSuggestions(
    tasks: Task[],
    userContext: UserContext,
    timeRange: { start: Date; end: Date }
  ): Promise<AIScheduleSuggestion[]> {
    if (!this.isAvailable()) {
      return this.getFallbackScheduleSuggestions(tasks, timeRange);
    }

    try {
      const prompt = this.buildScheduleOptimizationPrompt(tasks, userContext, timeRange);
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a scheduling optimization AI. Generate optimal task schedules in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content;
      return this.parseScheduleSuggestionsResponse(result || '{}', tasks, timeRange);
    } catch (error) {
      console.error('OpenAI schedule optimization failed:', error);
      return this.getFallbackScheduleSuggestions(tasks, timeRange);
    }
  }

  /**
   * Extract tasks from documents/images
   */
  async extractTasksFromDocument(
    content: string | File,
    context?: string
  ): Promise<DocumentTaskExtraction> {
    if (!this.isAvailable()) {
      return this.getFallbackDocumentExtraction(content, context);
    }

    try {
      if (typeof content === 'string') {
        // Text content
        const prompt = this.buildDocumentExtractionPrompt(content, context);
        
        const response = await this.openai!.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a document analysis AI that extracts actionable tasks. Respond in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });

        const result = response.choices[0].message.content;
        return this.parseDocumentExtractionResponse(result || '{}', context);
      } else {
        // Image content
        const base64Data = await this.fileToBase64(content);
        const prompt = this.buildDocumentExtractionPrompt('', context);
        
        const response = await this.openai!.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a document analysis AI that extracts actionable tasks from images. Respond in JSON format.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${content.type};base64,${base64Data}`
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });

        const result = response.choices[0].message.content;
        return this.parseDocumentExtractionResponse(result || '{}', context);
      }
    } catch (error) {
      console.error('OpenAI document extraction failed:', error);
      return this.getFallbackDocumentExtraction(content, context);
    }
  }

  /**
   * Generate productivity insights
   */
  async generateInsights(
    userHistory: UserLearningData,
    recentTasks: Task[]
  ): Promise<AIInsight[]> {
    if (!this.isAvailable()) {
      return this.getFallbackInsights();
    }

    try {
      const prompt = this.buildInsightsPrompt(userHistory, recentTasks);
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity insights AI. Generate actionable insights in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content;
      return this.parseInsightsResponse(result || '{}');
    } catch (error) {
      console.error('OpenAI insights generation failed:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * Generate text-to-speech audio
   */
  async generateSpeech(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'): Promise<ArrayBuffer> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI service not available');
    }

    const response = await this.openai!.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      response_format: 'mp3'
    });

    return response.arrayBuffer();
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(audioFile: File): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI service not available');
    }

    const response = await this.openai!.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text'
    });

    return response;
  }

  /**
   * Chat completion for general conversation
   */
  async chatCompletion(
    messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>,
    model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo' = 'gpt-4o-mini'
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI service not available');
    }

    const response = await this.openai!.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content || '';
  }

  // Private helper methods for building prompts (same as Gemini service)
  private buildTaskAnalysisPrompt(
    task: TaskFormData, 
    userContext?: UserContext,
    userHistory?: UserLearningData
  ): string {
    return `
Analyze this task and provide detailed insights:

TASK DETAILS:
- Title: "${task.title}"
- Description: "${task.description}"
- Category: "${task.category}"
- Priority: "${task.priority}"
- Estimated Duration: ${task.estimatedDuration} minutes

${userContext ? `
USER CONTEXT:
- Energy Pattern: ${userContext.energyPattern}
- Working Hours: ${userContext.workingHours.start} - ${userContext.workingHours.end}
- Deep Work Capacity: ${userContext.deepWorkCapacity} hours/day
- Stress Level: ${userContext.currentStressLevel}
- Interruption Tolerance: ${userContext.interruptionTolerance}
` : ''}

${userHistory ? `
USER HISTORY:
- Recent Completion Rate: ${(userHistory.taskCompletionPatterns.length > 0 ? 
    userHistory.taskCompletionPatterns.filter(p => p.completed).length / userHistory.taskCompletionPatterns.length * 100 : 0).toFixed(1)}%
- Average ${task.category} Duration: ${userHistory.taskCompletionPatterns.filter(p => p.category === task.category).reduce((sum, p) => sum + p.actualDuration, 0) / Math.max(userHistory.taskCompletionPatterns.filter(p => p.category === task.category).length, 1)} minutes
` : ''}

Respond with a JSON object containing:
{
  "estimatedDuration": number,
  "difficultyLevel": "trivial" | "easy" | "moderate" | "complex" | "expert",
  "cognitiveLoad": "low" | "medium" | "high",
  "optimalTimeOfDay": "morning" | "afternoon" | "evening" | "anytime",
  "recommendedBreaks": number,
  "prerequisites": ["list", "of", "prerequisites"],
  "resources": ["tools", "people", "materials", "needed"],
  "confidence": number
}`;
  }

  private buildVoiceExtractionPrompt(
    transcription: string,
    context: { timeOfDay: string; userContext?: UserContext }
  ): string {
    return `
Extract actionable tasks from this voice input:

VOICE INPUT: "${transcription}"
TIME OF DAY: ${context.timeOfDay}

Guidelines:
- Extract specific, actionable tasks
- Infer reasonable deadlines from context clues
- Determine priority based on urgency indicators
- Set appropriate categories
- Consider time of day for urgency

Respond with JSON:
{
  "transcription": "${transcription}",
  "confidence": number,
  "extractedTasks": [
    {
      "title": "Clear task title",
      "description": "Detailed description",
      "priority": "low" | "medium" | "high",
      "estimatedDuration": number,
      "deadline": "ISO date string or null",
      "category": "work|personal|health|learning",
      "isFlexible": boolean,
      "dependencies": [],
      "syncToCalendar": boolean
    }
  ],
  "context": {
    "urgency": "low" | "medium" | "high",
    "mood": "excited" | "neutral" | "stressed" | "tired",
    "location": "inferred location or null",
    "timeOfDay": "${context.timeOfDay}"
  }
}`;
  }

  private buildScheduleOptimizationPrompt(
    tasks: Task[],
    userContext: UserContext,
    timeRange: { start: Date; end: Date }
  ): string {
    const tasksSummary = tasks.map(t => 
      `- ${t.title} (${t.estimatedDuration}min, ${t.priority} priority, ${t.status})`
    ).join('\n');

    return `
Optimize schedule for these tasks:

TASKS:
${tasksSummary}

USER CONTEXT:
- Energy Pattern: ${userContext.energyPattern}
- Deep Work Capacity: ${userContext.deepWorkCapacity} hours/day
- Stress Level: ${userContext.currentStressLevel}
- Break Preference: ${userContext.preferredBreakDuration} minutes
- Interruption Tolerance: ${userContext.interruptionTolerance}

TIME RANGE: ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}

Respond with JSON:
{
  "suggestions": [
    {
      "taskId": "task_id",
      "suggestedStart": "ISO date string",
      "suggestedEnd": "ISO date string", 
      "reasoning": "Why this timing is optimal",
      "energyAlignment": number,
      "priorityScore": number,
      "conflictRisk": "low" | "medium" | "high",
      "alternatives": [
        {
          "start": "ISO date string",
          "end": "ISO date string",
          "reasoning": "Alternative option"
        }
      ]
    }
  ]
}`;
  }

  private buildDocumentExtractionPrompt(content: string, context?: string): string {
    return `
Extract actionable tasks from this document:

${content ? `CONTENT: ${content}` : 'Analyze the provided image for tasks.'}
${context ? `CONTEXT: ${context}` : ''}

Extract:
1. Specific actionable tasks
2. Deadlines and due dates
3. People/stakeholders mentioned
4. Priority indicators
5. Context information

Respond with JSON:
{
  "extractedTasks": [
    {
      "title": "actionable task",
      "description": "detailed description",
      "priority": "low|medium|high",
      "estimatedDuration": number,
      "deadline": "ISO date or null",
      "category": "appropriate category",
      "isFlexible": boolean,
      "syncToCalendar": false
    }
  ],
  "deadlines": [
    {
      "task": "task description",
      "deadline": "ISO date",
      "confidence": number
    }
  ],
  "people": ["list", "of", "stakeholders"],
  "context": "document type/subject",
  "priority": "overall priority level"
}`;
  }

  private buildInsightsPrompt(userHistory: UserLearningData, recentTasks: Task[]): string {
    return `
Analyze productivity patterns and generate insights:

USER HISTORY:
- Completion Patterns: ${userHistory.taskCompletionPatterns.length} data points
- Energy Patterns: ${userHistory.energyPatterns.length} data points
- Recent Completion Rate: ${userHistory.taskCompletionPatterns.filter(p => p.completed).length / Math.max(userHistory.taskCompletionPatterns.length, 1) * 100}%

RECENT TASKS:
${recentTasks.slice(0, 10).map(t => `- ${t.title} (${t.status}, ${t.priority})`).join('\n')}

Generate insights as JSON:
{
  "insights": [
    {
      "id": "unique_id",
      "category": "productivity|wellness|efficiency|balance",
      "title": "Insight Title",
      "message": "Detailed insight message",
      "data": {
        "trend": "improving|stable|declining",
        "metric": "completion rate|focus time|etc",
        "value": number,
        "comparison": "vs last week"
      },
      "actionable": boolean,
      "suggestedActions": ["action1", "action2"]
    }
  ]
}`;
  }

  // Parsing methods
  private parseTaskAnalysisResponse(response: string, task: TaskFormData): AITaskAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        estimatedDuration: parsed.estimatedDuration || task.estimatedDuration,
        difficultyLevel: parsed.difficultyLevel || 'moderate',
        cognitiveLoad: parsed.cognitiveLoad || 'medium',
        optimalTimeOfDay: parsed.optimalTimeOfDay || 'anytime',
        recommendedBreaks: parsed.recommendedBreaks || 0,
        prerequisites: parsed.prerequisites || [],
        resources: parsed.resources || [],
        confidence: parsed.confidence || 0.7,
      };
    } catch {
      return this.getFallbackTaskAnalysis(task);
    }
  }

  private parseVoiceExtractionResponse(
    response: string, 
    transcription: string, 
    context: { timeOfDay: string; userContext?: UserContext }
  ): VoiceTaskInput {
    try {
      const parsed = JSON.parse(response);
      return {
        transcription,
        confidence: parsed.confidence || 0.8,
        extractedTasks: parsed.extractedTasks || [],
        context: parsed.context || {
          urgency: 'medium',
          mood: 'neutral',
          timeOfDay: context.timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night',
        },
      };
    } catch {
      return this.getFallbackVoiceProcessing(transcription, context);
    }
  }

  private parseScheduleSuggestionsResponse(response: string, tasks: Task[], timeRange: { start: Date; end: Date }): AIScheduleSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.suggestions || [];
    } catch {
      return this.getFallbackScheduleSuggestions(tasks, timeRange);
    }
  }

  private parseDocumentExtractionResponse(response: string, context?: string): DocumentTaskExtraction {
    try {
      const parsed = JSON.parse(response);
      return {
        extractedTasks: parsed.extractedTasks || [],
        deadlines: parsed.deadlines || [],
        people: parsed.people || [],
        context: parsed.context || context || 'Document processed',
        priority: parsed.priority || 'medium',
      };
    } catch {
      return this.getFallbackDocumentExtraction('', context);
    }
  }

  private parseInsightsResponse(response: string): AIInsight[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.insights || [];
    } catch {
      return this.getFallbackInsights();
    }
  }

  // Fallback methods (same as Gemini service)
  private getFallbackTaskAnalysis(task: TaskFormData): AITaskAnalysis {
    return {
      estimatedDuration: task.estimatedDuration,
      difficultyLevel: 'moderate',
      cognitiveLoad: 'medium',
      optimalTimeOfDay: 'anytime',
      recommendedBreaks: Math.floor(task.estimatedDuration / 90),
      prerequisites: [],
      resources: [],
      confidence: 0.5,
    };
  }

  private getFallbackVoiceProcessing(transcription: string, context: { timeOfDay: string; userContext?: UserContext }): VoiceTaskInput {
    const taskData: TaskFormData = {
      title: transcription.slice(0, 50),
      description: transcription,
      priority: transcription.toLowerCase().includes('urgent') ? 'high' : 'medium',
      estimatedDuration: 60,
      category: 'personal',
      isFlexible: true,
      syncToCalendar: false,
    };

    return {
      transcription,
      confidence: 0.6,
      extractedTasks: [taskData],
      context: {
        urgency: 'medium',
        mood: 'neutral',
        timeOfDay: context.timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night',
      },
    };
  }

  private getFallbackScheduleSuggestions(tasks: Task[], timeRange: { start: Date; end: Date }): AIScheduleSuggestion[] {
    return tasks.map(task => ({
      suggestedStart: timeRange.start,
      suggestedEnd: new Date(timeRange.start.getTime() + task.estimatedDuration * 60000),
      reasoning: 'Basic scheduling without AI optimization',
      energyAlignment: 0.5,
      priorityScore: task.priority === 'high' ? 0.8 : task.priority === 'medium' ? 0.5 : 0.3,
      conflictRisk: 'medium' as const,
      alternatives: [],
    }));
  }

  private getFallbackDocumentExtraction(content: string | File, context?: string): DocumentTaskExtraction {
    return {
      extractedTasks: [],
      deadlines: [],
      people: [],
      context: context || 'Document processed without AI',
      priority: 'medium',
    };
  }

  private getFallbackInsights(): AIInsight[] {
    return [
      {
        id: 'fallback-1',
        category: 'productivity',
        title: 'AI Insights Unavailable',
        message: 'Connect AI service to get personalized productivity insights.',
        data: {
          trend: 'stable',
          metric: 'completion rate',
          value: 0,
          comparison: 'vs baseline',
        },
        actionable: false,
      },
    ];
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  }
}

export const openaiService = new OpenAIService();