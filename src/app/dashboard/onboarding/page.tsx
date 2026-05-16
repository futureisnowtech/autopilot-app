'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Globe,
  CheckCircle2,
  Loader2,
  Copy,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner"

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Data State
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [primaryWindow, setPrimaryWindow] = useState('09:00-17:00');

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      } else {
        window.location.href = '/auth';
      }
    }
    getSession();
  }, []);

  const handleNext = () => setStep(s => s + 1);

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          timezone: timezone,
          onboarding_completed: true,
          settings: {
            primary_window: primaryWindow,
            overflow_window: "20:00-22:00",
            work_weekends: false,
            daily_brief_time: "06:00"
          }
        })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success("Onboarding Complete! Deploying systems...");
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error("Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const icalUrl = userId ? `${window.location.origin}/api/calendar/${userId}` : '...';

  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white flex items-center justify-center px-6 py-20 selection:bg-indigo-500/30">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-tight">First, let's identify <span className="text-indigo-500">who you are</span>.</h1>
                <p className="text-xl text-slate-400 font-medium leading-relaxed">The assistant works best when it knows your name and where in the world you operate.</p>
              </div>

              <div className="space-y-6 bg-white/5 border border-white/10 p-10 rounded-[40px] shadow-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Full Name</label>
                  <input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Josh"
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Current Timezone</label>
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
                <Button onClick={handleNext} className="w-full h-16 bg-white text-[#0d0d1f] hover:bg-slate-200 rounded-2xl font-black text-xl flex items-center justify-center gap-2 mt-4 shadow-xl">
                  Continue <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-tight">When do you <span className="text-indigo-500">conquer</span> your day?</h1>
                <p className="text-xl text-slate-400 font-medium leading-relaxed">Define your primary focus window. Autopilot will prioritize scheduling tasks during these hours.</p>
              </div>

              <div className="space-y-6 bg-white/5 border border-white/10 p-10 rounded-[40px] shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TimeOption 
                    label="09:00 - 17:00" 
                    description="Standard Flow" 
                    active={primaryWindow === '09:00-17:00'} 
                    onClick={() => setPrimaryWindow('09:00-17:00')} 
                  />
                  <TimeOption 
                    label="06:00 - 14:00" 
                    description="Early Riser" 
                    active={primaryWindow === '06:00-14:00'} 
                    onClick={() => setPrimaryWindow('06:00-14:00')} 
                  />
                  <TimeOption 
                    label="12:00 - 20:00" 
                    description="Afternoon Power" 
                    active={primaryWindow === '12:00-20:00'} 
                    onClick={() => setPrimaryWindow('12:00-20:00')} 
                  />
                  <TimeOption 
                    label="22:00 - 04:00" 
                    description="Night Owl" 
                    active={primaryWindow === '22:00-04:00'} 
                    onClick={() => setPrimaryWindow('22:00-04:00')} 
                  />
                </div>
                <Button onClick={handleNext} className="w-full h-16 bg-white text-[#0d0d1f] hover:bg-slate-200 rounded-2xl font-black text-xl flex items-center justify-center gap-2 mt-4 shadow-xl">
                  Final Step <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-tight">Connect your <span className="text-indigo-500">Command Center</span>.</h1>
                <p className="text-xl text-slate-400 font-medium leading-relaxed">Follow these 2 steps to see your AI-scheduled tasks on your phone instantly.</p>
              </div>

              <div className="space-y-8 bg-white/5 border border-white/10 p-10 rounded-[40px] shadow-2xl">
                <div className="space-y-6">
                  <div className="flex gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Copy className="w-6 h-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xl font-bold">1. Copy your private Feed URL</p>
                      <div className="flex gap-2">
                        <input 
                          readOnly 
                          value={icalUrl} 
                          className="flex-1 h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-xs font-mono text-slate-500 outline-none" 
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            navigator.clipboard.writeText(icalUrl);
                            toast.success("URL Copied to clipboard");
                          }}
                          className="h-12 w-12 hover:bg-white/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xl font-bold">2. Subscribe on your Device</p>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        On iPhone: Go to Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar. Paste the URL.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={completeOnboarding} 
                  disabled={isLoading}
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 mt-4 shadow-2xl shadow-indigo-500/20"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finish & Deploy <Zap className="w-6 h-6 fill-current" /></>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TimeOption({ label, description, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-[24px] border-2 text-left transition-all group ${active ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
    >
      <p className={`text-xl font-black tracking-tight mb-1 ${active ? 'text-white' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-xs font-bold uppercase tracking-widest ${active ? 'text-indigo-400' : 'text-slate-600'}`}>{description}</p>
    </button>
  );
}
