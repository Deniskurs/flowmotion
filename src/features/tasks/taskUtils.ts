/**
 * Task Utility Functions
 * 
 * Helper functions for task operations, formatting, and validation
 * Used by: TaskManager.tsx, scheduling.ts
 */

import { Task, TaskFormData } from './TaskTypes';
import { format, isToday, isTomorrow, isYesterday, differenceInDays } from 'date-fns';

export const validateTaskForm = (data: TaskFormData): string[] => {
  const errors: string[] = [];
  
  if (!data.title.trim()) {
    errors.push('Title is required');
  }
  
  if (data.estimatedDuration <= 0) {
    errors.push('Estimated duration must be greater than 0');
  }
  
  if (data.deadline && data.deadline < new Date()) {
    errors.push('Deadline cannot be in the past');
  }
  
  return errors;
};

export const formatTaskDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
};

export const formatTaskDate = (date: Date): string => {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`;
  }
  
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  
  const daysDiff = differenceInDays(date, new Date());
  
  if (Math.abs(daysDiff) < 7) {
    return format(date, 'EEEE \'at\' h:mm a');
  }
  
  return format(date, 'MMM d \'at\' h:mm a');
};

export const getTaskPriorityWeight = (priority: Task['priority']): number => {
  switch (priority) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 1;
  }
};

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.deadline) return false;
  return task.deadline < new Date() && task.status !== 'completed';
};

export const getTaskUrgency = (task: Task): number => {
  if (!task.deadline) return 0;
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // More urgent = higher number
  if (hoursUntilDeadline < 0) return 100; // Overdue
  if (hoursUntilDeadline < 24) return 50; // Due today
  if (hoursUntilDeadline < 48) return 25; // Due tomorrow
  if (hoursUntilDeadline < 168) return 10; // Due this week
  
  return 1; // Not urgent
};

export const calculateTaskScore = (task: Task): number => {
  const priorityWeight = getTaskPriorityWeight(task.priority);
  const urgencyScore = getTaskUrgency(task);
  
  return priorityWeight * 10 + urgencyScore;
};

export const sortTasksByScore = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => calculateTaskScore(b) - calculateTaskScore(a));
};

export const groupTasksByStatus = (tasks: Task[]): Record<string, Task[]> => {
  return tasks.reduce((groups, task) => {
    const status = task.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(task);
    return groups;
  }, {} as Record<string, Task[]>);
};

export const groupTasksByCategory = (tasks: Task[]): Record<string, Task[]> => {
  return tasks.reduce((groups, task) => {
    const category = task.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(task);
    return groups;
  }, {} as Record<string, Task[]>);
};

export const getCompletionStats = (tasks: Task[]): { 
  completedToday: number; 
  totalToday: number; 
  streak: number; 
} => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const completedToday = tasks.filter(task => 
    task.status === 'completed' && 
    task.updatedAt >= todayStart
  ).length;
  
  const totalToday = tasks.filter(task => {
    if (task.scheduledStart) {
      const scheduledDate = new Date(task.scheduledStart);
      return scheduledDate.toDateString() === today.toDateString();
    }
    return task.createdAt.toDateString() === today.toDateString();
  }).length;
  
  // Calculate streak (simplified)
  let streak = 0;
  const sortedTasks = tasks
    .filter(task => task.status === 'completed')
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  
  const currentDate = new Date();
  for (const task of sortedTasks) {
    const taskDate = new Date(task.updatedAt);
    if (taskDate.toDateString() === currentDate.toDateString()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return { completedToday, totalToday, streak };
};

export const createTaskFromTemplate = (template: Partial<Task>, overrides: Partial<Task> = {}): TaskFormData => {
  return {
    title: template.title || 'New Task',
    description: template.description || '',
    priority: template.priority || 'medium',
    estimatedDuration: template.estimatedDuration || 60,
    deadline: template.deadline,
    category: template.category || 'personal',
    isFlexible: template.isFlexible ?? true,
    dependencies: template.dependencies || [],
    ...overrides,
  };
};