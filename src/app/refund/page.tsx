import { LegalDocLayout } from '@/components/legal-doc';

// Mirrors the refund terms already agreed on: no refunds on consumed
// credits, prorated cancellation, 14-day money-back on the first
// subscription charge only.
export default function RefundPage() {
  return (
    <LegalDocLayout title="Refund Policy" updated="September 2026">
      <h2>Credit Top-Ups</h2>
      <p>Credit purchases (e.g. the 50-credit top-up) are non-refundable once any portion of the purchased credits has been used. If none have been used, contact us within 7 days of purchase for a full refund.</p>

      <h2>Subscriptions (&quot;God Mode&quot; / unlimited plan)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong className="text-slate-200">First-time subscribers:</strong> contact us within 14 days of your first charge for a full refund if you&apos;re unhappy.</li>
        <li><strong className="text-slate-200">Cancellations:</strong> cancel anytime from billing settings. You keep access through the end of your current paid period — no prorated refunds for the unused portion after the initial 14-day window.</li>
        <li><strong className="text-slate-200">Renewals:</strong> recurring monthly charges after your first are non-refundable, but you can cancel before the next renewal to avoid being charged again.</li>
      </ul>

      <h2>How to Request a Refund</h2>
      <p>Contact us at <a href="mailto:futureisnowtech@gmail.com">futureisnowtech@gmail.com</a> with your account email and the reason for your request. We aim to respond within 2 business days.</p>

      <h2>Disputes</h2>
      <p>If you believe you were charged in error, please contact us before opening a dispute/chargeback with your bank or card issuer — we can usually resolve billing issues faster directly.</p>
    </LegalDocLayout>
  );
}
