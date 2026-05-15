'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Target, 
  Sparkles, 
  Briefcase,
  User,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>('Founder');

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Founder');
      }
    }
    getSession();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <aside className="w-80 border-r border-white/5 bg-[#0f0f2d]/50 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      <div className="p-10">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-blue-500">OPS HUB</span>
        </div>

        <nav className="space-y-2">
          <NavItem 
            href="/dashboard" 
            icon={<Target className="w-6 h-6" />} 
            label="Command Center" 
            active={pathname === '/dashboard'} 
          />
          <NavItem 
            href="/dashboard/timeline" 
            icon={<Calendar className="w-6 h-6" />} 
            label="Timeline" 
            active={pathname === '/dashboard/timeline'} 
          />
          <NavItem 
            href="/dashboard/docs" 
            icon={<Briefcase className="w-6 h-6" />} 
            label="Partner Docs" 
            active={pathname === '/dashboard/docs'} 
          />
          <NavItem 
            href="/dashboard/style-guide" 
            icon={<Sparkles className="w-6 h-6" />} 
            label="Style Guide" 
            active={pathname === '/dashboard/style-guide'} 
          />
        </nav>
      </div>

      <div className="mt-auto p-10 border-t border-white/5 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <User className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <p className="text-base font-bold truncate">{userName}</p>
            <p className="text-xs text-indigo-500/60 uppercase tracking-widest font-black">Founder</p>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, href, active = false }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-indigo-500/15 text-indigo-400 shadow-lg shadow-indigo-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="font-bold text-lg tracking-tight">{label}</span>
    </Link>
  );
}
