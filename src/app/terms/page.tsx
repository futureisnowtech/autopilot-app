import Link from 'next/link';

// Placeholder — swap this content for the real Terms of Service the
// business already has, before taking payments or running paid ads.
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">← Back home</Link>
        <h1 className="text-4xl font-black tracking-tight mt-6 mb-4">Terms of Service</h1>
        <p className="text-slate-400 leading-relaxed">
          This page is a placeholder. Replace this content with TaskMinder&apos;s actual
          Terms of Service (including the refund policy) before accepting payments
          or running paid ads.
        </p>
      </div>
    </div>
  );
}
