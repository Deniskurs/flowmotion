/**
 * Authentication Types
 * 
 * Type definitions for authentication system
 * Used by: authStore.ts, GoogleSignIn.tsx, NextAuth
 */

// import { User as NextAuthUser } from 'next-auth';

export interface FlowMotionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  googleCalendarConnected: boolean;
  googleRefreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: FlowMotionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthActions {
  signIn: (provider: 'google') => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<FlowMotionUser>) => Promise<void>;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  setUser: (user: FlowMotionUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface GoogleCalendarCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface CalendarSyncSettings {
  syncEnabled: boolean;
  defaultCalendarId: string;
  syncCompletedTasks: boolean;
  syncTasksToCalendar: boolean;
  calendarSyncDirection: 'one-way' | 'two-way';
}

// NextAuth session extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
    };
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accessToken?: string;
    refreshToken?: string;
  }
}