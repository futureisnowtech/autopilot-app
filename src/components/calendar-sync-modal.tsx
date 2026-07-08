'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type CalendarProvider = 'google' | 'apple' | 'outlook';

interface CalendarSyncModalProps {
  icalFeedUrl: string;
  onSave: (provider: CalendarProvider) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const GCAL_ADD_BY_URL = 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl';

// ─────────────────────────────────────────────
// Provider metadata
// ─────────────────────────────────────────────
const PROVIDERS: {
  id: CalendarProvider;
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
}[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    tagline: 'Subscribe to your live task feed. Auto-updates as Autopilot schedules.',
    badge: 'Recommended',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    gradient: 'from-blue-600/10 to-green-600/10',
    borderColor: 'border-blue-500/20',
  },
  {
    id: 'apple',
    name: 'Apple Calendar',
    tagline: 'Subscribe to your live task feed. Works on iPhone, iPad & Mac.',
    badge: 'Live Feed',
    badgeColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    gradient: 'from-slate-600/10 to-slate-500/10',
    borderColor: 'border-slate-500/20',
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    tagline: 'Subscribe to your live task feed. Works in Outlook & Microsoft 365.',
    badge: 'Live Feed',
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="2" fill="#0078D4"/>
        <rect x="6" y="7" width="5" height="5" rx="0.5" fill="white" fillOpacity="0.9"/>
        <rect x="13" y="7" width="5" height="5" rx="0.5" fill="white" fillOpacity="0.5"/>
        <rect x="6" y="14" width="5" height="4" rx="0.5" fill="white" fillOpacity="0.5"/>
        <rect x="13" y="14" width="5" height="4" rx="0.5" fill="white" fillOpacity="0.3"/>
      </svg>
    ),
    gradient: 'from-blue-700/10 to-blue-500/10',
    borderColor: 'border-blue-600/20',
  },
];

// ─────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────
export default function CalendarSyncModal({
  icalFeedUrl,
  onSave,
  onClose,
  isSaving = false,
}: CalendarSyncModalProps) {
  const [provider, setProvider] = useState<CalendarProvider | null>(null);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);

  const handleProviderSelect = (id: CalendarProvider) => {
    setProvider(id);
  };

  const handleBack = () => {
    setProvider(null);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-xl bg-[#13132b] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-4 shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white mb-0.5">
              {provider ? `Connect ${selectedProvider?.name}` : 'Connect Calendar'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {provider
                ? 'Follow the steps below to complete setup.'
                : 'Choose your calendar app to get started.'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-white/5 text-slate-500 shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="px-7 pb-7 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {/* ── Provider Picker ── */}
            {!provider && (
              <motion.div
                key="picker"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderSelect(p.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-br ${p.gradient} ${p.borderColor} hover:border-white/20 hover:bg-white/5 transition-all group text-left`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white group-hover:scale-105 transition-transform">
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-white font-bold text-sm">{p.name}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">{p.tagline}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
                  </button>
                ))}

                <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/15 rounded-xl mt-2">
                  <p className="text-xs text-indigo-300/70 leading-relaxed">
                    <span className="font-bold text-indigo-300">💡 Tip:</span> All providers use your private live task feed. Subscribe once and every task Autopilot schedules appears in your calendar automatically.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Google Calendar Flow ── */}
            {provider === 'google' && (
              <motion.div
                key="google-simple"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <InfoCard label="Add Your Feed to Google Calendar">
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Copy your feed URL, then paste it into Google Calendar.
                  </p>
                  <CopyBox label="Your Autopilot Feed URL" value={icalFeedUrl} />
                  <div className="p-3 mt-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2">
                    <span className="text-amber-400 text-xs mt-0.5">🔒</span>
                    <p className="text-xs text-amber-200/70 leading-relaxed">
                      Keep this URL private — it contains your tasks.
                    </p>
                  </div>
                </InfoCard>

                <div className="space-y-2 p-4 bg-black/30 border border-white/5 rounded-xl">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Steps:</p>
                  <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                    <li>Open <strong className="text-white">Google Calendar</strong></li>
                    <li>Go to <strong className="text-white">Settings → Add other calendars</strong></li>
                    <li>Click <strong className="text-white">Subscribe to calendar</strong></li>
                    <li>Paste your feed URL and click <strong className="text-white">Add calendar</strong></li>
                  </ol>
                </div>

                <Button
                  onClick={() => onSave('google')}
                  disabled={isSaving}
                  className="w-full h-11 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <>Done</>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="w-full text-slate-500 hover:text-white text-sm font-semibold px-2"
                >
                  ← Back
                </Button>
              </motion.div>
            )}

            {/* ── Apple Calendar Flow ── */}
            {provider === 'apple' && (
              <motion.div
                key="apple-simple"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <InfoCard label="Add Your Feed to Apple Calendar">
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Copy your feed URL, then paste it into Apple Calendar.
                  </p>
                  <CopyBox label="Your Autopilot iCal Feed URL" value={icalFeedUrl} />
                  <div className="p-3 mt-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2">
                    <span className="text-amber-400 text-xs mt-0.5">🔒</span>
                    <p className="text-xs text-amber-200/70 leading-relaxed">
                      Keep this URL private — it contains your tasks.
                    </p>
                  </div>
                </InfoCard>

                <div className="space-y-3">
                  <div className="space-y-2 p-4 bg-black/30 border border-white/5 rounded-xl">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">iPhone / iPad:</p>
                    <ol className="space-y-1 text-xs text-slate-400 list-decimal list-inside">
                      <li>Settings → <strong className="text-white">Calendar</strong></li>
                      <li>Tap <strong className="text-white">Accounts → Add Account → Other</strong></li>
                      <li>Tap <strong className="text-white">Add Subscribed Calendar</strong> and paste URL</li>
                    </ol>
                  </div>

                  <div className="space-y-2 p-4 bg-black/30 border border-white/5 rounded-xl">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Mac:</p>
                    <ol className="space-y-1 text-xs text-slate-400 list-decimal list-inside">
                      <li>Calendar app → <strong className="text-white">File → New Calendar Subscription</strong></li>
                      <li>Paste URL and click <strong className="text-white">Subscribe</strong></li>
                    </ol>
                  </div>
                </div>

                <Button
                  onClick={() => onSave('apple')}
                  disabled={isSaving}
                  className="w-full h-11 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all"
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <>Done</>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="w-full text-slate-500 hover:text-white text-sm font-semibold px-2"
                >
                  ← Back
                </Button>
              </motion.div>
            )}

            {/* ── Outlook Calendar Flow ── */}
            {provider === 'outlook' && (
              <motion.div
                key="outlook-simple"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <InfoCard label="Add Your Feed to Outlook">
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Copy your feed URL, then paste it into Outlook.
                  </p>
                  <CopyBox label="Your Autopilot iCal Feed URL" value={icalFeedUrl} />
                  <div className="p-3 mt-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2">
                    <span className="text-amber-400 text-xs mt-0.5">🔒</span>
                    <p className="text-xs text-amber-200/70 leading-relaxed">
                      Keep this URL private — it contains your tasks.
                    </p>
                  </div>
                </InfoCard>

                <div className="space-y-3">
                  <div className="space-y-2 p-4 bg-black/30 border border-white/5 rounded-xl">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Outlook Web (outlook.com):</p>
                    <ol className="space-y-1 text-xs text-slate-400 list-decimal list-inside">
                      <li>Calendar → <strong className="text-white">Add calendar → Subscribe from web</strong></li>
                      <li>Paste URL and click <strong className="text-white">Import</strong></li>
                    </ol>
                  </div>

                  <div className="space-y-2 p-4 bg-black/30 border border-white/5 rounded-xl">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Outlook Desktop:</p>
                    <ol className="space-y-1 text-xs text-slate-400 list-decimal list-inside">
                      <li>Calendar view → <strong className="text-white">Add Calendar → From Internet</strong></li>
                      <li>Paste URL and click <strong className="text-white">OK</strong></li>
                    </ol>
                  </div>

                  <div className="space-y-2 p-4 bg-black/30 border border-white/5 rounded-xl">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Outlook Mobile:</p>
                    <ol className="space-y-1 text-xs text-slate-400 list-decimal list-inside">
                      <li>Calendar icon → <strong className="text-white">Add shared calendar → Add via link</strong></li>
                      <li>Paste URL and tap <strong className="text-white">Add</strong></li>
                    </ol>
                  </div>
                </div>

                <Button
                  onClick={() => onSave('outlook')}
                  disabled={isSaving}
                  className="w-full h-11 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white font-bold rounded-xl text-sm shadow-lg transition-all"
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <>Done</>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="w-full text-slate-500 hover:text-white text-sm font-semibold px-2"
                >
                  ← Back
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-white/[0.04] border border-white/5 rounded-2xl space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{label}</p>
      {children}
    </div>
  );
}

function CopyBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">{label}</p>
      <div className="flex items-center gap-2 bg-black/40 border border-white/8 rounded-xl px-4 py-3">
        <code className="text-[11px] text-slate-300 flex-1 truncate select-all font-mono">{value}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success('Copied to clipboard!');
          }}
          className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

