import { ImageResponse } from 'next/og';

// Site-wide social share card. Next picks this up automatically and emits both
// og:image and twitter:image, so every link shared to LinkedIn, X, Slack or
// iMessage renders a real card instead of a bare URL.
//
// Generated rather than committed as a binary so it can never drift from the
// brand, and so there is no 1200x630 asset to maintain by hand.

export const alt = 'Personify | AI-Powered Personal Branding';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PINK = '#E91E63';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0A0A0A',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        {/* Brand accent rail */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 14,
            // Explicit height, not '100%' — Satori does not resolve percentage
            // heights on absolutely-positioned elements, which left the rail
            // stopping short of the bottom edge.
            height: size.height,
            background: PINK,
            display: 'flex',
          }}
        />
        {/* Soft glow, echoing the landing hero gradient */}
        <div
          style={{
            position: 'absolute',
            right: -180,
            top: -180,
            width: 620,
            height: 620,
            borderRadius: 620,
            background: 'radial-gradient(circle, rgba(233,30,99,0.30) 0%, rgba(10,10,10,0) 70%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: PINK, display: 'flex' }} />
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#9C97A6',
              fontWeight: 600,
            }}
          >
            Personify
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 82,
              lineHeight: 1.04,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: -2.5,
              maxWidth: 900,
            }}
          >
            Level up your personal brand with AI
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              lineHeight: 1.35,
              color: '#B4B0BC',
              maxWidth: 860,
            }}
          >
            Studio-quality AI photos of you, plus a Founder Page that showcases your work.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', width: 64, height: 4, background: PINK }} />
          <div style={{ display: 'flex', fontSize: 26, color: '#78737F' }}>personify.so</div>
        </div>
      </div>
    ),
    size
  );
}
