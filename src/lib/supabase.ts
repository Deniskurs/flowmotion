/**
 * Supabase Configuration
 * 
 * Client setup for database operations and authentication
 * Used by: auth features, task storage, calendar sync
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Running in local-only mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface DatabaseTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  estimated_duration: number;
  deadline?: string;
  category: string;
  status: 'todo' | 'in-progress' | 'completed';
  created_at: string;
  updated_at: string;
  scheduled_start?: string;
  scheduled_end?: string;
  dependencies?: string[];
  is_flexible: boolean;
  google_event_id?: string;
  sync_to_calendar: boolean;
}

export interface DatabaseUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  google_calendar_connected: boolean;
  google_refresh_token?: string;
  created_at: string;
  updated_at: string;
}

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};