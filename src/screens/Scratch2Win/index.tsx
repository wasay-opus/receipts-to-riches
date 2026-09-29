import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, HelpCircle, ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import { WebSound } from '../../utils/soundLoader';
import images from '../../constants/images';

import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
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

  // The backend doesn't return a numeric points field on this endpoint - it's
  // embedded in the message text instead (e.g. "You won 5 points!").
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

export const Scratch2Win: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedPercent, setRevealedPercent] = useState(0);
  const [cardsLeft, setCardsLeft] = useState(3);
  const [rulesModalVisible, setRulesModalVisible] = useState(false);
  const [prizePoints, setPrizePoints] = useState(0);
  const [cardLoading, setCardLoading] = useState(false);

  const scratchSoundRef = useRef<WebSound | null>(null);
  const winSoundRef = useRef<WebSound | null>(null);

  useEffect(() => {
    scratchSoundRef.current = new WebSound('scratching');
    winSoundRef.current = new WebSound('coins');
    initScratchCard();
  }, []);

  const drawScratchOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    // Fill with modern silver/gold metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.3, '#E8E8E8');
    gradient.addColorStop(0.5, '#D5AD60');
    gradient.addColorStop(0.8, '#C0C0C0');
    gradient.addColorStop(1, '#A0A0A0');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Overlay Pattern & Text
    ctx.fillStyle = '#151A2A';
    ctx.font = 'bold 20px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('scratch2win.canvasScratchHere', 'SCRATCH HERE TO WIN'), canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '13px Poppins, sans-serif';
    ctx.fillStyle = '#555555';
    ctx.fillText(t('scratch2win.canvasRubInstruction', 'Rub with mouse or touch'), canvas.width / 2, canvas.height / 2 + 20);
  };

  const initScratchCard = async () => {
    setIsRevealed(false);
    setRevealedPercent(0);
    setCardLoading(true);

    // Ask the backend for the real outcome BEFORE the card is scratchable - the
    // number underneath must be the real award, not a client-side guess.
    try {
      const response = await gameServices.playScratch2Win();
      const wonPoints = parseWonPoints(response?.data ?? response, 0);
      setPrizePoints(wonPoints);
      dispatch(fetchUser());
    } catch (error: any) {
      setPrizePoints(0);
      showToast({
        type: 'error',
        text1: t('scratch2win.cardNotAvailableTitle', 'Card not available'),
        text2: error?.message || t('scratch2win.cardNotAvailableMsg', 'Could not load this scratch card. Please try again.'),
      });
    } finally {
      setCardLoading(false);
    }

    drawScratchOverlay();
  };

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed || cardLoading) return;
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
          triggerCoinCelebration();
        }
        // Clear all canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch {
      // Ignored
    }
  };

  const handleNextCard = () => {
    if (cardsLeft > 0) {
      setCardsLeft((prev) => prev - 1);
      initScratchCard();
    }
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
          {t('scratch2win.pageTitle', 'Scratch 2 Win')}
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

      <div className="pill-badge pill-gold" style={{ fontSize: '14px', padding: '6px 16px' }}>
        <Sparkles size={16} />
        <span>{t('scratch2win.cardsRemaining', '{{count}} Scratch Cards Remaining', { count: cardsLeft })}</span>
      </div>

      {/* Scratch Card Container */}
      <div
        className="card"
        style={{
          position: 'relative',
          width: '320px',
          height: '240px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid #D5AD60',
        }}
      >
        {/* Hidden Prize Underneath */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0E1528 0%, #151A2A 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#FFFFFF',
          }}
        >
          <img src={images.Coin} alt={t('scratch2win.prizeAlt', 'Prize')} style={{ width: '64px', height: '64px' }} />
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#FFD700' }}>
            {prizePoints > 0
              ? t('scratch2win.wonPointsDisplay', '+{{points}} PTS!', { points: prizePoints })
              : t('scratch2win.noWinDisplay', 'No Win')}
          </h3>
          <span style={{ fontSize: '13px', color: prizePoints > 0 ? '#10B981' : 'var(--text-muted)', fontWeight: 600 }}>
            {prizePoints > 0
              ? t('scratch2win.winnerInstantReward', 'Winner Instant Reward')
              : t('scratch2win.betterLuckNextTime', 'Better luck next time')}
          </span>
        </div>

        {/* Scratchable Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          style={{
            position: 'absolute',
            inset: 0,
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

      {/* Progress Bar & Next Card Action */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>{t('scratch2win.scratchedLabel', 'Scratched')}</span>
          <span>{revealedPercent}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-card-secondary)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(revealedPercent, 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00674D, #10B981)',
              transition: 'width 0.1s ease',
            }}
          />
        </div>
      </div>

      {isRevealed && (
        <Button
          onClick={handleNextCard}
          disabled={cardsLeft <= 0}
          variant="gold"
          title={cardsLeft > 0 ? t('scratch2win.scratchNextCard', 'Scratch Next Card') : t('scratch2win.noCardsLeft', 'No Cards Left')}
          icon={<RefreshCw size={18} />}
          style={{ width: '320px', padding: '14px' }}
        />
      )}

      {/* Rules Modal */}
      <CustomModal
        visible={rulesModalVisible}
        onClose={() => setRulesModalVisible(false)}
        title={t('scratch2win.rulesModalTitle', 'Scratch 2 Win Rules')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
          <p>{t('scratch2win.rule1', '1. Rub the scratch card overlay using your mouse cursor or finger on touch devices.')}</p>
          <p>{t('scratch2win.rule2', '2. Once 45% of the card is scratched, your prize is revealed and automatically credited.')}</p>
          <p>{t('scratch2win.rule3', '3. Upload more shopping receipts daily to earn additional scratch cards!')}</p>
          <Button
            title={t('scratch2win.gotIt', 'Got it!')}
            onClick={() => setRulesModalVisible(false)}
            style={{ width: '100%', marginTop: '12px' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default Scratch2Win;
