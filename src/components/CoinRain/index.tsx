import React, { useEffect, useState, useMemo } from 'react';
import { CoinRainController } from '../../services/rewards/CoinRainController';
import { WebSound } from '../../utils/soundLoader';
import images from '../../constants/images';

export interface CoinRainProps {
  active?: boolean;
  onComplete?: () => void;
}

interface FallingCoin {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  spinDuration: number;
  rotation: number;
}

export const triggerCoinCelebration = () => {
  // Trigger global falling coins controller
  CoinRainController.start();
};

export const CoinRain: React.FC<CoinRainProps> = ({ active = false, onComplete }) => {
  const [visible, setVisible] = useState(active);

  // Generate randomized falling coins matching mobile flow-video
  const coins: FallingCoin[] = useMemo(() => {
    const list: FallingCoin[] = [];
    const count = 44;
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        left: Math.random() * 94 + 2, // 2% to 96% across viewport
        size: Math.floor(Math.random() * 11) + 24, // 24px to 34px (sleek size)
        delay: Math.random() * 1.5, // 0s to 1.5s wave
        duration: Math.random() * 0.7 + 1.8, // 1.8s to 2.5s smooth fall
        spinDuration: Math.random() * 0.6 + 0.8, // 0.8s to 1.4s 3D spin
        rotation: Math.floor(Math.random() * 50) - 25, // -25deg to +25deg natural tilt
      });
    }
    return list;
  }, [active]);

  useEffect(() => {
    if (active) {
      setVisible(true);

      // Play authentic coin shower sound
      try {
        const sound = new WebSound('coins');
        sound.play();
      } catch {
        // Fallback if audio restricted
      }

      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 3800);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [active, onComplete]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes smoothCoinFall {
          0% {
            transform: translateY(-70px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(112vh) rotate(240deg);
            opacity: 0;
          }
        }
        @keyframes coin3DSpinAnimation {
          0% {
            transform: perspective(400px) rotateY(0deg);
          }
          100% {
            transform: perspective(400px) rotateY(360deg);
          }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 999999,
          overflow: 'hidden',
        }}
      >
        {coins.map((coin) => (
          <div
            key={coin.id}
            style={{
              position: 'absolute',
              top: 0,
              left: `${coin.left}%`,
              animation: `smoothCoinFall ${coin.duration}s cubic-bezier(0.38, 0, 0.22, 1) ${coin.delay}s forwards`,
              willChange: 'transform, opacity',
            }}
          >
            <img
              src={images.Coin}
              alt=""
              style={{
                width: `${coin.size}px`,
                height: `${coin.size}px`,
                animation: `coin3DSpinAnimation ${coin.spinDuration}s linear infinite`,
                filter: 'drop-shadow(0 3px 8px rgba(245, 158, 11, 0.55))',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default CoinRain;
