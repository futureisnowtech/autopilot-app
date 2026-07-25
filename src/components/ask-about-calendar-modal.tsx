'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, X, CheckCircle2, AlertCircle, CalendarClock } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface AskAboutCalendarModalProps {
  onClose: () => void;
  onTasksChanged?: () => void;
}

const SUGGESTIONS = [
  "What's on my plate today?",
  "What do I have this week?",
  "Anything urgent I'm missing?",
  "Move my next meeting to tomorrow at 3 PM",
];

export default function AskAboutCalendarModal({ onClose, onTasksChanged }: AskAboutCalendarModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const ask = async (q: string) => {
    const finalQuestion = q.trim();
    if (!finalQuestion || isAsking) return;

    setIsAsking(true);
    setAnswer(null);
    setPendingAction(null);
    setActionResult(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: finalQuestion }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to get an answer');
      setAnswer(result.answer);
      if (result.action) {
        setPendingAction(result.action);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to ask about your calendar');
    } finally {
      setIsAsking(false);
    }
  };

  const executeAction = async () => {
    if (!pendingAction || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executeAction: pendingAction }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Action failed');
      setActionResult({ success: true, message: result.answer || 'Done!' });
      setPendingAction(null);
      toast.success('Calendar updated!');
      onTasksChanged?.();
    } catch (err: any) {
      setActionResult({ success: false, message: err.message });
      toast.error(err.message || 'Failed to execute action');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  const resetConversation = () => {
    setAnswer(null);
    setPendingAction(null);
    setActionResult(null);
    setQuestion('');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-lg bg-[#13132b] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">
              Ask or Update Your Calendar
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Ask questions, move events, reschedule tasks, or cancel items — all in plain language.
            </p>
          </div>

          {!answer && !isAsking && !actionResult && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuestion(s); ask(s); }}
                  className={`px-3 py-2 border rounded-full text-xs font-semibold transition-all ${
                    s.toLowerCase().startsWith('move')
                      ? 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/30 text-indigo-300 hover:text-indigo-200'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {s.toLowerCase().startsWith('move') && <CalendarClock className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
                  {s}
                </button>
              ))}
            </div>
          )}

          {isAsking && (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-semibold text-slate-400">Checking your schedule…</p>
            </div>
          )}

          {answer && !isAsking && (
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
            </div>
          )}

          {/* Pending Action Confirmation */}
          {pendingAction && !actionResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3"
            >
              <p className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Confirm Calendar Update
              </p>
              <p className="text-xs text-slate-300">
                {pendingAction.description || 'Apply the changes described above?'}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={executeAction}
                  disabled={isExecuting}
                  className="h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Update It'}
                </Button>
                <Button
                  onClick={() => setPendingAction(null)}
                  variant="ghost"
                  className="h-9 px-4 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {/* Action Result */}
          {actionResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border ${
                actionResult.success
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <p className={`text-sm font-bold flex items-center gap-2 ${
                actionResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {actionResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {actionResult.success ? 'Updated Successfully' : 'Update Failed'}
              </p>
              <p className="text-xs text-slate-300 mt-1">{actionResult.message}</p>
              <Button
                onClick={resetConversation}
                variant="ghost"
                className="mt-2 h-8 text-xs text-indigo-400 hover:text-indigo-300 font-bold px-0"
              >
                Ask something else →
              </Button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. &quot;Move my 2pm call to Thursday&quot; or &quot;What's my week look like?&quot;"
              rows={2}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
            <Button
              type="submit"
              disabled={!question.trim() || isAsking}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Ask or Command
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
