import React from 'react';
import { Lottie } from 'lottie-react';
import failAnimation from '../assets/animations/fail.json';

interface FailAnimationProps {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

export const FailAnimation: React.FC<FailAnimationProps> = ({
  width = 160,
  height = 140,
  style,
}) => {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        ...style,
      }}
    >
      <Lottie
        src={failAnimation}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default FailAnimation;
