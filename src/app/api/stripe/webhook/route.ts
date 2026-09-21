import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      // Never trust an unsigned event: without this, anyone who finds the
      // endpoint can POST a fake checkout.session.completed and grant
      // themselves free credits/subscription. Only local dev without the
      // secret configured is expected to hit this.
      if (process.env.NODE_ENV === 'production') {
        console.error('STRIPE_WEBHOOK_SECRET is not set — refusing to process webhook in production.');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
      }
      console.warn('STRIPE_WEBHOOK_SECRET is not set. Processing event without signature check (dev only).');
      event = JSON.parse(body) as Stripe.Event;
    } else if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    } else {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    }
  } catch (err: any) {
    console.error(`Webhook Signature Verification Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        const creditAmount = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : null;

        if (!userId) {
          console.warn('Checkout session missing userId metadata:', session.id);
          break;
        }

        if (session.mode === 'payment' && creditAmount) {
          // One-time credit top-up purchase via atomic RPC
          const { error: rpcError } = await supabaseAdmin.rpc('add_credits', {
            p_user_id: userId,
            p_amount: creditAmount,
            p_description: `Stripe Top-Up: ${creditAmount} Credits`,
            p_session_id: session.id,
          });

          if (rpcError) {
            console.error('Failed to add credits via RPC:', rpcError);
          } else {
            console.log(`Successfully added ${creditAmount} credits to user ${userId}`);
          }
        } else if (session.mode === 'subscription' && planType) {
          // Subscription activation
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              plan_type: planType,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Failed to update user profile for subscription:', updateError);
          } else {
            console.log(`User ${userId} upgraded to ${planType} subscription`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

        const { error: cancelError } = await supabaseAdmin
          .from('profiles')
          .update({
            plan_type: 'free',
            subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', customerId);

        if (cancelError) {
          console.error('Failed to update canceled subscription status:', cancelError);
        } else {
          console.log(`Subscription canceled for Stripe customer ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        const status = subscription.status;

        await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: status })
          .eq('stripe_customer_id', customerId);

        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook Handling Internal Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
