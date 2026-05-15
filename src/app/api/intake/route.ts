import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseTaskWithAI, getExecutionPlan } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
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

    // 0. Fetch Profile & Style Guide for context
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan_type, credits')
      .eq('id', userId)
      .single();

    if (!profile || profile.credits <= 0) {
      return NextResponse.json({ error: 'Insufficient credits. Please upgrade.' }, { status: 403 });
    }

    const { data: styleGuide } = await supabaseAdmin
      .from('style_guides')
      .select('learned_rules')
      .eq('user_id', userId)
      .single();
    
    const styleContext = styleGuide?.learned_rules?.join('\n') || '';

    // 1. AI Parsing & Enrichment with Style Guide context
    const parsedTask = await parseTaskWithAI(
      title + (notes ? `\nNotes: ${notes}` : ''),
      styleContext,
      profile.plan_type
    );

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
      parsedTask.notes = (parsedTask.notes || '') + `\n[${uploadedImages.length} image(s) uploaded to storage]`;
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
            client: parsedTask.client,
            workstream: parsedTask.workstream,
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

    // 4. Save to Supabase (Now using real userId and Admin client)
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert([
        {
          title: parsedTask.title,
          urgency: parsedTask.urgency,
          est_minutes: parsedTask.est_minutes,
          client: parsedTask.client,
          workstream: parsedTask.workstream,
          notes: parsedTask.notes,
          status: parsedTask.status,
          user_id: userId
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
      task: task
    });

  } catch (err: any) {
    console.error('Intake Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
