'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Move the heavy lifting to the server to guarantee env variables are found
    window.location.href = '/api/auth/google';
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
          disabled={isLoading}
          className="w-full py-4 px-6 bg-white text-[#0d0d1f] rounded-full font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all mb-6 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continue with Google
            </>
          )}
        </button>

        <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
