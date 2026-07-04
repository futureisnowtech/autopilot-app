'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  User, 
  LogOut, 
  Loader2, 
  ArrowRight, 
  X, 
  Trash2,
  AlertCircle,
  Copy,
  ExternalLink,
  Keyboard,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types/database';
import { toast } from "sonner";
import CalendarSyncModal, { CalendarProvider } from '@/components/calendar-sync-modal';

export default function Dashboard() {
  const [userName, setUserName] = useState<string>('Founder');
  const [userId, setUserId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [planType, setPlanType] = useState<string>('free');
  const [calendarId, setCalendarId] = useState('');
  const [isSynced, setIsSynced] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>('google');
  const [isSaving, setIsSaving] = useState(false);

  // Intake UI states
  const [inputType, setInputType] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Success view state
  const [successTask, setSuccessTask] = useState<any | null>(null);
  const [showAiInsights, setShowAiInsights] = useState(false);

  // Recent feed state
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Web Speech API Initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error:', e);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Fetch session, profile and tasks
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Founder');
        
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, plan_type, google_calendar_id, calendar_provider, onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (!profile.onboarding_completed) {
            window.location.href = '/dashboard/onboarding';
            return;
          }
          setCredits(profile.credits);
          setPlanType(profile.plan_type);
          if (profile.google_calendar_id) {
            setCalendarId(profile.google_calendar_id);
            setIsSynced(true);
          }
          if (profile.calendar_provider) {
            setCalendarProvider(profile.calendar_provider as CalendarProvider);
          } else if (profile.google_calendar_id) {
            setCalendarProvider('google');
          }
          // For Apple/Outlook: if calendar_provider is set but no google_calendar_id, still mark as synced
          if (!profile.google_calendar_id && profile.calendar_provider && profile.calendar_provider !== 'google') {
            setIsSynced(true);
          }
        }
        
        fetchRecentTasks(session.user.id);
      } else {
        window.location.href = '/auth';
      }
    }
    init();
  }, []);

  async function fetchRecentTasks(uid: string) {
    setIsLoadingFeed(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setRecentTasks(data);
    }
    setIsLoadingFeed(false);
  }

  // Voice capture start/stop
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        setTranscript('');
        setIsRecording(true);
        recognitionRef.current.start();
      } else {
        toast.error("Browser speech recognition is not supported.");
      }
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  // Submit voice/text note to API
  const handleIntakeSubmit = async (inputStr: string) => {
    const finalInput = inputStr.trim();
    if (!finalInput || !userId) return;

    setIsSubmitting(true);
    setSuccessTask(null);
    setStatusMessage('AI parsing note context...');

    try {
      // Step messages to make it feel responsive and magical
      setTimeout(() => setStatusMessage('Analyzing schedule gaps...'), 1000);
      setTimeout(() => setStatusMessage(isSynced ? 'Pushing to your calendar...' : 'Saving to backlog...'), 2000);

      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: finalInput }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccessTask(result.task);
        setShowAiInsights(true);
        setTextInput('');
        setTranscript('');
        
        toast.success("Synchronized successfully!", {
          description: result.calendar_synced 
            ? "Event created on Google Calendar" 
            : "Task saved to backlog (Connect calendar to auto-sync)"
        });

        // Refresh feed
        fetchRecentTasks(userId);
      } else {
        throw new Error(result.error || "Capture failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process intake note");
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  // Cancel or delete task
  const handleDeleteTask = async (taskId: string) => {
    toast.promise(
      fetch('/api/intake/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      }).then(async res => {
        if (!res.ok) throw new Error();
        if (userId) fetchRecentTasks(userId);
        if (successTask?.id === taskId) {
          setSuccessTask(null);
        }
      }),
      {
        loading: 'Deleting task and calendar event...',
        success: 'Successfully unscheduled & deleted',
        error: 'Failed to delete task',
      }
    );
  };

  const handleSaveCalendarSync = async (provider: CalendarProvider) => {
    if (provider === 'google' && (!userId || !calendarId)) return;
    if (!userId) return;
    setIsSaving(true);
    
    const updatePayload: Record<string, string> = {
      calendar_provider: provider,
    };
    if (provider === 'google') {
      updatePayload.google_calendar_id = calendarId;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
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
        description: provider === 'google'
          ? 'Autopilot will now auto-schedule and sync events.'
          : 'Subscribe using the iCal feed URL in your calendar app to see tasks.'
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <div className="space-y-12">
      {/* Upper Navigation & Headers */}
      <header className="flex justify-between items-center pb-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-indigo-400 uppercase">Autopilot</span>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowSyncModal(true)}
            variant="ghost"
            className={`h-11 rounded-full px-5 font-bold transition-all border flex gap-2 items-center ${
              isSynced 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                : 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10 bg-amber-500/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-xs tracking-tight">
              {isSynced ? 'Calendar Active' : 'Setup Sync'}
            </span>
          </Button>

          <Badge className="bg-white/5 text-slate-300 border-white/10 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
            {credits} Credits
          </Badge>
          
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            size="icon" 
            className="w-11 h-11 rounded-full hover:bg-white/5 text-slate-500 hover:text-white"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Single-Action Container */}
      <section className="max-w-xl mx-auto text-center space-y-8 pt-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            Hello, {userName}.
          </h1>
          <p className="text-lg text-slate-400 font-medium">
            Leave a voice or text note. We'll handle the calendar.
          </p>
        </div>

        <Card className="bg-white/[0.02] border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
          
          <CardContent className="p-0 space-y-8 pt-4">
            {/* Input Selection Toggle */}
            <div className="flex justify-center p-1 bg-white/5 border border-white/5 rounded-full w-fit mx-auto">
              <button 
                onClick={() => { setInputType('voice'); stopRecording(); }}
                className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-tight transition-all flex items-center gap-2 ${inputType === 'voice' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Mic className="w-4 h-4" /> Voice Note
              </button>
              <button 
                onClick={() => { setInputType('text'); stopRecording(); }}
                className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-tight transition-all flex items-center gap-2 ${inputType === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Keyboard className="w-4 h-4" /> Text Note
              </button>
            </div>

            {/* Submitting Status View */}
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div 
                  key="submitting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-12 flex flex-col items-center justify-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin flex items-center justify-center" />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold uppercase tracking-widest text-indigo-400 animate-pulse">Autopilot Active</p>
                    <p className="text-sm text-slate-400 font-medium mt-1">{statusMessage}</p>
                  </div>
                </motion.div>
              ) : inputType === 'voice' ? (
                /* Voice Interface */
                <motion.div 
                  key="voice-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center py-6">
                    <button 
                      onClick={toggleRecording}
                      className={`w-32 h-32 rounded-full flex items-center justify-center relative transition-all group ${
                        isRecording 
                          ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-105' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl hover:scale-105 active:scale-95'
                      }`}
                    >
                      {/* Pulse Ring when recording */}
                      {isRecording && (
                        <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                      )}
                      {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                    </button>
                  </div>

                  <div className="text-center space-y-2">
                    <p className={`text-lg font-black uppercase tracking-widest ${isRecording ? 'text-red-400' : 'text-slate-400'}`}>
                      {isRecording ? 'Listening...' : 'Tap Mic To Talk'}
                    </p>
                    <p className="text-xs text-slate-600 font-medium">
                      {isRecording ? 'Click again when finished' : 'Schedules automatically based on note analysis'}
                    </p>
                  </div>

                  {/* Realtime Transcript view */}
                  {transcript && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-6 bg-white/5 border border-white/5 rounded-2xl text-left"
                    >
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Transcript Preview</p>
                      <p className="text-lg font-medium text-slate-200 leading-relaxed italic">"{transcript}"</p>
                      <div className="mt-4 flex justify-end">
                        <Button 
                          onClick={() => handleIntakeSubmit(transcript)}
                          className="bg-white text-indigo-600 hover:bg-slate-100 rounded-xl font-bold px-6 h-11"
                        >
                          Process Note <Send className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* Text Interface */
                <motion.div 
                  key="text-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-left"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Text Input Note</label>
                    <textarea 
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="e.g. Schedule call with Syed tomorrow at 2 PM to review TAGtargets, 30 minutes"
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-lg"
                    />
                  </div>
                  <Button 
                    onClick={() => handleIntakeSubmit(textInput)}
                    disabled={!textInput.trim()}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl disabled:opacity-50"
                  >
                    Process Note <Send className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Success Card view */}
        <AnimatePresence>
          {successTask && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
            >
              <Card className="bg-green-500/5 border border-green-500/20 rounded-[32px] overflow-hidden p-8 shadow-2xl text-left relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-2">
                    <Badge className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      successTask.calendar_event_id 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {successTask.calendar_event_id ? 'Synced to Calendar' : 'Saved to Backlog'}
                    </Badge>
                    {successTask.urgency && (
                      <Badge className={`${
                        successTask.urgency === 'Urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                        successTask.urgency === 'High' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                        'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      } px-3 py-1 text-xs font-bold uppercase tracking-wider`}>
                        {successTask.urgency} Urgency
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleDeleteTask(successTask.id)} 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-500 hover:text-red-400 h-8 px-2 rounded-lg"
                    title="Delete event and task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <h3 className="text-2xl font-black text-white mb-4 leading-snug">
                  {successTask.title}
                </h3>

                {successTask.scheduled_start && (
                  <div className="flex items-center gap-2 text-indigo-400 mb-6 bg-white/5 w-fit px-4 py-2 rounded-xl border border-white/5">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold text-sm">
                      {new Date(successTask.scheduled_start).toLocaleString(undefined, { 
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                      })}
                      {successTask.scheduled_end && ` - ${new Date(successTask.scheduled_end).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
                    </span>
                  </div>
                )}

                <div className="border-t border-white/5 pt-4 space-y-2">
                  <button 
                    onClick={() => setShowAiInsights(!showAiInsights)}
                    className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-1"
                  >
                    AI Custom Enhancements {showAiInsights ? '▲' : '▼'}
                  </button>
                  
                  {showAiInsights && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-sm text-slate-400 leading-relaxed font-medium bg-black/25 p-4 rounded-xl border border-white/5 space-y-2"
                    >
                      {successTask.notes && (
                        <div>
                          <span className="text-xs font-bold text-slate-600 block">AI Tweak Notes:</span>
                          <span className="whitespace-pre-wrap">{successTask.notes}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                        <div>
                          <span className="text-xs font-bold text-slate-600 block">Workstream:</span>
                          <span className="text-xs font-bold text-slate-300">{successTask.workstream || 'General'}</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-600 block">Client Context:</span>
                          <span className="text-xs font-bold text-slate-300">{successTask.client || 'None'}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Recent Feed Action history */}
      <section className="max-w-xl mx-auto space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Recent Sync History</h2>
        
        <div className="space-y-3">
          {isLoadingFeed ? (
            <div className="py-6 text-center text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div 
                key={task.id}
                className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all group"
              >
                <div className="space-y-1 overflow-hidden pr-4">
                  <p className="font-bold text-base text-slate-200 truncate">{task.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    {task.scheduled_start ? (
                      <span className="text-indigo-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.scheduled_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {' @ '}
                        {new Date(task.scheduled_start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span>Backlog</span>
                    )}
                    <span>•</span>
                    <span>{task.est_minutes} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {task.calendar_event_id && (
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[10px] font-bold px-2 py-0.5 rounded">
                      Synced
                    </Badge>
                  )}
                  <Button 
                    onClick={() => handleDeleteTask(task.id)}
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 rounded-full w-9 h-9 transition-opacity"
                    title="Delete scheduled event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl text-slate-600 font-medium text-sm">
              No recent syncs recorded.
            </div>
          )}
        </div>
      </section>

      {/* Connection Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <CalendarSyncModal
            calendarId={calendarId}
            setCalendarId={setCalendarId}
            icalFeedUrl={userId ? `${window.location.origin}/api/calendar/${userId}` : '...'}
            onSave={handleSaveCalendarSync}
            onClose={() => setShowSyncModal(false)}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
