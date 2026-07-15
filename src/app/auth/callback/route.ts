import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * OAuth / calendar-link callback.
 *
 * Both the onboarding flow and the dashboard "Setup Sync" modal redirect here
 * after the Google consent screen. Previously this route swallowed every
 * failure and always redirected to /dashboard, so a failed link looked
 * identical to success ("as if I never clicked it"). We now surface the real
 * reason via ?sync_error= and route the user back to the right place.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const provider = requestUrl.searchParams.get('provider');

  // Google / Supabase report consent + linking failures as query params on the
  // return URL (e.g. access_denied, identity_already_exists). Surface them.
  const oauthError =
    requestUrl.searchParams.get('error_description') ||
    requestUrl.searchParams.get('error');

  // Helper: build an absolute redirect that preserves the deployed origin.
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, requestUrl.origin));

  if (oauthError) {
    console.error('OAuth callback error param:', oauthError);
    return redirectTo(`/dashboard?sync_error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return redirectTo('/dashboard?sync_error=missing_code');
  }

  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
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
  });

  // Exchange the code for a real session (sets the auth cookies).
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data?.session) {
    const msg = exchangeError?.message || 'no_session_after_exchange';
    console.error('exchangeCodeForSession failed:', msg);
    return redirectTo(`/dashboard?sync_error=${encodeURIComponent(msg)}`);
  }

  const userId = data.session.user.id;

  // Determine where to send the user back to. New users mid-onboarding must go
  // back to onboarding (not /dashboard, which would bounce them and reset the
  // wizard to step 1).
  let onboardingCompleted = true;
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();
    onboardingCompleted = !!profile?.onboarding_completed;
  } catch (e) {
    console.error('Failed to read onboarding status:', e);
  }

  const destination = onboardingCompleted ? '/dashboard' : '/dashboard/onboarding';

  if (provider === 'google') {
    const refreshToken = data.session.provider_refresh_token;
    const userEmail = data.session.user.email;

    // Without a refresh token we cannot push events to the calendar later, so
    // we must NOT mark the account as connected (google_calendar_id stays
    // unset — that's the signal the rest of the app keys off). This happens
    // when Google skips re-consent for an already-authorized account; the user
    // needs to retry (we force prompt=consent, which normally fixes it).
    if (!refreshToken) {
      console.error('OAuth succeeded but no provider_refresh_token returned for', userId);
      await supabaseAdmin
        .from('profiles')
        .update({ calendar_email: userEmail })
        .eq('id', userId);
      return redirectTo(`${destination}?sync_warning=no_refresh_token`);
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        calendar_provider: 'google',
        calendar_email: userEmail,
        google_calendar_id: 'primary',
        google_refresh_token: refreshToken,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update failed:', updateError);
      return redirectTo(
        `${destination}?sync_error=${encodeURIComponent(updateError.message)}`
      );
    }
  }

  return redirectTo(`${destination}?sync=success`);
}
