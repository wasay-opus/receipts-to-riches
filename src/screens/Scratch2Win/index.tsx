import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, HelpCircle, ArrowLeft, RefreshCw, Trophy, Megaphone } from 'lucide-react';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import { WebSound } from '../../utils/soundLoader';
import images from '../../constants/images';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { fetchUnlockedMiniGames, invalidateUnlockedMiniGamesCache } from '../../redux/Slices/gamesSlice';
import gameServices from '../../services/gameServices';
import { extractPlayableSlots, getNextUnlockText, parseWonPoints } from '../../utils/miniGamesUtil';

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
  const cardsLeft = extractPlayableSlots(scratchSlots);
  const nextUnlockText = getNextUnlockText(scratchSlots);
  const [rulesModalVisible, setRulesModalVisible] = useState(false);
  const [prizePoints, setPrizePoints] = useState(0);
  const [cardLoading, setCardLoading] = useState(false);
  const [resultModal, setResultModal] = useState<{ won: boolean; points: number } | null>(null);

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
    ctx.textBaseline = 'middle';
    ctx.fillText(t('scratch2win.canvasScratchHere', 'SCRATCH HERE TO WIN'), canvas.width / 2, canvas.height / 2 - 14);
    ctx.font = '13px Poppins, sans-serif';
    ctx.fillStyle = '#444444';
    ctx.fillText(t('scratch2win.canvasRubInstruction', 'Rub with mouse or touch'), canvas.width / 2, canvas.height / 2 + 16);
  };

  const initScratchCard = async () => {
    if (cardsLeft <= 0) {
      drawScratchOverlay();
      return;
    }

    setIsRevealed(false);
    setRevealedPercent(0);
    setCardLoading(true);

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
    <Container maxWidth="1000px" style={{ paddingBottom: '60px' }}>
      {/* Top Bar */}
      <div className="game-top-nav-bar">
        <button
          type="button"
          className="game-nav-btn"
          onClick={() => navigate(-1)}
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

        <button
          type="button"
          className="game-nav-btn"
          onClick={() => setRulesModalVisible(true)}
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* 2-Column Responsive Layout: Left (Scratch Card) & Right (Campaign + Rules) */}
      <div className="game-screen-grid">
        {/* Left: Interactive Gold Foil Scratch Card Arena */}
        <div className="card game-arena-card">
          {/* Card Header */}
          <div className="game-arena-header">
            <div>
              <span
                className="game-arena-badge"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
              >
                SCRATCH &bull; UP TO 1,000 PTS
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                {t('scratch2win.subtitle', 'Rub the metallic foil surface to uncover your secret cash points prize!')}
              </p>
            </div>
            <div
              className="game-slots-pill"
              style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}
            >
              <Sparkles size={14} />
              {t('scratch2win.cardsRemainingShort', '{{count}} Cards Left', { count: cardsLeft })}
            </div>
          </div>

          {/* Interactive Gold Foil Scratch Card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
              height: '240px',
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

          {/* Next Card Action Button */}
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <button
              type="button"
              onClick={handleNextCard}
              disabled={cardsLeft <= 0}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '16px',
                fontWeight: 800,
                cursor: cardsLeft <= 0 ? 'not-allowed' : 'pointer',
                opacity: cardsLeft <= 0 ? 0.6 : 1,
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (cardsLeft > 0) e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <RefreshCw size={20} />
              <span>
                {cardsLeft > 0
                  ? t('scratch2win.scratchNextCard', 'Scratch Next Card')
                  : t('scratch2win.noCardsLeft', 'No Cards Left')}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Side Column (Campaign Ad + Rules) */}
        <div className="game-side-column">
          {/* Sponsored Ad Banner */}
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
              {t('scratch2win.rulesTitle', 'Rules & How to Play')}
            </h4>
            <div className="game-rules-list">
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Use cursor or touch to rub the metallic gold foil overlay.</span>
              </div>
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Scratching 45% or more reveals your surprise reward.</span>
              </div>
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Winnings are directly credited into your reward points balance.</span>
              </div>
            </div>
          </div>
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
        </div>
      </CustomModal>
    </Container>
  );
};

export default Scratch2Win;
