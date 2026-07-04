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
  Link2,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type CalendarProvider = 'google' | 'apple' | 'outlook';

interface CalendarSyncModalProps {
  calendarId: string;
  setCalendarId: (v: string) => void;
  icalFeedUrl: string;
  onSave: (provider: CalendarProvider) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SERVICE_EMAIL = 'autopilot-sync@autopilot-app-496415.iam.gserviceaccount.com';
const GCAL_SETTINGS_URL = 'https://calendar.google.com/calendar/u/0/r/settings';

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
    tagline: 'Two-way sync. AI pushes events directly into your calendar.',
    badge: 'Full Autopilot',
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
  calendarId,
  setCalendarId,
  icalFeedUrl,
  onSave,
  onClose,
  isSaving = false,
}: CalendarSyncModalProps) {
  const [provider, setProvider] = useState<CalendarProvider | null>(null);
  const [step, setStep] = useState(1);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);

  const handleProviderSelect = (id: CalendarProvider) => {
    setProvider(id);
    setStep(1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      setProvider(null);
    }
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
                    <span className="font-bold text-indigo-300">💡 Tip:</span> Google Calendar has the deepest integration — Autopilot pushes events directly into it. Apple and Outlook use a live subscription feed that auto-updates.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Google Calendar Flow ── */}
            {provider === 'google' && (
              <motion.div
                key={`google-step-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Step tabs */}
                <GoogleStepTabs step={step} />

                {step === 1 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 1 of 3 — Open Google Calendar Settings">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        You need to go to your <strong className="text-white">Google Calendar Settings</strong> page to share your calendar with Autopilot&apos;s AI engine.
                      </p>
                      <div className="p-4 bg-black/30 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed space-y-2 mt-1">
                        <p className="font-bold text-slate-300">What you&apos;ll do on that page:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                          <li>In the left sidebar, click on the calendar you want to use (usually your primary calendar — your email).</li>
                          <li>Scroll to <span className="text-white font-semibold">&quot;Share with specific people or groups&quot;</span>.</li>
                          <li>Add Autopilot&apos;s service email with &quot;Make changes to events&quot; permission.</li>
                        </ol>
                      </div>
                      <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2 mt-1">
                        <span className="text-amber-400 text-xs mt-0.5">⚠️</span>
                        <p className="text-xs text-amber-200/70 leading-relaxed">
                          That button opens Google Calendar Settings — it does <strong>not</strong> connect automatically. You still need to share the calendar on that page.
                        </p>
                      </div>
                    </InfoCard>
                    <OpenSettingsBtn url={GCAL_SETTINGS_URL} label="Open Google Calendar Settings" />
                    <p className="text-center text-xs text-slate-600">Keep this tab open, then come back for Step 2.</p>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 2 of 3 — Share Your Calendar">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Share your calendar with Autopilot&apos;s service account so it can create and manage events on your behalf.
                      </p>
                      <div className="space-y-2 mt-1">
                        <MiniStep letter="A" title="Select your calendar">
                          In the left sidebar, click the name of the calendar you want Autopilot to schedule into (usually your email address / primary calendar).
                        </MiniStep>
                        <MiniStep letter="B" title={<>Find &ldquo;Share with specific people&rdquo;</>}>
                          Scroll down to the section titled <span className="text-white font-semibold">&quot;Share with specific people or groups&quot;</span> and click{' '}
                          <span className="bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded text-[11px] font-bold">+ Add people</span>.
                        </MiniStep>
                        <MiniStep letter="C" title="Add the service email & set permission">
                          Paste the email below. Set permission to <span className="text-white font-semibold">"Make changes to events"</span> — not just "See all event details". Then press Send.
                        </MiniStep>
                      </div>
                    </InfoCard>

                    <CopyBox label="Autopilot Service Email" value={SERVICE_EMAIL} />
                    <OpenSettingsBtn url={GCAL_SETTINGS_URL} label="Re-open Google Calendar Settings" ghost />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 3 of 3 — Enter Your Calendar ID">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Tell Autopilot <em>which</em> calendar to schedule into by entering your Calendar ID.
                      </p>
                      <div className="space-y-2 mt-1">
                        <MiniStep letter="A" title="Your primary calendar (most common)">
                          Your Calendar ID is your <strong className="text-white">Gmail address</strong> (e.g. <code className="text-indigo-300 text-[11px]">yourname@gmail.com</code>). Try that first.
                        </MiniStep>
                        <MiniStep letter="B" title="For a secondary calendar">
                          On the Google Calendar Settings page, scroll to <span className="text-white font-semibold">&quot;Integrate calendar&quot;</span>. Your Calendar ID is shown there — it usually ends in <code className="text-slate-300 text-[11px]">@group.calendar.google.com</code>.
                        </MiniStep>
                      </div>
                    </InfoCard>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                        Your Google Calendar ID
                      </label>
                      <input
                        value={calendarId}
                        onChange={(e) => setCalendarId(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm font-semibold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <Button
                      onClick={() => onSave('google')}
                      disabled={!calendarId.trim() || isSaving}
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" />Connect Google Calendar</>
                      )}
                    </Button>
                  </div>
                )}

                {/* Nav */}
                <ModalNav
                  step={step}
                  totalSteps={3}
                  onBack={handleBack}
                  onNext={step < 3 ? () => setStep((s) => s + 1) : undefined}
                />
              </motion.div>
            )}

            {/* ── Apple Calendar Flow ── */}
            {provider === 'apple' && (
              <motion.div
                key={`apple-step-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <ICalStepTabs step={step} />

                {step === 1 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 1 of 3 — How Apple Calendar Sync Works">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Apple Calendar supports <strong className="text-white">iCal feed subscriptions</strong> — a live URL that Apple Calendar polls regularly. Every task Autopilot schedules automatically appears in your calendar.
                      </p>
                      <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-2 mt-1">
                        <p className="text-xs font-bold text-slate-300">What this means for you:</p>
                        <ul className="space-y-1.5 text-xs text-slate-400">
                          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Your Autopilot tasks appear in Apple Calendar automatically</li>
                          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Works on iPhone, iPad, and Mac</li>
                          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />No password or special permissions required</li>
                          <li className="flex items-start gap-2"><span className="text-slate-600 text-xs shrink-0 mt-0.5">→</span><span className="text-slate-500">Updates may take up to 15 minutes to appear (Apple&apos;s refresh rate)</span></li>
                        </ul>
                      </div>
                    </InfoCard>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 2 of 3 — Copy Your Feed URL">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        This is your private Autopilot iCal feed. Copy the URL below — you&apos;ll paste it into Apple Calendar in the next step.
                      </p>
                    </InfoCard>
                    <CopyBox label="Your Autopilot iCal Feed URL" value={icalFeedUrl} />
                    <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2">
                      <span className="text-amber-400 text-xs mt-0.5">🔒</span>
                      <p className="text-xs text-amber-200/70 leading-relaxed">
                        Keep this URL private — it contains your tasks. Anyone with this URL can view your scheduled events.
                      </p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 3 of 3 — Subscribe in Apple Calendar">
                      <p className="text-slate-300 text-sm leading-relaxed mb-2">
                        Choose your device and follow the steps:
                      </p>
                      <DeviceTabs
                        tabs={[
                          {
                            label: '📱 iPhone / iPad',
                            content: (
                              <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                                <li>Open the <strong className="text-white">Settings</strong> app</li>
                                <li>Tap <strong className="text-white">Calendar</strong> → <strong className="text-white">Accounts</strong></li>
                                <li>Tap <strong className="text-white">Add Account</strong> → <strong className="text-white">Other</strong></li>
                                <li>Tap <strong className="text-white">Add Subscribed Calendar</strong></li>
                                <li>Paste your feed URL and tap <strong className="text-white">Next</strong></li>
                                <li>Tap <strong className="text-white">Save</strong> — done!</li>
                              </ol>
                            ),
                          },
                          {
                            label: '💻 Mac',
                            content: (
                              <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                                <li>Open the <strong className="text-white">Calendar</strong> app</li>
                                <li>Click <strong className="text-white">File</strong> → <strong className="text-white">New Calendar Subscription…</strong></li>
                                <li>Paste your feed URL and click <strong className="text-white">Subscribe</strong></li>
                                <li>Name it &quot;Autopilot Tasks&quot; and click <strong className="text-white">OK</strong></li>
                              </ol>
                            ),
                          },
                        ]}
                      />
                    </InfoCard>

                    <Button
                      onClick={() => onSave('apple')}
                      disabled={isSaving}
                      className="w-full h-11 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all"
                    >
                      {isSaving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" />Mark Apple Calendar as Connected</>
                      )}
                    </Button>
                  </div>
                )}

                <ModalNav
                  step={step}
                  totalSteps={3}
                  onBack={handleBack}
                  onNext={step < 3 ? () => setStep((s) => s + 1) : undefined}
                />
              </motion.div>
            )}

            {/* ── Outlook Calendar Flow ── */}
            {provider === 'outlook' && (
              <motion.div
                key={`outlook-step-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <ICalStepTabs step={step} />

                {step === 1 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 1 of 3 — How Outlook Calendar Sync Works">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Outlook supports <strong className="text-white">calendar subscriptions via iCal URL</strong>. Your scheduled tasks will appear as a separate subscribed calendar inside Outlook.
                      </p>
                      <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-2 mt-1">
                        <p className="text-xs font-bold text-slate-300">What this means for you:</p>
                        <ul className="space-y-1.5 text-xs text-slate-400">
                          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />Tasks show up in Outlook, Teams, and Microsoft 365</li>
                          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />Works in Outlook desktop, web (outlook.com), and mobile</li>
                          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />No Microsoft account login required from Autopilot</li>
                          <li className="flex items-start gap-2"><span className="text-slate-600 text-xs shrink-0 mt-0.5">→</span><span className="text-slate-500">Outlook refreshes subscriptions approximately every 3 hours</span></li>
                        </ul>
                      </div>
                    </InfoCard>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 2 of 3 — Copy Your Feed URL">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        This is your private Autopilot iCal feed. Copy the URL below — you&apos;ll paste it into Outlook in the next step.
                      </p>
                    </InfoCard>
                    <CopyBox label="Your Autopilot iCal Feed URL" value={icalFeedUrl} />
                    <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2">
                      <span className="text-amber-400 text-xs mt-0.5">🔒</span>
                      <p className="text-xs text-amber-200/70 leading-relaxed">
                        Keep this URL private — it contains your scheduled tasks. Anyone with it can see your Autopilot events.
                      </p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <InfoCard label="Step 3 of 3 — Subscribe in Outlook">
                      <p className="text-slate-300 text-sm leading-relaxed mb-2">
                        Choose your Outlook version and follow the steps:
                      </p>
                      <DeviceTabs
                        tabs={[
                          {
                            label: '🌐 Outlook Web',
                            content: (
                              <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                                <li>Go to <strong className="text-white">outlook.com</strong> → <strong className="text-white">Calendar</strong></li>
                                <li>Click <strong className="text-white">Add calendar</strong> (left sidebar)</li>
                                <li>Select <strong className="text-white">Subscribe from web</strong></li>
                                <li>Paste your feed URL</li>
                                <li>Name it <strong className="text-white">&quot;Autopilot Tasks&quot;</strong> and click <strong className="text-white">Import</strong></li>
                              </ol>
                            ),
                          },
                          {
                            label: '🖥️ Outlook Desktop',
                            content: (
                              <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                                <li>Open <strong className="text-white">Outlook</strong> → <strong className="text-white">Calendar</strong> view</li>
                                <li>Click <strong className="text-white">Add Calendar</strong> in the toolbar</li>
                                <li>Choose <strong className="text-white">From Internet…</strong></li>
                                <li>Paste your feed URL and click <strong className="text-white">OK</strong></li>
                                <li>Click <strong className="text-white">Yes</strong> when prompted to add the subscription</li>
                              </ol>
                            ),
                          },
                          {
                            label: '📱 Outlook Mobile',
                            content: (
                              <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                                <li>Open the <strong className="text-white">Outlook</strong> app → tap the calendar icon</li>
                                <li>Tap the <strong className="text-white">+</strong> button → <strong className="text-white">Add shared calendar</strong></li>
                                <li>Choose <strong className="text-white">Add via link</strong></li>
                                <li>Paste your feed URL and tap <strong className="text-white">Add</strong></li>
                              </ol>
                            ),
                          },
                        ]}
                      />
                    </InfoCard>

                    <Button
                      onClick={() => onSave('outlook')}
                      disabled={isSaving}
                      className="w-full h-11 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white font-bold rounded-xl text-sm shadow-lg transition-all"
                    >
                      {isSaving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" />Mark Outlook as Connected</>
                      )}
                    </Button>
                  </div>
                )}

                <ModalNav
                  step={step}
                  totalSteps={3}
                  onBack={handleBack}
                  onNext={step < 3 ? () => setStep((s) => s + 1) : undefined}
                />
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

function MiniStep({ letter, title, children }: { letter: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 bg-black/25 border border-white/5 rounded-xl">
      <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black flex items-center justify-center border border-indigo-500/30 mt-0.5">
        {letter}
      </span>
      <div>
        <p className="text-white text-xs font-bold mb-0.5">{title}</p>
        <p className="text-slate-400 text-[11px] leading-relaxed">{children}</p>
      </div>
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

function OpenSettingsBtn({ url, label, ghost = false }: { url: string; label: string; ghost?: boolean }) {
  return (
    <button
      onClick={() => window.open(url, '_blank')}
      className={`w-full flex items-center justify-center gap-2 py-3 font-semibold rounded-xl transition-all text-sm ${
        ghost
          ? 'border border-white/8 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5'
          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20'
      }`}
    >
      <ExternalLink className="w-4 h-4" />
      {label}
    </button>
  );
}

function GoogleStepTabs({ step }: { step: number }) {
  const labels = ['Open Settings', 'Share Calendar', 'Enter ID'];
  return <StepTabRow labels={labels} step={step} />;
}

function ICalStepTabs({ step }: { step: number }) {
  const labels = ['How it works', 'Copy URL', 'Subscribe'];
  return <StepTabRow labels={labels} step={step} />;
}

function StepTabRow({ labels, step }: { labels: string[]; step: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      {labels.map((label, i) => {
        const s = i + 1;
        return (
          <React.Fragment key={s}>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                step === s
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                  : step > s
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'text-slate-600 border-white/5'
              }`}
            >
              {step > s ? <CheckCircle2 className="w-3 h-3" /> : <span>{s}</span>}
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-px ${step > s ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ModalNav({
  step,
  totalSteps,
  onBack,
  onNext,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5">
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-slate-500 hover:text-white gap-1 text-sm font-semibold px-2"
      >
        <ChevronLeft className="w-4 h-4" />
        {step === 1 ? 'Change Provider' : 'Back'}
      </Button>
      <span className="text-xs text-slate-700 font-bold">{step} / {totalSteps}</span>
      {onNext ? (
        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1 text-sm font-bold px-4 rounded-xl"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      ) : (
        <div className="w-20" />
      )}
    </div>
  );
}

function DeviceTabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
              active === i
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'text-slate-600 border-white/5 hover:text-slate-400 hover:border-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3.5 bg-black/30 border border-white/5 rounded-xl">
        {tabs[active].content}
      </div>
    </div>
  );
}
