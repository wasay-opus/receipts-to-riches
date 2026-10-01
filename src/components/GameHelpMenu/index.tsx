import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { HelpCircle, X, Play, RotateCcw, RotateCw, Settings, Maximize, Volume2, VolumeX } from 'lucide-react';
import {
  cashGamesVideos,
  picPickGameVideos,
  statePickGameVideos,
  winPointsGameVideos,
} from '../../config';
import { ZDT_Rules, ZDT_Rules_es } from '../../assets/Rules/ZDTRules';
import { Pick3_Rules, Pick3_Rules_es } from '../../assets/Rules/Pick3Rules';
import { Pick4_Rules, Pick4_Rules_es } from '../../assets/Rules/Pick4Rules';
import { Pick5_Rules, Pick5_Rules_es } from '../../assets/Rules/Pick5Rules';
import { PicPickGameRules, PicPickGameRules_es } from '../../assets/Rules/PicPickRules';
import { StatePickGameRules, StatePickGameRules_es } from '../../assets/Rules/StatePickRules';
import { MiniGamesRules, MiniGamesRules_es } from '../../assets/Rules/MiniGamesRules';

export interface GameHelpMenuProps {
  gameSlug: string; // e.g., 'zdt', 'pick-3', 'pick-4', 'pick-5', 'pic-pick', 'state', 'spin-the-wheel', etc.
  gameTitle?: string;
  gameNumber?: string | number;
}

export const GameHelpMenu: React.FC<GameHelpMenuProps> = ({
  gameSlug,
  gameTitle,
  gameNumber,
}) => {
  const { t, i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isSpanish = (i18n.language || 'en').startsWith('es');
  const normalizedSlug = String(gameSlug || '').toLowerCase();

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showVideoModal || showRulesModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showVideoModal, showRulesModal]);

  // Resolve video URL
  const getVideo = () => {
    if (normalizedSlug.includes('zdt')) {
      const v = cashGamesVideos.find((item) => item.id === 4);
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    if (normalizedSlug.includes('pick-3') || normalizedSlug === 'pick3') {
      const v = cashGamesVideos.find((item) => item.id === 2);
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    if (normalizedSlug.includes('pick-4') || normalizedSlug === 'pick4') {
      const v = cashGamesVideos.find((item) => item.id === 3);
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    if (normalizedSlug.includes('pick-5') || normalizedSlug === 'pick5') {
      const v = cashGamesVideos.find((item) => item.id === 1);
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    if (normalizedSlug.includes('state')) {
      const num = Number(gameNumber) || 3;
      const index = num === 4 ? 1 : num === 5 ? 2 : 0;
      const v = statePickGameVideos[index] || statePickGameVideos[0];
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    if (normalizedSlug.includes('pic-pick') || normalizedSlug.includes('picpick')) {
      const num = Number(gameNumber) || 3;
      const index = num === 4 ? 1 : num === 5 ? 2 : 0;
      const v = picPickGameVideos[index] || picPickGameVideos[0];
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    if (normalizedSlug.includes('spin')) {
      const v = winPointsGameVideos.find((item) => item.id === 1);
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    if (normalizedSlug.includes('lucky') || normalizedSlug.includes('777')) {
      const v = winPointsGameVideos.find((item) => item.id === 2);
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    if (normalizedSlug.includes('scratch')) {
      const v = winPointsGameVideos.find((item) => item.id === 3);
      return isSpanish && v?.videoUrl_es ? v.videoUrl_es : v?.videoUrl;
    }
    return cashGamesVideos[0]?.videoUrl;
  };

  // Resolve Rules Markdown
  const getRules = () => {
    if (normalizedSlug.includes('zdt')) {
      return isSpanish ? ZDT_Rules_es : ZDT_Rules;
    }
    if (normalizedSlug.includes('pick-3') || normalizedSlug === 'pick3') {
      return isSpanish ? Pick3_Rules_es : Pick3_Rules;
    }
    if (normalizedSlug.includes('pick-4') || normalizedSlug === 'pick4') {
      return isSpanish ? Pick4_Rules_es : Pick4_Rules;
    }
    if (normalizedSlug.includes('pick-5') || normalizedSlug === 'pick5') {
      return isSpanish ? Pick5_Rules_es : Pick5_Rules;
    }
    if (normalizedSlug.includes('state')) {
      return isSpanish ? StatePickGameRules_es : StatePickGameRules;
    }
    if (normalizedSlug.includes('pic-pick') || normalizedSlug.includes('picpick')) {
      return isSpanish ? PicPickGameRules_es : PicPickGameRules;
    }
    if (
      normalizedSlug.includes('spin') ||
      normalizedSlug.includes('lucky') ||
      normalizedSlug.includes('scratch')
    ) {
      return isSpanish ? MiniGamesRules_es : MiniGamesRules;
    }
    return Pick3_Rules;
  };

  const videoUrl = getVideo();
  const rulesMarkdown = getRules();

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Help Question Mark Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title="Help & Rules"
        style={{
          background: 'var(--bg-card)',
          border: '1.5px solid #10B981',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#10B981',
          transition: 'all 0.2s ease',
          boxShadow: dropdownOpen ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
        }}
      >
        <HelpCircle size={22} />
      </button>

      {/* Dropdown Popover matching Screenshot 3 */}
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            background: '#1C232B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            overflow: 'hidden',
            minWidth: '160px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)',
            zIndex: 150,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            onClick={() => {
              setDropdownOpen(false);
              setShowVideoModal(true);
            }}
            style={{
              padding: '13px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#263342')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            How to play
          </div>
          <div
            onClick={() => {
              setDropdownOpen(false);
              setShowRulesModal(true);
            }}
            style={{
              padding: '13px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#263342')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Rules
          </div>
        </div>
      )}

      {/* How To Play Video Modal matching Screenshot 4 */}
      {showVideoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowVideoModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#0D1117',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green Header Bar */}
            <div
              style={{
                background: '#15AE36',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#000000', margin: 0 }}>
                How to play
              </h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
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
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid #000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} strokeWidth={2.5} />
                </div>
              </button>
            </div>

            {/* Video Container */}
            <div
              style={{
                background: '#000000',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '320px',
              }}
            >
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxHeight: '60vh',
                    borderRadius: '12px',
                    outline: 'none',
                    backgroundColor: '#000000',
                  }}
                />
              ) : (
                <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>
                  Video tutorial currently unavailable.
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div
              style={{
                height: '14px',
                background: '#15AE36',
                width: '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* Rules / Game Instructions Modal matching Screenshot 5 */}
      {showRulesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowRulesModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '88vh',
              background: '#0E1217',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green Header Bar */}
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
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#000000', margin: 0 }}>
                Game Instructions
              </h3>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
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
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid #000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} strokeWidth={2.5} />
                </div>
              </button>
            </div>

            {/* Modal Body with scroll */}
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
              {/* Important Promotion Disclosure Box matching Screenshot 5 */}
              <div
                style={{
                  border: '1.5px solid #10B981',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  marginBottom: '20px',
                }}
              >
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: '0 0 6px 0',
                  }}
                >
                  Important Promotion Disclosure
                </h4>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#94A3B8',
                    lineHeight: '1.5',
                    margin: 0,
                  }}
                >
                  Apple Inc. is not a sponsor of, and is not involved in any way with, any contest, sweepstakes, game, or promotion offered in this app.
                </p>
              </div>

              {/* Rendered Markdown Rules */}
              <div className="rules-markdown-content" style={{ color: '#CBD5E1' }}>
                <ReactMarkdown>{rulesMarkdown}</ReactMarkdown>
              </div>
            </div>

            {/* Bottom Bar */}
            <div
              style={{
                height: '14px',
                background: '#15AE36',
                width: '100%',
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHelpMenu;
