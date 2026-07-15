import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const FREE_PLAN_MONTHLY_CREDITS = 10;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ credits: FREE_PLAN_MONTHLY_CREDITS })
      .eq('plan_type', 'free')
      .select('id');

    if (error) throw error;

    return NextResponse.json({ success: true, resetCount: data?.length ?? 0 });
  } catch (err: any) {
    console.error('Credit Reset Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
