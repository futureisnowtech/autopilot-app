import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function parseTaskWithAI(input: string, context?: string, plan: string = 'free') {
  // Use Flash for free, Pro for paid
  const modelName = plan === 'free' ? "gemini-1.5-flash" : "gemini-1.5-pro";
  const model = genAI.getGenerativeModel({ model: modelName });

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
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}

export async function getExecutionPlan(task: any, styleGuide?: string, plan: string = 'free') {
  const modelName = plan === 'free' ? "gemini-1.5-flash" : "gemini-1.5-pro";
  const model = genAI.getGenerativeModel({ model: modelName });

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

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
}
