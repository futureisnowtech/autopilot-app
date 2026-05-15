'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Save,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { StyleGuide } from '@/types/database';
import { toast } from "sonner"

export default function StyleGuidePage() {
  const [styleGuide, setStyleGuide] = useState<StyleGuide | null>(null);
  const [newRule, setNewRule] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      } else {
        window.location.href = '/auth';
      }
    }
    getSession();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchStyleGuide();
    }
  }, [userId]);

  async function fetchStyleGuide() {
    const { data, error } = await supabase
      .from('style_guides')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching style guide:', error);
      toast.error("Failed to load style guide");
    } else if (data) {
      setStyleGuide(data);
    } else {
      // Create a default style guide if none exists
      const { data: newData, error: createError } = await supabase
        .from('style_guides')
        .insert([{ user_id: userId, preferences: {}, learned_rules: [] }])
        .select()
        .single();
      
      if (!createError) setStyleGuide(newData);
    }
    setIsLoading(false);
  }

  const handleAddRule = async () => {
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
      toast.success("Rule added to AI Brain");
    }
  };

  const handleDeleteRule = async (index: number) => {
    if (!styleGuide) return;

    const updatedRules = styleGuide.learned_rules.filter((_, i) => i !== index);
    const { error } = await supabase
      .from('style_guides')
      .update({ learned_rules: updatedRules })
      .eq('id', styleGuide.id);

    if (error) {
      toast.error("Failed to delete rule");
    } else {
      setStyleGuide({ ...styleGuide, learned_rules: updatedRules });
      toast.success("Rule removed");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="w-16 h-16 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-16">
        <h1 className="text-5xl font-black tracking-tight mb-3">AI Brain & Style Guide</h1>
        <p className="text-xl text-slate-400 font-medium">Configure how your autonomous assistant thinks and delivers.</p>
      </header>

      <section className="space-y-12">
        {/* Add New Rule */}
        <Card className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Plus className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold uppercase tracking-widest text-slate-500">Add New Preference</h2>
            </div>
            <div className="flex gap-4">
              <Input 
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="e.g., 'Josh prefers all research reports to include a competitive pricing table.'"
                className="h-14 bg-white/5 border-white/10 rounded-xl text-lg focus-visible:ring-indigo-500"
              />
              <Button onClick={handleAddRule} className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">
                Add Rule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Learned Rules List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black uppercase tracking-[0.2em] text-slate-500">Learned Rules</h2>
            <span className="text-sm font-bold text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-lg">
              {styleGuide?.learned_rules.length || 0} Principles
            </span>
          </div>

          <div className="grid gap-4">
            <AnimatePresence>
              {styleGuide?.learned_rules.map((rule, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-white/[0.03] border border-white/5 p-6 rounded-2xl flex items-center gap-6 hover:bg-white/[0.06] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="flex-1 text-lg font-medium text-slate-200">{rule}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteRule(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!styleGuide || styleGuide.learned_rules.length === 0) && (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                <Brain className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Your AI Brain is a blank slate</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
