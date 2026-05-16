import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseConfig } from './supabase-config';

const { url, anonKey } = getSupabaseConfig();

/**
 * Shared Supabase client for client-side usage.
 * Uses createBrowserClient to automatically synchronize session with cookies,
 * ensuring compatibility with Next.js Middleware.
 */
export const supabase = createBrowserClient(url, anonKey);
