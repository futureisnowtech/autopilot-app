import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './supabase-config';

// This client has admin privileges and bypasses RLS.
// ONLY use this in server-side contexts (API routes, Server Actions).
// Lazy singleton — instantiated on first access to avoid build-time crashes
// when SUPABASE_SERVICE_ROLE_KEY is not set in the local environment.
let _supabaseAdmin: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      const { url, serviceKey } = getSupabaseConfig();
      if (!url || !serviceKey) {
        throw new Error(
          'CRITICAL: SUPABASE_SERVICE_ROLE_KEY or URL is missing. Set it in your environment variables.'
        );
      }
      _supabaseAdmin = createClient(url, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    const value = (_supabaseAdmin as any)[prop];
    return typeof value === 'function' ? value.bind(_supabaseAdmin) : value;
  },
});

