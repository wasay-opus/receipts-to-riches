import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Shield } from 'lucide-react';
import { Container } from '../../components';
import { getPrivacyPolicyMarkdown } from '../../locales/markdown';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const markdownContent = getPrivacyPolicyMarkdown(i18n.language);

  return (
    <Container maxWidth="760px" style={{ gap: '20px', paddingBottom: '40px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={22} color="var(--green)" />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Privacy Policy
          </h1>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          lineHeight: '1.7',
          fontSize: '14px',
          color: 'var(--text-muted)',
          borderRadius: '20px',
        }}
      >
        <div className="markdown-content">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', marginBottom: '16px' }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '24px', marginBottom: '10px' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '16px', marginBottom: '8px' }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: '6px' }}>
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  {children}
                </strong>
              ),
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'underline' }}>
                  {children}
                </a>
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
    </Container>
  );
};

export default PrivacyPolicy;
