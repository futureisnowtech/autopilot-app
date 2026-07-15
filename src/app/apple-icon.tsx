import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const SPARKLE_PATH =
  'M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z';

// iOS applies its own rounded-square mask to home screen icons, so this is
// deliberately edge-to-edge with no border-radius and no transparency.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
        }}
      >
        <svg width={96} height={96} viewBox="0 0 24 24" fill="none">
          <path d={SPARKLE_PATH} fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
