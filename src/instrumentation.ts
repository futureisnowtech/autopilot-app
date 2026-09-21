import * as Sentry from '@sentry/nextjs';

// No-ops cleanly until SENTRY_DSN is set (create a free project at
// sentry.io, add the DSN to Vercel env vars, redeploy — no code change
// needed after that).
export function register() {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  });
}

export const onRequestError = Sentry.captureRequestError;
