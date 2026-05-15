'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

export default function AuthPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Login Error:', error.message);
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[40px] text-center">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-3 tracking-tight">Welcome to the future.</h1>
        <p className="text-slate-400 mb-10 leading-relaxed">
          Sign in to access your autonomous assistant and reclaim your time.
        </p>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 px-6 bg-white text-[#0d0d1f] rounded-full font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all mb-6 shadow-xl"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

        <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
