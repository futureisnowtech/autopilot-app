import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseTaskWithAI(input: string, context?: string) {
  const systemPrompt = `
    You are an elite Chief of Staff. Extract task fields from the input.
    Context: ${context || 'General task management'}
    
    Return STRICT JSON:
    {
      "title": "Clean, actionable title",
      "urgency": "Urgent|High|Low",
      "est_minutes": number,
      "client": "Name or null",
      "workstream": "Name or null",
      "notes": "Extra context",
      "status": "Ready|AI_Do"
    }
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function getExecutionPlan(task: any, styleGuide?: string) {
  const systemPrompt = `
    You are an AI Planner. Analyze the task and delivery preferences.
    Style Guide: ${styleGuide || 'None'}
    
    If the task is unclear or needs specific formatting info, add questions.
    
    Return STRICT JSON:
    {
      "questions": ["Question 1", "Question 2"],
      "output_format": "DOC|SHEET|TASK",
      "plan": "Short strategy"
    }
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(task) }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
