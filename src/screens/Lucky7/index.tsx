import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, HelpCircle, RotateCcw, Sparkles, Trophy, Megaphone, Tv, Volume2, VolumeX, Clock } from 'lucide-react';
import { Button, Container, CustomModal, MiniGameHelpMenu, showToast, triggerCoinCelebration } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import { WebSound } from '../../utils/soundLoader';
import images from '../../constants/images';
import { getGameGuideVideoUrl } from '../../utils/gameVideoUtil';

const SYMBOLS = ['7️⃣', '💎', '🍒', '🔔', '🪙', '⭐'];

const CasinoSymbol: React.FC<{ symbol: string; spinning?: boolean }> = ({ symbol, spinning }) => {
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: spinning ? 'blur(2px)' : 'none',
    transition: 'filter 0.1s ease',
  };

  switch (symbol) {
    case '7️⃣':
      return (
        <div style={containerStyle}>
          <svg viewBox="0 0 64 64" width="62" height="62" fill="none">
            <defs>
              <linearGradient id="goldGrad7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF59D" />
                <stop offset="45%" stopColor="#FFC107" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <path
              d="M14 14 H50 V24 L32 52 H18 L34 24 H14 Z"
              fill="url(#goldGrad7)"
              stroke="#B91C1C"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M18 18 H46 V21 L32 46 H24 L37 21 H18 Z" fill="#FFF9C4" opacity="0.65" />
          </svg>
        </div>
      );
    case '💎':
      return (
        <div style={containerStyle}>
          <svg viewBox="0 0 64 64" width="60" height="60" fill="none">
            <defs>
              <linearGradient id="gemGradL7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <polygon points="20,14 44,14 54,26 32,52 10,26" fill="url(#gemGradL7)" stroke="#0369A1" strokeWidth="2" strokeLinejoin="round" />
            <polygon points="20,14 44,14 38,26 26,26" fill="#BAE6FD" opacity="0.9" />
            <polygon points="10,26 26,26 32,52" fill="#0284C7" opacity="0.75" />
            <polygon points="44,14 54,26 38,26" fill="#7DD3FC" opacity="0.85" />
            <circle cx="28" cy="21" r="2.5" fill="#FFFFFF" opacity="0.9" />
          </svg>
        </div>
      );
    case '🍒':
      return (
        <div style={containerStyle}>
          <svg viewBox="0 0 64 64" width="60" height="60" fill="none">
            <defs>
              <radialGradient id="cherryRedL7" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="50%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </radialGradient>
            </defs>
            <path d="M22 36 C22 22, 34 14, 46 12" stroke="#15803D" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M42 38 C40 24, 38 18, 46 12" stroke="#15803D" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M46 12 C52 10, 56 14, 54 18 C48 18, 46 14, 46 12 Z" fill="#22C55E" stroke="#15803D" strokeWidth="1" />
            <circle cx="20" cy="42" r="14" fill="url(#cherryRedL7)" stroke="#991B1B" strokeWidth="1.5" />
            <circle cx="16" cy="37" r="3" fill="#FFFFFF" opacity="0.65" />
            <circle cx="44" cy="44" r="14" fill="url(#cherryRedL7)" stroke="#991B1B" strokeWidth="1.5" />
            <circle cx="40" cy="39" r="3" fill="#FFFFFF" opacity="0.65" />
          </svg>
        </div>
      );
    case '🔔':
      return (
        <div style={containerStyle}>
          <svg viewBox="0 0 64 64" width="58" height="58" fill="none">
            <defs>
              <linearGradient id="bellGoldL7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>
            </defs>
            <path d="M32 10 C34 10 35 12 35 14 C35 14 46 22 47 38 L51 44 H13 L17 38 C18 22 29 14 29 14 C29 12 30 10 32 10 Z" fill="url(#bellGoldL7)" stroke="#A16207" strokeWidth="2" strokeLinejoin="round" />
            <rect x="12" y="44" width="40" height="5" rx="2.5" fill="#CA8A04" stroke="#854D0E" strokeWidth="1.5" />
            <circle cx="32" cy="52" r="5" fill="#EAB308" stroke="#854D0E" strokeWidth="1.5" />
            <path d="M22 24 C24 18 30 16 32 16" stroke="#FEF9C3" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>
      );
    case '🪙':
      return (
        <div style={containerStyle}>
          <svg viewBox="0 0 64 64" width="58" height="58" fill="none">
            <defs>
              <radialGradient id="coinGoldL7" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="60%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#A16207" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="23" fill="url(#coinGoldL7)" stroke="#854D0E" strokeWidth="2.5" />
            <circle cx="32" cy="32" r="18" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
            <text x="32" y="40" fontSize="22" fontWeight="900" textAnchor="middle" fill="#713F12" fontFamily="Arial, sans-serif">$</text>
          </svg>
        </div>
      );
    case '⭐':
    default:
      return (
        <div style={containerStyle}>
          <svg viewBox="0 0 64 64" width="58" height="58" fill="none">
            <defs>
              <linearGradient id="starGoldL7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="40%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <polygon
              points="32,8 39,23 56,25 43,37 47,54 32,45 17,54 21,37 8,25 25,23"
              fill="url(#starGoldL7)"
              stroke="#B45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="24" r="2" fill="#FFFFFF" opacity="0.8" />
          </svg>
        </div>
      );
  }
};

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { fetchUnlockedMiniGames, invalidateUnlockedMiniGamesCache, unlockedMiniGame } from '../../redux/Slices/gamesSlice';
import gameServices from '../../services/gameServices';
import { extractPlayableSlots, getNextUnlockText, parseWonPoints } from '../../utils/miniGamesUtil';
import { isDeviceInUSTimezone, UNSUPPORTED_TIMEZONE_MESSAGE } from '../../utils/usTime';

// Picks reel symbols that visually match the REAL backend outcome - the
// animation is cosmetic, but it must never show a result the backend didn't award.
const pickReelsForPoints = (points: number): [string, string, string] => {
  if (points >= 1000) return ['7️⃣', '7️⃣', '7️⃣'];
  if (points >= 300) return ['💎', '💎', '💎'];
  if (points > 0) {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const other = SYMBOLS.find((s) => s !== symbol) ?? SYMBOLS[0];
    return [symbol, symbol, other];
  }
  const shuffled = [...SYMBOLS].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1], shuffled[2]];
};

export const Lucky7: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { unlockedMiniGames } = useSelector((state: RootState) => state.games);

  const [reel1, setReel1] = useState('7️⃣');
  const [reel2, setReel2] = useState('7️⃣');
  const [reel3, setReel3] = useState('7️⃣');
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultModal, setResultModal] = useState<{ won: boolean; points: number } | null>(null);


  const lucky7Slots = unlockedMiniGames?.['lucky-7'];
  const [playsLeft, setPlaysLeft] = useState<number>(() => extractPlayableSlots(lucky7Slots));
  const nextUnlockText = getNextUnlockText(lucky7Slots);

  useEffect(() => {
    setPlaysLeft(extractPlayableSlots(lucky7Slots));
  }, [lucky7Slots]);

  // Video Ad Unlock State for locked-out players
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(15);
  const [unlockingPlay, setUnlockingPlay] = useState(false);
  const [adMuted, setAdMuted] = useState(false);
  const [adVideoReady, setAdVideoReady] = useState(false);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const adTimerRef = useRef<any>(null);

  // Preload video in background
  useEffect(() => {
    const preloader = document.createElement('video');
    preloader.src = 'https://api.receiptstoriches.net/images/game-guide/video-folder/IMG_6536.mp4';
    preloader.preload = 'auto';
    preloader.load();
  }, []);

  const openAdModal = () => {
    setAdSecondsLeft(15);
    setAdVideoReady(false);
    setAdModalOpen(true);
  };

  const closeAdModal = () => {
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    setAdModalOpen(false);
    setAdSecondsLeft(15);
  };

  useEffect(() => {
    if (adModalOpen) {
      setAdSecondsLeft(15);
      adTimerRef.current = setInterval(() => {
        setAdSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(adTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [adModalOpen]);

  const handleClaimUnlockPlay = async () => {
    setUnlockingPlay(true);
    setPlaysLeft((prev) => prev + 1);
    try {
      await dispatch(unlockedMiniGame({ game_slug: 'lucky-7' })).unwrap();
      dispatch(invalidateUnlockedMiniGamesCache());
      await dispatch(fetchUnlockedMiniGames()).unwrap();
      triggerCoinCelebration();
      showToast({
        type: 'success',
        text1: t('lucky7.unlockedTitle', 'Lucky 7 Unlocked!'),
        text2: t('lucky7.unlockedDesc', 'You unlocked a free play! Pull the lever now.'),
      });
      closeAdModal();
    } catch {
      dispatch(invalidateUnlockedMiniGamesCache());
      try {
        await dispatch(fetchUnlockedMiniGames()).unwrap();
      } catch { }
      triggerCoinCelebration();
      showToast({
        type: 'success',
        text1: t('lucky7.unlockedTitle', 'Lucky 7 Unlocked!'),
        text2: t('lucky7.unlockedDesc', 'Your play is ready! Good luck!'),
      });
      closeAdModal();
    } finally {
      setUnlockingPlay(false);
    }
  };

  const spinSoundRef = useRef<WebSound | null>(null);
  const winSoundRef = useRef<WebSound | null>(null);

  useEffect(() => {
    spinSoundRef.current = new WebSound('spinWheelSound');
    winSoundRef.current = new WebSound('spinWin');
    dispatch(fetchUnlockedMiniGames());
  }, [dispatch]);

  const spinReels = async () => {
    if (isSpinning) return;

    if (!isDeviceInUSTimezone()) {
      showToast({
        type: 'error',
        text1: 'Play Blocked',
        text2: UNSUPPORTED_TIMEZONE_MESSAGE,
      });
      return;
    }

    if (playsLeft <= 0) {
      showToast({
        type: 'info',
        text1: t('lucky7.errors.noPlaysLeft', 'No plays left'),
        text2: nextUnlockText || t('lucky7.errors.allPlaysUsed', 'You have used all plays for today. Plays unlock every 24 hours.'),
      });
      return;
    }

    setIsSpinning(true);
    setPlaysLeft((prev) => Math.max(0, prev - 1));
    spinSoundRef.current?.play();

    // Ask the backend for the real outcome BEFORE showing any result
    let wonPoints = 0;
    try {
      const response = await gameServices.playLucky7();
      wonPoints = parseWonPoints(response?.data ?? response, 0);
      dispatch(invalidateUnlockedMiniGamesCache());
      dispatch(fetchUnlockedMiniGames());
    } catch (error: any) {
      setIsSpinning(false);
      spinSoundRef.current?.stop();
      showToast({
        type: 'error',
        text1: t('lucky7.errors.spinNotAvailable', 'Spin not available'),
        text2: getUserFriendlyErrorMessage(
          error,
          t('lucky7.errors.spinNotAllowed', 'Backend did not allow this spin right now.'),
        ),
      });
      dispatch(invalidateUnlockedMiniGamesCache());
      dispatch(fetchUnlockedMiniGames());
      return;
    }

    const [final1, final2, final3] = pickReelsForPoints(wonPoints);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      // Reel 1 spins until tick 14
      if (count <= 14) {
        setReel1(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      } else if (count === 15) {
        setReel1(final1);
      }

      // Reel 2 spins until tick 20
      if (count <= 20) {
        setReel2(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      } else if (count === 21) {
        setReel2(final2);
      }

      // Reel 3 spins until tick 26
      if (count <= 26) {
        setReel3(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      } else if (count === 27) {
        setReel3(final3);
        clearInterval(interval);
        setIsSpinning(false);
        spinSoundRef.current?.stop();

        if (wonPoints > 0) {
          winSoundRef.current?.play();
          try {
            sessionStorage.setItem(
              'pending_home_reward',
              JSON.stringify({
                type: 'game',
                points: wonPoints,
                title: `+${wonPoints} Points Won!`,
                subtitle: 'Lucky 777 Slot Rewards added to your wallet',
              })
            );
          } catch { }
        }
        setResultModal({ won: wonPoints > 0, points: wonPoints });
        dispatch(fetchUser());
      }
    }, 70);
  };

  return (
    <Container maxWidth="1150px" style={{ paddingBottom: '60px' }}>
      {/* Top Header Bar */}
      <div className="game-top-nav-bar">
        <button
          type="button"
          className="game-nav-btn"
          onClick={() => navigate(-1)}
          aria-label={t('common.back', 'Back')}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="game-stage-title-wrap">
          <h2 className="game-stage-title">
            {t('lucky7.headerTitle', 'Lucky 777 Slot')}
          </h2>
          <span className="game-stage-subtitle">
            VIP Casino Lounge
          </span>
        </div>

        <MiniGameHelpMenu gameType="lucky7" gameTitle={t('lucky7.headerTitle', 'Lucky 777 Slot')} />
      </div>

      {/* Main 3D Slot Machine Arena Card */}
      <div
        className="card game-arena-card"
        style={{
          width: '100%',
          maxWidth: '1150px',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
            backgroundImage: `linear-gradient(180deg, rgba(12, 10, 24, 0.72) 0%, rgba(12, 10, 24, 0.94) 100%), url(${images.slotBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '2px solid rgba(245, 158, 11, 0.45)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.2)',
            borderRadius: '28px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            minHeight: '480px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Floating Match Info Banner matching Mobile App Screenshot */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              color: '#0F172A',
              padding: '12px 18px',
              borderRadius: '20px',
              fontSize: '13.5px',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              maxWidth: '600px',
              width: '100%',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ lineHeight: '1.35', flex: 1, textAlign: 'left' }}>
              {t('lucky7.matchInfo', 'Match 777 for jackpot, or land 7s to earn bonus rewards.')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div
                className="game-slots-pill game-slots-pill--lucky7"
                style={{
                  margin: 0,
                  background: playsLeft === 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                  color: playsLeft === 0 ? '#EF4444' : '#DC2626',
                  border: playsLeft === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(220, 38, 38, 0.25)',
                  fontWeight: 800,
                }}
              >
                <Sparkles size={13} />
                <span>{playsLeft} Left</span>
              </div>
              {playsLeft === 0 && nextUnlockText && (
                <div
                  className="game-clock-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(239, 68, 68, 0.14)',
                    color: '#DC2626',
                    border: '1.5px solid rgba(239, 68, 68, 0.55)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Clock size={16} color="#DC2626" strokeWidth={2.5} />
                  <span>Next play in {nextUnlockText.replace(/Next\s*(spin|play|card)?\s*in\s*/i, '')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3D Casino Slot Cabinet matching Mobile App Screenshot */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '430px',
              margin: '8px 18px 8px 0',
            }}
          >
            {/* Retro Red Cabinet Frame with Light Bulbs */}
            <div
              style={{
                position: 'relative',
                background: 'linear-gradient(145deg, #DC2626 0%, #991B1B 100%)',
                borderRadius: '26px',
                padding: '18px 16px',
                border: '4px solid #F59E0B',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65), inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -4px 6px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Marquee Light Bulbs Around Border */}
              <div
                style={{
                  position: 'absolute',
                  inset: '5px',
                  borderRadius: '20px',
                  border: '2px dotted rgba(254, 240, 138, 0.85)',
                  pointerEvents: 'none',
                  boxShadow: 'inset 0 0 10px rgba(253, 224, 71, 0.5)',
                }}
              />

              {/* 3D Reels Viewport */}
              <div
                style={{
                  position: 'relative',
                  background: '#0B0F17',
                  borderRadius: '18px',
                  padding: '10px',
                  border: '3px solid #1E293B',
                  boxShadow: 'inset 0 8px 18px rgba(0,0,0,0.8)',
                  overflow: 'hidden',
                }}
              >
                {/* Horizontal Center Payline */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #EF4444, #FBBF24, #EF4444, transparent)',
                    boxShadow: '0 0 8px #EF4444',
                    zIndex: 2,
                    pointerEvents: 'none',
                    opacity: 0.85,
                  }}
                />

                {/* 3 Reels Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[reel1, reel2, reel3].map((symbol, idx) => (
                    <div
                      key={idx}
                      className="reel-box"
                      style={{
                        transform: isSpinning ? 'scale(0.96) translateY(2px)' : 'scale(1)',
                        transition: 'transform 0.08s ease',
                        background: 'linear-gradient(180deg, #CBD5E1 0%, #F8FAFC 22%, #FFFFFF 50%, #F8FAFC 78%, #CBD5E1 100%)',
                        borderRadius: '14px',
                        border: '2px solid #E2E8F0',
                        boxShadow: 'inset 0 10px 14px rgba(0,0,0,0.22), inset 0 -10px 14px rgba(0,0,0,0.22), 0 4px 10px rgba(0,0,0,0.3)',
                        height: '135px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CasinoSymbol symbol={symbol} spinning={isSpinning} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3D Casino Mechanical Lever on Right */}
            <div
              style={{
                position: 'absolute',
                right: '-24px',
                top: '26px',
                width: '24px',
                height: '110px',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 3,
              }}
            >
              {/* Red Sphere Knob */}
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #F87171, #DC2626 60%, #7F1D1D 100%)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.7)',
                  transform: isSpinning ? 'translateY(50px) scale(0.95)' : 'translateY(0)',
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              {/* Golden Metallic Lever Arm */}
              <div
                style={{
                  width: '6px',
                  height: isSpinning ? '45px' : '75px',
                  background: 'linear-gradient(90deg, #FDE68A 0%, #F59E0B 45%, #92400E 100%)',
                  borderRadius: '3px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  transition: 'height 0.25s ease',
                }}
              />
              {/* Lever Base Pivot */}
              <div
                style={{
                  width: '14px',
                  height: '16px',
                  borderRadius: '3px',
                  background: 'linear-gradient(180deg, #64748B, #1E293B)',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
                }}
              />
            </div>
          </div>

          {/* Spin CTA Button */}
          <button
            type="button"
            onClick={spinReels}
            disabled={isSpinning || playsLeft <= 0}
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '16px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              border: '2px solid rgba(255,255,255,0.3)',
              fontSize: '16px',
              fontWeight: 800,
              cursor: isSpinning || playsLeft <= 0 ? 'not-allowed' : 'pointer',
              opacity: isSpinning || playsLeft <= 0 ? 0.7 : 1,
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSpinning && playsLeft > 0) e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <RotateCcw size={20} className={isSpinning ? 'spin-anim' : ''} />
            <span>
              {isSpinning
                ? t('lucky7.buttons.rolling', 'ROLLING...')
                : playsLeft > 0
                  ? t('lucky7.buttons.pullLever', 'PULL LEVER / SPIN')
                  : t('lucky7.buttons.noPlaysLeft', 'No Plays Left')}
            </span>
          </button>

          {/* Watch Video to Unlock Lucky 7 Option when locked out */}
          {playsLeft <= 0 && (
            <button
              type="button"
              onClick={openAdModal}
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '14px 20px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 5px 16px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Tv size={18} />
              <span>{t('lucky7.watchVideoToUnlock', 'Watch Video to Unlock Lucky 7 (+1)')}</span>
            </button>
          )}
        </div>

      {/* Result Modal matching flow-video with 360° Spinning Coin */}
      <CustomModal
        visible={Boolean(resultModal)}
        onClose={() => setResultModal(null)}
        maxWidth="390px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 4px 4px 4px' }}>
          {resultModal?.won && (resultModal?.points || 0) > 0 ? (
            <>
              {/* 360 Degree Continuously Spinning Golden Coin in 3D */}
              <div
                style={{
                  perspective: '600px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <img
                  src={images.Coin}
                  alt="Prize Coin"
                  style={{
                    width: '88px',
                    height: '88px',
                    animation: 'coin3DSpinAnimation 2.2s linear infinite',
                    transformStyle: 'preserve-3d',
                    filter: 'drop-shadow(0 6px 18px rgba(255, 215, 0, 0.5))',
                  }}
                />
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                +{resultModal.points} Points Won!
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: '1.45' }}>
                Congratulations! Your winnings have been credited to your balance.
              </p>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setResultModal(null)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '24px',
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '15.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Play Again
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const points = resultModal?.points || 0;
                    setResultModal(null);
                    navigate('/home', {
                      state: points > 0 ? {
                        rewardCelebration: {
                          type: 'game',
                          points,
                          title: `+${points} Points Won!`,
                          subtitle: 'Lucky 777 Slot Rewards added to your wallet',
                        },
                      } : undefined,
                    });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '8px 16px',
                  }}
                >
                  Back to Home
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Better Luck Next Time Distinct State (No Gold Coin) */}
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '2px dashed rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
                }}
              >
                <RotateCcw size={40} color="#F59E0B" />
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                Better Luck Next Time!
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: '1.45' }}>
                You stopped just short of the jackpot! Pull the lever again to match symbols and win.
              </p>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setResultModal(null)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '24px',
                    background: '#F59E0B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '15.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Try Again
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResultModal(null);
                    navigate('/home');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '8px 16px',
                  }}
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </CustomModal>

      {/* Sponsored Video Ad Modal to Unlock Lucky 7 Plays */}
      <CustomModal
        visible={adModalOpen}
        onClose={closeAdModal}
        title={t('lucky7.watchAdTitle', 'Sponsored Video Ad')}
        maxWidth="620px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            {t('lucky7.watchAdSubtitle', 'Watch this short sponsored video to unlock a free Lucky 7 play!')}
          </p>

          {/* Video Player Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#0B0F17',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={adVideoRef}
              src={getGameGuideVideoUrl('lucky-7', (t('language', 'en') || '').startsWith('es'))}
              autoPlay
              muted={adMuted}
              playsInline
              preload="auto"
              loop
              onCanPlay={() => setAdVideoReady(true)}
              onPlaying={() => setAdVideoReady(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Video Loading Spinner Overlay */}
            {!adVideoReady && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: '#0B0F17',
                  color: '#94A3B8',
                  zIndex: 2,
                }}
              >
                <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Loading video ad...</span>
              </div>
            )}

            {/* Countdown Badge */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                color: adSecondsLeft > 0 ? '#FFD700' : '#10B981',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                zIndex: 3,
              }}
            >
              <Sparkles size={13} />
              <span>{adSecondsLeft > 0 ? `Ad ends in ${adSecondsLeft}s` : 'Ad Complete!'}</span>
            </div>

            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setAdMuted((prev) => !prev);
                if (adVideoRef.current) {
                  adVideoRef.current.muted = !adVideoRef.current.muted;
                  if (!adVideoRef.current.muted) {
                    adVideoRef.current.play().catch(() => { });
                  }
                }
              }}
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                color: '#FFFFFF',
                padding: '5px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                zIndex: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
              aria-label={adMuted ? 'Unmute video audio' : 'Mute video audio'}
            >
              {adMuted ? <VolumeX size={15} color="#EF4444" /> : <Volume2 size={15} color="#10B981" />}
              <span>{adMuted ? 'Unmute' : 'Sound On'}</span>
            </button>

            {/* Sponsored Label */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.65)',
                color: '#FFFFFF',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                zIndex: 3,
              }}
            >
              Sponsored Ad
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-card-secondary)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${((15 - adSecondsLeft) / 15) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10B981, #059669)',
                transition: 'width 1s linear',
              }}
            />
          </div>

          {/* Action CTA */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {adSecondsLeft > 0 ? (
              <button
                type="button"
                disabled
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'var(--bg-card-secondary)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'not-allowed',
                }}
              >
                Watch full ad to unlock (+{adSecondsLeft}s)
              </button>
            ) : (
              <Button
                title={unlockingPlay ? 'Unlocking Lucky 7...' : 'Claim 1 Free Play & Spin!'}
                onClick={handleClaimUnlockPlay}
                disabled={unlockingPlay}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                }}
              />
            )}
            <button
              type="button"
              onClick={closeAdModal}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '6px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </CustomModal>
    </Container>
  );
};

export default Lucky7;
