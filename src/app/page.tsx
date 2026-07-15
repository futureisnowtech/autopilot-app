import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Calendar, Target, Sparkles } from 'lucide-react';
import AddToHomeScreenButton from '@/components/add-to-home-screen';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0d0d1f]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Autopilot</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/auth" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/auth" className="px-5 py-2.5 bg-white text-[#0d0d1f] rounded-full text-sm font-semibold hover:bg-slate-200 transition-all">
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8">
            <Zap className="w-3 h-3" />
            <span>Built for busy humans, not power users</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Just say it. <br />
            <span className="text-indigo-500">We'll find the time.</span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            For everyone with too much in their head — the busy founder and the busy
            Tuesday alike. Text it, say it, screenshot it. Autopilot finds where it
            fits on your calendar and books it. No boards to build. No workflows to
            learn. No dashboard to babysit.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link href="/auth" className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
            <AddToHomeScreenButton />
          </div>
          <p className="text-sm text-slate-500 mt-6">Free forever for personal use.</p>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto mt-40 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calendar className="w-6 h-6 text-indigo-400" />}
            title="It finds the time"
            description="Tell it what needs to happen. Autopilot checks your real calendar, works around what's already there, and books it — travel and buffer time included."
          />
          <FeatureCard
            icon={<Target className="w-6 h-6 text-purple-400" />}
            title="It can just do it"
            description="Some things don't need scheduling, they need doing. For those, Autopilot can research, write, and hand you a finished doc — no extra app, no extra step."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-amber-400" />}
            title="Talk to it like a person"
            description="Voice note, text, or a screenshot of a group chat — say it however's easiest, and watch it turn into something scheduled."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-slate-500 text-sm">
            © 2026 Autopilot AI. Built for the future.
          </div>
          <div className="flex gap-8 text-slate-400 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
