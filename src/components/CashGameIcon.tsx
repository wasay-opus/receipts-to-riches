type CashGameIconProps = { game: 'zdt' | 'pick-3' | 'pick-4' | 'pick-5' };

export function CashGameIcon({ game }: CashGameIconProps) {
  return (
    <svg className="cash-game-corner-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cashCrown" x1="7" y1="9" x2="39" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5B9FF" /><stop offset=".53" stopColor="#B67AEC" /><stop offset="1" stopColor="#6F35B7" />
        </linearGradient>
        <radialGradient id="cashBall" cx="0" cy="0" r="1" gradientTransform="translate(16 12) rotate(50) scale(36)">
          <stop stopColor="#FFB5B9" /><stop offset=".42" stopColor="#F63E59" /><stop offset="1" stopColor="#9B123B" />
        </radialGradient>
        <linearGradient id="cashClover" x1="13" y1="7" x2="37" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C6FFB7" /><stop offset=".48" stopColor="#62D979" /><stop offset="1" stopColor="#0B8E53" />
        </linearGradient>
        <linearGradient id="cashStar" x1="14" y1="8" x2="37" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0F9FF" /><stop offset=".5" stopColor="#8FC7FF" /><stop offset="1" stopColor="#328BE6" />
        </linearGradient>
      </defs>
      {game === 'zdt' && (
        <>
          <path d="M6 15 15 24 23 10 32 24 42 15 37 36H11L6 15Z" fill="url(#cashCrown)" stroke="#E5A8FF" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M11 36H37V40H11V36Z" fill="#8D48C8" stroke="#DBA6FF" strokeWidth="1.2" />
          <path d="M12 31H36" stroke="#F3D0FF" strokeOpacity=".8" strokeWidth="1.4" />
          <circle cx="7" cy="14" r="2.5" fill="#FFD9FF" /><circle cx="23" cy="9" r="2.5" fill="#FFD9FF" /><circle cx="41" cy="14" r="2.5" fill="#FFD9FF" />
          <circle cx="23" cy="29" r="2.2" fill="#F8E4FF" />
        </>
      )}
      {game === 'pick-3' && (
        <>
          <circle cx="24" cy="24" r="19" fill="url(#cashBall)" stroke="#FFB4C1" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="10.5" fill="#F9F5F7" />
          <text x="24" y="30" textAnchor="middle" fill="#9D1745" fontSize="17" fontWeight="900" fontFamily="Arial, sans-serif">3</text>
          <path d="M11 16C16 8 23 7 29 9" stroke="#FFF" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {game === 'pick-4' && (
        <>
          <path d="M24 27C26 32 27 37 27 43" stroke="#1E9E5B" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 24C19 18 16 9 22 7c5-2 9 4 7 11-1 3-3 5-5 6Z" fill="url(#cashClover)" stroke="#B6F4BD" strokeWidth="1.2" />
          <path d="M24 24C30 19 39 16 41 22c2 5-4 9-11 7-3-1-5-3-6-5Z" fill="url(#cashClover)" stroke="#B6F4BD" strokeWidth="1.2" />
          <path d="M24 24C29 30 32 39 26 41c-5 2-9-4-7-11 1-3 3-5 5-6Z" fill="url(#cashClover)" stroke="#B6F4BD" strokeWidth="1.2" />
          <path d="M24 24C18 29 9 32 7 26c-2-5 4-9 11-7 3 1 5 3 6 5Z" fill="url(#cashClover)" stroke="#B6F4BD" strokeWidth="1.2" />
          <circle cx="24" cy="24" r="3.2" fill="#D6FFD4" />
        </>
      )}
      {game === 'pick-5' && (
        <>
          <path d="m24 4 6.5 13.1L45 19.2 34.5 29.5 37 44 24 37.2 11 44l2.5-14.5L3 19.2l14.5-2.1L24 4Z" fill="url(#cashStar)" stroke="#E6F6FF" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="m24 10 4.9 9.8 10.8 1.6" stroke="#FFF" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
