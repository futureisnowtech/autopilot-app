import { NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gemini = process.env.GEMINI_API_KEY;

  const sanitized = getSupabaseConfig();

  return NextResponse.json({
    raw: {
      url: {
        exists: !!url,
        length: url?.length || 0,
        startsWithHttps: url?.startsWith('https://') || false,
        hasTrailingSlash: url?.endsWith('/') || false,
        hasLeadingSpace: url?.startsWith(' ') || false,
        hasTrailingSpace: url?.endsWith(' ') || false,
        hasQuotes: url?.includes('"') || url?.includes("'") || false,
      },
      anonKey: {
        exists: !!anon,
        length: anon?.length || 0,
        hasLeadingSpace: anon?.startsWith(' ') || false,
        hasTrailingSpace: anon?.endsWith(' ') || false,
        hasQuotes: anon?.includes('"') || anon?.includes("'") || false,
      }
    },
    sanitized: {
      url: sanitized.url,
      urlLength: sanitized.url.length,
      anonKeyLength: sanitized.anonKey.length,
      serviceKeyLength: sanitized.serviceKey.length,
    },
    geminiKey: {
      exists: !!gemini,
      length: gemini?.length || 0,
    }
  });
}
