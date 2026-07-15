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
  Zap,
  Check,
  Link2
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

  // Sync state
  const [syncMethod, setSyncMethod] = useState<'google' | 'ical'>('google');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isOAuthConnecting, setIsOAuthConnecting] = useState(false);

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

  useEffect(() => {
    async function getProfile() {
      if (!userId) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_id')
        .eq('id', userId)
        .single();
      // google_calendar_id is only set once a real refresh token is captured,
      // so it's the honest "connected" signal (calendar_provider is not).
      if (profile?.google_calendar_id) {
        setIsGoogleConnected(true);
      }
    }
    getProfile();
  }, [userId]);

  // Handle the return trip from the Google OAuth callback. Without this, a user
  // who connected mid-onboarding lands back on step 1 with no feedback.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const syncError = params.get('sync_error');
    const syncWarning = params.get('sync_warning');
    const sync = params.get('sync');

    if (syncError) {
      toast.error('Google Calendar connection failed', { description: syncError });
      setStep(3);
    } else if (syncWarning === 'no_refresh_token') {
      toast.error('Connected, but no calendar permission was granted', {
        description: 'Please connect again and tap "Allow" on the calendar screen.',
      });
      setStep(3);
    } else if (sync === 'success') {
      setIsGoogleConnected(true);
      setStep(3);
      toast.success('Google Calendar connected');
    }

    // Strip the query params so refreshes don't re-fire the toast.
    if (syncError || syncWarning || sync) {
      window.history.replaceState({}, '', '/dashboard/onboarding');
    }
  }, []);

  const handleConnectGoogleOAuth = async () => {
    setIsOAuthConnecting(true);
    try {
      // signInWithOAuth (not linkIdentity): auto-links on matching verified
      // email and reliably returns a refresh token. See callback route.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?provider=google`,
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate Google Calendar link');
      setIsOAuthConnecting(false);
    }
  };

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
                <p className="text-xl text-slate-400 font-medium leading-relaxed">Choose how you want to see your AI-scheduled tasks on your devices instantly.</p>
              </div>

              <div className="space-y-8 bg-white/5 border border-white/10 p-10 rounded-[40px] shadow-2xl">
                {/* Method Selector */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 mb-2">
                  <button
                    onClick={() => setSyncMethod('google')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${syncMethod === 'google' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google Calendar
                  </button>
                  <button
                    onClick={() => setSyncMethod('ical')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${syncMethod === 'ical' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Link2 className="w-4 h-4" /> iCal Feed (Apple / Outlook)
                  </button>
                </div>

                {syncMethod === 'google' && (
                  <div className="space-y-6">
                    {isGoogleConnected ? (
                      <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-3xl text-center space-y-4 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                        <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-400">
                          <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white">Google Calendar Connected</h3>
                          <p className="text-slate-400 text-sm font-medium mt-1">Autopilot is fully linked and ready to schedule events.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-left space-y-4">
                          <p className="text-xl font-bold leading-relaxed">
                            Sign in with your Google account to grant Autopilot access to automatically schedule events directly on your calendar.
                          </p>
                          <p className="text-base text-slate-400 leading-relaxed font-medium">
                            No manual sharing, service accounts, or copying URLs required. Fully automated.
                          </p>
                        </div>

                        {/* Glowing button wrapper */}
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse" />
                          <button
                            onClick={handleConnectGoogleOAuth}
                            disabled={isOAuthConnecting}
                            className="relative w-full h-18 bg-white hover:bg-slate-100 text-black rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all shadow-2xl cursor-pointer"
                          >
                            {isOAuthConnecting ? (
                              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Connect Google Calendar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {syncMethod === 'ical' && (
                  <div className="space-y-6 text-left">
                    <div className="flex gap-6 group items-start">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                        <Copy className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="text-2xl font-black text-white">1. Copy your private Feed URL</p>
                        <div className="flex gap-2">
                          <input 
                            readOnly 
                            value={icalUrl} 
                            className="flex-1 h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-mono text-slate-400 outline-none" 
                          />
                          <div className="relative group/copy shrink-0">
                            <div className="absolute -inset-0.5 bg-indigo-500 rounded-xl blur opacity-30 group-hover/copy:opacity-100 transition duration-300" />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                navigator.clipboard.writeText(icalUrl);
                                toast.success("URL Copied to clipboard");
                              }}
                              className="relative h-14 w-14 bg-[#0d0d1f] hover:bg-white/10 border border-white/10 text-white rounded-xl cursor-pointer"
                            >
                              <Copy className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6 group items-start pt-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="text-2xl font-black text-white">2. Subscribe on your Device</p>
                        <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                          <p className="text-base text-slate-300 leading-relaxed font-bold">
                            On iPhone / iOS:
                          </p>
                          <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                            Go to <strong className="text-indigo-400">Settings</strong> → <strong className="text-indigo-400">Calendar</strong> → <strong className="text-indigo-400">Accounts</strong> → <strong className="text-indigo-400">Add Account</strong> → <strong className="text-indigo-400">Other</strong> → <strong className="text-indigo-400">Add Subscribed Calendar</strong>. Paste the copied Feed URL and save.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Glowing finish button */}
                <div className="relative group pt-4">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500" />
                  <Button 
                    onClick={completeOnboarding} 
                    disabled={isLoading}
                    className="relative w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 mt-4 shadow-2xl shadow-indigo-500/20 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finish & Deploy <Zap className="w-6 h-6 fill-current text-amber-300 animate-pulse" /></>}
                  </Button>
                </div>
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
