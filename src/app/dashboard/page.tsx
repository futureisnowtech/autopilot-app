'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Target, 
  Sparkles, 
  ChevronRight,
  Clock,
  Briefcase,
  User,
  LogOut,
  Loader2,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types/database';
import { toast } from "sonner"

const JOSH_ID = '235ea98b-0404-4a1b-bdeb-8d0adb89667f';

export default function Dashboard() {
  const [intakeValue, setIntakeValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Interactive state
  const [interactiveData, setInteractiveData] = useState<{ question: string, fields: any } | null>(null);
  const [answer, setAnswer] = useState('');
  const answerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${JOSH_ID}`
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (interactiveData && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [interactiveData]);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', JOSH_ID)
      .neq('status', 'Done')
      .order('priority', { ascending: true, nullsFirst: false })
      .order('urgency', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error("Failed to sync data");
    } else {
      setTasks(data || []);
    }
    setIsLoading(false);
  }

  const handleCapture = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && intakeValue.trim()) {
      executeCapture(intakeValue);
    }
  };

  const executeCapture = async (input: string, userAnswer?: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: input, 
          user_id: JOSH_ID,
          answer: userAnswer 
        }),
      });
      
      const result = await response.json();
      
      if (result.interactive) {
        setInteractiveData({ question: result.question, fields: result.fields });
        toast("AI Brain: Question", { description: result.question });
      } else {
        toast.success("God Mode: Captured", { description: result.message });
        setIntakeValue('');
        setInteractiveData(null);
        setAnswer('');
      }
    } catch (err) {
      toast.error("Capture failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && interactiveData) {
      executeCapture(intakeValue, answer);
    }
  };

  const executeAiDo = async (taskId: string) => {
    toast.promise(
      fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      }).then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      {
        loading: 'AI is researching and executing...',
        success: 'Deliverable ready for review',
        error: 'Execution failed',
      }
    );
  };

  const markDone = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'Done' })
      .eq('id', taskId);
    
    if (error) {
      toast.error("Failed to update task");
    } else {
      toast.success("Task archived");
    }
  };

  const topTask = tasks[0];


  const backlog = tasks.slice(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d1f] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-16 h-16 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white selection:bg-indigo-500/30 flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 bg-[#0f0f2d]/50 backdrop-blur-xl flex flex-col">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-blue-500">OPS HUB</span>
          </div>

          <nav className="space-y-2">
            <NavItem icon={<Target className="w-6 h-6" />} label="Command Center" active />
            <NavItem icon={<Calendar className="w-6 h-6" />} label="Timeline" />
            <NavItem icon={<Briefcase className="w-6 h-6" />} label="Partner Docs" />
            <NavItem icon={<Sparkles className="w-6 h-6" />} label="Style Guide" />
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
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-16 overflow-y-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h1 className="text-5xl font-black tracking-tight mb-3">Hello, Josh.</h1>
            <p className="text-xl text-slate-400 font-medium">Here is your high-leverage focus for today.</p>
          </div>
          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest">
            God Mode Active
          </Badge>
        </header>

        {/* Quick Intake Container */}
        <div className="mb-16 space-y-4">
          <div className="relative group">
            <div className="absolute left-8 top-1/2 -translate-y-1/2">
              {isSubmitting ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /> : <Plus className="w-8 h-8 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />}
            </div>
            <Input 
              value={intakeValue}
              onChange={(e) => setIntakeValue(e.target.value)}
              onKeyDown={handleCapture}
              disabled={isSubmitting || !!interactiveData}
              placeholder="What needs to happen? (Type 'AI DO' to delegate)"
              className="h-20 pl-20 pr-8 bg-white/5 border-white/10 rounded-[24px] text-2xl font-medium focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all shadow-2xl shadow-black/40"
            />
            {intakeValue && !isSubmitting && !interactiveData && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <kbd className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-widest border border-white/10">Enter</kbd>
              </div>
            )}
          </div>

          {/* Interactive Question Overlay */}
          <AnimatePresence>
            {interactiveData && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-indigo-600 rounded-[24px] p-8 shadow-2xl shadow-indigo-500/40 relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 p-8 opacity-10">
                  <MessageSquare className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-indigo-100">AI Needs Context</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-6 text-white leading-tight">
                    {interactiveData.question}
                  </h2>
                  <form onSubmit={handleAnswerSubmit} className="flex gap-4">
                    <Input 
                      ref={answerInputRef}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Your answer..."
                      className="h-14 bg-white/10 border-white/20 rounded-xl text-xl placeholder:text-indigo-200/50 text-white focus-visible:ring-white"
                    />
                    <Button type="submit" className="h-14 px-8 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-lg">
                      Submit <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setInteractiveData(null)}
                      variant="ghost" 
                      className="h-14 text-indigo-100 hover:bg-white/10 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Left Column: Focus & Backlog */}
          <div className="lg:col-span-2 space-y-16">
            {/* Top Priority */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-base font-black uppercase tracking-[0.2em] text-slate-500">Immediate Focus</h2>
                <span className="text-sm font-bold text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-lg">#1 Rank</span>
              </div>
              
              <AnimatePresence mode="wait">
                {topTask ? (
                  <motion.div
                    key={topTask.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 20 }}
                  >
                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-none rounded-[40px] overflow-hidden shadow-2xl shadow-indigo-500/20 group">
                      <CardContent className="p-12">
                        <div className="flex justify-between items-start mb-10">
                          <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                            {topTask.client || 'General'}
                          </Badge>
                          <div className="flex gap-2">
                            {topTask.status === 'AI_Do' && <Badge className="bg-purple-400 text-purple-900 border-none px-4 py-1.5 text-xs font-black uppercase">Autonomous</Badge>}
                            <Badge className={`${
                              topTask.urgency === 'Urgent' ? 'bg-red-500 text-white' : 
                              topTask.urgency === 'High' ? 'bg-amber-500 text-white' : 'bg-indigo-400 text-white'
                            } border-none shadow-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider`}>
                              {topTask.urgency}
                            </Badge>
                          </div>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                          {topTask.title}
                        </h3>
                        {topTask.notes && (
                          <p className="text-indigo-100/80 mb-10 text-xl leading-relaxed line-clamp-3 font-medium">
                            {topTask.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-10">
                          <div className="flex items-center gap-3 text-indigo-100/60 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5">
                            <Clock className="w-6 h-6" />
                            <span className="font-bold text-lg uppercase tracking-tighter">{topTask.est_minutes} min</span>
                          </div>
                          <div className="ml-auto flex gap-4">
                            {topTask.status === 'AI_Do' && (
                              <Button 
                                onClick={() => executeAiDo(topTask.id)}
                                className="bg-purple-500 hover:bg-purple-400 text-white rounded-full px-10 py-8 font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                              >
                                Execute AI DO <Sparkles className="ml-3 w-8 h-8" />
                              </Button>
                            )}
                            <Button 
                              onClick={() => markDone(topTask.id)}
                              className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-full px-10 py-8 font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                            >
                              Mark as Done <CheckCircle2 className="ml-3 w-8 h-8" />
                            </Button>
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <div className="p-32 border-2 border-dashed border-white/5 rounded-[48px] text-center bg-white/[0.02]">
                    <p className="text-slate-500 text-2xl font-bold tracking-tight uppercase">Dashboard Clear. Reclaiming your day.</p>
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Backlog */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-base font-black uppercase tracking-[0.2em] text-slate-500">On Deck</h2>
                <Button variant="ghost" size="sm" className="text-sm font-bold text-indigo-400 hover:text-indigo-300">Expand All</Button>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {backlog.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      className="group bg-white/[0.03] border border-white/5 p-6 rounded-[28px] flex items-center gap-8 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer shadow-xl"
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                        task.status === 'AI_Do' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-indigo-400'
                      }`}>
                        {task.status === 'AI_Do' ? <Sparkles className="w-7 h-7" /> : <Target className="w-7 h-7" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-2xl leading-tight tracking-tight mb-1">{task.title}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{task.client || 'General'}</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                          <span className="text-sm font-bold text-indigo-500/60 uppercase">{task.est_minutes} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {task.status === 'AI_Do' && (
                          <>
                            <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/20 px-4 py-1 font-black uppercase text-[10px] tracking-widest">Autonomous</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => { e.stopPropagation(); executeAiDo(task.id); }}
                              className="hover:bg-purple-500/20 hover:text-purple-400 rounded-full w-12 h-12"
                            >
                              <Sparkles className="w-7 h-7" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); markDone(task.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-500/20 hover:text-green-400 rounded-full w-12 h-12"
                        >
                          <CheckCircle2 className="w-7 h-7" />
                        </Button>
                        <ChevronRight className="w-6 h-6 text-slate-700" />
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
                {backlog.length === 0 && !isLoading && (
                  <p className="text-center py-10 text-slate-600 font-bold uppercase tracking-widest text-xs">Backlog Empty</p>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Daily Brief & Schedule Visualization */}
          <div className="space-y-16">
            <Card className="bg-white/5 border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <CardHeader className="p-10 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">AI Intelligence</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <p className="text-2xl leading-snug italic text-slate-300 font-medium tracking-tight">
                  "Josh, your morning is prioritized for TAGtargets strategy. I've cleared the noise so you can focus. Your AI reports will be delivered by 5 PM."
                </p>
                <div className="space-y-4 pt-8 border-t border-white/5">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-600">Day Metrics</p>
                  <ul className="space-y-4">
                    <WinItem text={`${tasks.length} optimized actions`} />
                    <WinItem text="4 hours reclaimed by AI" />
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f2d]/50 border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
              <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Timeline</CardTitle>
                <div className="p-2 bg-white/5 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-500" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-10 space-y-6">
                  <TimeBlock time="09:00" label="Executive Flow" type="locked" />
                  <TimeBlock time="11:30" label="AI: TAGtargets Strategy" type="ai" active />
                  <TimeBlock time="13:30" label="Lunch Break" type="locked" />
                  <TimeBlock time="15:00" label="AI: Output Review" type="ai" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-indigo-500/15 text-indigo-400 shadow-lg shadow-indigo-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
      {icon}
      <span className="font-bold text-lg tracking-tight">{label}</span>
    </button>
  );
}

function WinItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-4 group">
      <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
        <div className="w-2 h-2 rounded-full bg-green-500" />
      </div>
      <span className="text-base font-bold text-slate-400 group-hover:text-slate-200 transition-colors tracking-tight">{text}</span>
    </li>
  );
}

function TimeBlock({ time, label, type, active = false }: { time: string, label: string, type: 'locked' | 'ai', active?: boolean }) {
  return (
    <div className={`flex gap-6 group ${active ? 'scale-105 origin-left transition-transform' : ''}`}>
      <span className="text-sm font-black font-mono text-slate-600 pt-1.5 uppercase tracking-tighter w-12">{time}</span>
      <div className={`flex-1 p-5 rounded-[22px] border transition-all shadow-lg ${
        active 
          ? 'bg-indigo-500/20 border-indigo-500/40 ring-1 ring-indigo-500/20' 
          : type === 'ai' 
            ? 'bg-purple-500/5 border-purple-500/10 text-slate-300' 
            : 'bg-white/5 border-white/5 text-slate-500'
      }`}>
        <p className="text-base font-black tracking-tight uppercase">{label}</p>
      </div>
    </div>
  );
}
