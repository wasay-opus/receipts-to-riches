import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Container } from '../../components';

export const PrivacyPolicy: React.FC = () => {
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
          Privacy Policy
        </h1>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.6', fontSize: '14px', color: 'var(--text-muted)' }}>
        <h3 style={{ color: 'var(--text-main)', fontSize: '16px' }}>Data Collection & Usage</h3>
        <p>We collect information you provide directly, such as your email address, profile details, and uploaded receipt images for the sole purpose of verifying eligible reward points.</p>

        <h3 style={{ color: 'var(--text-main)', fontSize: '16px' }}>Security & Storage</h3>
        <p>All transmitted data is encrypted using industry standard TLS encryption. We do not sell your personal identifying data to unauthorized third parties.</p>
      </div>
    </Container>
  );
};

export default PrivacyPolicy;
