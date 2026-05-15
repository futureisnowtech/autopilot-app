'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  Loader2,
  Brain,
  Zap,
  Target,
  Calendar,
  Briefcase,
  User,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { StyleGuide } from '@/types/database';
import { toast } from "sonner"

const JOSH_ID = '235ea98b-0404-4a1b-bdeb-8d0adb89667f';

export default function StyleGuidePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaveing] = useState(false);
  const [styleGuide, setStyleGuide] = useState<StyleGuide | null>(null);
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    fetchStyleGuide();
  }, []);

  async function fetchStyleGuide() {
    const { data, error } = await supabase
      .from('style_guides')
      .select('*')
      .eq('user_id', JOSH_ID)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast.error("Failed to load preferences");
    } else if (data) {
      setStyleGuide(data);
    } else {
      // Initialize if missing
      const { data: newData, error: initError } = await supabase
        .from('style_guides')
        .insert([{ user_id: JOSH_ID, preferences: {}, learned_rules: [] }])
        .select()
        .single();
      if (!initError) setStyleGuide(newData);
    }
    setLoading(false);
  }

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newRule.trim() || !styleGuide) return;

    const updatedRules = [...styleGuide.learned_rules, newRule.trim()];
    const { error } = await supabase
      .from('style_guides')
      .update({ learned_rules: updatedRules })
      .eq('id', styleGuide.id);

    if (error) {
      toast.error("Failed to add rule");
    } else {
      setStyleGuide({ ...styleGuide, learned_rules: updatedRules });
      setNewRule('');
      toast.success("Preference learned");
    }
  }

  async function deleteRule(index: number) {
    if (!styleGuide) return;
    const updatedRules = styleGuide.learned_rules.filter((_, i) => i !== index);
    const { error } = await supabase
      .from('style_guides')
      .update({ learned_rules: updatedRules })
      .eq('id', styleGuide.id);

    if (error) {
      toast.error("Failed to remove rule");
    } else {
      setStyleGuide({ ...styleGuide, learned_rules: updatedRules });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d1f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white flex">
      {/* Sidebar - Reused from Dashboard */}
      <aside className="w-80 border-r border-white/5 bg-[#0f0f2d]/50 backdrop-blur-xl flex flex-col">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter cursor-pointer" onClick={() => window.location.href='/dashboard'}>AUTOPILOT</span>
          </div>

          <nav className="space-y-2">
            <NavItem icon={<Target className="w-6 h-6" />} label="Command Center" onClick={() => window.location.href='/dashboard'} />
            <NavItem icon={<Calendar className="w-6 h-6" />} label="Timeline" />
            <NavItem icon={<Briefcase className="w-6 h-6" />} label="Partner Docs" />
            <NavItem icon={<Sparkles className="w-6 h-6" />} label="Style Guide" active />
          </nav>
        </div>

        <div className="mt-auto p-10 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <User className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-bold truncate">Josh</p>
              <p className="text-xs text-indigo-500/60 uppercase tracking-widest font-black">Founder</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-16 overflow-y-auto">
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              <Brain className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-black tracking-tight">Style Guide</h1>
          </div>
          <p className="text-xl text-slate-400 font-medium max-w-2xl">
            This is your AI's core operating memory. Every rule here dictates how deliverables are researched, formatted, and delivered.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12 max-w-5xl">
          {/* Explicit Rules */}
          <section className="space-y-8">
            <Card className="bg-white/5 border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <CardHeader className="p-10 pb-0">
                <CardTitle className="text-2xl font-bold">Autonomous Preferences</CardTitle>
                <CardDescription className="text-lg text-slate-400">Add custom instructions that the AI should always follow.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <form onSubmit={addRule} className="flex gap-4">
                  <Input 
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="e.g. Always include a 'Key Takeaways' section at the top of every doc."
                    className="h-16 bg-white/5 border-white/10 rounded-2xl text-xl placeholder:text-slate-600 px-6"
                  />
                  <Button type="submit" className="h-16 px-8 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20">
                    Add Preference <Plus className="ml-2 w-6 h-6" />
                  </Button>
                </form>

                <div className="space-y-4 pt-4">
                  <AnimatePresence>
                    {styleGuide?.learned_rules.map((rule, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group flex items-start gap-6 p-6 bg-white/[0.03] border border-white/5 rounded-[24px] hover:bg-white/[0.06] transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                          <Zap className="w-5 h-5" />
                        </div>
                        <p className="flex-1 text-xl font-medium leading-relaxed pt-1.5">{rule}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteRule(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400 rounded-full w-12 h-12 mt-1"
                        >
                          <Trash2 className="w-6 h-6" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {styleGuide?.learned_rules.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]">
                      <p className="text-slate-600 text-xl font-bold uppercase tracking-widest">No preferences saved yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Core Values / Tone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="bg-[#0f0f2d]/50 border-white/5 rounded-[32px] p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Tone of Voice
                </h3>
                <div className="flex flex-wrap gap-3">
                  <ToneBadge label="Executive" />
                  <ToneBadge label="Concise" />
                  <ToneBadge label="Data-Driven" />
                  <ToneBadge label="Ambitious" />
                </div>
             </Card>
             <Card className="bg-[#0f0f2d]/50 border-white/5 rounded-[32px] p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Deliverable Standard
                </h3>
                <p className="text-slate-400 leading-relaxed italic">
                  "Every output must be ready to present to a CEO. No fluff, high density information, and clearly marked action items."
                </p>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-indigo-500/15 text-indigo-400 shadow-lg shadow-indigo-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="font-bold text-lg tracking-tight">{label}</span>
    </button>
  );
}

function ToneBadge({ label }: { label: string }) {
  return (
    <span className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full font-bold text-sm">
      {label}
    </span>
  );
}
