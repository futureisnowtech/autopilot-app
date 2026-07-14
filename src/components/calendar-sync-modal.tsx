'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type CalendarProvider = 'google';

interface CalendarSyncModalProps {
  onSave: (provider: CalendarProvider, email: string) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

// ─────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────
export default function CalendarSyncModal({
  onSave,
  onClose,
  isSaving = false,
}: CalendarSyncModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleGoogleOAuth = async () => {
    setIsConnecting(true);
    try {
      // Use signInWithOAuth (not linkIdentity) to authorize calendar access.
      // linkIdentity requires Manual Linking to be enabled and fails with
      // identity_already_exists when the Google email already maps to an
      // identity — the common case here. signInWithOAuth auto-links on a
      // matching verified email and reliably returns a provider refresh token.
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
      toast.error(err.message || 'Failed to initiate Google Calendar connection');
      setIsConnecting(false);
    }
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

        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">
              Connect Google Calendar
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Sign in with your Google account to sync your tasks automatically.
            </p>
          </div>

          <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">How it works:</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                <span>Sign in securely with Google OAuth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                <span>Autopilot gets permission to add events to your calendar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                <span>Tasks automatically appear in Google Calendar in real-time</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleGoogleOAuth}
            disabled={isConnecting || isSaving}
            className="w-full h-12 bg-white text-[#0d0d1f] hover:bg-slate-100 font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            {isConnecting || isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-slate-500 hover:text-white text-sm font-semibold"
          >
            Cancel
          </Button>

          <p className="text-xs text-slate-500 text-center">
            We only use your Google account to add events to your calendar. We never store or access your Google password.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

