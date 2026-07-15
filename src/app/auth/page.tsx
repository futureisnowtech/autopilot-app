'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner"

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Account created! Please check your email or sign in.');
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const isSignUp = mode === 'signup';
  const isForgot = mode === 'forgot';

  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[40px] text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />

        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>

        {isForgot ? (
          <>
            <h1 className="text-3xl font-black mb-3 tracking-tight">Reset your password.</h1>
            <p className="text-slate-400 mb-10 leading-relaxed font-medium">
              {resetSent
                ? "Check your email for a link to set a new password."
                : "Enter your email and we'll send you a link to set a new password."}
            </p>

            {resetSent ? (
              <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-4 text-left mb-8">
                <Mail className="w-6 h-6 text-indigo-400 shrink-0" />
                <p className="text-sm text-slate-300 font-medium">Sent to {email}</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 mb-8">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. josh@founder.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-8 group"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send Reset Link <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
            )}

            <div className="pt-6 border-t border-white/5">
              <button
                onClick={() => { setMode('signin'); setResetSent(false); }}
                className="text-sm font-bold text-slate-500 hover:text-white transition-colors"
              >
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-black mb-3 tracking-tight">
              {isSignUp ? 'Claim your time.' : 'Welcome back.'}
            </h1>
            <p className="text-slate-400 mb-10 leading-relaxed font-medium">
              {isSignUp
                ? 'Create an account to deploy your autonomous assistant.'
                : 'Sign in to access your Command Center.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4 mb-8">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. josh@founder.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-medium"
                />
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between ml-4 mr-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-8 group"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Initialize Autopilot' : 'Enter Command Center'}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 border-t border-white/5">
              <button
                onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
                className="text-sm font-bold text-slate-500 hover:text-white transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "New to the future? Create an account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
