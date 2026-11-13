import React from 'react';
import goldCoin from '../assets/images/05_gold_coin.png';

/**
 * Premium Ambient Auth Background for all Auth screens (SignIn, SignUp, Forgot Password, OTP, etc.).
 * Features:
 * - Seamless looping ambient cashVideo.mp4
 * - Subtle mint/emerald gradient overlay
 * - Floating 3D Gold Coins (slightly faster floating animation & customizable opacity)
 * - Zero bottom curves or static gold contour lines
 */
export const AuthBackground: React.FC = () => {
  return (
    <div className="auth-unified-bg-container" aria-hidden="true">
      {/* 1. Looping Ambient Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="auth-bg-video"
      >
        <source src="/cashVideo.mp4" type="video/mp4" />
      </video>

      {/* 2. Soft Mint Color Grading Overlay */}
      <div className="auth-bg-gradient-overlay" />

      {/* 3. Floating 3D Gold Coins (Bigger size, dim opacity, slightly faster animation) */}
      <div className="auth-ambient-coins" aria-hidden="true">
        {/* Left Side: 3 coins */}
        <div
          className="auth-coin-layer auth-anim-coin-1"
          style={{ top: '12%', left: '6%', width: '74px', height: '74px' }}
        >
          <div className="coin-glow-halo" style={{ filter: 'blur(12px)', transform: 'scale(1.3)' }} />
          <img alt="" className="ambient-coin-img coin-drop-shadow-3" src={goldCoin} />
        </div>

        <div
          className="auth-coin-layer auth-anim-coin-2"
          style={{ top: '48%', left: '3%', width: '60px', height: '60px' }}
        >
          <div className="coin-glow-halo" style={{ filter: 'blur(10px)', transform: 'scale(1.2)' }} />
          <img alt="" className="ambient-coin-img coin-drop-shadow-2" src={goldCoin} />
        </div>

        <div
          className="auth-coin-layer auth-anim-coin-3"
          style={{ bottom: '10%', left: '6%', width: '84px', height: '84px' }}
        >
          <div className="coin-glow-halo" style={{ filter: 'blur(14px)', transform: 'scale(1.4)' }} />
          <img alt="" className="ambient-coin-img coin-drop-shadow-5" src={goldCoin} />
        </div>

        {/* Right Side: 3 coins */}
        <div
          className="auth-coin-layer auth-anim-coin-4"
          style={{ top: '14%', right: '6%', width: '72px', height: '72px' }}
        >
          <div className="coin-glow-halo" style={{ filter: 'blur(12px)', transform: 'scale(1.3)' }} />
          <img alt="" className="ambient-coin-img coin-drop-shadow-4" src={goldCoin} />
        </div>

        <div
          className="auth-coin-layer auth-anim-coin-1"
          style={{ top: '50%', right: '3%', width: '62px', height: '62px' }}
        >
          <div className="coin-glow-halo" style={{ filter: 'blur(10px)', transform: 'scale(1.2)' }} />
          <img alt="" className="ambient-coin-img coin-drop-shadow-3" src={goldCoin} />
        </div>

        <div
          className="auth-coin-layer auth-anim-coin-2"
          style={{ bottom: '8%', right: '6%', width: '88px', height: '88px' }}
        >
          <div className="coin-glow-halo" style={{ filter: 'blur(16px)', transform: 'scale(1.5)' }} />
          <img alt="" className="ambient-coin-img coin-drop-shadow-7" src={goldCoin} />
        </div>
      </div>
    </div>
  );
};

export default AuthBackground;
