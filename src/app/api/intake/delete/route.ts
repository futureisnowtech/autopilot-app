import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { deleteFromGoogleCalendar } from '@/lib/calendar';

export async function POST(req: Request) {
  try {
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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // 1. Fetch task details
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 2. Fetch user profile for Google Calendar ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('google_calendar_id, google_refresh_token')
      .eq('id', session.user.id)
      .single();

    // 3. Delete from Google Calendar if event exists
    if (task.calendar_event_id && (profile?.google_calendar_id || profile?.google_refresh_token)) {
      await deleteFromGoogleCalendar(
        profile.google_calendar_id || 'primary', 
        task.calendar_event_id, 
        profile.google_refresh_token
      );
    }

    // 4. Delete from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });

  } catch (err: any) {
    console.error('Delete Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
