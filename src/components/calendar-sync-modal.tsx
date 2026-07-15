'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from 'sonner';

export type CalendarProvider = 'google';

interface CalendarSyncModalProps {
  onSave: (provider: CalendarProvider, email: string) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export default function CalendarSyncModal({
  onSave,
  onClose,
  isSaving = false,
}: CalendarSyncModalProps) {
  const [email, setEmail] = useState('');
  const [serviceEmail, setServiceEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetch('/api/calendar/link-service')
      .then(res => res.json())
      .then(data => {
        setServiceEmail(data.serviceEmail);
        setIsFetching(false);
      })
      .catch(() => setIsFetching(false));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(serviceEmail);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    await onSave('google', email.trim());
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-[#13132b] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">
              Share Google Calendar
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Give your Autopilot AI permission to schedule events directly on your calendar.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Step 1: Copy Bot Email</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/50 text-indigo-300 px-3 py-2 rounded-lg text-sm truncate">
                  {isFetching ? 'Loading...' : serviceEmail}
                </code>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  className="shrink-0 bg-white/10 hover:bg-white/20 text-white"
                  onClick={handleCopy}
                  disabled={isFetching}
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
              <div>
                <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Step 2: Share in Google</span>
                <ol className="text-xs text-slate-400 leading-relaxed mt-2 space-y-1.5 list-decimal list-inside">
                  <li>In the left sidebar under "My calendars", hover the calendar you want to share and click the <strong className="text-white">3-dot menu</strong> next to it.</li>
                  <li>Click <strong className="text-white">Settings and sharing</strong>.</li>
                  <li>Scroll to <strong className="text-white">Share with specific people or groups</strong>.</li>
                  <li>Click <strong className="text-white">+ Add people and groups</strong> and paste the bot email above.</li>
                  <li>Set permission to <strong className="text-white">"Make changes to events"</strong> — not "Make changes and manage sharing", which grants more access than needed.</li>
                  <li>Click <strong className="text-white">Send</strong>.</li>
                </ol>
              </div>
              <div className="relative group/btn">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-40 group-hover/btn:opacity-70 transition duration-300" />
                <a
                  href="https://calendar.google.com/calendar/u/0/r/settings/calendar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full h-10 bg-[#0d0d1f] hover:bg-white/10 border border-indigo-500/50 text-indigo-300 hover:text-indigo-200 font-bold rounded-lg text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Open Calendar Settings
                </a>
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Step 3: Confirm Your Email</span>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Done — Connect Calendar</span>
                  )}
                </Button>
              </form>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-slate-500 hover:text-white text-sm font-semibold mt-2"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
