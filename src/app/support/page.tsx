import Link from 'next/link';

// Placeholder — wire up a real support channel (email address, help desk,
// contact form) before sending ad traffic here.
export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">← Back home</Link>
        <h1 className="text-4xl font-black tracking-tight mt-6 mb-4">Support</h1>
        <p className="text-slate-400 leading-relaxed">
          Need help? Reach out and we&apos;ll get back to you.
        </p>
        <p className="text-slate-400 leading-relaxed mt-4">
          TODO: replace with a real support email/contact form before launch.
        </p>
      </div>
    </div>
  );
}
