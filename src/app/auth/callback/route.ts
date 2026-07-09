import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const provider = requestUrl.searchParams.get('provider');

  if (code) {
    const { url, anonKey } = getSupabaseConfig();
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      url,
      anonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Exchange the code for a real session (sets the cookies)
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.session && provider === 'google') {
      const refreshToken = data.session.provider_refresh_token;
      const userEmail = data.session.user.email;

      const updatePayload: Record<string, any> = {
        calendar_provider: 'google',
        calendar_email: userEmail,
        google_calendar_id: 'primary'
      };

      if (refreshToken) {
        updatePayload.google_refresh_token = refreshToken;
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', data.session.user.id);

      if (error) {
        console.error('Profile update failed:', error);
      }
    }
  }

  // URL to redirect to after sign in process completes
  // Add cache-busting to force dashboard to refetch profile
  return NextResponse.redirect(new URL('/dashboard?t=' + Date.now(), request.url));
}
