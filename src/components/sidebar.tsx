'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Sparkles, 
  User,
  LogOut,
  CreditCard,
  Plus,
  Folder,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Space } from '@/types/database';
import { AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import CalendarSyncModal, { CalendarProvider } from './calendar-sync-modal';

export default function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>('Founder');
  const [userId, setUserId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>('google');
  const [isSaving, setIsSaving] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Founder');
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('google_calendar_id, calendar_provider')
          .eq('id', session.user.id)
          .single();
        if (profile?.calendar_provider) {
          setCalendarProvider(profile.calendar_provider as CalendarProvider);
          setIsSynced(true);
        } else if (profile?.google_calendar_id) {
          setCalendarProvider('google');
          setIsSynced(true);
        }

        // Fetch spaces
        const { data: spacesData } = await supabase
          .from('spaces')
          .select('*')
          .order('name', { ascending: true });
        
        if (spacesData) setSpaces(spacesData);
      }
    }
    getSession();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const handleCreateSpace = async () => {
    if (!userId) return;
    const name = window.prompt('Enter space name (e.g. TAG Targets):');
    if (!name) return;

    const { data, error } = await supabase
      .from('spaces')
      .insert([{ 
        name, 
        user_id: userId,
        theme_color: '#6366f1'
      }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to create space');
    } else {
      setSpaces([...spaces, data]);
      toast.success(`Space "${name}" created`);
    }
  };

  const handleSaveSync = async (provider: CalendarProvider) => {
    if (!userId) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ calendar_provider: provider })
      .eq('id', userId);

    setIsSaving(false);
    if (error) {
      toast.error('Failed to save calendar settings');
    } else {
      setIsSynced(true);
      setCalendarProvider(provider);
      setShowSyncModal(false);
      const providerName = provider === 'google' ? 'Google Calendar' : provider === 'apple' ? 'Apple Calendar' : 'Outlook Calendar';
      toast.success(`${providerName} Connected`, {
        description: 'Your tasks will appear in your calendar via live feed subscription.'
      });
    }
  };

  return (
    <>
      <aside className="w-80 border-r border-white/5 bg-[#0f0f2d]/50 backdrop-blur-xl flex flex-col h-screen sticky top-0 overflow-hidden">
        <div className="p-10 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-blue-500 uppercase">Autopilot</span>
          </div>

          <nav className="space-y-2">
            <NavItem 
              href="/dashboard" 
              icon={<LayoutGrid className="w-6 h-6" />} 
              label="Command Center" 
              active={pathname === '/dashboard'} 
            />
            
            <div className="pt-8 pb-4">
              <div className="flex items-center justify-between px-6 mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Spaces</p>
                <button 
                  onClick={handleCreateSpace}
                  className="p-1 hover:bg-white/10 rounded-md text-slate-500 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {spaces.map(space => (
                  <NavItem 
                    key={space.id}
                    href={`/dashboard/space/${space.id}`} 
                    icon={<Folder className="w-5 h-5" style={{ color: space.theme_color }} />} 
                    label={space.name} 
                    active={pathname === `/dashboard/space/${space.id}`}
                    compact
                  />
                ))}
                {spaces.length === 0 && (
                  <p className="px-6 py-2 text-xs text-slate-700 italic font-medium">No spaces yet.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
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
            </div>
          </nav>

          <div className="mt-12 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 ml-6">Integrations</p>
            <button 
              id="sync-calendar-btn"
              onClick={() => setShowSyncModal(true)}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all group ${
                isSynced 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-6 h-6" />
              <span className="font-bold text-lg tracking-tight text-left">
                {isSynced
                  ? calendarProvider === 'apple'
                    ? 'Apple Calendar'
                    : calendarProvider === 'outlook'
                    ? 'Outlook Calendar'
                    : 'Google Calendar'
                  : 'Sync Calendar'}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-10 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <User className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="overflow-hidden">
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

      {/* Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <CalendarSyncModal
            icalFeedUrl={userId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/${userId}` : '...'}
            onSave={handleSaveSync}
            onClose={() => setShowSyncModal(false)}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function NavItem({ icon, label, href, active = false, id, compact = false }: { icon: React.ReactNode, label: string, href: string, active?: boolean, id?: string, compact?: boolean }) {
  return (
    <Link 
      id={id}
      href={href}
      className={`w-full flex items-center transition-all ${compact ? 'gap-3 px-6 py-2 rounded-xl text-sm font-bold' : 'gap-5 px-6 py-4 rounded-2xl text-lg font-bold'} ${active ? 'bg-indigo-500/15 text-indigo-400 shadow-lg shadow-indigo-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      <div className="shrink-0">{icon}</div>
      <span className="truncate tracking-tight">{label}</span>
    </Link>
  );
}
