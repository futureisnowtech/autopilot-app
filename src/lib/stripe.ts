import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not defined in environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'TaskMinder Executive Assistant',
    version: '1.0.0',
  },
});

export const PLANS = {
  pro: {
    name: 'God Mode',
    priceId: process.env.STRIPE_PRICE_PRO || 'price_god_mode_monthly',
    amount: 2900, // $29.00 / month
    interval: 'month',
    unlimited: true,
  },
};

export const CREDIT_PACKAGES: Record<string, { name: string; credits: number; priceId: string; amount: number }> = {
  topup_50: {
    name: '50 AI Credits Pack',
    credits: 50,
    priceId: process.env.STRIPE_PRICE_TOPUP_50 || 'price_topup_50',
    amount: 1000, // $10.00
  },
};
