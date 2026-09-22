import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Calendar, Target, Sparkles, X, Check } from 'lucide-react';
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
            <span className="text-xl font-bold tracking-tight">Sayso</span>
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
            <span className="text-indigo-500">We&apos;ll find the time.</span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            You&apos;ve downloaded the productivity app. Built the boards. Labeled the projects.
            Two weeks later you&apos;re back to sticky notes, because the system needed you to
            feed it and you never had that hour to spare. Sayso works backwards from that —
            say what&apos;s on your mind, once, and it does the organizing.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link href="/auth" className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
            <AddToHomeScreenButton />
          </div>
          <p className="text-sm text-slate-500 mt-6">Free forever for personal use.</p>
        </div>

        {/* Problem Section */}
        <div className="max-w-5xl mx-auto mt-40 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            It&apos;s not you. <span className="text-slate-500">It&apos;s the tools.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed">
            Every tool built to make you less scattered ends up asking you to become its
            project manager first. That&apos;s the trap.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <PainCard
              title="You have to build the system before it helps you"
              body="Boards, labels, priorities, recurring rules — hours of setup before the tool does anything for you. Most people never finish it. The ones who do spend more time maintaining it than using it."
            />
            <PainCard
              title="The AI only shows up once you're already in the app"
              body="Gmail's AI helps with the email you already opened. Calendar's AI helps with the event you already started. Neither one hears the thought you had in the car, or the screenshot of a group chat that actually has the real plan in it."
            />
            <PainCard
              title="Scheduling isn't the same as doing"
              body="A tool that finds you a meeting slot hasn't done the work the meeting was about. Most 'AI productivity' stops at the calendar and hands the actual task back to you."
            />
          </div>
        </div>

        {/* Competitor Comparison Section */}
        <div className="max-w-6xl mx-auto mt-40">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              Why not just use what you&apos;ve already got?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Here&apos;s exactly what each one still requires of you — and what Sayso doesn&apos;t.
            </p>
          </div>

          <div className="space-y-4">
            <CompetitorRow
              name="Motion / Reclaim"
              theyRequire="Build the task list, set priorities, tune the auto-scheduling rules — before it schedules anything for you."
              saysoInstead="No task list to build. Say it once. It's already scheduled."
            />
            <CompetitorRow
              name="Todoist / Notion / ClickUp"
              theyRequire="Someone still has to write the item, pick the project, set the priority, and open the app to check it."
              saysoInstead="Voice note, text, or a screenshot. Zero categorizing. It shows up organized."
            />
            <CompetitorRow
              name={`Gmail's / Calendar's built-in AI`}
              theyRequire="Only activates once you're already inside Gmail or Calendar, on something already typed into an email or event box."
              saysoInstead="Works on a voice memo from your car or a screenshot of a group chat — nothing has to already be in an app first."
            />
            <CompetitorRow
              name="A human executive assistant"
              theyRequire="$4,000–6,000+/month, business hours only, and everything still has to be spelled out clearly."
              saysoInstead="From $0/month, works at 11pm, and only needs three words to act on."
            />
          </div>
        </div>

        {/* USP / Solution Grid */}
        <div className="max-w-7xl mx-auto mt-40">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-16 text-center">
            What Sayso actually does differently
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-amber-400" />}
              title="No setup. Ever."
              description="No boards, no projects to create, no rules to configure first. Voice, text, or a screenshot — say it however's easiest, and it's already organized. Nothing to open, nothing to maintain."
            />
            <FeatureCard
              icon={<Target className="w-6 h-6 text-purple-400" />}
              title="It doesn't just schedule. It executes."
              description="Some things don't need a calendar slot, they need doing. For those, Sayso researches, writes, and hands you a finished document — no extra app, no extra step."
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-indigo-400" />}
              title="Books around your actual life"
              description="Not a list of times for you to pick from. It checks your real calendar, respects your work hours and weekends, adds travel and buffer time, and books it — done, not pending."
            />
          </div>
        </div>

        {/* Closing CTA */}
        <div className="max-w-3xl mx-auto mt-40 text-center">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Stop managing the tool.<br />Start saying the thing.
          </h2>
          <Link href="/auth" className="inline-flex mt-6 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 mt-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-slate-500 text-sm">
            © 2026 Sayso AI. Built for the future.
          </div>
          <div className="flex gap-8 text-slate-400 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Refunds</Link>
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

function PainCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
      <h3 className="font-bold text-white mb-3 leading-snug">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}

function CompetitorRow({ name, theyRequire, saysoInstead }: { name: string; theyRequire: string; saysoInstead: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6 md:p-8 grid grid-cols-1 md:grid-cols-[180px_1fr_1fr] gap-4 md:gap-8 items-start">
      <div className="font-black text-lg text-slate-200">{name}</div>
      <div className="flex gap-3">
        <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-400 leading-relaxed">{theyRequire}</p>
      </div>
      <div className="flex gap-3">
        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300 leading-relaxed">{saysoInstead}</p>
      </div>
    </div>
  );
}
