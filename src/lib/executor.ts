import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from './supabase-admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * The primary execution engine for AI DO tasks.
 * Performs research and generates deliverables based on the Style Guide.
 */
export async function executeAiDoTask(taskId: string) {
  try {
    // 1. Fetch Task, Profile (for plan/credits), and Style Guide
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*, profiles(id, plan_type, credits, timezone, settings)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) throw new Error('Task not found');
    const profile = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles;

    if (!profile || profile.credits <= 0) {
      throw new Error('Insufficient credits. Please upgrade or top up.');
    }

    const { data: styleGuide } = await supabaseAdmin
      .from('style_guides')
      .select('*')
      .eq('user_id', task.user_id)
      .single();

    // 2. Prepare context
    const learnedRules = styleGuide?.learned_rules.join('\n') || 'None';
    const prompt = `
      You are an elite executive assistant focused on precision and excellence. 
      Your goal is to deliver a perfect document, sheet, or note based on the user's task.
      
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

    // 3. Execution (Gemini for all, Pro for Paid)
    const modelName = profile.plan_type === 'free' ? "gemini-2.5-flash" : "gemini-2.5-pro";
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const output = result.response.text();

    // 4. Update task and deduct credit
    const { error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({
        notes: (task.notes ? task.notes + '\n\n' : '') + '-- AI DELIVERABLE --\n' + output,
        status: 'Review',
        ai_reason: (task.ai_reason ? task.ai_reason + ' | ' : '') + 'ai_executed=' + new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) throw updateError;

    // Deduct 1 credit
    await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', profile.id);

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

    const prompt = `
      You are a senior operator. Analyze this completed task and the user's feedback.
      Distill ONE specific delivery preference or "lesson learned" about how the user likes things delivered.
      
      TASK: ${task.title}
      FEEDBACK: ${task.feedback}
      
      Example: "Josh prefers competitive analyses to focus on pricing models over feature lists."
      Keep it to 1 sentence.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const learning = result.response.text().trim();

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
