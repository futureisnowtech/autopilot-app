'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Target, 
  Sparkles, 
  Briefcase,
  User,
  LogOut,
  CreditCard,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>('Founder');
  const [userId, setUserId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Founder');
        
        // Check sync status from settings
        const { data: profile } = await supabase.from('profiles').select('settings').eq('id', session.user.id).single();
        if (profile?.settings?.calendar_synced) {
          setIsSynced(true);
        }
      }
    }
    getSession();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const handleSyncCalendar = async () => {
    if (!userId) return;
    setIsSyncing(true);
    
    const protocol = window.location.protocol === 'https:' ? 'webcal:' : 'http:';
    const icalUrl = `${protocol}//${window.location.host}/api/calendar/${userId}`;
    window.location.href = icalUrl;

    // Persist sync state
    const { data: profile } = await supabase.from('profiles').select('settings').eq('id', userId).single();
    const newSettings = { ...(profile?.settings || {}), calendar_synced: true };
    await supabase.from('profiles').update({ settings: newSettings }).eq('id', userId);
    
    setTimeout(() => {
      setIsSynced(true);
      setIsSyncing(false);
      toast.success('Calendar Synced', {
        description: 'Autopilot is now connected to your device calendar.'
      });
    }, 2000);
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
            id="style-guide-nav"
            href="/dashboard/style-guide" 
            icon={<Sparkles className="w-6 h-6" />} 
            label="Style Guide" 
            active={pathname === '/dashboard/style-guide'} 
          />
          <NavItem 
            href="/dashboard/billing" 
            icon={<CreditCard className="w-6 h-6" />} 
            label="Billing" 
            active={pathname === '/dashboard/billing'} 
          />
        </nav>

        <div className="mt-12 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 ml-6">Integrations</p>
          <button 
            id="sync-calendar-btn"
            onClick={handleSyncCalendar}
            disabled={isSynced || isSyncing}
            className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all group ${
              isSynced 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : isSynced ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
            )}
            <span className="font-bold text-lg tracking-tight text-left">
              {isSyncing ? 'Syncing...' : isSynced ? 'Synced' : 'Sync Calendar'}
            </span>
          </button>
        </div>
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

function NavItem({ icon, label, href, active = false, id }: { icon: React.ReactNode, label: string, href: string, active?: boolean, id?: string }) {
  return (
    <Link 
      id={id}
      href={href}
      className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-indigo-500/15 text-indigo-400 shadow-lg shadow-indigo-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="font-bold text-lg tracking-tight">{label}</span>
    </Link>
  );
}
