'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  // Supabase fires a PASSWORD_RECOVERY auth event once it's processed the
  // recovery token from the emailed link's URL fragment and established a
  // session. Until then we don't know if this visit is a legitimate recovery
  // link or someone just landing on the page directly.
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready');
      }
    });

    // If a recovery session already exists by the time this mounts (fast
    // token processing), the event above may have already fired and been
    // missed — fall back to checking for a live session.
    const fallback = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setStatus((current) => (current === 'checking' ? (session ? 'ready' : 'invalid') : current));
    }, 2500);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated — you\'re signed in.');
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[40px] text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />

        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>

        {status === 'checking' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-slate-400 font-medium">Verifying your reset link…</p>
          </div>
        )}

        {status === 'invalid' && (
          <>
            <h1 className="text-3xl font-black mb-3 tracking-tight">Link expired or invalid.</h1>
            <p className="text-slate-400 mb-8 leading-relaxed font-medium">
              Reset links only work once and expire after a while. Request a new one from the sign-in page.
            </p>
            <a
              href="/auth"
              className="inline-flex h-14 px-8 items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all"
            >
              Back to Sign In
            </a>
          </>
        )}

        {status === 'ready' && (
          <>
            <h1 className="text-3xl font-black mb-3 tracking-tight">Set a new password.</h1>
            <p className="text-slate-400 mb-10 leading-relaxed font-medium">
              Choose something you'll remember this time.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mb-2">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-medium"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ShieldCheck className="w-6 h-6" /> Set New Password</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
