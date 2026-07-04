import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
        <Sparkles className="w-9 h-9 text-white" />
      </div>
      <h1 className="text-8xl font-black tracking-tight text-indigo-500 mb-4">404</h1>
      <p className="text-2xl font-bold text-white mb-2">Page not found</p>
      <p className="text-slate-400 mb-10 max-w-sm">This route doesn&apos;t exist in the command center. Let&apos;s get you back on track.</p>
      <Link href="/" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-indigo-500/20">
        Return to Base
      </Link>
    </div>
  );
}
