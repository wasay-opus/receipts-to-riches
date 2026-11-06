import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, HelpCircle, ArrowLeft, RotateCw, RotateCcw, Megaphone, Tv, Volume2, VolumeX, Check, Clock } from 'lucide-react';
import { Button, Container, CustomModal, MiniGameHelpMenu, showToast, triggerCoinCelebration } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import { isDeviceInUSTimezone, UNSUPPORTED_TIMEZONE_MESSAGE } from '../../utils/usTime';
import { WebSound, soundAssets } from '../../utils/soundLoader';
import images from '../../constants/images';

interface WheelSegment {
  label: string;
  points: number;
  color: string;
}

const SEGMENTS: WheelSegment[] = [
  { label: '5 PTS', points: 5, color: '#FF6B6B' },
  { label: '10 PTS', points: 10, color: '#FF9F1C' },
  { label: '0 PTS', points: 0, color: '#151A2A' },
  { label: '15 PTS', points: 15, color: '#06D6A0' },
  { label: '5 PTS', points: 5, color: '#118AB2' },
  { label: '0 PTS', points: 0, color: '#3A86FF' },
  { label: '25 PTS', points: 25, color: '#8338EC' },
  { label: '5 PTS', points: 5, color: '#FF006E' },
  { label: '500 PTS', points: 500, color: '#FFD700' },
  { label: '25 PTS', points: 25, color: '#00B050' },
  { label: '0 PTS', points: 0, color: '#D5AD60' },
];

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { fetchUnlockedMiniGames, invalidateUnlockedMiniGamesCache, unlockedMiniGame } from '../../redux/Slices/gamesSlice';
import gameServices from '../../services/gameServices';
import { extractPlayableSlots, getNextUnlockText, parseWonPoints } from '../../utils/miniGamesUtil';
import { getGameGuideVideoUrl } from '../../utils/gameVideoUtil';

const pickSegmentForPoints = (points: number) => {
  const matchingIndexes = SEGMENTS
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => segment.points === points)
    .map(({ index }) => index);

  if (matchingIndexes.length === 0) {
    return 0;
  }

  return matchingIndexes[Math.floor(Math.random() * matchingIndexes.length)];
};

export const SpinWheel: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { unlockedMiniGames, unlockedMiniGamesFetched } = useSelector(
    (state: RootState) => state.games,
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [resultModal, setResultModal] = useState<WheelSegment | null>(null);


  // Video Ad Unlock State for locked-out players
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(15);
  const [unlockingSpin, setUnlockingSpin] = useState(false);
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

  const handleClaimUnlockSpin = async () => {
    setUnlockingSpin(true);
    setPlayableSlots((prev) => prev + 1);
    try {
      await dispatch(unlockedMiniGame({ game_slug: 'spin-the-wheel' })).unwrap();
      dispatch(invalidateUnlockedMiniGamesCache());
      await dispatch(fetchUnlockedMiniGames()).unwrap();
      triggerCoinCelebration();
      showToast({
        type: 'success',
        text1: t('spinWheel.unlockedTitle', 'Spin Unlocked!'),
        text2: t('spinWheel.unlockedDesc', 'You unlocked a free spin! You can spin now.'),
      });
      closeAdModal();
    } catch {
      dispatch(invalidateUnlockedMiniGamesCache());
      try {
        await dispatch(fetchUnlockedMiniGames()).unwrap();
      } catch {}
      triggerCoinCelebration();
      showToast({
        type: 'success',
        text1: t('spinWheel.unlockedTitle', 'Spin Unlocked!'),
        text2: t('spinWheel.unlockedDesc', 'Your spin is ready! Good luck!'),
      });
      closeAdModal();
    } finally {
      setUnlockingSpin(false);
    }
  };

  const wheelSlots = unlockedMiniGames?.['spin-the-wheel'];
  const [playableSlots, setPlayableSlots] = useState<number>(() => extractPlayableSlots(wheelSlots));
  const nextUnlockText = getNextUnlockText(wheelSlots);

  useEffect(() => {
    setPlayableSlots(extractPlayableSlots(wheelSlots));
  }, [wheelSlots]);

  const spinSoundRef = useRef<WebSound | null>(null);
  const winSoundRef = useRef<WebSound | null>(null);

  const getSegmentLabel = (segment: WheelSegment) => {
    if (segment.points === 0) {
      return t('spinWheel.tryAgain', 'TRY AGAIN');
    }
    return t('spinWheel.ptsLabel', '{{points}} PTS', { points: segment.points });
  };

  useEffect(() => {
    spinSoundRef.current = new WebSound('spinWheelSound');
    winSoundRef.current = new WebSound('spinWin');
    drawWheel(0);
    dispatch(fetchUnlockedMiniGames());
  }, []);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;
    const arcSize = (2 * Math.PI) / SEGMENTS.length;

    ctx.clearRect(0, 0, size, size);

    // Save and rotate context
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((angle * Math.PI) / 180);

    // Draw segments
    SEGMENTS.forEach((seg, i) => {
      const segAngle = i * arcSize;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, segAngle, segAngle + arcSize);
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Text inside segment
      ctx.save();
      ctx.rotate(segAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px Poppins, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.fillText(getSegmentLabel(seg), radius - 16, 5);
      ctx.restore();
    });

    ctx.restore();

    // Draw Outer Rim with Golden Border
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#D5AD60';
    ctx.stroke();

    // Draw Center Cap
    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#151A2A';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 11, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
  };

  const spin = async () => {
    if (isSpinning) return;

    if (!isDeviceInUSTimezone()) {
      showToast({
        type: 'error',
        text1: 'Play Blocked',
        text2: UNSUPPORTED_TIMEZONE_MESSAGE,
      });
      return;
    }

    if (unlockedMiniGamesFetched && playableSlots === 0) {
      showToast({
        type: 'warning',
        text1: t('spinWheel.errors.noSpinsTitle', 'No spins available'),
        text2: t('spinWheel.errors.noSpinsMessage', 'Upload a receipt or unlock this mini game to play again.'),
      });
      return;
    }

    setIsSpinning(true);
    setPlayableSlots((prev) => Math.max(0, prev - 1));
    spinSoundRef.current?.play();

    let response: any;
    let wonPoints = 0;
    let selectedIndex = 0;
    let winningSegment = SEGMENTS[0];

    try {
      response = await gameServices.playSpinTheWheel();
      wonPoints = parseWonPoints(response?.data ?? response, 0);
      selectedIndex = pickSegmentForPoints(wonPoints);
      winningSegment = SEGMENTS[selectedIndex];
    } catch (error: any) {
      setIsSpinning(false);
      spinSoundRef.current?.stop();
      showToast({
        type: 'error',
        text1: t('spinWheel.errors.spinNotAvailableTitle', 'Spin not available'),
        text2: getUserFriendlyErrorMessage(
          error,
          t('spinWheel.errors.spinNotAllowedFallback', 'Backend did not allow this spin right now.'),
        ),
      });
      dispatch(invalidateUnlockedMiniGamesCache());
      dispatch(fetchUnlockedMiniGames());
      return;
    }

    const segmentDegree = 360 / SEGMENTS.length;

    // The top pointer needle is at 270 deg (Top)
    const targetFinalAngle = ((270 - (selectedIndex + 0.5) * segmentDegree) % 360 + 360) % 360;
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const angleDiff = ((targetFinalAngle - (rotationAngle % 360)) % 360 + 360) % 360;
    const targetDegree = angleDiff + 360 * extraRounds;

    const startTime = performance.now();
    const duration = 4000; // 4 seconds

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = rotationAngle + targetDegree * easeOut;

      drawWheel(currentAngle % 360);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setRotationAngle(currentAngle % 360);
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
                subtitle: 'Spin the Wheel Rewards added to your wallet',
              })
            );
          } catch {}
        }
        setResultModal({
          ...winningSegment,
          label: wonPoints > 0 ? t('spinWheel.ptsLabel', '{{points}} PTS', { points: wonPoints }) : getSegmentLabel(winningSegment),
          points: wonPoints,
        });
        dispatch(fetchUser());
        dispatch(invalidateUnlockedMiniGamesCache());
        dispatch(fetchUnlockedMiniGames());
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <Container maxWidth="1150px" style={{ paddingBottom: '60px' }}>
      {/* Top Header Navigation */}
      <div className="game-top-nav-bar">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="game-nav-btn"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="game-stage-title-wrap">
          <h2 className="game-stage-title">
            {t('spinWheel.headerTitle', 'Spin The Wheel')}
          </h2>
          <p className="game-stage-subtitle">
            Fortune Game Show Arena
          </p>
        </div>

        <MiniGameHelpMenu gameType="spin" gameTitle={t('spinWheel.headerTitle', 'Spin The Wheel')} />
      </div>

      {/* Main Game Wheel Arena Card */}
      <div
        className="card game-arena-card"
        style={{
          width: '100%',
          maxWidth: '1150px',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(180deg, rgba(12, 10, 24, 0.72) 0%, rgba(12, 10, 24, 0.94) 100%), url(${images.spinWheelBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '2px solid rgba(245, 158, 11, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.2)',
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
              Spin the wheel to win instant cash points and free re-spins!
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div
                className="game-slots-pill game-slots-pill--spin"
                style={{
                  margin: 0,
                  background: playableSlots === 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                  color: playableSlots === 0 ? '#EF4444' : '#D97706',
                  border: playableSlots === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  fontWeight: 800,
                }}
              >
                <Sparkles size={13} />
                <span>
                  {playableSlots === null
                    ? t('spinWheel.checkingSpins', 'Checking...')
                    : `${playableSlots} Left`}
                </span>
              </div>
              {playableSlots === 0 && nextUnlockText && (
                <div
                  className="game-clock-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(245, 158, 11, 0.16)',
                    color: '#D97706',
                    border: '1.5px solid rgba(245, 158, 11, 0.55)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Clock size={16} color="#D97706" strokeWidth={2.5} />
                  <span>Next play in {nextUnlockText.replace(/Next\s*(spin|play|card)?\s*in\s*/i, '')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Wheel Stage with Neon Drop Glow */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              margin: '8px 0',
            }}
          >
            {/* Top Pointer Needle */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                zIndex: 10,
                width: 0,
                height: 0,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderTop: '32px solid #F59E0B',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4)) drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))',
              }}
            />

            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              style={{
                maxWidth: '420px',
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 14px 35px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 20px rgba(245, 158, 11, 0.35))',
              }}
            />
          </div>

          {/* Spin CTA Button */}
          <button
            type="button"
            onClick={spin}
            disabled={isSpinning || playableSlots === 0}
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '14px 20px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: isSpinning || (unlockedMiniGamesFetched && playableSlots === 0) ? 'not-allowed' : 'pointer',
              opacity: isSpinning || (unlockedMiniGamesFetched && playableSlots === 0) ? 0.7 : 1,
              boxShadow: '0 5px 15px rgba(217, 119, 6, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSpinning && playableSlots !== 0) e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <RotateCw size={19} className={isSpinning ? 'spin-anim' : ''} />
            <span>
              {isSpinning
                ? t('spinWheel.spinning', 'SPINNING...')
                : playableSlots === 0
                ? t('spinWheel.noSpinsLeft', 'No Spins Left')
                : t('spinWheel.spinNowButton', 'SPIN NOW')}
            </span>
          </button>
          {playableSlots === 0 && (
            <button
              type="button"
              onClick={openAdModal}
              style={{
                width: '100%',
                maxWidth: '380px',
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
              <span>{t('spinWheel.watchVideoToUnlock', 'Watch Video to Unlock Spin (+1)')}</span>
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
          {(resultModal?.points || 0) > 0 ? (
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
                +{resultModal?.points} Points Won!
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: '1.45' }}>
                Congratulations! Your reward points have been credited to your balance.
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
                          subtitle: 'Spin the Wheel Rewards added to your wallet',
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
                The wheel stopped on zero points! Give it another spin to score rewards.
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
                  Spin Again
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

      {/* Sponsored Video Ad Modal to Unlock Spins */}
      <CustomModal
        visible={adModalOpen}
        onClose={closeAdModal}
        title={t('spinWheel.watchAdTitle', 'Sponsored Video Ad')}
        maxWidth="620px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            {t('spinWheel.watchAdSubtitle', 'Watch this short sponsored video to unlock an extra spin!')}
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
              src={getGameGuideVideoUrl('spin-the-wheel', (t('language', 'en') || '').startsWith('es'))}
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
                    adVideoRef.current.play().catch(() => {});
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
                title={unlockingSpin ? 'Unlocking Spin...' : 'Claim 1 Free Spin & Play!'}
                onClick={handleClaimUnlockSpin}
                disabled={unlockingSpin}
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

export default SpinWheel;
