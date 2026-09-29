import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export interface CoinRainProps {
  active?: boolean;
  onComplete?: () => void;
}

export const triggerCoinCelebration = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
  };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      colors: ['#FFD700', '#D5AD60', '#00674D', '#10B981', '#FFA500'],
    });
  };

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

export const CoinRain: React.FC<CoinRainProps> = ({ active = false, onComplete }) => {
  useEffect(() => {
    if (active) {
      triggerCoinCelebration();
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  return null;
};

export default CoinRain;
