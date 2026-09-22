import Link from 'next/link';

export function LegalDocLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">← Back home</Link>
        <h1 className="text-4xl font-black tracking-tight mt-6 mb-1">{title}</h1>
        <p className="text-xs text-slate-500 mb-8">Last updated: {updated}</p>
        <div className="space-y-6 text-slate-400 leading-relaxed [&_h2]:text-white [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-2 [&_a]:underline [&_a]:hover:text-white">
          {children}
        </div>
      </div>
    </div>
  );
}

// Visually flags a blank only the business owner can fill in (legal entity
// name, jurisdiction, etc.) so it stays obvious in the live page instead of
// silently shipping an incomplete document.
export function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="text-amber-400 font-bold">[{children}]</span>;
}
