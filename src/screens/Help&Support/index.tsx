import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { Container, Button } from '../../components';

export const HelpSupport: React.FC = () => {
  const navigate = useNavigate();
  const supportEmail = 'support@receiptstoriches.net';

  const openSupportEmail = (subject: string) => {
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;
  };

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
          Help & Support
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0, 103, 77, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--green)',
              }}
            >
              <Mail size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Email Support</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>support@receiptstoriches.net</p>
            </div>
          </div>
          <Button
            title="Send Email"
            onClick={() => openSupportEmail('Receipts To Riches Support')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          />
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(213, 173, 96, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D5AD60',
              }}
            >
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Live Chat</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Available Monday - Friday, 9 AM - 6 PM</p>
            </div>
          </div>
          <Button
            variant="secondary"
            title="Contact"
            onClick={() => openSupportEmail('Receipts To Riches Live Chat Request')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          />
        </div>
      </div>
    </Container>
  );
};

export default HelpSupport;
