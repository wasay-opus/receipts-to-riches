import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Tv } from 'lucide-react';
import { Container } from '../../components';
import {
  cashGamesVideos,
  picPickGameVideos,
  statePickGameVideos,
  winPointsGameVideos,
} from '../../config';

const GAME_TABS = [
  'Zip Date Time',
  'Pick 3',
  'Pick 4',
  'Pick 5',
  'Pic-Pick',
  'State Game',
  'Mini Games',
];

export const GuideVideo: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isSpanish = (i18n.language || 'en').startsWith('es');
  const [activeTab, setActiveTab] = useState(GAME_TABS[0]);
  const [selectedSubId, setSelectedSubId] = useState<number>(1);

  const getTabKey = (tab: string) => {
    switch (tab) {
      case 'Zip Date Time': return 'zdt';
      case 'Pick 3': return 'pick3';
      case 'Pick 4': return 'pick4';
      case 'Pick 5': return 'pick5';
      case 'Pic-Pick': return 'picPick';
      case 'State Game': return 'stateGame';
      case 'Mini Games': return 'miniGames';
      default: return tab;
    }
  };

  const currentVideos = useMemo(() => {
    switch (activeTab) {
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
  }, [activeTab]);

  const activeVideo = useMemo(() => {
    return (
      currentVideos.find((v) => v.id === selectedSubId) || currentVideos[0] || null
    );
  }, [currentVideos, selectedSubId]);

  const activeVideoUrl = useMemo(() => {
    if (!activeVideo) return '';
    return isSpanish && (activeVideo as any).videoUrl_es
      ? (activeVideo as any).videoUrl_es
      : activeVideo.videoUrl;
  }, [activeVideo, isSpanish]);

  return (
    <Container maxWidth="720px" style={{ gap: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
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
          {t('rules.howToPlay', 'How to Play & Video Guides')}
        </h1>
      </div>

      {/* Primary Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
      >
        {GAME_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedSubId(1);
              }}
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
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Sub tabs if multiple videos in category */}
      {currentVideos.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {currentVideos.map((sub) => {
            const isSelected = (activeVideo?.id ?? 1) === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubId(sub.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '16px',
                  border: isSelected ? '1px solid #00674D' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(0, 103, 77, 0.12)' : 'var(--bg-card)',
                  color: isSelected ? '#00674D' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sub.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Video Player Card */}
      <div
        className="card"
        style={{
          padding: '20px',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            {activeVideo?.title || activeTab}
          </h2>
          <span className="pill-badge pill-green" style={{ fontSize: '12px' }}>
            {isSpanish ? 'Español' : 'English'}
          </span>
        </div>

        {activeVideoUrl ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '18px',
              overflow: 'hidden',
              background: '#000000',
              boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
              aspectRatio: '16 / 9',
            }}
          >
            <video
              key={activeVideoUrl}
              src={activeVideoUrl}
              controls
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            Video is currently unavailable.
          </div>
        )}
      </div>
    </Container>
  );
};

export default GuideVideo;
