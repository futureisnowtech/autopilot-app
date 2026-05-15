import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { executeAiDoTask } from '@/lib/executor';

export async function GET(req: Request) {
  try {
    // 1. Security Check (Optional: can be bypassed if you don't care about public triggers, 
    // but recommended to check for Vercel Cron header or a secret key)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all tasks that are ready for AI Execution
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('status', 'AI_Do');

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ success: true, message: 'No tasks to execute' });
    }

    // 3. Execute tasks (In parallel or sequence? Let's do sequence to avoid rate limits for now)
    const results = [];
    for (const task of tasks) {
      const result = await executeAiDoTask(task.id);
      results.push({ taskId: task.id, ...result });
    }

    return NextResponse.json({ 
      success: true, 
      processedCount: tasks.length,
      results 
    });

  } catch (err: any) {
    console.error('Global Execution Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
