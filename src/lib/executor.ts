import OpenAI from 'openai';
import { supabaseAdmin } from './supabase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * The primary execution engine for AI DO tasks.
 * Performs research and generates deliverables based on the Style Guide.
 */
export async function executeAiDoTask(taskId: string) {
  try {
    // 1. Fetch Task and Style Guide using Admin Client
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*, profiles(timezone, settings)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) throw new Error('Task not found');

    const { data: styleGuide } = await supabaseAdmin
      .from('style_guides')
      .select('*')
      .eq('user_id', task.user_id)
      .single();

    // 2. Prepare context
    const learnedRules = styleGuide?.learned_rules.join('\n') || 'None';
    const systemPrompt = `
      You are an elite executive assistant focused on precision and excellence. 
      Your goal is to deliver a perfect document, sheet, or note based on the user's task.
    `;
      USER STYLE GUIDE & PREFERENCES:
      ${learnedRules}
      
      TONE: Executive, Concise, Data-Driven.
      
      TASK TITLE: ${task.title}
      CONTEXT: ${task.notes || 'No extra context provided.'}
      CLIENT: ${task.client || 'General'}
      
      Output ONLY the finished deliverable. No meta-prose like "Here is your report".
      If the user asked for a research report, be exhaustive but concise.
      Use Markdown for formatting.
    `;

    // 3. Execution (GPT-4o for high quality)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Execute the task now.' }
      ],
      temperature: 0.7,
    });

    const output = response.choices[0].message.content || '';

    // 4. Update task with deliverable
    const { error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({
        notes: (task.notes ? task.notes + '\n\n' : '') + '-- AI DELIVERABLE --\n' + output,
        status: 'Review',
        ai_reason: (task.ai_reason ? task.ai_reason + ' | ' : '') + 'ai_executed=' + new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) throw updateError;

    return { success: true, output };

  } catch (err: any) {
    console.error('AI DO Execution Error:', err);
    await supabaseAdmin.from('tasks').update({ status: 'Blocked', ai_reason: 'execution_failed: ' + err.message }).eq('id', taskId);
    return { success: false, error: err.message };
  }
}

/**
 * Distills delivery preferences from a completed task.
 */
export async function learnFromCompletedTask(taskId: string) {
  try {
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task || !task.feedback) return;

    const systemPrompt = `
      You are a senior operator. Analyze this completed task and the user's feedback.
      Distill ONE specific delivery preference or "lesson learned" about how the user likes things delivered.
      
      TASK: ${task.title}
      FEEDBACK: ${task.feedback}
      
      Example: "Josh prefers competitive analyses to focus on pricing models over feature lists."
      Keep it to 1 sentence.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }],
    });

    const learning = response.choices[0].message.content?.trim();

    if (learning) {
      const { data: styleGuide } = await supabaseAdmin
        .from('style_guides')
        .select('*')
        .eq('user_id', task.user_id)
        .single();

      if (styleGuide) {
        const updatedRules = [...styleGuide.learned_rules, learning];
        await supabaseAdmin.from('style_guides').update({ learned_rules: updatedRules }).eq('id', styleGuide.id);
      }
    }

  } catch (err) {
    console.error('Learning Error:', err);
  }
}
