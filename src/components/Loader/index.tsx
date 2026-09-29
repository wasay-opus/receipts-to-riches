import React from 'react';
import { Loader2 } from 'lucide-react';
import images from '../../constants/images';

export interface LoaderProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 40,
  message,
  fullScreen = false,
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={images.Coin}
          alt="Loading..."
          style={{ width: `${size * 0.7}px`, height: `${size * 0.7}px`, objectFit: 'contain' }}
        />
        <div
          style={{
            position: 'absolute',
            width: `${size * 1.3}px`,
            height: `${size * 1.3}px`,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#00674D',
            borderRightColor: '#D5AD60',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
      {message && (
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {message}
        </span>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          background: 'var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  return <div style={{ padding: '24px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>{content}</div>;
};

export default Loader;
