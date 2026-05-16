import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // 1. Fetch user tasks that are scheduled
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .not('scheduled_start', 'is', null);

    if (error) throw error;

    // 2. Generate iCal format
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Autopilot AI//Task Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Autopilot Tasks',
      'X-WR-TIMEZONE:UTC'
    ].join('\r\n');

    tasks?.forEach((task) => {
      const start = new Date(task.scheduled_start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(task.scheduled_end || new Date(task.scheduled_start).getTime() + 30 * 60000)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';

      icalContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${task.id}`,
        `DTSTAMP:${start}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${task.title}`,
        `DESCRIPTION:${task.notes?.replace(/\n/g, '\\n') || ''}`,
        'END:VEVENT'
      ].join('\r\n');
    });

    icalContent += '\r\nEND:VCALENDAR';

    // 3. Return as .ics file
    return new Response(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="autopilot-tasks.ics"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
