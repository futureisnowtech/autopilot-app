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
  CheckCircle2,
  Plus,
  Folder,
  LayoutGrid,
  X,
  ExternalLink,
  Copy
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Space } from '@/types/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>('Founder');
  const [userId, setUserId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [calendarId, setCalendarId] = useState('');
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Founder');
        
        // Fetch profile data
        const { data: profile } = await supabase.from('profiles').select('google_calendar_id').eq('id', session.user.id).single();
        if (profile?.google_calendar_id) {
          setIsSynced(true);
          setCalendarId(profile.google_calendar_id);
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

  const handleSaveSync = async () => {
    if (!userId || !calendarId) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ google_calendar_id: calendarId })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to save calendar ID');
    } else {
      setIsSynced(true);
      setShowSyncModal(false);
      toast.success('Google Calendar Connected', {
        description: 'Autopilot will now push events to your calendar.'
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
                {isSynced ? 'Google Calendar' : 'Sync Calendar'}
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSyncModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#15152e] border border-white/10 rounded-[32px] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2 text-white">Google Calendar Sync</h2>
                  <p className="text-slate-400 font-medium">Activate "God Mode" autonomous scheduling.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSyncModal(false)} className="rounded-full hover:bg-white/5 text-slate-500">
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                  <p className="text-sm font-black uppercase tracking-widest text-indigo-400">Step 1: Authorization</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Share your Google Calendar with our AI Service Email. Give it <span className="text-white font-bold">"Make changes to events"</span> permission.
                  </p>
                  <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5 group">
                    <code className="text-xs text-slate-400 flex-1 truncate select-all">autopilot-sync@autopilot-app-496415.iam.gserviceaccount.com</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('autopilot-sync@autopilot-app-496415.iam.gserviceaccount.com');
                        toast.success('Copied to clipboard');
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-black uppercase tracking-widest text-indigo-400">Step 2: Connect</p>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Google Calendar ID</label>
                    <Input 
                      value={calendarId}
                      onChange={(e) => setCalendarId(e.target.value)}
                      placeholder="e.g. josh@founder.com"
                      className="h-16 bg-white/5 border-white/10 rounded-2xl px-6 text-white text-lg font-medium focus-visible:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-600 ml-4 italic">Tip: Your primary calendar ID is usually just your email address.</p>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button 
                    onClick={handleSaveSync}
                    disabled={!calendarId}
                    className="flex-1 h-16 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/10"
                  >
                    Confirm Connection
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://calendar.google.com/calendar/u/0/r/settings', '_blank')}
                    className="h-16 px-8 border-white/10 text-slate-400 hover:bg-white/5 rounded-2xl"
                  >
                    <ExternalLink className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
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
