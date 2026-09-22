import { LegalDocLayout } from '@/components/legal-doc';
import Link from 'next/link';

// Drafted from how the app actually works. Not attorney-reviewed — have it
// reviewed before relying on it for compliance.
export default function TermsPage() {
  return (
    <LegalDocLayout title="Terms of Service" updated="September 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Sayso (the &quot;Service&quot;), operated by Future is Now Technologies.
        By creating an account, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>Sayso lets you capture tasks by voice, text, or screenshot, and uses AI to organize and, optionally, schedule them on a calendar you connect. Some features (&quot;AI DO&quot; tasks) use AI to research or draft a document on your behalf.</p>

      <h2>2. Accounts</h2>
      <p>You must provide accurate information and are responsible for activity under your account and for keeping your password secure.</p>

      <h2>3. Credits and Subscriptions</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Free accounts receive a monthly allotment of credits; each task capture consumes one credit.</li>
        <li>Additional credits and unlimited plans are available for purchase, billed via Stripe.</li>
        <li>Prices are shown at checkout and may change with notice; changes don&apos;t affect a billing period you&apos;ve already paid for.</li>
        <li>Subscriptions renew automatically until canceled. Cancel anytime from billing settings — you keep access through the end of the paid period.</li>
      </ul>
      <p>See our <Link href="/refund">Refund Policy</Link> for cancellation and refund terms.</p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to: use the Service unlawfully; attempt to circumvent credit limits or abuse the API (automated/scripted requests outside normal use); upload content that infringes others&apos; rights; or attempt to disrupt or reverse-engineer the Service.</p>

      <h2>5. AI-Generated Content</h2>
      <p>Task parsing, scheduling suggestions, and AI-generated documents are produced by third-party AI models (currently Google Gemini) and may contain errors. You&apos;re responsible for reviewing AI output before relying on it, especially for anything consequential.</p>

      <h2>6. Calendar Access</h2>
      <p>If you connect a calendar, you authorize Sayso to read availability and create, modify, or delete events on your behalf as needed to schedule your tasks. Disconnect anytime from account settings.</p>

      <h2>7. Termination</h2>
      <p>We may suspend or terminate accounts that violate these Terms, including credit-system abuse. You may delete your account at any time.</p>

      <h2>8. Disclaimers and Limitation of Liability</h2>
      <p>The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, Future is Now Technologies is not liable for indirect, incidental, or consequential damages arising from your use of the Service, including missed appointments or scheduling errors resulting from AI-generated output.</p>

      <h2>9. Governing Law</h2>
      <p>These Terms are governed by the laws of the Commonwealth of Virginia, without regard to conflict-of-law principles.</p>

      <h2>10. Changes to These Terms</h2>
      <p>We may update these Terms from time to time. Continued use after changes take effect constitutes acceptance.</p>

      <h2>11. Contact Us</h2>
      <p>Questions? <a href="mailto:futureisnowtech@gmail.com">futureisnowtech@gmail.com</a></p>
    </LegalDocLayout>
  );
}
