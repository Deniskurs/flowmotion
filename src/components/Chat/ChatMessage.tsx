/**
 * ChatMessage - Ultra-premium Apple-style message component
 * Sophisticated design with smooth animations
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Sparkles, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Message } from 'ai';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

interface SchedulingTask {
  title: string;
  description: string;
  estimatedDuration: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestedTime: string;
  preparationTime?: number;
  conflicts?: string[];
  alternatives?: string[];
}

interface SchedulingResponse {
  response: string;
  tasks?: SchedulingTask[];
  clarificationNeeded?: boolean;
  nextQuestion?: string;
}

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Try to parse scheduling response
  let schedulingData: SchedulingResponse | null = null;
  let displayText = message.content;
  
  if (isAssistant && message.content) {
    try {
      const jsonMatch = message.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        schedulingData = JSON.parse(jsonMatch[0]);
        // Extract just the response text for display
        displayText = schedulingData.response || message.content;
      }
    } catch {
      // Not JSON, treat as regular text
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }}
      className={`flex gap-4 mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar - Assistant only */}
      {isAssistant && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex-shrink-0 mt-1"
        >
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg shadow-black/20">
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
        </motion.div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Message Bubble */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={`
            relative px-6 py-4 rounded-2xl shadow-sm
            ${isUser 
              ? 'bg-black text-white shadow-black/20' 
              : 'bg-black/3 text-black border border-black/5 backdrop-blur-sm'
            }
          `}
        >
          {/* Loading animation */}
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: 'easeInOut',
                    }}
                    className="w-2 h-2 bg-black/40 rounded-full"
                  />
                ))}
              </div>
              <span className="text-sm font-light text-black/60">AI is thinking...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Message Text */}
              <div className={`
                text-base leading-relaxed font-light
                ${isUser ? 'text-white' : 'text-black'}
              `}>
                {displayText}
              </div>

              {/* Scheduling Response */}
              {schedulingData && (
                <SchedulingResponseComponent data={schedulingData} />
              )}
            </div>
          )}

          {/* Message tail */}
          <div
            className={`
              absolute top-4 w-3 h-3 transform rotate-45
              ${isUser 
                ? 'bg-black -right-1' 
                : 'bg-black/3 border-r border-b border-black/5 -left-1'
              }
            `}
          />
        </motion.div>

        {/* Timestamp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-2 px-2"
        >
          <p className="text-xs text-black/40 font-light">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </motion.div>
      </div>

      {/* Avatar - User only */}
      {isUser && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex-shrink-0 mt-1"
        >
          <div className="w-8 h-8 bg-black/10 border border-black/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-black/60" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Scheduling Response Component
function SchedulingResponseComponent({ data }: { data: SchedulingResponse }) {
  if (!data.tasks || !Array.isArray(data.tasks)) {
    return data.nextQuestion ? (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="bg-blue-50/30 backdrop-blur-sm rounded-xl p-4 border border-blue-200/30"
      >
        <p className="text-sm text-blue-700 font-light italic">
          {data.nextQuestion}
        </p>
      </motion.div>
    ) : null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-3"
    >
      {/* Tasks */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-black/80 mb-3">Suggested Schedule:</h4>
        {data.tasks.map((task, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
            className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-black/5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <h5 className="font-medium text-black text-sm">{task.title}</h5>
              <span className={`
                px-2 py-1 rounded-lg text-xs font-medium shrink-0 ml-2
                ${task.priority === 'high' ? 'bg-red-100/80 text-red-700' :
                  task.priority === 'medium' ? 'bg-yellow-100/80 text-yellow-700' :
                  'bg-green-100/80 text-green-700'}
              `}>
                {task.priority}
              </span>
            </div>
            
            {task.description && (
              <p className="text-sm text-black/70 font-light mb-3 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Task Details */}
            <div className="flex flex-wrap gap-3 text-xs text-black/60">
              {task.estimatedDuration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{task.estimatedDuration} min</span>
                </div>
              )}
              {task.category && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-black/20 rounded-full" />
                  <span className="capitalize">{task.category}</span>
                </div>
              )}
              {task.suggestedTime && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(task.suggestedTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </div>

            {/* Conflicts */}
            {task.conflicts && task.conflicts.length > 0 && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-red-50/50 rounded-lg border border-red-100/50">
                <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 shrink-0" />
                <div className="text-xs text-red-700">
                  <span className="font-medium">Conflicts:</span>
                  <span className="ml-1">{task.conflicts.join(', ')}</span>
                </div>
              </div>
            )}

            {/* Alternatives */}
            {task.alternatives && task.alternatives.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                <div className="text-xs text-blue-700">
                  <span className="font-medium">Alternatives:</span>
                  <div className="mt-1 space-y-1">
                    {task.alternatives.map((alt, altIndex) => (
                      <div key={altIndex} className="text-xs">• {alt}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Next Question */}
      {data.nextQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="bg-blue-50/30 backdrop-blur-sm rounded-xl p-4 border border-blue-200/30"
        >
          <p className="text-sm text-blue-700 font-light italic">
            {data.nextQuestion}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}