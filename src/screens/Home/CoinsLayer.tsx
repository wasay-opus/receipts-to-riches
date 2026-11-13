import React from 'react';
import goldCoin from '../../assets/images/05_gold_coin.png';

/**
 * Redesigned 3D Floating Coin Atmosphere strictly for Home page.
 * Perfectly balanced with 3 coins on the left and 3 coins on the right (+ 1 top-center).
 * All coins sit in the background behind dashboard cards.
 */
export function CoinsLayer() {
  return (
    <div className="home-ambient-coins" aria-hidden="true">
      {/* --- LEFT SIDE: 3 COINS --- */}
      {/* 1. Top-Left Midground Coin */}
      <div
        className="ambient-coin-layer anim-coin-3"
        style={{ top: '72px', left: '265px', width: '44px', height: '44px', zIndex: 0 }}
      >
        <div className="coin-glow-halo" style={{ filter: 'blur(8px)', transform: 'scale(1.2)' }} />
        <img
          alt=""
          className="ambient-coin-img coin-drop-shadow-2"
          src={goldCoin}
        />
      </div>

      {/* 2. Left Mid-edge Coin */}
      <div
        className="ambient-coin-layer anim-coin-2"
        style={{ top: '340px', left: '240px', width: '40px', height: '40px', zIndex: 0 }}
      >
        <div className="coin-glow-halo" style={{ filter: 'blur(6px)', transform: 'scale(1.3)' }} />
        <img
          alt=""
          className="ambient-coin-img coin-drop-shadow-3"
          src={goldCoin}
        />
      </div>

      {/* 3. Bottom-Left Coin (Shifted left into background) */}
      <div
        className="ambient-coin-layer anim-coin-2"
        style={{ bottom: '32px', left: '235px', width: '58px', height: '58px', zIndex: 0 }}
      >
        <div className="coin-glow-halo" style={{ filter: 'blur(12px)', transform: 'scale(1.4)' }} />
        <img
          alt=""
          className="ambient-coin-img coin-drop-shadow-7"
          src={goldCoin}
        />
      </div>

      {/* --- RIGHT SIDE: 3 COINS (Clean balanced 3 coins) --- */}
      {/* 1. Top-Right Coin */}
      <div
        className="ambient-coin-layer anim-coin-3"
        style={{ top: '72px', right: '40px', width: '46px', height: '46px', zIndex: 0 }}
      >
        <div className="coin-glow-halo" style={{ filter: 'blur(9px)', transform: 'scale(1.3)' }} />
        <img
          alt=""
          className="ambient-coin-img coin-drop-shadow-4"
          src={goldCoin}
        />
      </div>

      {/* 2. Right Mid-edge Coin */}
      <div
        className="ambient-coin-layer anim-coin-4"
        style={{ top: '380px', right: '22px', width: '50px', height: '50px', zIndex: 0 }}
      >
        <div className="coin-glow-halo" style={{ filter: 'blur(10px)', transform: 'scale(1.4)' }} />
        <img
          alt=""
          className="ambient-coin-img coin-drop-shadow-4"
          src={goldCoin}
        />
      </div>

      {/* 3. Bottom-Right Coin (Shifted right into background) */}
      <div
        className="ambient-coin-layer anim-coin-1"
        style={{ bottom: '32px', right: '22px', width: '64px', height: '64px', zIndex: 0 }}
      >
        <div className="coin-glow-halo" style={{ filter: 'blur(12px)', transform: 'scale(1.5)' }} />
        <img
          alt=""
          className="ambient-coin-img coin-drop-shadow-5"
          src={goldCoin}
        />
      </div>
    </div>
  );
}

export default CoinsLayer;
