import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import {
  X,
  Tv,
  BookOpen,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { winPointsGameVideos } from '../../config';
import { MiniGamesRules, MiniGamesRules_es } from '../../assets/Rules/MiniGamesRules';

export interface MiniGameHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: 'spin' | 'lucky7' | 'scratch';
  gameTitle?: string;
  initialTab?: 'video' | 'rules';
}

export const MiniGameHelpModal: React.FC<MiniGameHelpModalProps> = ({
  isOpen,
  onClose,
  gameType,
  gameTitle,
  initialTab,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'video' | 'rules'>(initialTab || 'video');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>(
    (i18n.language || 'en').startsWith('es') ? 'es' : 'en',
  );
  const [showFullLegalRules, setShowFullLegalRules] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    setSelectedLanguage((i18n.language || 'en').startsWith('es') ? 'es' : 'en');
  }, [i18n.language]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Resolve Game Video
  const videoItem =
    gameType === 'spin'
      ? winPointsGameVideos.find((item) => item.id === 1)
      : gameType === 'lucky7'
      ? winPointsGameVideos.find((item) => item.id === 2)
      : winPointsGameVideos.find((item) => item.id === 3);

  const videoUrl =
    selectedLanguage === 'es' && videoItem?.videoUrl_es
      ? videoItem.videoUrl_es
      : videoItem?.videoUrl;

  const resolvedGameTitle =
    gameTitle ||
    (gameType === 'spin'
      ? t('spinWheel.headerTitle', 'Spin The Wheel')
      : gameType === 'lucky7'
      ? t('lucky7.headerTitle', 'Lucky 777 Slot')
      : t('scratch2win.headerTitle', 'Scratch 2 Win'));

  // Quick Rules list matching http://localhost:3000/play/state-game layout
  const getQuickRules = () => {
    if (gameType === 'spin') {
      return [
        t('spinWheel.quickRule1', 'Tap "SPIN NOW" to launch the fortune wheel.'),
        t('spinWheel.quickRule2', 'Win instant cash points credited straight to your balance.'),
        t('spinWheel.quickRule3', 'Landing on "EXTRA SPIN" awards you a free immediate re-spin!'),
        t('spinWheel.quickRule4', 'Daily limit of 3 plays per 24 hours.'),
        t('spinWheel.quickRule5', 'When spins run out, watch a short sponsored video to unlock additional spins (+1).'),
        t('spinWheel.quickRule6', 'Points can be redeemed for gift cards and rewards in the Marketplace.'),
      ];
    }
    if (gameType === 'lucky7') {
      return [
        t('lucky7.quickRule1', 'Pull the slot machine lever or tap "SPIN" to roll all three reels.'),
        t('lucky7.quickRule2', 'Match three 7s (7-7-7) across the reels to trigger the top 1,000 Points Jackpot!'),
        t('lucky7.quickRule3', 'Matching 3 identical icons or 2 matching icons earns bonus reward points.'),
        t('lucky7.quickRule4', 'Daily limit of 3 plays per 24 hours.'),
        t('lucky7.quickRule5', 'When plays run out, watch a short sponsored video to unlock an extra play (+1).'),
        t('lucky7.quickRule6', 'Points can be redeemed for gift cards and prizes in the Rewards marketplace.'),
      ];
    }
    // Scratch 2 Win
    return [
      t('scratch2win.quickRule1', 'Rub the metallic gold foil surface with your mouse or finger to uncover your secret prize.'),
      t('scratch2win.quickRule2', 'Scratching reveals instant bonus cash points credited straight to your wallet.'),
      t('scratch2win.quickRule3', 'Scratch at least 60% of the surface to reveal the full hidden prize.'),
      t('scratch2win.quickRule4', 'Daily limit of 3 cards per 24 hours.'),
      t('scratch2win.quickRule5', 'When cards run out, watch a short sponsored video to unlock an extra card (+1).'),
      t('scratch2win.quickRule6', 'Points can be redeemed for real gift cards and prizes in the Rewards section.'),
    ];
  };

  const quickRules = getQuickRules();
  const fullLegalRules = selectedLanguage === 'es' ? MiniGamesRules_es : MiniGamesRules;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          background: '#0E1217',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(21, 174, 54, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            background: '#15AE36',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={22} color="#000000" strokeWidth={2.5} />
            <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#000000', margin: 0 }}>
              Need Help &bull; {resolvedGameTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
            }}
            aria-label="Close"
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '2px solid #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <X size={18} strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* 2 Tabs: How to play (Video) & Rules */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 18px',
            background: '#141A23',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'video' ? '#15AE36' : 'rgba(255, 255, 255, 0.06)',
              color: activeTab === 'video' ? '#000000' : '#CBD5E1',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <Tv size={17} strokeWidth={activeTab === 'video' ? 2.5 : 2} />
            <span>{t('rules.howToPlay', 'How to Play')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'rules' ? '#15AE36' : 'rgba(255, 255, 255, 0.06)',
              color: activeTab === 'rules' ? '#000000' : '#CBD5E1',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={17} strokeWidth={activeTab === 'rules' ? 2.5 : 2} />
            <span>{t('rules.title', 'Rules')}</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            color: '#E2E8F0',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        >
          {activeTab === 'video' ? (
            /* TAB 1: HOW TO PLAY (VIDEO) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {videoItem?.title || resolvedGameTitle} Video Guide
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                    Watch this short visual tutorial to learn how to play and win rewards.
                  </p>
                </div>

                {/* English / Spanish Language Toggle for Video */}
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '2px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('en')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '14px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: selectedLanguage === 'en' ? '#15AE36' : 'transparent',
                      color: selectedLanguage === 'en' ? '#000000' : '#94A3B8',
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('es')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '14px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: selectedLanguage === 'es' ? '#15AE36' : 'transparent',
                      color: selectedLanguage === 'es' ? '#000000' : '#94A3B8',
                    }}
                  >
                    Español
                  </button>
                </div>
              </div>

              {/* Video Player Box */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#000000',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  aspectRatio: '16 / 9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {videoUrl ? (
                  <video
                    ref={videoRef}
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      backgroundColor: '#000000',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <div style={{ color: '#94A3B8', padding: '30px', textAlign: 'center' }}>
                    Video guide coming soon for this game.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: RULES */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Game Rules Card matching http://localhost:3000/play/state-game */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(21, 174, 54, 0.4)',
                  borderRadius: '18px',
                  padding: '18px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles size={18} color="#15AE36" />
                  <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {resolvedGameTitle} - Game Rules
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {quickRules.map((rule, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '13px',
                        color: '#E2E8F0',
                        lineHeight: '1.5',
                      }}
                    >
                      <span
                        style={{
                          color: '#15AE36',
                          fontSize: '18px',
                          lineHeight: '1',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        &bull;
                      </span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Promotion Disclosure Box matching mobile app */}
              <div
                style={{
                  border: '1.5px solid #10B981',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  background: 'rgba(16, 185, 129, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <ShieldCheck size={16} color="#10B981" />
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    Important Promotion Disclosure
                  </h4>
                </div>
                <p style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: '1.5', margin: 0 }}>
                  Apple Inc. is not a sponsor of, and is not involved in any way with, any contest, sweepstakes, game, or promotion offered in this app.
                </p>
              </div>

              {/* Expandable Official Sweepstakes Rules */}
              <div
                style={{
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowFullLegalRules(!showFullLegalRules)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: '#E2E8F0',
                    fontSize: '13.5px',
                    fontWeight: 700,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} color="#15AE36" />
                    <span>View Official Sweepstakes Rules</span>
                  </div>
                  {showFullLegalRules ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showFullLegalRules && (
                  <div
                    style={{
                      padding: '16px 18px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      color: '#CBD5E1',
                      fontSize: '12px',
                      lineHeight: '1.55',
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '14px', marginBottom: '8px' }}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 style={{ fontSize: '13.5px', fontWeight: 800, color: '#34D399', marginTop: '12px', marginBottom: '6px' }}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginTop: '10px', marginBottom: '4px' }}>
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => <p style={{ marginBottom: '8px' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ paddingLeft: '18px', marginBottom: '8px' }}>{children}</ul>,
                        li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                      }}
                    >
                      {fullLegalRules}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Accent Bar */}
        <div
          style={{
            height: '10px',
            background: '#15AE36',
            width: '100%',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
};

export interface MiniGameHelpMenuProps {
  gameType: 'spin' | 'lucky7' | 'scratch';
  gameTitle?: string;
}

export const MiniGameHelpMenu: React.FC<MiniGameHelpMenuProps> = ({
  gameType,
  gameTitle,
}) => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'video' | 'rules'>('video');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  };

  const handleSelectTab = (tab: 'video' | 'rules') => {
    setModalTab(tab);
    setDropdownOpen(false);
    setModalOpen(true);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="game-how-to-play-btn"
        style={{
          background: 'var(--bg-card)',
          border: '1.5px solid rgba(0, 208, 102, 0.4)',
          color: 'var(--text-main)',
          boxShadow: dropdownOpen ? '0 0 14px rgba(16, 185, 129, 0.45)' : 'var(--shadow-sm)',
          cursor: 'pointer',
        }}
        aria-label="Need Help"
      >
        <HelpCircle size={18} color="#00D066" />
        <span className="game-how-to-play-btn__text">{t('common.needHelp', 'Need Help')}</span>
      </button>

      {/* Hover Dropdown Tabs Popover */}
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            background: '#161B22',
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '16px',
            overflow: 'hidden',
            minWidth: '175px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(16, 185, 129, 0.15)',
            zIndex: 200,
            animation: 'fadeIn 0.15s ease-out',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => handleSelectTab('video')}
            style={{
              padding: '11px 16px',
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#FFFFFF',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)';
              e.currentTarget.style.color = '#34D399';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            <Tv size={17} color="#10B981" />
            <span>{t('rules.howToPlay', 'How to Play')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('rules')}
            style={{
              padding: '11px 16px',
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#FFFFFF',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)';
              e.currentTarget.style.color = '#34D399';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            <BookOpen size={17} color="#10B981" />
            <span>{t('rules.title', 'Rules')}</span>
          </button>
        </div>
      )}

      {/* Full Modal with Video & Rules tabs */}
      <MiniGameHelpModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        gameType={gameType}
        gameTitle={gameTitle}
        initialTab={modalTab}
      />
    </div>
  );
};

export default MiniGameHelpModal;

