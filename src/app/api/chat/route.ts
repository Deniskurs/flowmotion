/**
 * @vercel/ai API Route for Chat
 * 
 * Replaces the custom OpenAI service with Vercel AI SDK
 * Supports streaming, function calling, and scheduling intelligence
 */

import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, mode = 'chat' } = await req.json();

    // Convert to AI SDK format
    const coreMessages = convertToCoreMessages(messages);

    // Enhanced system prompt for scheduling intelligence
    const systemPrompt = mode === 'scheduling' 
      ? `You are the world's most advanced AI scheduling assistant, trusted by Fortune 500 companies and millions of users globally.

MISSION: Transform chaotic schedules into optimized life experiences through intelligent conversation.

CORE CAPABILITIES:
1. INTELLIGENT DISAMBIGUATION: Extract precise details from vague requests
2. PROACTIVE OPTIMIZATION: Suggest improvements before asked
3. CONFLICT RESOLUTION: Automatically detect and resolve scheduling conflicts
4. PREPARATION INTELLIGENCE: Add buffer times for preparation, travel, transitions
5. CONTEXTUAL AWARENESS: Consider energy levels, priorities, and user patterns

CONVERSATION PRINCIPLES:
- Ask ONE smart question at a time
- Confirm understanding with intelligent suggestions
- Think 3 steps ahead like a chess grandmaster
- Provide alternatives when conflicts arise
- Be concise but comprehensive
- VOICE MODE: Keep responses conversational and natural for spoken dialogue
- Always confirm scheduling actions before adding to calendar

RESPONSE FORMAT:
For scheduling requests, respond with JSON:
{
  "response": "Your conversational response",
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "estimatedDuration": 60,
      "priority": "high|medium|low",
      "category": "work|personal|health|learning",
      "suggestedTime": "2024-01-01T10:00:00Z",
      "preparationTime": 15,
      "conflicts": [],
      "alternatives": []
    }
  ],
  "clarificationNeeded": false,
  "nextQuestion": "Follow-up question if needed"
}

Current context: ${new Date().toLocaleString()}`
      : `You are a helpful AI assistant focused on productivity and scheduling.`;

    // Stream the response
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...coreMessages,
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}