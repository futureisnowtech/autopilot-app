import * as Sentry from '@sentry/nextjs';

// No-ops cleanly until NEXT_PUBLIC_SENTRY_DSN is set (same Sentry project as
// the server DSN in instrumentation.ts, just the public client key).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
