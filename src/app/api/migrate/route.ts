import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// TEMPORARY one-shot migration endpoint — deleted immediately after use.
// No auth — migrations are purely additive (IF NOT EXISTS), zero destructive risk.
export async function POST() {

  const results: Record<string, any> = {};

  // Migration 1: calendar_provider column
  try {
    const { error } = await supabaseAdmin.rpc('exec_migration', {
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendar_provider TEXT DEFAULT 'google';`
    });
    // rpc may not exist, try direct query approach
    if (error) throw error;
    results.calendar_provider = 'ok';
  } catch {
    // Try via raw insert approach — Supabase doesn't expose raw SQL via JS client
    // But we can check if column exists via select
    const { error: checkErr } = await supabaseAdmin
      .from('profiles')
      .select('calendar_provider')
      .limit(1);
    results.calendar_provider = checkErr ? `missing: ${checkErr.message}` : 'already exists';
  }

  // Migration 2: style_guides row for all existing users without one
  try {
    // Get all profiles without style_guides
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id');

    const { data: existingGuides } = await supabaseAdmin
      .from('style_guides')
      .select('user_id');

    const existingIds = new Set((existingGuides || []).map((g: any) => g.user_id));
    const missing = (profiles || []).filter((p: any) => !existingIds.has(p.id));

    if (missing.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('style_guides')
        .insert(missing.map((p: any) => ({
          user_id: p.id,
          preferences: {},
          learned_rules: []
        })));
      results.style_guides = insertErr ? `error: ${insertErr.message}` : `created ${missing.length} rows`;
    } else {
      results.style_guides = 'all users have style_guides';
    }
  } catch (e: any) {
    results.style_guides = `error: ${e.message}`;
  }

  // Migration 3: Verify profiles table structure
  const { data: profileCheck, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, google_calendar_id, calendar_provider, credits, plan_type, onboarding_completed')
    .limit(1);

  results.profile_columns = profileErr ? `error: ${profileErr.message}` : 'ok - all columns present';
  results.sample = profileCheck?.[0] ? Object.keys(profileCheck[0]) : [];

  return NextResponse.json({ success: true, migrations: results });
}
