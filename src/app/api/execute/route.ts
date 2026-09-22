import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-errors';
import { executeAiDoTask } from '@/lib/executor';
import { getSupabaseConfig } from '@/lib/supabase-config';

// This route runs a model call, which the shared Gemini budget caps at
// ~30s. Without an explicit limit the platform default can be shorter,
// killing the function mid-flight so the browser gets no response at all.
export const maxDuration = 60;

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

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const result = await executeAiDoTask(taskId);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'AI Execution complete' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (err: any) {
    return errorResponse('Execute', err);
  }
}
