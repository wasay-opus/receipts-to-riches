import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  BookOpen,
  Info,
  Tv,
  Globe,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button, Container } from '../../components';

// Import Markdown rules assets
import { ZDT_Rules, ZDT_Rules_es } from '../../assets/Rules/ZDTRules';
import { Pick3_Rules, Pick3_Rules_es } from '../../assets/Rules/Pick3Rules';
import { Pick4_Rules, Pick4_Rules_es } from '../../assets/Rules/Pick4Rules';
import { Pick5_Rules, Pick5_Rules_es } from '../../assets/Rules/Pick5Rules';
import { PicPickGameRules, PicPickGameRules_es } from '../../assets/Rules/PicPickRules';
import { StatePickGameRules, StatePickGameRules_es } from '../../assets/Rules/StatePickRules';
import { MiniGamesRules, MiniGamesRules_es } from '../../assets/Rules/MiniGamesRules';

import {
  cashGamesVideos,
  picPickGameVideos,
  statePickGameVideos,
  winPointsGameVideos,
} from '../../config';

const RULE_TABS = [
  'Zip Date Time',
  'Pick 3',
  'Pick 4',
  'Pick 5',
  'Pic-Pick',
  'State Game',
  'Mini Games',
];

export const RulesScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(RULE_TABS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>(
    (i18n.language || 'en').startsWith('es') ? 'es' : 'en',
  );
  const [showVideoGuides, setShowVideoGuides] = useState(false);

  useEffect(() => {
    setSelectedLanguage((i18n.language || 'en').startsWith('es') ? 'es' : 'en');
  }, [i18n.language]);

  const getRulesMarkdown = (tab: string, lang: 'en' | 'es') => {
    const isSpanish = lang === 'es';
    switch (tab) {
      case 'Zip Date Time':
        return isSpanish ? ZDT_Rules_es : ZDT_Rules;
      case 'Pick 3':
        return isSpanish ? Pick3_Rules_es : Pick3_Rules;
      case 'Pick 4':
        return isSpanish ? Pick4_Rules_es : Pick4_Rules;
      case 'Pick 5':
        return isSpanish ? Pick5_Rules_es : Pick5_Rules;
      case 'Pic-Pick':
        return isSpanish ? PicPickGameRules_es : PicPickGameRules;
      case 'State Game':
        return isSpanish ? StatePickGameRules_es : StatePickGameRules;
      case 'Mini Games':
        return isSpanish ? MiniGamesRules_es : MiniGamesRules;
      default:
        return '';
    }
  };

  const getVideosForTab = (tab: string) => {
    switch (tab) {
      case 'Zip Date Time':
        return cashGamesVideos.filter((v) => v.id === 4);
      case 'Pick 3':
        return cashGamesVideos.filter((v) => v.id === 2);
      case 'Pick 4':
        return cashGamesVideos.filter((v) => v.id === 3);
      case 'Pick 5':
        return cashGamesVideos.filter((v) => v.id === 1);
      case 'Pic-Pick':
        return picPickGameVideos;
      case 'State Game':
        return statePickGameVideos;
      case 'Mini Games':
        return winPointsGameVideos;
      default:
        return [];
    }
  };

  const currentVideos = useMemo(() => getVideosForTab(activeTab), [activeTab]);
  const markdownContent = useMemo(
    () => getRulesMarkdown(activeTab, selectedLanguage),
    [activeTab, selectedLanguage],
  );

  return (
    <Container maxWidth="760px" style={{ gap: '20px', paddingBottom: '48px' }}>
      {/* 1. Header with Language Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#00674D',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            }}
            aria-label={t('common.back', 'Back')}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('rules.title', 'Official Game Rules')}
          </h1>
        </div>

        {/* English / Español toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card-secondary)',
            borderRadius: '20px',
            padding: '3px',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setSelectedLanguage('en')}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedLanguage === 'en' ? '#00674D' : 'transparent',
              color: selectedLanguage === 'en' ? '#FFFFFF' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            English
          </button>
          <button
            onClick={() => setSelectedLanguage('es')}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedLanguage === 'es' ? '#00674D' : 'transparent',
              color: selectedLanguage === 'es' ? '#FFFFFF' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            Español
          </button>
        </div>
      </div>

      {/* 2. Platform Disclaimer Card */}
      <div
        style={{
          background: 'rgba(0, 103, 77, 0.08)',
          border: '1px solid rgba(0, 103, 77, 0.25)',
          borderRadius: '18px',
          padding: '16px 20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <ShieldCheck size={22} color="#00674D" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#00674D' }}>
            {t('rules.platformDisclaimerTitle', 'Promotional Sweepstakes & Rules Notice')}
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
            {t(
              'rules.platformDisclaimerBody',
              'Receipts To Riches is an entertainment and promotional rewards platform. No purchase necessary. All games and sweepstakes are void where prohibited by law. Must be 18+ to participate.',
            )}
          </p>
        </div>
      </div>

      {/* 3. Game Tabs Selector */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
      >
        {RULE_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 18px',
                borderRadius: '24px',
                border: isActive ? '1px solid #00674D' : '1px solid var(--border-color)',
                background: isActive ? '#00674D' : 'var(--bg-card)',
                color: isActive ? '#FFFFFF' : 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(0, 103, 77, 0.25)' : 'none',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 4. Switch between Text Rules and Video Tutorials */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowVideoGuides(false)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '14px',
            border: !showVideoGuides ? '2px solid #00674D' : '1px solid var(--border-color)',
            background: !showVideoGuides ? 'rgba(0, 103, 77, 0.1)' : 'var(--bg-card)',
            color: !showVideoGuides ? '#00674D' : 'var(--text-muted)',
            fontSize: '13.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <BookOpen size={18} />
          <span>{t('rules.writtenRules', 'Full Written Rules')}</span>
        </button>

        <button
          onClick={() => setShowVideoGuides(true)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '14px',
            border: showVideoGuides ? '2px solid #00674D' : '1px solid var(--border-color)',
            background: showVideoGuides ? 'rgba(0, 103, 77, 0.1)' : 'var(--bg-card)',
            color: showVideoGuides ? '#00674D' : 'var(--text-muted)',
            fontSize: '13.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <Tv size={18} />
          <span>{t('rules.howToPlayVideos', 'Video Tutorials')}</span>
        </button>
      </div>

      {/* 5. Main Content: Video Guides or Markdown Rules */}
      {showVideoGuides ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentVideos.map((video) => {
            const videoUrl =
              selectedLanguage === 'es' && (video as any).videoUrl_es
                ? (video as any).videoUrl_es
                : video.videoUrl;

            return (
              <div
                key={video.id}
                className="card"
                style={{
                  padding: '20px',
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {video.title}
                  </h3>
                  <span className="pill-badge pill-green" style={{ fontSize: '11px' }}>
                    {selectedLanguage === 'es' ? 'Español' : 'English'}
                  </span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#000000',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    aspectRatio: '16 / 9',
                  }}
                >
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </div>
            );
          })}

          {currentVideos.length === 0 && (
            <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('rules.noVideosAvailable', 'Video guide coming soon for this game category.')}
            </div>
          )}
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: '28px 24px',
            borderRadius: '24px',
            lineHeight: 1.7,
            fontSize: '14px',
            color: 'var(--text-main)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <div className="markdown-body">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#00674D', marginTop: '20px', marginBottom: '12px' }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '20px', marginBottom: '10px' }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '16px', marginBottom: '8px' }}>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p style={{ marginBottom: '12px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul style={{ paddingLeft: '20px', marginBottom: '14px', color: 'var(--text-muted)' }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol style={{ paddingLeft: '20px', marginBottom: '14px', color: 'var(--text-muted)' }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li style={{ marginBottom: '6px', fontSize: '13.5px' }}>
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {children}
                  </strong>
                ),
                hr: () => (
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />
                ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </Container>
  );
};

export default RulesScreen;
