import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { stripe, PLANS, CREDIT_PACKAGES } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig();
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
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
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'pro'; // 'pro' for subscription or 'topup' for 50 credits

    // 1. Fetch User Profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 2. Ensure Stripe Customer ID exists
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || session.user.email,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // 3. One-click Subscription Checkout (God Mode $29/mo)
    if (action === 'pro') {
      const plan = PLANS.pro;
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'God Mode Subscription',
                description: 'Unlimited AI Credits, Gemini 1.5 Pro Brain, Instant Execution, Priority Memory',
              },
              unit_amount: plan.amount,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          planType: 'pro',
        },
        success_url: `${origin}/dashboard/billing?success=true&plan=pro&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/billing?canceled=true`,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    // 4. One-click Credit Refill Checkout (50 Credits for $10)
    if (action === 'topup') {
      const pkg = CREDIT_PACKAGES.topup_50;
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: '50 AI Credits Refill',
                description: 'Instant top-up of 50 AI credits for TaskMinder task execution.',
              },
              unit_amount: pkg.amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          creditPackage: 'topup_50',
          credits: '50',
        },
        success_url: `${origin}/dashboard/billing?success=true&topup=true&credits=50&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/billing?canceled=true`,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
