'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'ad_tracking_consent';

export type ConsentState = 'granted' | 'denied' | null;

export function getStoredConsent(): ConsentState {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

// Ad conversion tracking (Google/Meta) only loads after explicit consent —
// required for Meta Pixel + any EU/UK visitor under GDPR, and cheap
// insurance for Google Ads too. Banner shows once; the choice persists
// per-browser and a page reload is enough for the tracking scripts to
// pick up a change.
export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>('granted');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    setMounted(true);
  }, []);

  if (!mounted || consent !== null) return null;

  const choose = (value: 'granted' | 'denied') => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // localStorage unavailable — consent choice won't persist, but
      // trackers still won't load this session since consent state stays null.
    }
    setConsent(value);
    if (value === 'granted') window.location.reload();
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 bg-[#0d0d1f]/95 backdrop-blur-md border-t border-white/10">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-xs text-slate-400 flex-1 text-center sm:text-left">
          We use cookies for analytics and ad performance tracking. See our{' '}
          <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={() => choose('denied')}
            variant="ghost"
            className="h-9 px-4 text-xs font-bold text-slate-400 hover:text-white"
          >
            Decline
          </Button>
          <Button
            onClick={() => choose('granted')}
            className="h-9 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
