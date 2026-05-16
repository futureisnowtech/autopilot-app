import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './supabase-config';

const { url, serviceKey } = getSupabaseConfig();

// This client has admin privileges and bypasses RLS.
// ONLY use this in server-side contexts (API routes, Server Actions).
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
