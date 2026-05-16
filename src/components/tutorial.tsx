'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';

interface Step {
  target: string;
  title: string;
  content: string;
}

const STEPS: Step[] = [
  {
    target: 'intake-input',
    title: 'The Intake Engine',
    content: "This is where the magic starts. Type any thought, task, or 'AI DO: [task]' to delegate work to your assistant. It even handles raw voice transcripts."
  },
  {
    target: 'immediate-focus',
    title: 'Immediate Focus',
    content: "The AI automatically ranks your most high-leverage task here. Focus on this, and let the autopilot handle the noise."
  },
  {
    target: 'sync-calendar-btn',
    title: 'Mobile Autonomy',
    content: "Sync your assistant with your iPhone or Google Calendar. Scheduled tasks will appear on your phone instantly."
  },
  {
    target: 'style-guide-nav',
    title: 'The AI Brain',
    content: "Configure your delivery preferences in the Style Guide. The more you add, the smarter your assistant becomes."
  }
];

export default function Tutorial({ onComplete, userId }: { onComplete: () => void, userId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      const el = document.getElementById(STEPS[currentStep].target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [currentStep]);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark tutorial as completed in Supabase
      const { data: profile } = await supabase.from('profiles').select('settings').eq('id', userId).single();
      const newSettings = { ...(profile?.settings || {}), tutorial_completed: true };
      await supabase.from('profiles').update({ settings: newSettings }).eq('id', userId);
      onComplete();
    }
  };

  if (!targetRect) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dimmed Overlay with cutout */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-500" style={{
        clipPath: `polygon(
          0% 0%, 
          0% 100%, 
          ${targetRect.left - 10}px 100%, 
          ${targetRect.left - 10}px ${targetRect.top - 10}px, 
          ${targetRect.right + 10}px ${targetRect.top - 10}px, 
          ${targetRect.right + 10}px ${targetRect.bottom + 10}px, 
          ${targetRect.left - 10}px ${targetRect.bottom + 10}px, 
          ${targetRect.left - 10}px 100%, 
          100% 100%, 
          100% 0%
        )`
      }} />

      {/* Tutorial Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          left: targetRect.left,
          top: targetRect.bottom + 20
        }}
        className="absolute w-80 bg-indigo-600 rounded-3xl p-8 shadow-2xl pointer-events-auto"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Step {currentStep + 1} of {STEPS.length}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 leading-tight">{STEPS[currentStep].title}</h3>
        <p className="text-indigo-100/80 text-sm leading-relaxed mb-6">
          {STEPS[currentStep].content}
        </p>
        <div className="flex gap-2">
          <Button onClick={handleNext} className="flex-1 h-12 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold">
            {currentStep === STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}
          </Button>
          <Button variant="ghost" onClick={onComplete} className="h-12 w-12 rounded-xl text-indigo-100 hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
