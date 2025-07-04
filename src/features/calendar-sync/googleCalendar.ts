/**
 * Google Calendar API Integration
 * 
 * Handles direct Google Calendar API operations
 * Manages authentication and API calls
 * 
 * Used by: CalendarSync.tsx, calendar sync store
 * Related: authStore.ts for authentication tokens
 */

import { GoogleCalendarEvent, GoogleCalendar, SyncedCalendarEvent } from './CalendarSyncTypes';
import { Task } from '@/features/tasks/TaskTypes';

class GoogleCalendarService {
  private baseUrl = 'https://www.googleapis.com/calendar/v3';

  /**
   * Get access token from session
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      return session?.accessToken || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request to Google Calendar
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get list of user's calendars
   */
  async getCalendars(): Promise<GoogleCalendar[]> {
    try {
      const response = await this.apiRequest<{ items: GoogleCalendar[] }>('/calendars');
      return response.items || [];
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
      throw error;
    }
  }

  /**
   * Get calendar events within a date range
   */
  async getEvents(
    calendarId: string = 'primary',
    timeMin?: Date,
    timeMax?: Date
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });

      if (timeMin) {
        params.append('timeMin', timeMin.toISOString());
      }

      if (timeMax) {
        params.append('timeMax', timeMax.toISOString());
      }

      const response = await this.apiRequest<{ items: GoogleCalendarEvent[] }>(
        `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
      );

      return response.items || [];
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event from a task
   */
  async createEventFromTask(
    task: Task,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent> {
    if (!task.scheduledStart || !task.scheduledEnd) {
      throw new Error('Task must be scheduled to create calendar event');
    }

    const event: Partial<GoogleCalendarEvent> = {
      summary: task.title,
      description: this.formatTaskDescription(task),
      start: {
        dateTime: task.scheduledStart.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: task.scheduledEnd.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      source: {
        title: 'FlowMotion Task',
        url: `${window.location.origin}?task=${task.id}`,
      },
    };

    try {
      const response = await this.apiRequest<GoogleCalendarEvent>(
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          body: JSON.stringify(event),
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    eventId: string,
    task: Task,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent> {
    if (!task.scheduledStart || !task.scheduledEnd) {
      throw new Error('Task must be scheduled to update calendar event');
    }

    const event: Partial<GoogleCalendarEvent> = {
      summary: task.title,
      description: this.formatTaskDescription(task),
      start: {
        dateTime: task.scheduledStart.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: task.scheduledEnd.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    try {
      const response = await this.apiRequest<GoogleCalendarEvent>(
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'PUT',
          body: JSON.stringify(event),
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> {
    try {
      await this.apiRequest(
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  /**
   * Convert Google Calendar events to our calendar event format
   */
  convertToSyncedEvents(
    googleEvents: GoogleCalendarEvent[],
    calendar: GoogleCalendar
  ): SyncedCalendarEvent[] {
    return googleEvents
      .filter(event => event.status !== 'cancelled')
      .map(event => {
        const start = event.start.dateTime 
          ? new Date(event.start.dateTime)
          : new Date(event.start.date + 'T00:00:00');
        
        const end = event.end.dateTime
          ? new Date(event.end.dateTime)
          : new Date(event.end.date + 'T23:59:59');

        return {
          id: `google-${event.id}`,
          googleEventId: event.id,
          title: event.summary || 'Untitled Event',
          start,
          end,
          isAllDay: !!event.start.date,
          calendarId: calendar.id,
          calendarName: calendar.summary,
          status: event.status,
          isFromGoogleCalendar: true as const,
          type: this.categorizeEvent(event),
          description: event.description,
          attendees: event.attendees?.map(a => a.email) || [],
        };
      });
  }

  /**
   * Categorize event type based on Google Calendar event data
   */
  private categorizeEvent(event: GoogleCalendarEvent): 'meeting' | 'event' | 'block' {
    if (event.attendees && event.attendees.length > 1) {
      return 'meeting';
    }
    
    if (event.transparency === 'transparent') {
      return 'block';
    }
    
    return 'event';
  }

  /**
   * Format task description for Google Calendar
   */
  private formatTaskDescription(task: Task): string {
    let description = '';
    
    if (task.description) {
      description += task.description + '\n\n';
    }
    
    description += `Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}\n`;
    description += `Category: ${task.category}\n`;
    description += `Duration: ${task.estimatedDuration} minutes\n`;
    
    if (task.deadline) {
      description += `Deadline: ${task.deadline.toLocaleDateString()}\n`;
    }
    
    description += '\n---\nCreated by FlowMotion';
    
    return description;
  }

  /**
   * Check if the user has granted calendar permissions
   */
  async hasCalendarPermissions(): Promise<boolean> {
    try {
      await this.getCalendars();
      return true;
    } catch {
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();