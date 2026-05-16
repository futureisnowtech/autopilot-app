import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Read and sanitize directly from the server environment
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    // Remove quotes if present
    supabaseUrl = supabaseUrl?.replace(/^["']|["']$/g, '');
    supabaseKey = supabaseKey?.replace(/^["']|["']$/g, '');

    // Remove trailing slash from URL
    if (supabaseUrl?.endsWith('/')) {
      supabaseUrl = supabaseUrl.slice(0, -1);
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server is missing Supabase Environment Variables. Check Vercel Settings.', urlExists: !!supabaseUrl, keyExists: !!supabaseKey }, 
        { status: 500 }
      );
    }

    // Initialize an ephemeral client just to generate the OAuth URL
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data?.url) {
      // Redirect the user's browser to the Google Login page
      return NextResponse.redirect(data.url);
    }

    return NextResponse.json({ error: 'Failed to generate OAuth URL' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
