import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gemini = process.env.GEMINI_API_KEY;

  return NextResponse.json({
    url: {
      exists: !!url,
      length: url?.length || 0,
      startsWithHttps: url?.startsWith('https://') || false,
      hasTrailingSlash: url?.endsWith('/') || false,
    },
    anonKey: {
      exists: !!anon,
      length: anon?.length || 0,
    },
    serviceKey: {
      exists: !!service,
      length: service?.length || 0,
    },
    geminiKey: {
      exists: !!gemini,
      length: gemini?.length || 0,
    }
  });
}
