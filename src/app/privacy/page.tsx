import Link from 'next/link';

// Placeholder — swap this content for the real Privacy Policy the business
// already has. Needed live before: Stripe checkout, Google OAuth sensitive-
// scope verification (they require a public URL to this exact page), and
// any Google/Meta ad approval.
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">← Back home</Link>
        <h1 className="text-4xl font-black tracking-tight mt-6 mb-4">Privacy Policy</h1>
        <p className="text-slate-400 leading-relaxed">
          This page is a placeholder. Replace this content with TaskMinder&apos;s actual
          Privacy Policy before accepting payments, submitting for Google OAuth
          verification, or running paid ads — all three require a real, public
          policy at this URL.
        </p>
      </div>
    </div>
  );
}
