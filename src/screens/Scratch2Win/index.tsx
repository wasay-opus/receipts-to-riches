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
            {t('scratch2win.pageTitle', 'Scratch 2 Win')}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
            VIP Scratch Card Lounge
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

      <div className="pill-badge pill-gold" style={{ fontSize: '14px', padding: '8px 20px', gap: '8px' }}>
        <Sparkles size={16} />
        <span style={{ fontWeight: 700 }}>
          {t('scratch2win.cardsRemaining', '{{count}} Scratch Cards Remaining', { count: cardsLeft })}
        </span>
      </div>

      {/* VIP Scratch Arena Immersive Wrapper */}
      <div className="game-arena-wrapper game-arena-wrapper--green">
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
          {/* Left Column: Interactive Gold Foil Scratch Card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                position: 'relative',
                width: '360px',
                maxWidth: '100%',
                height: '250px',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(213, 173, 96, 0.3)',
                border: '4px solid #D5AD60',
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
                }}
              >
                <img src={images.Coin} alt={t('scratch2win.prizeAlt', 'Prize')} style={{ width: '70px', height: '70px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }} />
                <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#FFD700', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
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
                height={250}
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
            <div style={{ width: '360px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#CBD5E1', fontWeight: 600 }}>
                <span>{t('scratch2win.scratchedLabel', 'Scratched')}</span>
                <span style={{ color: '#10B981', fontWeight: 800 }}>{revealedPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(revealedPercent, 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00674D, #10B981)',
                    boxShadow: '0 0 10px #10B981',
                    transition: 'width 0.1s ease',
                  }}
                />
              </div>

              {isRevealed && (
                <Button
                  onClick={handleNextCard}
                  disabled={cardsLeft <= 0}
                  variant="gold"
                  title={cardsLeft > 0 ? t('scratch2win.scratchNextCard', 'Scratch Next Card') : t('scratch2win.noCardsLeft', 'No Cards Left')}
                  icon={<RefreshCw size={20} />}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '17px',
                    fontWeight: 800,
                    borderRadius: '20px',
                    marginTop: '8px',
                    boxShadow: '0 8px 24px rgba(213, 173, 96, 0.4)',
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Column: Scratch Guide & Rewards Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Prize Card */}
            <div className="game-glass-panel game-glass-panel-gold">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Trophy size={20} color="#FFD700" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Instant Scratch Jackpot
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                UP TO 1,000 PTS
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '6px', margin: 0, lineHeight: '1.45' }}>
                Rub the metallic foil surface to 45% to instantly uncover your secret cash points prize!
              </p>
            </div>

            {/* How It Works Guide */}
            <div className="game-glass-panel">
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
                Scratch & Win Rules
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    1
                  </span>
                  <span>Use cursor or touch to rub the gold overlay foil.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    2
                  </span>
                  <span>Reach 45% scratched to automatically reveal winnings.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    3
                  </span>
                  <span>Winnings are directly credited into your reward points.</span>
                </div>
              </div>
            </div>

            {/* Earn More Plays Promo */}
            <div
              className="game-glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(0, 103, 77, 0.4) 0%, rgba(16, 185, 129, 0.2) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
              }}
            >
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Need More Scratch Cards?
                </h5>
                <p style={{ fontSize: '12px', color: '#A7F3D0', margin: '4px 0 0 0' }}>
                  Upload shopping receipts to get extra daily cards!
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
