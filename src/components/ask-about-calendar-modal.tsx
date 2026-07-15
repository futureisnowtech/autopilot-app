'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface AskAboutCalendarModalProps {
  onClose: () => void;
}

const SUGGESTIONS = [
  "What's on my plate today?",
  "What do I have this week?",
  "Anything urgent I'm missing?",
];

export default function AskAboutCalendarModal({ onClose }: AskAboutCalendarModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const ask = async (q: string) => {
    const finalQuestion = q.trim();
    if (!finalQuestion || isAsking) return;

    setIsAsking(true);
    setAnswer(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: finalQuestion }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to get an answer');
      setAnswer(result.answer);
    } catch (err: any) {
      toast.error(err.message || 'Failed to ask about your calendar');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(question);
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
              Ask About Your Calendar
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Ask in plain language — no need to go dig through your calendar yourself.
            </p>
          </div>

          {!answer && !isAsking && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuestion(s); ask(s); }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-slate-300 hover:text-white transition-all"
                >
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

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What do I have going on tomorrow?"
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
                  <Send className="w-4 h-4" /> Ask
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
