'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Zap, 
  Check, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner"

export default function BillingPage() {
  const [credits, setCredits] = useState<number>(0);
  const [planType, setPlanType] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const handleUpgrade = (plan: string) => {
    toast.info(`Stripe Integration Pending`, {
      description: `In the marketplace version, this will open a Stripe Checkout link for the ${plan} plan.`
    });
  };

  if (isLoading) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-16">
        <h1 className="text-5xl font-black tracking-tight mb-3">Billing & Plan</h1>
        <p className="text-xl text-slate-400 font-medium">Manage your AI credits and operational scale.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Status Card */}
        <Card className="lg:col-span-3 bg-white/5 border-white/10 rounded-[32px] overflow-hidden mb-8 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div>
              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                Current Plan: {planType === 'free' ? 'Standard' : 'God Mode'}
              </Badge>
              <h2 className="text-4xl font-black mb-2">{credits} AI Credits Remaining</h2>
              <p className="text-slate-400 text-lg">Your credits refresh on the 1st of every month.</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => handleUpgrade('Top-up')} className="h-16 px-8 bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-2xl font-bold text-lg">
                Buy Credits
              </Button>
              {planType === 'free' && (
                <Button onClick={() => handleUpgrade('Pro')} className="h-16 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20">
                  Upgrade to Pro <Zap className="ml-2 w-5 h-5 fill-current" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Tier: Free */}
        <PricingCard 
          title="Standard"
          price="$0"
          description="Perfect for testing the waters of autonomy."
          features={[
            "10 AI Credits / mo",
            "Gemini 1.5 Flash Brain",
            "Daily Task Execution",
            "Community Support"
          ]}
          active={planType === 'free'}
        />

        {/* Pricing Tier: Pro */}
        <PricingCard 
          title="God Mode"
          price="$29"
          period="/mo"
          description="Full autonomy for busy founders and operators."
          features={[
            "Unlimited AI Credits*",
            "Gemini 1.5 Pro Brain",
            "Instant Task Execution",
            "Priority Memory (Style Guide)",
            "Apple & Google Sync"
          ]}
          active={planType === 'pro'}
          highlight
          onUpgrade={() => handleUpgrade('Pro')}
        />

        {/* Pricing Tier: Annual */}
        <PricingCard 
          title="Scale"
          price="$240"
          period="/yr"
          description="The elite choice for long-term leverage."
          features={[
            "Everything in God Mode",
            "Equivalent to $20/mo",
            "Early access to new agents",
            "VIP Support"
          ]}
          onUpgrade={() => handleUpgrade('Annual')}
        />
      </div>
    </div>
  );
}

function PricingCard({ title, price, period = "", description, features, active = false, highlight = false, onUpgrade }: any) {
  return (
    <Card className={`rounded-[32px] border-white/10 flex flex-col h-full transition-all ${highlight ? 'bg-indigo-600 border-none shadow-2xl scale-105' : 'bg-white/5'}`}>
      <CardHeader className="p-8">
        <CardTitle className="text-2xl font-black mb-2">{title}</CardTitle>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-black">{price}</span>
          <span className={`text-sm font-bold ${highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{period}</span>
        </div>
        <CardDescription className={`text-base ${highlight ? 'text-indigo-100' : 'text-slate-400'}`}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0 flex-1 flex flex-col">
        <ul className="space-y-4 mb-8 flex-1">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                <Check className={`w-3 h-3 ${highlight ? 'text-white' : 'text-indigo-400'}`} />
              </div>
              <span className={`text-sm font-medium ${highlight ? 'text-indigo-50' : 'text-slate-300'}`}>{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          onClick={onUpgrade}
          disabled={active}
          className={`w-full h-14 rounded-2xl font-bold text-lg ${
            active 
              ? 'bg-white/10 text-slate-500 cursor-not-allowed' 
              : highlight 
                ? 'bg-white text-indigo-600 hover:bg-slate-100' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {active ? 'Current Plan' : 'Get Started'}
        </Button>
      </CardContent>
    </Card>
  );
}
