import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { Container } from '../../components';

export const RulesScreen: React.FC = () => {
  const navigate = useNavigate();

  const rules = [
    {
      title: '1. Receipt Submission Rules',
      points: [
        'Receipts must be less than 14 days old.',
        'Store name, purchase date, itemized total, and store address must be readable.',
        'You can submit up to 10 receipts daily.',
      ],
    },
    {
      title: '2. Instant Win Mini Games',
      points: [
        'Each valid receipt earns points plus unlocked game plays.',
        'Mini-game points are credited immediately to your wallet balance.',
        'Bonus streak rewards reset if check-in is missed.',
      ],
    },
    {
      title: '3. Redemptions & Payouts',
      points: [
        'Digital gift cards are delivered within 24 hours of redemption.',
        'Paypal transfers require a verified Paypal email address.',
      ],
    },
  ];

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
          Game Rules & Guidelines
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {rules.map((rule, idx) => (
          <div key={idx} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)' }}>{rule.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rule.points.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={16} color="#10B981" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default RulesScreen;
