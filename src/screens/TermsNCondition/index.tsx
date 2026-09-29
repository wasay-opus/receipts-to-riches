import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Container } from '../../components';

export const TermsNCondition: React.FC = () => {
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
          Terms & Conditions
        </h1>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.6', fontSize: '14px', color: 'var(--text-muted)' }}>
        <h3 style={{ color: 'var(--text-main)', fontSize: '16px' }}>1. Acceptance of Terms</h3>
        <p>By registering, accessing, or using the Receipts To Riches platform, you agree to be bound by these Terms and all applicable laws and regulations.</p>

        <h3 style={{ color: 'var(--text-main)', fontSize: '16px' }}>2. Receipt Scanning Eligibility</h3>
        <p>Only authentic, legible receipts issued by legitimate retailers within the last 14 days are eligible for point processing. Duplicate or falsified receipts will result in account suspension.</p>

        <h3 style={{ color: 'var(--text-main)', fontSize: '16px' }}>3. Reward Redemption</h3>
        <p>Points have no cash value outside the Receipts To Riches ecosystem until successfully redeemed for offered gift cards or approved payouts.</p>
      </div>
    </Container>
  );
};

export default TermsNCondition;
