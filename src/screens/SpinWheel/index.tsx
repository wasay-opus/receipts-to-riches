import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, HelpCircle, ArrowLeft, RotateCw, RotateCcw, Megaphone } from 'lucide-react';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
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
import { fetchUnlockedMiniGames, invalidateUnlockedMiniGamesCache } from '../../redux/Slices/gamesSlice';
import gameServices from '../../services/gameServices';
import { extractPlayableSlots, getNextUnlockText, parseWonPoints } from '../../utils/miniGamesUtil';

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
  const [rulesModalVisible, setRulesModalVisible] = useState(false);

  const wheelSlots = unlockedMiniGames?.['spin-the-wheel'];
  const playableSlots = extractPlayableSlots(wheelSlots);
  const nextUnlockText = getNextUnlockText(wheelSlots);

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
      ctx.font = 'bold 12px Poppins, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(getSegmentLabel(seg), radius - 16, 4);
      ctx.restore();
    });

    ctx.restore();

    // Draw Outer Rim with Golden Border
    ctx.beginPath();
    ctx.arc(center, center, radius + 5, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#D5AD60';
    ctx.stroke();

    // Draw Center Cap
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#151A2A';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
  };

  const spin = async () => {
    if (isSpinning) return;

    if (unlockedMiniGamesFetched && playableSlots === 0) {
      showToast({
        type: 'warning',
        text1: t('spinWheel.errors.noSpinsTitle', 'No spins available'),
        text2: t('spinWheel.errors.noSpinsMessage', 'Upload a receipt or unlock this mini game to play again.'),
      });
      return;
    }

    setIsSpinning(true);
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
        text2:
          error?.response?.data?.message ||
          error?.message ||
          t('spinWheel.errors.spinNotAllowedFallback', 'Backend did not allow this spin right now.'),
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
          triggerCoinCelebration();
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
    <Container maxWidth="1000px" style={{ paddingBottom: '60px' }}>
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

        <button
          type="button"
          onClick={() => setRulesModalVisible(true)}
          className="game-nav-btn"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* 2-Column Responsive Layout: Left (Game Wheel) & Right (Campaign + Rules) */}
      <div className="game-screen-grid">
        {/* Left: Main Game Wheel Arena Card */}
        <div className="card game-arena-card">
          {/* Card Header */}
          <div className="game-arena-header">
            <div>
              <span className="game-arena-badge game-arena-badge--spin">
                SPIN &bull; 500 PTS TOP PRIZE
              </span>
              <p className="game-arena-desc">
                {t('spinWheel.subtitle', 'Spin the wheel to win instant cash points and free re-spins!')}
              </p>
            </div>
            <div className="game-slots-pill game-slots-pill--spin">
              <Sparkles size={14} />
              {playableSlots === null
                ? t('spinWheel.checkingSpins', 'Checking...')
                : `${playableSlots} Spins Left`}
            </div>
          </div>

          {/* Wheel Stage with Neon Drop Glow */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              margin: '8px 0',
            }}
          >
            {/* Top Pointer Needle */}
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                zIndex: 10,
                width: 0,
                height: 0,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderTop: '32px solid #F59E0B',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))',
              }}
            />

            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              style={{
                maxWidth: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 12px 28px rgba(0, 0, 0, 0.18))',
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
              maxWidth: '420px',
              padding: '16px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '16px',
              fontWeight: 800,
              cursor: isSpinning || (unlockedMiniGamesFetched && playableSlots === 0) ? 'not-allowed' : 'pointer',
              opacity: isSpinning || (unlockedMiniGamesFetched && playableSlots === 0) ? 0.7 : 1,
              boxShadow: '0 6px 18px rgba(217, 119, 6, 0.35)',
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
            <RotateCw size={20} className={isSpinning ? 'spin-anim' : ''} />
            <span>
              {isSpinning
                ? t('spinWheel.spinning', 'SPINNING...')
                : playableSlots === 0
                ? t('spinWheel.noSpinsLeft', 'No Spins Left')
                : t('spinWheel.spinNowButton', 'SPIN NOW')}
            </span>
          </button>
          {playableSlots === 0 && nextUnlockText && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              ⏳ {nextUnlockText}
            </span>
          )}
        </div>

        {/* Right: Side Column (Campaign Ad + Rules) */}
        <div className="game-side-column">
          {/* Sponsored Ad / Campaign Card */}
          <div className="card game-campaign-card">
            <div className="game-campaign-icon">
              <Megaphone size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {t('home.growAudienceTitle', 'Grow Your Audience!')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
              {t('home.growAudienceDesc', 'Advertise your brand, website, or mobile app directly to our active users. Tap here to launch your campaign!')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/campaigns/create')}
              className="game-campaign-btn"
            >
              {t('home.getStarted', 'Get Started')} &rarr;
            </button>
          </div>

          {/* Rules & How to Play Card */}
          <div className="card game-rules-card">
            <h4 className="game-rules-title">
              {t('spinWheel.rulesTitle', 'Rules & How to Play')}
            </h4>
            <div className="game-rules-list">
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Tap "SPIN NOW" to launch the fortune wheel.</span>
              </div>
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Win instant cash points credited straight to your balance.</span>
              </div>
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Landing on "EXTRA SPIN" awards you a free re-spin!</span>
              </div>
            </div>
          </div>
        </div>
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
                      state: {
                        rewardCelebration: {
                          type: 'game',
                          title: `+${points} Points Won!`,
                          subtitle: `Added to your wallet`,
                          points,
                        },
                      },
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
                  Done
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
                    navigate('/play');
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
                  Back to Games
                </button>
              </div>
            </>
          )}
        </div>
      </CustomModal>

      {/* Rules Modal */}
      <CustomModal
        visible={rulesModalVisible}
        onClose={() => setRulesModalVisible(false)}
        title={t('spinWheel.rulesModalTitle', 'Spin the Wheel Rules')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
          <p>{t('spinWheel.rules.rule1', '1. Each user receives daily free spins after uploading receipts.')}</p>
          <p>{t('spinWheel.rules.rule2', '2. Tap SPIN NOW to rotate the wheel. The reward indicated by the needle will be added to your points balance.')}</p>
          <p>{t('spinWheel.rules.rule3', '3. Points can be redeemed for gift cards and prizes in the Rewards section.')}</p>
          <Button
            title={t('spinWheel.gotIt', 'Got it!')}
            onClick={() => setRulesModalVisible(false)}
            style={{ width: '100%', marginTop: '12px' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default SpinWheel;
