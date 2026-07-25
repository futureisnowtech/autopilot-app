import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { generateWithFallback } from '@/lib/gemini';
import { listUpcomingEvents, pushToGoogleCalendar, deleteFromGoogleCalendar, findAvailableSlot } from '@/lib/calendar';

async function getAuthenticatedUser() {
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
  return session;
}

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();

    // Branch: execute a confirmed action
    if (body.executeAction) {
      return await handleExecuteAction(userId, body.executeAction);
    }

    // Branch: answer a question (may also detect an action)
    const { question } = body;
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
      .select('id, title, status, urgency, scheduled_start, scheduled_end, due_date, notes, calendar_event_id')
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
      You are a helpful assistant that can BOTH answer questions about the user's
      schedule AND detect when they want to modify it.

      Be warm, concise, and organized. No markdown syntax (no #, no **, no bullet
      dashes needed) — just plain, clearly formatted text with line breaks.

      Current date/time: ${now.toISOString()}
      User's timezone: ${timezone}

      TASKS AUTOPILOT IS TRACKING (JSON):
      ${JSON.stringify(tasks || [])}

      CALENDAR EVENTS (JSON, includes things Autopilot did not create):
      ${JSON.stringify(calendarEvents)}

      USER'S REQUEST: ${question.trim()}

      INSTRUCTIONS:
      1. If the user is asking a QUESTION about their schedule, answer it naturally.
      2. If the user wants to MODIFY their schedule (move, reschedule, cancel,
         delete, update a task or event), respond with a helpful confirmation
         message AND include a JSON action block at the very end of your response
         in this exact format:

         ---ACTION---
         {"type": "reschedule"|"delete"|"update", "task_id": "uuid-if-known-or-null", "task_title": "matched title", "new_start": "ISO8601-or-null", "new_end": "ISO8601-or-null", "description": "human-readable summary of what will change"}
         ---END_ACTION---

         Match the task by finding the best title match from the tasks list.
         For reschedule: calculate the new ISO8601 times based on the user's
         request relative to the current time and timezone.
         For delete/cancel: set type to "delete".
         For title updates: set type to "update" and add "new_title" field.

      3. If you can't find a matching task, say so and don't include an action block.
      4. Only reference what's actually in the data. Don't invent tasks.
    `;

    const rawAnswer = await generateWithFallback(tier, prompt);

    // Parse out action block if present
    const actionMatch = rawAnswer.match(/---ACTION---\s*([\s\S]*?)\s*---END_ACTION---/);
    let action = null;
    let cleanAnswer = rawAnswer.trim();

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1].trim());
        cleanAnswer = rawAnswer.replace(/---ACTION---[\s\S]*?---END_ACTION---/, '').trim();
      } catch {
        // If JSON parse fails, just show the answer without action
      }
    }

    return NextResponse.json({ success: true, answer: cleanAnswer, action });
  } catch (err: any) {
    console.error('Ask About Calendar Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

async function handleExecuteAction(userId: string, action: any) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('google_calendar_id, google_refresh_token, timezone, settings')
    .eq('id', userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const calendarId = profile.google_calendar_id || 'primary';

  try {
    if (action.type === 'delete') {
      // Find the task
      const { data: task } = await supabaseAdmin
        .from('tasks')
        .select('id, calendar_event_id')
        .eq('user_id', userId)
        .eq('id', action.task_id)
        .single();

      if (!task) {
        // Try matching by title
        const { data: taskByTitle } = await supabaseAdmin
          .from('tasks')
          .select('id, calendar_event_id')
          .eq('user_id', userId)
          .ilike('title', `%${action.task_title}%`)
          .limit(1)
          .single();

        if (!taskByTitle) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (taskByTitle.calendar_event_id) {
          await deleteFromGoogleCalendar(calendarId, taskByTitle.calendar_event_id, profile.google_refresh_token);
        }
        await supabaseAdmin.from('tasks').delete().eq('id', taskByTitle.id);
      } else {
        if (task.calendar_event_id) {
          await deleteFromGoogleCalendar(calendarId, task.calendar_event_id, profile.google_refresh_token);
        }
        await supabaseAdmin.from('tasks').delete().eq('id', task.id);
      }

      return NextResponse.json({ success: true, answer: 'Task deleted and removed from calendar.' });

    } else if (action.type === 'reschedule') {
      // Find the task
      let task;
      if (action.task_id) {
        const { data } = await supabaseAdmin
          .from('tasks')
          .select('id, title, calendar_event_id, notes, est_minutes')
          .eq('user_id', userId)
          .eq('id', action.task_id)
          .single();
        task = data;
      }
      if (!task && action.task_title) {
        const { data } = await supabaseAdmin
          .from('tasks')
          .select('id, title, calendar_event_id, notes, est_minutes')
          .eq('user_id', userId)
          .ilike('title', `%${action.task_title}%`)
          .limit(1)
          .single();
        task = data;
      }

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const newStart = action.new_start;
      const newEnd = action.new_end || new Date(new Date(newStart).getTime() + (task.est_minutes || 30) * 60000).toISOString();

      // Delete old calendar event if exists
      if (task.calendar_event_id) {
        await deleteFromGoogleCalendar(calendarId, task.calendar_event_id, profile.google_refresh_token);
      }

      // Create new calendar event
      let newEventId = null;
      if (profile.google_calendar_id || profile.google_refresh_token) {
        const calResult = await pushToGoogleCalendar(
          calendarId,
          task.title,
          task.notes || '',
          newStart,
          newEnd,
          profile.google_refresh_token
        );
        if (calResult.success) newEventId = calResult.eventId;
      }

      // Update task in database
      await supabaseAdmin
        .from('tasks')
        .update({
          scheduled_start: newStart,
          scheduled_end: newEnd,
          calendar_event_id: newEventId,
          status: 'Scheduled',
        })
        .eq('id', task.id);

      const when = new Date(newStart).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        timeZone: profile.timezone || 'America/New_York',
      });

      return NextResponse.json({
        success: true,
        answer: `"${task.title}" has been rescheduled to ${when}. Calendar updated.`,
      });

    } else if (action.type === 'update') {
      let task;
      if (action.task_id) {
        const { data } = await supabaseAdmin
          .from('tasks')
          .select('id, title')
          .eq('user_id', userId)
          .eq('id', action.task_id)
          .single();
        task = data;
      }
      if (!task && action.task_title) {
        const { data } = await supabaseAdmin
          .from('tasks')
          .select('id, title')
          .eq('user_id', userId)
          .ilike('title', `%${action.task_title}%`)
          .limit(1)
          .single();
        task = data;
      }

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const updateFields: any = {};
      if (action.new_title) updateFields.title = action.new_title;

      await supabaseAdmin.from('tasks').update(updateFields).eq('id', task.id);

      return NextResponse.json({
        success: true,
        answer: `Task updated successfully.`,
      });
    }

    return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
  } catch (err: any) {
    console.error('Execute Action Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to execute action' }, { status: 500 });
  }
}
