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
  { label: '50 PTS', points: 50, color: '#00674D' },
  { label: '100 PTS', points: 100, color: '#D5AD60' },
  { label: '25 PTS', points: 25, color: '#274C66' },
  { label: '500 PTS', points: 500, color: '#8B4513' },
  { label: '200 PTS', points: 200, color: '#009973' },
  { label: '1000 PTS', points: 1000, color: '#FFD700' },
  { label: 'FREE SPIN', points: 0, color: '#151A2A' },
  { label: '250 PTS', points: 250, color: '#00674D' },
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
    return Math.floor(Math.random() * SEGMENTS.length);
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
      return t('spinWheel.freeSpinLabel', 'FREE SPIN');
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
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(getSegmentLabel(seg), radius - 20, 5);
      ctx.restore();
    });

    ctx.restore();

    // Draw Outer Rim with Golden Dots
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

    // Calculate final angle to land on pointer (pointer at top 270 deg)
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const targetDegree =
      360 * extraRounds + (360 - (selectedIndex * segmentDegree + segmentDegree / 2) + 270);

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
        winSoundRef.current?.play();
        triggerCoinCelebration();
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
    <Container maxWidth="540px" style={{ alignItems: 'center', gap: '20px', paddingBottom: '40px' }}>
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
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
          {t('spinWheel.headerTitle', 'Spin The Wheel')}
        </h2>

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
          }}
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Spins Available Badge */}
      <div
        className="pill-badge pill-gold"
        style={{ fontSize: '14px', padding: '6px 16px' }}
      >
        <Sparkles size={16} />
        <span>
          {playableSlots === null
            ? t('spinWheel.checkingSpins', 'Checking spins...')
            : t('spinWheel.spinsAvailable', '{{count}} Spins Available', { count: playableSlots })}
        </span>
      </div>

      {/* Wheel Area with Needle */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Top Pointer Needle */}
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            zIndex: 10,
            width: 0,
            height: 0,
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderTop: '28px solid #FFD700',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
          }}
        />

        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          style={{ maxWidth: '100%', height: 'auto', filter: 'drop-shadow(0 10px 25px rgba(0, 103, 77, 0.3))' }}
        />
      </div>

      {/* Spin Button */}
      <Button
        onClick={spin}
        disabled={isSpinning || (unlockedMiniGamesFetched && playableSlots === 0)}
        loading={isSpinning}
        variant="gold"
        title={
          isSpinning
            ? t('spinWheel.spinning', 'Spinning...')
            : unlockedMiniGamesFetched && playableSlots === 0
            ? t('spinWheel.noSpinsLeft', 'No Spins Left')
            : t('spinWheel.spinNowButton', 'SPIN NOW')
        }
        icon={<RotateCw size={20} />}
        style={{ width: '80%', padding: '16px', fontSize: '17px', borderRadius: '20px' }}
      />

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
