/**
 * Shared utility to sanitize Supabase environment variables.
 * This prevents common Vercel configuration errors from breaking the app.
 */
export function getSupabaseConfig() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

  // Remove accidental quotes from Vercel paste
  url = url.replace(/^["']|["']$/g, '');
  anonKey = anonKey.replace(/^["']|["']$/g, '');
  serviceKey = serviceKey.replace(/^["']|["']$/g, '');

  if (serviceKey === 'placeholder_until_provided') {
    serviceKey = '';
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is still a placeholder. Admin operations will fail.');
  }

  // Remove common malformed suffixes like /rest/v1 or trailing slashes
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/$/, '');

  if (!url || !anonKey) {
    console.error('CRITICAL: Supabase Configuration Missing URL or Anon Key');
  }

  return { url, anonKey, serviceKey };
}
