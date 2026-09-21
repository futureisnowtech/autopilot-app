'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Check, 
  ShieldCheck,
  Loader2,
  Settings,
  PlusCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { trackPurchase } from '@/lib/ad-conversions';

export default function BillingPage() {
  const [credits, setCredits] = useState<number>(0);
  const [planType, setPlanType] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, plan_type')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setCredits(profile.credits);
          setPlanType(profile.plan_type);
        }
      }
      setIsLoading(false);
    }

    fetchProfile();

    // Feedback parsing after returning from Stripe Checkout
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        const addedCredits = params.get('credits');
        // Values here mirror PLANS.pro.amount / CREDIT_PACKAGES.topup_50.amount
        // in src/lib/stripe.ts — update both together if pricing changes.
        if (addedCredits) {
          toast.success(`Success! 50 AI credits added to your account.`, { duration: 5000 });
          trackPurchase(10, 'credit_topup');
        } else {
          toast.success('Welcome to God Mode! Unlimited executions unlocked.', { duration: 5000 });
          trackPurchase(29, 'subscription');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('canceled') === 'true') {
        toast.info('Checkout canceled. No charges were made.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleCheckout = async (action: 'pro' | 'topup') => {
    try {
      setIsProcessing(action);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize checkout');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout Error:', err);
      toast.error('Checkout Error', { description: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsProcessing('portal');
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Portal Error:', err);
      toast.error('Portal Error', { description: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) return null;

  const isGodMode = ['pro', 'god-mode', 'scale'].includes(planType);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-2">Billing & Operational Scale</h1>
        <p className="text-lg text-slate-400 font-medium">Simple, transparent pricing for AI task automation.</p>
      </header>

      {/* Hero Status Banner */}
      <Card className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden mb-12 relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-32 h-32" />
        </div>
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3">
              Current Tier: {isGodMode ? 'God Mode' : 'Standard (Free)'}
            </Badge>
            <h2 className="text-3xl font-black mb-1">
              {isGodMode ? 'Unlimited AI Executions' : `${credits} AI Credits Remaining`}
            </h2>
            <p className="text-slate-400 text-sm">
              {isGodMode 
                ? 'Your God Mode subscription grants unlimited automated task execution.' 
                : '10 free credits refresh on the 1st of every month.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isGodMode && (
              <Button 
                onClick={() => handleCheckout('topup')} 
                disabled={isProcessing === 'topup'}
                className="h-14 px-6 bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl font-bold text-base"
              >
                {isProcessing === 'topup' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="mr-2 w-5 h-5" /> Buy 50 Credits ($10)
                  </>
                )}
              </Button>
            )}

            {isGodMode ? (
              <Button 
                onClick={handleManageSubscription}
                disabled={isProcessing === 'portal'}
                className="h-14 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-base border border-slate-700"
              >
                {isProcessing === 'portal' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Manage Subscription <Settings className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={() => handleCheckout('pro')} 
                disabled={isProcessing === 'pro'}
                className="h-14 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-base shadow-xl shadow-indigo-500/20"
              >
                {isProcessing === 'pro' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Upgrade to God Mode ($29/mo) <Zap className="ml-2 w-5 h-5 fill-current" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simple 2-Card Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Standard Tier */}
        <Card className={`rounded-[32px] border-white/10 flex flex-col h-full bg-white/5`}>
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-black mb-1">Standard</CardTitle>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-black">$0</span>
              <span className="text-sm font-bold text-slate-500">/mo</span>
            </div>
            <CardDescription className="text-slate-400">
              Essential executive assistant features for occasional use.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex-1 flex flex-col">
            <ul className="space-y-4 mb-8 flex-1">
              <PricingFeature text="10 AI Credits / month (auto-refreshed)" />
              <PricingFeature text="Gemini 1.5 Flash Brain" />
              <PricingFeature text="Task Scheduling & Google Calendar Sync" />
              <PricingFeature text="Single 50 credit refill option ($10)" />
            </ul>
            <Button 
              disabled={!isGodMode}
              className={`w-full h-14 rounded-xl font-bold text-base bg-white/10 text-slate-500 cursor-not-allowed`}
            >
              {!isGodMode ? 'Current Plan' : 'Free Tier'}
            </Button>
          </CardContent>
        </Card>

        {/* God Mode Tier */}
        <Card className={`rounded-[32px] border-none bg-indigo-600 shadow-2xl flex flex-col h-full`}>
          <CardHeader className="p-8">
            <div className="flex justify-between items-center mb-1">
              <CardTitle className="text-2xl font-black text-white">God Mode</CardTitle>
              <Badge className="bg-white/20 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full">
                Recommended
              </Badge>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-black text-white">$29</span>
              <span className="text-sm font-bold text-indigo-200">/mo</span>
            </div>
            <CardDescription className="text-indigo-100">
              Full autonomy and high-performance execution for busy operators.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex-1 flex flex-col">
            <ul className="space-y-4 mb-8 flex-1">
              <PricingFeature text="Unlimited AI DO Executions" highlight />
              <PricingFeature text="Gemini 1.5 Pro Brain" highlight />
              <PricingFeature text="Instant Task Execution & Memory" highlight />
              <PricingFeature text="Style Guide Personalization" highlight />
              <PricingFeature text="Priority Support & Sync" highlight />
            </ul>
            <Button 
              onClick={isGodMode ? handleManageSubscription : () => handleCheckout('pro')}
              disabled={isProcessing !== null}
              className="w-full h-14 rounded-xl font-bold text-base bg-white text-indigo-600 hover:bg-slate-100 shadow-lg"
            >
              {isProcessing === 'pro' || isProcessing === 'portal' ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : isGodMode ? (
                'Manage Subscription'
              ) : (
                'Upgrade to God Mode'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PricingFeature({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
        <Check className={`w-3 h-3 ${highlight ? 'text-white' : 'text-indigo-400'}`} />
      </div>
      <span className={`text-sm font-medium ${highlight ? 'text-indigo-50' : 'text-slate-300'}`}>{text}</span>
    </li>
  );
}
