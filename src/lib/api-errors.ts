import { NextResponse } from 'next/server';
import { ModelsUnavailableError } from './gemini';

/**
 * Turns a thrown error into a response that is safe to hand a user.
 *
 * Routes used to return `err.message` verbatim, which meant an upstream
 * failure surfaced in the UI as something like:
 *
 *   "[GoogleGenerativeAI Error]: Error fetching from
 *    https://generativelanguage.googleapis.com/v1beta/models/
 *    gemini-2.5-flash-lite:generateContent: [404 Not Found] ..."
 *
 * That tells the user nothing actionable, and needlessly discloses which
 * provider and model the backend runs on. The full error still goes to the
 * server log, where it is actually useful.
 *
 * @param context short label for the log line, e.g. 'Intake'
 */
export function errorResponse(context: string, err: any): NextResponse {
  if (err instanceof ModelsUnavailableError) {
    console.error(`${context} — models unavailable:`, err.detail);
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  console.error(`${context} Error:`, err);

  // Anything we did not explicitly classify gets a generic message. Leaking
  // the raw text is how provider internals reached the UI in the first place.
  return NextResponse.json(
    { error: 'Something went wrong on our end. Please try again.' },
    { status: 500 },
  );
}
