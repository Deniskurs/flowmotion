/**
 * Calendar-related TypeScript types and interfaces
 * 
 * Contains all type definitions for the calendar and scheduling system
 * Used by: CalendarView.tsx, scheduling.ts, TaskManager.tsx
 */

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'meeting' | 'block' | 'break';
  taskId?: string;
  color?: string;
  isFlexible: boolean;
  description?: string;
  location?: string;
}

export interface TimeBlock {
  id: string;
  start: Date;
  end: Date;
  type: 'work' | 'break' | 'meeting' | 'focus' | 'unavailable';
  title: string;
  description?: string;
  color: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  endDate?: Date;
  exceptions?: Date[]; // dates to skip
}

export interface CalendarView {
  type: 'day' | 'week' | 'month' | 'agenda';
  currentDate: Date;
  startDate: Date;
  endDate: Date;
}

export interface WorkingHours {
  start: string; // HH:MM format
  end: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
}

export interface CalendarSettings {
  workingHours: WorkingHours;
  timeZone: string;
  defaultTaskDuration: number; // in minutes
  breakDuration: number; // in minutes
  bufferTime: number; // in minutes between tasks
  weekStartsOn: number; // 0-6, Sunday-Saturday
}

export interface SchedulingConstraint {
  id: string;
  type: 'before' | 'after' | 'during' | 'not_during';
  time?: Date;
  timeRange?: {
    start: Date;
    end: Date;
  };
  taskId?: string;
  priority: number;
}

export interface SchedulingResult {
  success: boolean;
  scheduledTasks: {
    taskId: string;
    start: Date;
    end: Date;
    confidence: number; // 0-1, how confident the scheduler is
  }[];
  unscheduledTasks: string[]; // task IDs that couldn't be scheduled
  conflicts: {
    taskId: string;
    reason: string;
    suggestedTime?: Date;
  }[];
  suggestions: {
    message: string;
    actionType: 'extend_hours' | 'reduce_tasks' | 'adjust_deadlines';
    data?: Record<string, unknown>;
  }[];
}

export interface DraggedEvent {
  event: CalendarEvent;
  start: Date;
  end: Date;
}

export interface CalendarFilter {
  types: string[];
  categories: string[];
  showCompleted: boolean;
  showScheduled: boolean;
  showUnscheduled: boolean;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
  isAvailable: boolean;
  conflicts?: string[];
}

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  start: '09:00',
  end: '17:00',
  daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
};

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  workingHours: DEFAULT_WORKING_HOURS,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultTaskDuration: 60,
  breakDuration: 15,
  bufferTime: 5,
  weekStartsOn: 0, // Sunday
};

export const EVENT_COLORS = {
  task: '#3b82f6',
  meeting: '#10b981',
  block: '#8b5cf6',
  break: '#f59e0b',
  unavailable: '#ef4444',
} as const;

export const CALENDAR_VIEWS = [
  { id: 'day', name: 'Day', shortcut: 'D' },
  { id: 'week', name: 'Week', shortcut: 'W' },
  { id: 'month', name: 'Month', shortcut: 'M' },
  { id: 'agenda', name: 'Agenda', shortcut: 'A' },
] as const;