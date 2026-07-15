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

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Step 2: Share in Google</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open your Google Calendar settings, go to "Share with specific people or groups", paste this email, and grant <strong className="text-white">"Make changes to events"</strong> access.
              </p>
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
