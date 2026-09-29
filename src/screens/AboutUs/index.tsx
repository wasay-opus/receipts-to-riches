import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Award, Heart } from 'lucide-react';
import { Container } from '../../components';
import images from '../../constants/images';

export const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
          About Us
        </h1>
      </div>

      <div className="card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
        <img src={images.SplashLogo} alt="Logo" style={{ width: '180px', objectFit: 'contain' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
          Turn Everyday Shopping Into Real Rewards
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Receipts To Riches transforms everyday paper & digital receipts into exciting cash rewards, gift cards, and interactive mini-game spins. Our mission is to put money back in your pocket on every grocery, retail, and restaurant purchase!
        </p>
      </div>
    </Container>
  );
};

export default AboutUs;
