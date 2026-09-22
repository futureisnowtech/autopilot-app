import { LegalDocLayout } from '@/components/legal-doc';

// Drafted from the app's actual data flows (Gemini processing, Google
// Calendar OAuth, Stripe payments, Supabase storage). Not attorney-reviewed
// — have it reviewed before relying on it for compliance.
export default function PrivacyPage() {
  return (
    <LegalDocLayout title="Privacy Policy" updated="September 2026">
      <p>
        This Privacy Policy explains how Future is Now Technologies (&quot;Sayso,&quot; &quot;we,&quot; &quot;us&quot;)
        collects, uses, and shares information when you use the Sayso application (the &quot;Service&quot;).
      </p>

      <h2>1. Information We Collect</h2>
      <p><strong className="text-slate-200">Account information.</strong> Your email address and a securely hashed password, stored via our authentication provider, Supabase.</p>
      <p><strong className="text-slate-200">Task and note content.</strong> Anything you type, speak (transcribed in your browser), or upload as a screenshot to log a task — including the text, images, and notes — is stored and processed to schedule and organize it.</p>
      <p><strong className="text-slate-200">Calendar data (optional).</strong> If you connect Google Calendar, we request permission via Google OAuth to read your availability and create/update/delete events on your behalf. We store an OAuth refresh token until you disconnect it. We never access calendar data unless you explicitly connect an account.</p>
      <p><strong className="text-slate-200">Payment information.</strong> Payments are processed entirely by Stripe, Inc. We never see or store your full card number — only a Stripe customer/subscription reference to manage your billing status.</p>
      <p><strong className="text-slate-200">Usage and device data.</strong> Standard technical data (IP address, browser type), and — only if you accept our cookie-consent banner — advertising/analytics identifiers from Google Analytics/Ads and Meta Pixel.</p>

      <h2>2. How We Use Information</h2>
      <p>
        To parse, schedule, and organize the tasks you submit; to manage a calendar you&apos;ve connected; to operate your account and process payments;
        to monitor and fix errors; and, only with your cookie consent, to measure advertising performance.
      </p>

      <h2>3. How We Share Information</h2>
      <p>We share information with service providers solely to operate the Service:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong className="text-slate-200">Google (Gemini API)</strong> — task/note text is sent to Google&apos;s Gemini API to extract structured task details and, for AI-assisted tasks, generate documents on your behalf.</li>
        <li><strong className="text-slate-200">Google Calendar API</strong> — only if you connect a calendar.</li>
        <li><strong className="text-slate-200">Supabase</strong> — our database, authentication, and file-storage provider.</li>
        <li><strong className="text-slate-200">Stripe</strong> — our payment processor.</li>
        <li><strong className="text-slate-200">Vercel</strong> — our hosting provider.</li>
        <li><strong className="text-slate-200">Sentry</strong> (if enabled) — error monitoring.</li>
        <li><strong className="text-slate-200">Google Analytics/Ads and Meta</strong> (only with your cookie consent) — advertising performance measurement.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>4. Data Retention</h2>
      <p>We retain your account and task data for as long as your account is active. You may request deletion of your account and data at any time (Section 7).</p>

      <h2>5. Your Rights</h2>
      <p>Depending on your location, you may have rights to access, correct, export, or delete your personal information, and to withdraw cookie consent at any time via the banner shown on the site.</p>

      <h2>6. Security</h2>
      <p>We use industry-standard measures (encryption in transit, access-controlled database policies) to protect your information, but no method of transmission or storage is 100% secure.</p>

      <h2>7. Contact Us</h2>
      <p>Questions about this policy? <a href="mailto:futureisnowtech@gmail.com">futureisnowtech@gmail.com</a></p>
    </LegalDocLayout>
  );
}
