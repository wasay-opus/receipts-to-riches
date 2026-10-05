import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, HelpCircle, ArrowLeft, RotateCw } from 'lucide-react';
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

const parseWonPoints = (payload: any, fallback: number) => {
  const candidates = [
    payload?.points,
    payload?.won_points,
    payload?.reward_points,
    payload?.data?.points,
    payload?.data?.won_points,
    payload?.data?.reward_points,
    payload?.data?.wallet?.points,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  const message = String(payload?.message ?? payload?.data?.message ?? '');
  const matchedPoints = message.match(/(\d+)\s*(pts?|points?)/i);
  if (matchedPoints) {
    const parsed = Number(matchedPoints[1]);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return fallback;
};

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

const extractPlayableSlots = (slots: any[] | undefined) =>
  Array.isArray(slots)
    ? slots.filter(
        (slot) =>
          Number(slot?.is_open) === 1 ||
          String(slot?.is_open).toLowerCase() === 'true',
      ).length
    : null;

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
  const playableSlots = extractPlayableSlots(unlockedMiniGames?.['spin-the-wheel']);

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
    <Container maxWidth="1100px" style={{ alignItems: 'center', gap: '24px', paddingBottom: '60px' }}>
      {/* Top Bar */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {t('spinWheel.headerTitle', 'Spin The Wheel')}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Fortune Game Show Arena
          </span>
        </div>

        <button
          onClick={() => setRulesModalVisible(true)}
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
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Spins Available Badge */}
      <div
        className="pill-badge pill-gold"
        style={{ fontSize: '14px', padding: '8px 20px', gap: '8px' }}
      >
        <Sparkles size={16} />
        <span style={{ fontWeight: 700 }}>
          {playableSlots === null
            ? t('spinWheel.checkingSpins', 'Checking spins...')
            : t('spinWheel.spinsAvailable', '{{count}} Spins Available', { count: playableSlots })}
        </span>
      </div>

      {/* Game Show Arena Immersive Wrapper */}
      <div className="game-arena-wrapper">
        {/* Top Marquee Light Bulbs */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          {[...Array(16)].map((_, i) => (
            <span key={i} className="casino-bulb" />
          ))}
        </div>

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Wheel Stage & Spin CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                background: 'radial-gradient(circle, rgba(213, 173, 96, 0.15) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
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
                  borderTop: '32px solid #FFD700',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 8px #FFA500)',
                }}
              />

              <canvas
                ref={canvasRef}
                width={360}
                height={360}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  filter: 'drop-shadow(0 12px 30px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 15px rgba(213, 173, 96, 0.3))',
                }}
              />
            </div>

            {/* Spin CTA Button */}
            <Button
              onClick={spin}
              disabled={isSpinning || (unlockedMiniGamesFetched && playableSlots === 0)}
              loading={isSpinning}
              variant="gold"
              title={
                isSpinning
                  ? t('spinWheel.spinning', 'SPINNING...')
                  : unlockedMiniGamesFetched && playableSlots === 0
                  ? t('spinWheel.noSpinsLeft', 'No Spins Left')
                  : t('spinWheel.spinNowButton', 'SPIN NOW')
              }
              icon={<RotateCw size={22} />}
              style={{
                width: '100%',
                maxWidth: '380px',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 800,
                borderRadius: '24px',
                boxShadow: '0 8px 24px rgba(213, 173, 96, 0.4)',
              }}
            />
          </div>

          {/* Right Column: Prize Table & Wheel Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Prize Grand Banner */}
            <div className="game-glass-panel game-glass-panel-gold">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Sparkles size={20} color="#FFD700" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Top Fortune Reward
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                500 PTS TOP PRIZE
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '6px', margin: 0, lineHeight: '1.45' }}>
                Every spin guarantees reward points or a free extra spin for more chances to win!
              </p>
            </div>

            {/* Prize Multipliers Grid */}
            <div className="game-glass-panel">
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
                Wheel Prize Segments
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                {SEGMENTS.map((seg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '10px',
                      borderLeft: `4px solid ${seg.color}`,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                      {getSegmentLabel(seg)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Earn More Plays Promo */}
            <div
              className="game-glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(0, 103, 77, 0.3) 0%, rgba(16, 185, 129, 0.15) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Need More Spins?
                </h5>
                <p style={{ fontSize: '12px', color: '#A7F3D0', margin: '4px 0 0 0' }}>
                  Upload shopping receipts to get extra daily spins!
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/scan')}
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                }}
              >
                Scan Now
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Marquee Light Bulbs */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '24px' }}>
          {[...Array(16)].map((_, i) => (
            <span key={i} className="casino-bulb" />
          ))}
        </div>
      </div>

      {/* Result Modal */}
      <CustomModal
        visible={Boolean(resultModal)}
        onClose={() => setResultModal(null)}
        maxWidth="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <img src={images.Coin} alt="Prize" style={{ width: '80px', height: '80px' }} />
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
              {t('spinWheel.congratulations', 'Congratulations!')}
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {t('spinWheel.youWonLabel', 'You Won {{label}}!', { label: resultModal?.label })}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {t('spinWheel.rewardCredited', 'Your reward points have been credited to your balance.')}
            </p>
          </div>

          <Button
            title={t('spinWheel.claimAndContinue', 'Claim & Continue')}
            onClick={() => setResultModal(null)}
            style={{ width: '100%', marginTop: '8px' }}
          />
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
