/**
 * Calendar Sync Types
 * 
 * Type definitions for Google Calendar integration
 * Used by: CalendarSync.tsx, googleCalendar.ts
 */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  htmlLink?: string;
  source?: {
    url: string;
    title: string;
  };
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: 'owner' | 'reader' | 'writer' | 'freeBusyReader';
  selected?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface CalendarSyncState {
  isConnected: boolean;
  isLoading: boolean;
  lastSyncTime?: Date;
  error?: string;
  calendars: GoogleCalendar[];
  selectedCalendarId?: string;
  syncSettings: {
    syncTasksToCalendar: boolean;
    syncCalendarToTasks: boolean;
    defaultTaskDuration: number; // minutes
    includeCompletedTasks: boolean;
    taskCalendarColor?: string;
  };
}

export interface CalendarSyncActions {
  connectCalendar: () => Promise<void>;
  disconnectCalendar: () => Promise<void>;
  loadCalendars: () => Promise<void>;
  syncCalendarEvents: (timeMin?: Date, timeMax?: Date) => Promise<void>;
  createCalendarEvent: (taskId: string) => Promise<string | null>;
  updateCalendarEvent: (taskId: string, eventId: string) => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
  updateSyncSettings: (settings: Partial<CalendarSyncState['syncSettings']>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface SyncedCalendarEvent {
  id: string;
  googleEventId: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  calendarId: string;
  calendarName: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  isFromGoogleCalendar: true;
  type: 'meeting' | 'event' | 'block';
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface CalendarSyncResult {
  success: boolean;
  eventsAdded: number;
  eventsUpdated: number;
  eventsRemoved: number;
  tasksCreated: number;
  tasksUpdated: number;
  errors: string[];
}

export interface GoogleCalendarAPI {
  calendars: {
    list: () => Promise<{ items: GoogleCalendar[] }>;
  };
  events: {
    list: (params: {
      calendarId: string;
      timeMin?: string;
      timeMax?: string;
      singleEvents?: boolean;
      orderBy?: string;
      maxResults?: number;
    }) => Promise<{ items: GoogleCalendarEvent[] }>;
    insert: (params: {
      calendarId: string;
      resource: Partial<GoogleCalendarEvent>;
    }) => Promise<GoogleCalendarEvent>;
    update: (params: {
      calendarId: string;
      eventId: string;
      resource: Partial<GoogleCalendarEvent>;
    }) => Promise<GoogleCalendarEvent>;
    delete: (params: {
      calendarId: string;
      eventId: string;
    }) => Promise<void>;
  };
}

// Default sync settings
export const DEFAULT_SYNC_SETTINGS: CalendarSyncState['syncSettings'] = {
  syncTasksToCalendar: true,
  syncCalendarToTasks: false, // Start with one-way sync
  defaultTaskDuration: 60,
  includeCompletedTasks: false,
  taskCalendarColor: '#4285f4',
};