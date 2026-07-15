import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { generateWithFallback } from '@/lib/gemini';
import { listUpcomingEvents } from '@/lib/calendar';

export async function POST(req: Request) {
  try {
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
    const userId = session.user.id;

    const { question } = await req.json();
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'A question is required' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan_type, timezone, google_calendar_id, google_refresh_token')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const timezone = profile.timezone || 'America/New_York';
    const now = new Date();

    // Our own tasks are the source of truth for anything Autopilot scheduled
    // or is still holding onto (backlog, needs-info, etc).
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('title, status, urgency, scheduled_start, scheduled_end, due_date, notes')
      .eq('user_id', userId)
      .neq('status', 'Done')
      .order('scheduled_start', { ascending: true, nullsFirst: false })
      .limit(50);

    // Real calendar events too (meetings, invites) so the answer reflects the
    // whole calendar, not just what Autopilot itself put there.
    const calendarEvents = profile.google_calendar_id || profile.google_refresh_token
      ? await listUpcomingEvents(
          profile.google_calendar_id || 'primary',
          14,
          profile.google_refresh_token
        )
      : [];

    const tier = profile.plan_type === 'free' ? 'flash' : 'pro';

    const prompt = `
      You are a helpful assistant answering a plain-language question about the
      user's schedule. Be warm, concise, and organized into short labeled
      sections when it helps (e.g. "Today:", "Tomorrow:", "This week:") — but
      don't force sections if the question doesn't call for them. No markdown
      syntax (no #, no **, no bullet dashes needed) — just plain, clearly
      formatted text with line breaks.

      Only reference what's actually in the data below. If nothing matches the
      question, say so plainly rather than guessing or inventing anything.

      Current date/time: ${now.toISOString()}
      User's timezone: ${timezone}

      TASKS AUTOPILOT IS TRACKING (JSON):
      ${JSON.stringify(tasks || [])}

      CALENDAR EVENTS (JSON, includes things Autopilot did not create):
      ${JSON.stringify(calendarEvents)}

      USER'S QUESTION: ${question.trim()}
    `;

    const answer = await generateWithFallback(tier, prompt);

    return NextResponse.json({ success: true, answer: answer.trim() });
  } catch (err: any) {
    console.error('Ask About Calendar Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
