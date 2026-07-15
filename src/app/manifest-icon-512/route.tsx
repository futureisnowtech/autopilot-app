import { ImageResponse } from 'next/og';

const SPARKLE_PATH =
  'M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z';

// Dedicated 512x512 icon for the PWA manifest (Android's install
// prompt/splash screen). Kept separate from icon.tsx since Next's icon
// convention is meant for the browser-tab favicon, not manifest sizes.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 104,
          background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
        }}
      >
        <svg width={276} height={276} viewBox="0 0 24 24" fill="none">
          <path d={SPARKLE_PATH} fill="white" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
