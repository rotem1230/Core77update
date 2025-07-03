import { createClient } from '@supabase/supabase-js';

// 🔧 Supabase Configuration
// Using the new Supabase project details provided by the user

const SUPABASE_URL = 'https://ylqfgcgjkdmurcnhgaqg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscWZnY2dqa2RtdXJjbmhnYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDQzMzAsImV4cCI6MjA2NzA4MDMzMH0.drqeF0ghDdMnive1y9e5y0wpF7PZm8YZRGDlc-Fsm_0';

// Check if Supabase is configured
export const isSupabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (isSupabaseReady) {
  console.log('✅ Supabase configured successfully!');
} else {
  console.warn('⚠️ Supabase not configured - missing configuration');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: true
  }
});

// Types for our database schema
// Note: The profiles table is optional and needs to be created manually
// See SUPABASE_SETUP.md for instructions on how to set it up
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  profile?: Profile;
} 