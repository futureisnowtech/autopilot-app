import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  return NextResponse.json({
    serviceEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Service account email not configured'
  });
}

export async function POST(request: Request) {
  try {
    const { calendarId } = await request.json(); // the user's email address
    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar email is required' }, { status: 400 });
    }

    // Verify user is logged in
    const { url, anonKey } = getSupabaseConfig();
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        calendar_provider: 'google',
        calendar_email: calendarId,
        google_calendar_id: calendarId, // Service Account will push specifically to this email
      })
      .eq('id', session.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, calendarId }, { status: 200 });
  } catch (err: any) {
    console.error('Service Account link error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
