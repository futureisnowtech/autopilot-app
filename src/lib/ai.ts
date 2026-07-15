import { generateWithFallback } from "./gemini";

export async function parseTaskWithAI(input: string, context?: string, plan: string = 'free') {
  // Use Flash for free, Pro for paid
  const tier = plan === 'free' ? 'flash' : 'pro';

  const prompt = `
    You are an elite Chief of Staff. Extract task fields from the input.
    Context: ${context || 'General task management'}
    Reference Time (Current): ${new Date().toISOString()}
    
    Input: ${input}

    Return ONLY a JSON object with this structure:
    {
      "title": "Clean, actionable title",
      "urgency": "Urgent|High|Low",
      "est_minutes": number,
      "space_name": "Name of the workspace/client (e.g. TAG Targets, RaketRank, Personal)",
      "project_name": "Specific project name if mentioned",
      "assignee_label": "Name of person assigned (e.g. Syed, Theo) or null",
      "scheduled_start": "ISO8601 string if a specific time is mentioned, otherwise null",
      "scheduled_end": "ISO8601 string if duration is known, otherwise null",
      "notes": "Extra context",
      "status": "Ready|AI_Do"
    }
  `;

  const text = await generateWithFallback(tier, prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}

export async function getExecutionPlan(task: any, styleGuide?: string, plan: string = 'free') {
  const tier = plan === 'free' ? 'flash' : 'pro';

  const prompt = `
    You are an AI Planner. Analyze the task and delivery preferences.
    Style Guide: ${styleGuide || 'None'}
    
    If the task is unclear or needs specific formatting info, add questions.
    
    Task: ${JSON.stringify(task)}

    Return STRICT JSON:
    {
      "questions": ["Question 1", "Question 2"],
      "output_format": "DOC|SHEET|TASK",
      "plan": "Short strategy"
    }
  `;

  const text = await generateWithFallback(tier, prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}
