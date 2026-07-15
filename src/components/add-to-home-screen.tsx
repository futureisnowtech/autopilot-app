'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Share, MoreVertical, PlusSquare, X } from 'lucide-react';
import { Button } from './ui/button';

type Platform = 'ios' | 'android' | 'other';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectPlatform(): Platform {
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's own (non-standard) flag for "launched from home screen"
    (window.navigator as any).standalone === true
  );
}

export default function AddToHomeScreenButton() {
  const [platform, setPlatform] = useState<Platform>('other');
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all"
      >
        <Smartphone className="w-4 h-4" />
        Add App to Phone
      </button>

      {showModal && (
        <AddToHomeScreenModal platform={platform} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function AddToHomeScreenModal({ platform, onClose }: { platform: Platform; onClose: () => void }) {
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
        className="relative w-full max-w-md bg-[#13132b] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">
              Add Autopilot to Your Home Screen
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Get it on your phone like any other app — one tap and you're capturing tasks.
            </p>
          </div>

          {platform === 'ios' && (
            <div className="space-y-3">
              <Step
                icon={<Share className="w-5 h-5" />}
                text={<>Tap the <strong className="text-white">Share</strong> icon in Safari's toolbar.</>}
              />
              <Step
                icon={<PlusSquare className="w-5 h-5" />}
                text={<>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</>}
              />
              <Step
                icon={<Smartphone className="w-5 h-5" />}
                text={<>Tap <strong className="text-white">Add</strong> — Autopilot now lives on your home screen.</>}
              />
            </div>
          )}

          {platform === 'android' && (
            <div className="space-y-3">
              <Step
                icon={<MoreVertical className="w-5 h-5" />}
                text={<>Tap the <strong className="text-white">⋮ menu</strong> in your browser's toolbar.</>}
              />
              <Step
                icon={<PlusSquare className="w-5 h-5" />}
                text={<>Tap <strong className="text-white">Add to Home screen</strong> or <strong className="text-white">Install app</strong>.</>}
              />
              <Step
                icon={<Smartphone className="w-5 h-5" />}
                text={<>Confirm — Autopilot now lives on your home screen.</>}
              />
            </div>
          )}

          {platform === 'other' && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-sm text-slate-300 leading-relaxed">
                Open this page on your phone's browser, then use this same button — your phone
                will walk you through adding it to your home screen.
              </p>
            </div>
          )}

          <Button
            onClick={onClose}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg"
          >
            Got it
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Step({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
        {icon}
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}
