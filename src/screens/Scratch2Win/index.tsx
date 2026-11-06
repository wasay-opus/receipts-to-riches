import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, HelpCircle, ArrowLeft, RefreshCw, Trophy, Megaphone, Zap, Tv, Volume2, VolumeX, Clock } from 'lucide-react';
import { Button, Container, CustomModal, MiniGameHelpMenu, showToast, triggerCoinCelebration } from '../../components';
import { WebSound } from '../../utils/soundLoader';
import images from '../../constants/images';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { fetchUnlockedMiniGames, invalidateUnlockedMiniGamesCache, unlockedMiniGame } from '../../redux/Slices/gamesSlice';
import gameServices from '../../services/gameServices';
import { extractPlayableSlots, getNextUnlockText, parseWonPoints } from '../../utils/miniGamesUtil';
import { isDeviceInUSTimezone, UNSUPPORTED_TIMEZONE_MESSAGE } from '../../utils/usTime';
import { getGameGuideVideoUrl } from '../../utils/gameVideoUtil';

export const Scratch2Win: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { unlockedMiniGames } = useSelector((state: RootState) => state.games);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedPercent, setRevealedPercent] = useState(0);

  const scratchSlots = unlockedMiniGames?.['scratch-2-win'];
  const [cardsLeft, setCardsLeft] = useState<number>(() => extractPlayableSlots(scratchSlots));
  const nextUnlockText = getNextUnlockText(scratchSlots);

  useEffect(() => {
    setCardsLeft(extractPlayableSlots(scratchSlots));
  }, [scratchSlots]);


  const [prizePoints, setPrizePoints] = useState(0);
  const [cardLoading, setCardLoading] = useState(false);
  const [resultModal, setResultModal] = useState<{ won: boolean; points: number } | null>(null);

  // Video Ad Unlock State for locked-out players
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(15);
  const [unlockingCard, setUnlockingCard] = useState(false);
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

  const handleClaimUnlockCard = async () => {
    setUnlockingCard(true);
    setCardsLeft((prev) => prev + 1);
    try {
      await dispatch(unlockedMiniGame({ game_slug: 'scratch-2-win' })).unwrap();
      dispatch(invalidateUnlockedMiniGamesCache());
      await dispatch(fetchUnlockedMiniGames()).unwrap();
      triggerCoinCelebration();
      showToast({
        type: 'success',
        text1: t('scratch2win.unlockedTitle', 'Scratch Card Unlocked!'),
        text2: t('scratch2win.unlockedDesc', 'You unlocked a free scratch card! Rub to reveal your prize.'),
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
        text1: t('scratch2win.unlockedTitle', 'Scratch Card Unlocked!'),
        text2: t('scratch2win.unlockedDesc', 'Your scratch card is ready! Good luck!'),
      });
      closeAdModal();
    } finally {
      setUnlockingCard(false);
    }
  };

  const handleQuickReveal = () => {
    if (isRevealed || cardLoading || cardsLeft <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    scratchSoundRef.current?.play();
    setIsRevealed(true);
    setRevealedPercent(100);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (prizePoints > 0) {
      winSoundRef.current?.play();
      try {
        sessionStorage.setItem(
          'pending_home_reward',
          JSON.stringify({
            type: 'game',
            points: prizePoints,
            title: `+${prizePoints} Points Won!`,
            subtitle: 'Scratch 2 Win Rewards added to your wallet',
          })
        );
      } catch { }
    }

    setTimeout(() => {
      setResultModal({
        won: prizePoints > 0,
        points: prizePoints,
      });
    }, 400);
  };

  const scratchSoundRef = useRef<WebSound | null>(null);
  const winSoundRef = useRef<WebSound | null>(null);

  useEffect(() => {
    scratchSoundRef.current = new WebSound('scratching');
    winSoundRef.current = new WebSound('coins');
    dispatch(fetchUnlockedMiniGames());
    drawScratchOverlay();
  }, [dispatch]);

  useEffect(() => {
    if (cardsLeft > 0 && !isRevealed && !cardLoading && prizePoints === 0) {
      initScratchCard();
    }
  }, [cardsLeft]);

  const drawScratchOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    const w = canvas.width;
    const h = canvas.height;

    // Rich metallic gold and silver foil gradient
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#D4AF37');
    gradient.addColorStop(0.25, '#FFF9C4');
    gradient.addColorStop(0.5, '#F59E0B');
    gradient.addColorStop(0.75, '#FFD700');
    gradient.addColorStop(1, '#B45309');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Decorative ticket frame with dashed inner edge
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.setLineDash([]);

    // Shimmer central badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.rect(w / 2 - 135, h / 2 - 42, 270, 84);
    ctx.fill();

    // Star icon & Title
    ctx.fillStyle = '#1A1A1A';
    ctx.font = '900 21px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ SCRATCH 2 WIN ★', w / 2, h / 2 - 14);

    ctx.font = '700 13px Poppins, sans-serif';
    ctx.fillStyle = '#451A03';
    ctx.fillText('Rub with finger to scratch & win', w / 2, h / 2 + 16);
  };

  const initScratchCard = async () => {
    if (cardsLeft <= 0) {
      drawScratchOverlay();
      return;
    }

    setIsRevealed(false);
    setRevealedPercent(0);
    setCardLoading(true);
    setCardsLeft((prev) => Math.max(0, prev - 1));

    try {
      const response = await gameServices.playScratch2Win();
      const wonPoints = parseWonPoints(response?.data ?? response, 0);
      setPrizePoints(wonPoints);
      dispatch(fetchUser());
      dispatch(invalidateUnlockedMiniGamesCache());
      dispatch(fetchUnlockedMiniGames());
    } catch (error: any) {
      setPrizePoints(0);
      dispatch(invalidateUnlockedMiniGamesCache());
      dispatch(fetchUnlockedMiniGames());
    } finally {
      setCardLoading(false);
      drawScratchOverlay();
    }
  };

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed || cardLoading) return;

    if (!isDeviceInUSTimezone()) {
      showToast({
        type: 'error',
        text1: 'Play Blocked',
        text2: UNSUPPORTED_TIMEZONE_MESSAGE,
      });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, 2 * Math.PI);
    ctx.fill();

    scratchSoundRef.current?.play();
    checkPercentScratched();
  };

  const checkPercentScratched = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentCount = 0;
      const totalPixels = pixels.length / 4;

      // Sample every 4th pixel for speed
      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] === 0) {
          transparentCount++;
        }
      }

      const percent = Math.round((transparentCount / (totalPixels / 4)) * 100);
      setRevealedPercent(percent);

      if (percent >= 45 && !isRevealed) {
        setIsRevealed(true);
        // prizePoints was already fetched from the backend when this card loaded.
        if (prizePoints > 0) {
          winSoundRef.current?.play();
          try {
            sessionStorage.setItem(
              'pending_home_reward',
              JSON.stringify({
                type: 'game',
                points: prizePoints,
                title: `+${prizePoints} Points Won!`,
                subtitle: 'Scratch 2 Win Rewards added to your wallet',
              })
            );
          } catch { }
        }
        // Clear all canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Show result modal after brief reveal
        setTimeout(() => {
          setResultModal({
            won: prizePoints > 0,
            points: prizePoints,
          });
        }, 500);
      }
    } catch {
      // Ignored
    }
  };

  const handleNextCard = () => {
    if (cardsLeft > 0) {
      initScratchCard();
    }
  };

  return (
    <Container maxWidth="1150px" style={{ paddingBottom: '60px' }}>
      {/* Top Bar */}
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
            {t('scratch2win.pageTitle', 'Scratch 2 Win')}
          </h2>
          <span className="game-stage-subtitle">
            VIP Scratch Card Lounge
          </span>
        </div>

        <MiniGameHelpMenu gameType="scratch" gameTitle={t('scratch2win.pageTitle', 'Scratch 2 Win')} />
      </div>

      {/* Center: Interactive Gold Foil Scratch Card Arena */}
      <div
        className="card game-arena-card"
        style={{
          width: '100%',
          maxWidth: '1150px',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
            backgroundImage: `linear-gradient(180deg, rgba(6, 26, 18, 0.75) 0%, rgba(6, 20, 14, 0.95) 100%), url(${images.slotBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '2px solid rgba(16, 185, 129, 0.45)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.2)',
            borderRadius: '28px',
            padding: '24px 20px',
            gap: '18px',
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Floating Match Info Banner matching Mobile App */}
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
              Rub the metallic gold foil surface to uncover your secret cash points prize!
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div
                className="game-slots-pill game-slots-pill--scratch"
                style={{
                  margin: 0,
                  background: cardsLeft === 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.14)',
                  color: cardsLeft === 0 ? '#EF4444' : '#059669',
                  border: cardsLeft === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 800,
                }}
              >
                <Sparkles size={13} />
                <span>{cardsLeft} Left</span>
              </div>
              {cardsLeft === 0 && nextUnlockText && (
                <div
                  className="game-clock-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(16, 185, 129, 0.16)',
                    color: '#059669',
                    border: '1.5px solid rgba(16, 185, 129, 0.55)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Clock size={16} color="#059669" strokeWidth={2.5} />
                  <span>Next play in {nextUnlockText.replace(/Next\s*(spin|play|card)?\s*in\s*/i, '')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Gold Foil Scratch Card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '430px',
              height: '265px',
              borderRadius: '24px',
              overflow: 'hidden',
              margin: '12px auto',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
              border: '3px solid #D5AD60',
              background: 'linear-gradient(135deg, #0A291E 0%, #151A2A 100%)',
            }}
          >
            {/* Hidden Prize Underneath */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, #0F382B 0%, #061A13 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#FFFFFF',
                textAlign: 'center',
                padding: '16px',
                boxSizing: 'border-box',
              }}
            >
              <img src={images.Coin} alt={t('scratch2win.prizeAlt', 'Prize')} style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }} />
              <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#FFD700', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {prizePoints > 0
                  ? t('scratch2win.wonPointsDisplay', '+{{points}} PTS!', { points: prizePoints })
                  : t('scratch2win.noWinDisplay', 'No Win')}
              </h3>
              <span style={{ fontSize: '13px', color: prizePoints > 0 ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                {prizePoints > 0
                  ? t('scratch2win.winnerInstantReward', 'Winner Instant Reward')
                  : t('scratch2win.betterLuckNextTime', 'Better luck next time')}
              </span>
            </div>

            {/* Scratchable Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={360}
              height={240}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                cursor: 'grab',
                touchAction: 'none',
              }}
              onMouseDown={(e) => {
                setIsDrawing(true);
                const { x, y } = getPosition(e);
                scratch(x, y);
              }}
              onMouseMove={(e) => {
                if (isDrawing) {
                  const { x, y } = getPosition(e);
                  scratch(x, y);
                }
              }}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
              onTouchStart={(e) => {
                setIsDrawing(true);
                const { x, y } = getPosition(e);
                scratch(x, y);
              }}
              onTouchMove={(e) => {
                if (isDrawing) {
                  const { x, y } = getPosition(e);
                  scratch(x, y);
                }
              }}
              onTouchEnd={() => setIsDrawing(false)}
            />
          </div>

          {/* Card Action Buttons */}
          <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Play / Scratch Button matching Spin Now & Pull Lever in other games */}
            <button
              type="button"
              onClick={handleNextCard}
              disabled={cardsLeft <= 0 || cardLoading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15.5px',
                fontWeight: 800,
                cursor: cardsLeft <= 0 || cardLoading ? 'not-allowed' : 'pointer',
                opacity: cardsLeft <= 0 || cardLoading ? 0.7 : 1,
                boxShadow: '0 5px 16px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (cardsLeft > 0 && !cardLoading) e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <RefreshCw size={19} className={cardLoading ? 'spin-anim' : ''} />
              <span>
                {cardLoading
                  ? 'LOADING CARD...'
                  : cardsLeft > 0
                  ? 'PLAY'
                  : t('scratch2win.noCardsLeft', 'No Cards Left')}
              </span>
            </button>

            {/* Watch Video to Unlock Scratch Card Option when locked out */}
            {cardsLeft <= 0 && (
              <button
                type="button"
                onClick={openAdModal}
                style={{
                  width: '100%',
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
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Tv size={18} />
                <span>{t('scratch2win.watchVideoToUnlock', 'Watch Video to Unlock Card (+1)')}</span>
              </button>
            )}
          </div>
        </div>

      {/* Sponsored Video Ad Modal to Unlock Scratch Cards */}
      <CustomModal
        visible={adModalOpen}
        onClose={closeAdModal}
        title={t('scratch2win.watchAdTitle', 'Sponsored Video Ad')}
        maxWidth="620px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            {t('scratch2win.watchAdSubtitle', 'Watch this short sponsored video to unlock a free Scratch 2 Win card!')}
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
              src={getGameGuideVideoUrl('scratch-2-win', (t('language', 'en') || '').startsWith('es'))}
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
                title={unlockingCard ? 'Unlocking Card...' : 'Claim 1 Free Scratch Card!'}
                onClick={handleClaimUnlockCard}
                disabled={unlockingCard}
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

      {/* Result Modal matching flow-video with 360° Spinning Coin */}
      <CustomModal
        visible={Boolean(resultModal)}
        onClose={() => setResultModal(null)}
        maxWidth="390px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 4px 4px 4px' }}>
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

          <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            {resultModal?.won ? `You won ${resultModal.points} points!` : 'Better luck next time!'}
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: '1.45' }}>
            {resultModal?.won
              ? 'Your winnings have been credited to your balance.'
              : 'Keep scratching to uncover instant cash points!'}
          </p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setResultModal(null);
                handleNextCard();
              }}
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
                const points = resultModal?.won ? resultModal.points : prizePoints;
                setResultModal(null);
                navigate('/home', {
                  state: points > 0 ? {
                    rewardCelebration: {
                      type: 'game',
                      points,
                      title: `+${points} Points Won!`,
                      subtitle: 'Scratch 2 Win Rewards added to your wallet',
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
        </div>
      </CustomModal>
    </Container>
  );
};

export default Scratch2Win;
