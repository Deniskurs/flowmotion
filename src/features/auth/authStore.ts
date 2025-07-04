/**
 * Authentication State Management
 * 
 * Zustand store for managing authentication state and user sessions
 * Integrates with NextAuth and Supabase for user management
 * 
 * Used by: All components requiring auth state
 * Related: GoogleSignIn.tsx, taskStore.ts
 */

import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { FlowMotionUser, AuthState, AuthActions } from './AuthTypes';

interface AuthStore extends AuthState, AuthActions {}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial State
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Authentication Actions
  signIn: async (provider: 'google') => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await nextAuthSignIn(provider, { 
        redirect: false 
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Success will be handled by session callback
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign in failed',
        isLoading: false 
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await nextAuthSignOut({ redirect: false });
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign out failed',
        isLoading: false 
      });
    }
  },

  updateUser: async (updates: Partial<FlowMotionUser>) => {
    const { user } = get();
    if (!user || !isSupabaseConfigured()) return;

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase!
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      set({ 
        user: { ...user, ...updates, updatedAt: new Date() },
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update user',
        isLoading: false 
      });
    }
  },

  connectGoogleCalendar: async () => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });

    try {
      // This will trigger the Google Calendar OAuth flow
      const result = await nextAuthSignIn('google', {
        redirect: false,
        scope: 'openid email profile https://www.googleapis.com/auth/calendar'
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Update user's calendar connection status
      await get().updateUser({ googleCalendarConnected: true });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to connect Google Calendar',
        isLoading: false 
      });
    }
  },

  disconnectGoogleCalendar: async () => {
    const { user } = get();
    if (!user || !isSupabaseConfigured()) return;

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase!
        .from('users')
        .update({
          google_calendar_connected: false,
          google_refresh_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      set({ 
        user: { 
          ...user, 
          googleCalendarConnected: false,
          googleRefreshToken: undefined,
          updatedAt: new Date() 
        },
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to disconnect Google Calendar',
        isLoading: false 
      });
    }
  },

  // State Management Actions
  setUser: (user: FlowMotionUser | null) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false 
    });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper function to create user in Supabase after first sign-in
export const createUserInDatabase = async (userData: {
  id: string;
  email: string;
  name?: string;
  image?: string;
}): Promise<FlowMotionUser | null> => {
  if (!isSupabaseConfigured()) {
    // Return a local user object if Supabase not configured
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      image: userData.image,
      googleCalendarConnected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase!
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .single();

    if (existingUser) {
      // User exists, update their info
      const { data: updatedUser, error } = await supabase!
        .from('users')
        .update({
          name: userData.name,
          avatar_url: userData.image,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.avatar_url,
        googleCalendarConnected: updatedUser.google_calendar_connected,
        googleRefreshToken: updatedUser.google_refresh_token,
        createdAt: new Date(updatedUser.created_at),
        updatedAt: new Date(updatedUser.updated_at),
      };
    } else {
      // Create new user
      const { data: newUser, error } = await supabase!
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar_url: userData.image,
          google_calendar_connected: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        image: newUser.avatar_url,
        googleCalendarConnected: newUser.google_calendar_connected,
        googleRefreshToken: newUser.google_refresh_token,
        createdAt: new Date(newUser.created_at),
        updatedAt: new Date(newUser.updated_at),
      };
    }
  } catch (error) {
    console.error('Failed to create/update user in database:', error);
    return null;
  }
};