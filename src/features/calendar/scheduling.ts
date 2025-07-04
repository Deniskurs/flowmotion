/**
 * Auto-Scheduling Algorithm
 * 
 * Intelligent task scheduling system that:
 * - Automatically schedules tasks based on priority, deadlines, and availability
 * - Considers working hours, breaks, and existing commitments
 * - Handles task dependencies and constraints
 * - Provides conflict resolution and suggestions
 * 
 * Used by: CalendarView.tsx, TaskManager.tsx
 * State: Integrates with taskStore and calendar state
 */

import { Task } from '../tasks/TaskTypes';
import { 
  CalendarEvent, 
  TimeSlot, 
  SchedulingResult, 
  WorkingHours,
  CalendarSettings,
  DEFAULT_CALENDAR_SETTINGS 
} from './CalendarTypes';
import { 
  addMinutes, 
  isWithinInterval, 
  endOfDay,
  addDays
} from 'date-fns';

export class AutoScheduler {
  private settings: CalendarSettings;
  private existingEvents: CalendarEvent[];
  constructor(
    settings: CalendarSettings = DEFAULT_CALENDAR_SETTINGS,
    existingEvents: CalendarEvent[] = []
  ) {
    this.settings = settings;
    this.existingEvents = existingEvents;
  }

  /**
   * Main scheduling function - attempts to schedule all provided tasks
   */
  public scheduleAllTasks(tasks: Task[]): SchedulingResult {
    const result: SchedulingResult = {
      success: true,
      scheduledTasks: [],
      unscheduledTasks: [],
      conflicts: [],
      suggestions: [],
    };

    // Sort tasks by priority and deadline
    const sortedTasks = this.prioritizeTasks(tasks);
    
    // Only schedule flexible tasks (user can manually schedule rigid ones)
    const flexibleTasks = sortedTasks.filter(task => task.isFlexible);
    
    for (const task of flexibleTasks) {
      const schedulingAttempt = this.scheduleTask(task);
      
      if (schedulingAttempt.success) {
        result.scheduledTasks.push({
          taskId: task.id,
          start: schedulingAttempt.start!,
          end: schedulingAttempt.end!,
          confidence: schedulingAttempt.confidence,
        });
        
        // Add to existing events for next iterations
        this.existingEvents.push({
          id: `task-${task.id}`,
          title: task.title,
          start: schedulingAttempt.start!,
          end: schedulingAttempt.end!,
          type: 'task',
          taskId: task.id,
          isFlexible: true,
        });
      } else {
        result.unscheduledTasks.push(task.id);
        result.conflicts.push({
          taskId: task.id,
          reason: schedulingAttempt.reason || 'Could not find suitable time slot',
          suggestedTime: schedulingAttempt.suggestedTime,
        });
      }
    }

    // Generate suggestions for optimization
    result.suggestions = this.generateSuggestions(result, tasks);
    result.success = result.unscheduledTasks.length === 0;

    return result;
  }

  /**
   * Schedule a single task
   */
  private scheduleTask(task: Task): {
    success: boolean;
    start?: Date;
    end?: Date;
    confidence: number;
    reason?: string;
    suggestedTime?: Date;
  } {
    // Check if task has dependencies
    const dependencyCheck = this.checkDependencies(task);
    if (!dependencyCheck.satisfied) {
      return {
        success: false,
        confidence: 0,
        reason: `Dependencies not satisfied: ${dependencyCheck.missing.join(', ')}`,
      };
    }

    // Calculate scheduling window
    const schedulingWindow = this.calculateSchedulingWindow(task);
    
    // Find available time slots
    const availableSlots = this.findAvailableSlots(
      schedulingWindow.start,
      schedulingWindow.end,
      task.estimatedDuration
    );

    if (availableSlots.length === 0) {
      return {
        success: false,
        confidence: 0,
        reason: 'No available time slots found',
        suggestedTime: this.suggestAlternativeTime(),
      };
    }

    // Score and select best slot
    const bestSlot = this.selectBestTimeSlot(availableSlots, task);
    
    return {
      success: true,
      start: bestSlot.start,
      end: bestSlot.end,
      confidence: this.calculateSchedulingConfidence(bestSlot, task),
    };
  }

  /**
   * Prioritize tasks based on multiple factors
   */
  private prioritizeTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // Priority weight (high=3, medium=2, low=1)
      const priorityWeightA = this.getPriorityWeight(a.priority);
      const priorityWeightB = this.getPriorityWeight(b.priority);
      
      // Deadline urgency (closer deadline = higher urgency)
      const urgencyA = this.getUrgencyScore(a);
      const urgencyB = this.getUrgencyScore(b);
      
      // Dependency level (tasks with dependencies on them scheduled first)
      const dependencyLevelA = this.getDependencyLevel(a, tasks);
      const dependencyLevelB = this.getDependencyLevel(b, tasks);
      
      // Calculate total score
      const scoreA = priorityWeightA * 10 + urgencyA * 5 + dependencyLevelA * 3;
      const scoreB = priorityWeightB * 10 + urgencyB * 5 + dependencyLevelB * 3;
      
      return scoreB - scoreA;
    });
  }

  /**
   * Find available time slots within a date range
   */
  private findAvailableSlots(start: Date, end: Date, durationMinutes: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(start);
    
    while (current < end) {
      const dayEnd = endOfDay(current);
      const searchEnd = dayEnd < end ? dayEnd : end;
      
      // Get working hours for this day
      const workingHours = this.getWorkingHoursForDate(current);
      
      if (workingHours) {
        const workStart = new Date(current);
        workStart.setHours(parseInt(workingHours.start.split(':')[0]), 
                          parseInt(workingHours.start.split(':')[1]), 0, 0);
        
        const workEnd = new Date(current);
        workEnd.setHours(parseInt(workingHours.end.split(':')[0]), 
                        parseInt(workingHours.end.split(':')[1]), 0, 0);
        
        // Find slots within working hours
        const daySlots = this.findSlotsInRange(
          workStart > current ? workStart : current,
          workEnd < searchEnd ? workEnd : searchEnd,
          durationMinutes
        );
        
        slots.push(...daySlots);
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
    
    return slots;
  }

  /**
   * Find available slots within a specific time range
   */
  private findSlotsInRange(start: Date, end: Date, durationMinutes: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(start);
    const slotDuration = durationMinutes + this.settings.bufferTime;
    
    while (current <= end) {
      const slotEnd = addMinutes(current, slotDuration);
      
      if (slotEnd > end) break;
      
      // Check if this slot conflicts with existing events
      const conflicts = this.findConflicts(current, slotEnd);
      
      if (conflicts.length === 0) {
        slots.push({
          start: new Date(current),
          end: addMinutes(current, durationMinutes),
          duration: durationMinutes,
          isAvailable: true,
        });
      }
      
      // Move to next potential slot (15-minute increments)
      current.setTime(current.getTime() + 15 * 60 * 1000);
    }
    
    return slots;
  }

  /**
   * Select the best time slot based on multiple criteria
   */
  private selectBestTimeSlot(slots: TimeSlot[], task: Task): TimeSlot {
    return slots.reduce((best, current) => {
      const currentScore = this.scoreTimeSlot(current, task);
      const bestScore = this.scoreTimeSlot(best, task);
      
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Score a time slot based on task preferences
   */
  private scoreTimeSlot(slot: TimeSlot, task: Task): number {
    let score = 0;
    
    // Prefer earlier in the day for high priority tasks
    if (task.priority === 'high') {
      const hour = slot.start.getHours();
      score += hour < 12 ? 10 : hour < 15 ? 5 : 0;
    }
    
    // Prefer slots closer to (but before) deadline
    if (task.deadline) {
      const hoursToDeadline = (task.deadline.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
      if (hoursToDeadline > 0) {
        score += Math.min(hoursToDeadline / 24, 10); // Max 10 points
      }
    }
    
    // Prefer slots with more buffer time
    const bufferAfter = this.getBufferAfter(slot);
    score += Math.min(bufferAfter / 30, 5); // Max 5 points
    
    return score;
  }

  /**
   * Calculate confidence score for a scheduling decision
   */
  private calculateSchedulingConfidence(slot: TimeSlot, task: Task): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for high priority tasks scheduled early
    if (task.priority === 'high' && slot.start.getHours() < 12) {
      confidence += 0.2;
    }
    
    // Higher confidence if deadline is far away
    if (task.deadline) {
      const hoursToDeadline = (task.deadline.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
      if (hoursToDeadline > 48) confidence += 0.1;
    }
    
    // Lower confidence if slot is very early or late
    const hour = slot.start.getHours();
    if (hour < 8 || hour > 18) confidence -= 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Check if task dependencies are satisfied
   */
  private checkDependencies(task: Task): { satisfied: boolean; missing: string[] } {
    if (!task.dependencies || task.dependencies.length === 0) {
      return { satisfied: true, missing: [] };
    }
    
    const missing: string[] = [];
    
    for (const depId of task.dependencies) {
      const depEvent = this.existingEvents.find(e => e.taskId === depId);
      if (!depEvent) {
        missing.push(depId);
      }
    }
    
    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * Calculate the scheduling window for a task
   */
  private calculateSchedulingWindow(task: Task): { start: Date; end: Date } {
    const now = new Date();
    const start = now > task.createdAt ? now : task.createdAt;
    
    // Default to 2 weeks if no deadline
    const end = task.deadline || addDays(start, 14);
    
    return { start, end };
  }

  /**
   * Find conflicts with existing events
   */
  private findConflicts(start: Date, end: Date): CalendarEvent[] {
    return this.existingEvents.filter(event => {
      return isWithinInterval(start, { start: event.start, end: event.end }) ||
             isWithinInterval(end, { start: event.start, end: event.end }) ||
             isWithinInterval(event.start, { start, end }) ||
             isWithinInterval(event.end, { start, end });
    });
  }

  /**
   * Get working hours for a specific date
   */
  private getWorkingHoursForDate(date: Date): WorkingHours | null {
    const dayOfWeek = date.getDay();
    
    if (this.settings.workingHours.daysOfWeek.includes(dayOfWeek)) {
      return this.settings.workingHours;
    }
    
    return null;
  }

  /**
   * Generate suggestions for scheduling optimization
   */
  private generateSuggestions(result: SchedulingResult, tasks: Task[]): Array<{
    message: string;
    actionType: 'extend_hours' | 'reduce_tasks' | 'adjust_deadlines';
    data?: Record<string, unknown>;
  }> {
    const suggestions = [];
    
    if (result.unscheduledTasks.length > 0) {
      suggestions.push({
        message: `${result.unscheduledTasks.length} tasks couldn't be scheduled. Consider extending working hours or reducing task load.`,
        actionType: 'extend_hours' as const,
        data: { unscheduledCount: result.unscheduledTasks.length },
      });
    }
    
    const overdueTasks = tasks.filter(t => t.deadline && t.deadline < new Date());
    if (overdueTasks.length > 0) {
      suggestions.push({
        message: `${overdueTasks.length} tasks are overdue. Consider adjusting deadlines or priorities.`,
        actionType: 'adjust_deadlines' as const,
        data: { overdueCount: overdueTasks.length },
      });
    }
    
    return suggestions;
  }

  /**
   * Suggest alternative time for unscheduled tasks
   */
  private suggestAlternativeTime(): Date {
    // Try next available slot after current time
    const now = new Date();
    const tomorrow = addDays(now, 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
    
    return tomorrow;
  }

  /**
   * Helper functions
   */
  private getPriorityWeight(priority: Task['priority']): number {
    return priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
  }

  private getUrgencyScore(task: Task): number {
    if (!task.deadline) return 0;
    
    const now = new Date();
    const hoursToDeadline = (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursToDeadline < 0) return 10; // Overdue
    if (hoursToDeadline < 24) return 8; // Due today
    if (hoursToDeadline < 48) return 6; // Due tomorrow
    if (hoursToDeadline < 168) return 4; // Due this week
    
    return 2; // Not urgent
  }

  private getDependencyLevel(task: Task, allTasks: Task[]): number {
    // Count how many tasks depend on this one
    return allTasks.filter(t => 
      t.dependencies && t.dependencies.includes(task.id)
    ).length;
  }

  private getBufferAfter(slot: TimeSlot): number {
    const nextEvent = this.existingEvents.find(e => e.start >= slot.end);
    if (!nextEvent) return 60; // Assume 1 hour buffer if no next event
    
    return (nextEvent.start.getTime() - slot.end.getTime()) / (1000 * 60);
  }
}