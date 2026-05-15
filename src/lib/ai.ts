import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function parseTaskWithAI(input: string, context?: string, plan: string = 'free') {
  if (plan === 'free') {
    return parseWithGemini(input, context);
  }
  
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

async function parseWithGemini(input: string, context?: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an elite Chief of Staff. Extract task fields from the input.
    Context: ${context || 'General task management'}
    
    Input: ${input}

    Return ONLY a JSON object with this structure:
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

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Basic clean up in case Gemini adds markdown blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}

export async function getExecutionPlan(task: any, styleGuide?: string, plan: string = 'free') {
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

  if (plan === 'free') {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(systemPrompt + "\n\nTask: " + JSON.stringify(task));
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
  }

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
