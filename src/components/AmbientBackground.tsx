import React from 'react';

/**
 * Global fluid organic mint waves & tech dot matrix clusters from testing site.
 * Supports light mode mint elegance and dark mode rich emerald ambience.
 * Applied across all pages with navigation.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="ambient-waves-layer">
      {/* Upper fluid curved pastel mint-sage waves */}
      <svg
        className="ambient-waves-svg ambient-waves-svg--top"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1440 640"
      >
        <path
          d="M380,0 C660,110 880,30 1140,120 C1320,185 1390,130 1440,75 L1440,0 L380,0 Z"
          fill="url(#mint-top-1)"
          className="ambient-wave-path"
          opacity="0.6"
        />
        <path
          d="M580,0 C790,175 1110,85 1290,220 C1380,290 1420,245 1440,215 L1440,0 L580,0 Z"
          fill="url(#mint-top-2)"
          className="ambient-wave-path"
          opacity="0.5"
        />
        <defs>
          <linearGradient id="mint-top-1" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--ambient-wave-top-1a, #bbf7d0)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--ambient-wave-top-1b, #6ee7b7)" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="mint-top-2" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--ambient-wave-top-2a, #dcfce7)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--ambient-wave-top-2b, #a7f3d0)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
      </svg>

      {/* Lower fluid curved wave band */}
      <svg
        className="ambient-waves-svg ambient-waves-svg--bot"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1440 540"
      >
        <path
          d="M0,280 C310,150 590,370 940,230 C1200,130 1360,290 1440,320 L1440,540 L0,540 Z"
          fill="url(#mint-bot-1)"
          className="ambient-wave-path"
        />
        <path
          d="M0,380 C270,290 500,430 820,335 C1100,260 1310,415 1440,395 L1440,540 L0,540 Z"
          fill="url(#mint-bot-2)"
          className="ambient-wave-path"
        />
        <defs>
          <linearGradient id="mint-bot-1" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--ambient-wave-bot-1a, #a7f3d0)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--ambient-wave-bot-1b, #6ee7b7)" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="mint-bot-2" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--ambient-wave-bot-2a, #34d399)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--ambient-wave-bot-2b, #a7f3d0)" stopOpacity="0.45" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tech Dot Matrix clusters */}
      <div className="dot-matrix-cluster dot-matrix--top-right" />
      <div className="dot-matrix-cluster dot-matrix--bot-right" />
      <div className="dot-matrix-cluster dot-matrix--bot-left" />
    </div>
  );
}

export default AmbientBackground;
