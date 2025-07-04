/**
 * Task-related TypeScript types and interfaces
 * 
 * Contains all type definitions for the task management system
 * Used by: TaskManager.tsx, taskStore.ts, CalendarView.tsx
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number; // in minutes
  deadline?: Date;
  category: string;
  status: 'todo' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  dependencies?: string[]; // task IDs
  isFlexible: boolean; // can be moved by auto-scheduler
  // Authentication and sync fields
  userId?: string; // ID of the user who owns this task
  googleEventId?: string; // Google Calendar event ID if synced
  syncToCalendar?: boolean; // Whether to sync this task to Google Calendar
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  deadline?: Date;
  category: string;
  isFlexible: boolean;
  dependencies?: string[];
  syncToCalendar?: boolean; // Whether to sync this task to Google Calendar
}

export interface TaskFilter {
  status?: 'todo' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface DragEndEvent {
  active: {
    id: string;
  };
  over: {
    id: string;
  } | null;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'personal', name: 'Personal', color: '#10b981' },
  { id: 'health', name: 'Health', color: '#f59e0b' },
  { id: 'learning', name: 'Learning', color: '#8b5cf6' },
];

export const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#ef4444',
} as const;