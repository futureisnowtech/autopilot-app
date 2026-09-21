'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getStoredConsent } from './cookie-consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Loads Google (GA4 + Ads conversion tag) and Meta Pixel only once the
// visitor has accepted the cookie-consent banner, and only for whichever
// IDs are actually configured — every piece here is a safe no-op until
// those env vars are set in Vercel.
export default function AdTracking() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(getStoredConsent() === 'granted');
  }, []);

  if (!consented) return null;

  const gtagTargets = [GA_ID, GOOGLE_ADS_ID].filter(Boolean) as string[];

  return (
    <>
      {gtagTargets.length > 0 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagTargets[0]}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              ${gtagTargets.map((id) => `gtag('config', '${id}');`).join('\n')}
            `}
          </Script>
        </>
      )}

      {META_PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
