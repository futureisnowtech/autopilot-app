import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './supabase-config';

const { url, anonKey } = getSupabaseConfig();

// For client-side usage
export const supabase = createClient(url, anonKey);
