import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseTaskWithAI, getExecutionPlan } from '@/lib/ai';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { pushToGoogleCalendar, findAvailableSlot } from '@/lib/calendar';

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

    const userId = session.user.id;
    const body = await req.json();
    const { title, notes, image_base64_list, answer } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // 0. Fetch Profile & Style Guide in parallel for faster intake
    const [{ data: profile }, { data: styleGuide }] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('plan_type, credits, google_calendar_id, google_refresh_token, timezone, settings')
        .eq('id', userId)
        .single(),
      supabaseAdmin
        .from('style_guides')
        .select('learned_rules')
        .eq('user_id', userId)
        .single(),
    ]);

    if (!profile || profile.credits <= 0) {
      return NextResponse.json({ error: 'Insufficient credits. Please upgrade.' }, { status: 403 });
    }
    
    const styleContext = styleGuide?.learned_rules?.join('\n') || '';

    // 1. AI Parsing & Enrichment with Style Guide context
    const parsedTask = await parseTaskWithAI(
      title + (notes ? `\nNotes: ${notes}` : ''),
      styleContext,
      profile.plan_type
    );

    // Preserve the raw user input and compose structured notes
    const originalInput = title + (notes ? `\nNotes: ${notes}` : '');
    const aiBullets = parsedTask.ai_bullets || [];
    const structuredNotes = [
      `📝 Original: ${originalInput}`,
      '',
      ...(aiBullets.length > 0 ? [
        '🤖 AI Insights:',
        ...aiBullets.map((b: string) => `• ${b}`),
      ] : []),
      ...(parsedTask.notes ? ['', `📋 Context: ${parsedTask.notes}`] : []),
    ].join('\n');
    parsedTask.notes = structuredNotes;

    // 1.1 Resolve Space & Project IDs
    let spaceId = null;
    let projectId = null;

    if (parsedTask.space_name) {
      // Find or Create Space
      const { data: spaceData } = await supabaseAdmin
        .from('spaces')
        .select('id')
        .ilike('name', parsedTask.space_name)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (spaceData) {
        spaceId = spaceData.id;
      } else {
        const { data: newSpace } = await supabaseAdmin
          .from('spaces')
          .insert([{ name: parsedTask.space_name, user_id: userId }])
          .select()
          .single();
        if (newSpace) spaceId = newSpace.id;
      }

      if (spaceId && parsedTask.project_name) {
        // Find or Create Project within Space
        const { data: projData } = await supabaseAdmin
          .from('projects')
          .select('id')
          .ilike('name', parsedTask.project_name)
          .eq('space_id', spaceId)
          .maybeSingle();
        
        if (projData) {
          projectId = projData.id;
        } else {
          const { data: newProj } = await supabaseAdmin
            .from('projects')
            .insert([{ name: parsedTask.project_name, space_id: spaceId, user_id: userId }])
            .select()
            .single();
          if (newProj) projectId = newProj.id;
        }
      }
    }

    // 2. Multi-image handling (Real Storage Upload)
    const uploadedImages: string[] = [];
    if (image_base64_list && image_base64_list.length > 0) {
      for (let i = 0; i < image_base64_list.length; i++) {
        const base64Data = image_base64_list[i].replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${userId}/${Date.now()}-${i}.png`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('task-attachments')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (!uploadError && uploadData) {
          uploadedImages.push(uploadData.path);
        }
      }
      parsedTask.notes = (parsedTask.notes || '') + `\n\n[${uploadedImages.length} image(s) uploaded to storage]`;
    }

    // 3. Interactive Prompting Loop
    if (parsedTask.status === 'AI_Do') {
      const plan = await getExecutionPlan(parsedTask, styleContext, profile.plan_type);
      
      // If AI has questions and user hasn't provided an answer yet
      if (plan.questions && plan.questions.length > 0 && !answer) {
        // Set status to Needs-info if we're waiting
        parsedTask.status = 'Needs-info';
        
        // Save the partial task first so we don't lose it
        const { data: taskData } = await supabaseAdmin
          .from('tasks')
          .insert([{
            title: parsedTask.title,
            urgency: parsedTask.urgency,
            est_minutes: parsedTask.est_minutes,
            space_id: spaceId,
            project_id: projectId,
            assignee_label: parsedTask.assignee_label,
            scheduled_start: parsedTask.scheduled_start,
            scheduled_end: parsedTask.scheduled_end,
            notes: parsedTask.notes + `\n\nPENDING QUESTION: ${plan.questions[0]}`,
            status: 'Needs-info',
            user_id: userId
          }])
          .select()
          .single();

        return NextResponse.json({
          interactive: true,
          taskId: taskData?.id,
          question: plan.questions[0],
          message: 'The AI DO agent needs more context.'
        });
      }

      // Append answer to notes if provided
      if (answer) {
        parsedTask.notes = (parsedTask.notes || '') + `\n\nUser Answer: ${answer}`;
      }
    }

    // 3.1 Automatically schedule task if no time is specified and calendar is linked
    let scheduledStart = parsedTask.scheduled_start;
    let scheduledEnd = parsedTask.scheduled_end;
    let finalStatus = parsedTask.status;

    if (!scheduledStart && parsedTask.status !== 'AI_Do' && (profile.google_calendar_id || profile.google_refresh_token)) {
      const slot = await findAvailableSlot(
        profile.google_calendar_id || 'primary',
        parsedTask.est_minutes || 30,
        parsedTask.urgency || 'Low',
        profile.timezone || 'America/New_York',
        {
          primary_window: profile.settings?.primary_window || '09:00-17:00',
          overflow_window: profile.settings?.overflow_window || '20:00-22:00',
          work_weekends: profile.settings?.work_weekends || false
        },
        profile.google_refresh_token
      );
      scheduledStart = slot.start.toISOString();
      scheduledEnd = slot.end.toISOString();
      finalStatus = 'Scheduled';
    } else if (scheduledStart) {
      finalStatus = 'Scheduled';
    }

    // 3.2 Sync directly with Google Calendar
    let calendarEventId = null;
    let calendarSynced = false;

    if (scheduledStart && (profile.google_calendar_id || profile.google_refresh_token)) {
      const calendarSync = await pushToGoogleCalendar(
        profile.google_calendar_id || 'primary',
        parsedTask.title,
        parsedTask.notes || '',
        scheduledStart,
        scheduledEnd,
        profile.google_refresh_token
      );
      if (calendarSync.success && calendarSync.eventId) {
        calendarEventId = calendarSync.eventId;
        calendarSynced = true;
      }
    }

    // 4. Save to Supabase (Now using real userId and Admin client)
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert([
        {
          title: parsedTask.title,
          urgency: parsedTask.urgency,
          est_minutes: parsedTask.est_minutes,
          space_id: spaceId,
          project_id: projectId,
          assignee_label: parsedTask.assignee_label,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          notes: parsedTask.notes,
          status: finalStatus,
          user_id: userId,
          calendar_event_id: calendarEventId
        }
      ])
      .select()
      .single();

    if (taskError) throw taskError;

    // 5. Link attachments
    if (uploadedImages.length > 0 && task) {
      const attachmentRecords = uploadedImages.map(path => ({
        task_id: task.id,
        storage_path: path,
        file_type: 'image/png'
      }));
      await supabaseAdmin.from('task_attachments').insert(attachmentRecords);
    }

    return NextResponse.json({
      success: true,
      message: `Task captured: ${parsedTask.title}`,
      task: task,
      calendar_synced: calendarSynced
    });

  } catch (err: any) {
    console.error('Intake Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
