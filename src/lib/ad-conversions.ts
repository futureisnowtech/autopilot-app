// Fire ad-platform conversion events from client components. No-ops safely
// if gtag/fbq were never loaded (no env var configured, or consent not
// granted yet) — every call is guarded.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackSignup() {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', 'sign_up', { method: 'email' });
  window.fbq?.('track', 'CompleteRegistration');
}

export function trackPurchase(valueUsd: number, label: 'subscription' | 'credit_topup') {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', 'purchase', {
    value: valueUsd,
    currency: 'USD',
    transaction_id: `${label}_${Date.now()}`,
  });
  window.fbq?.('track', 'Purchase', { value: valueUsd, currency: 'USD' });
}
