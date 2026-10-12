import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, HelpCircle, RotateCcw, Sparkles, Trophy, Megaphone } from 'lucide-react';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import { WebSound } from '../../utils/soundLoader';
import images from '../../constants/images';

const SYMBOLS = ['7️⃣', '💎', '🍒', '🔔', '🪙', '⭐'];

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { fetchUnlockedMiniGames, invalidateUnlockedMiniGamesCache } from '../../redux/Slices/gamesSlice';
import gameServices from '../../services/gameServices';
import { extractPlayableSlots, getNextUnlockText, parseWonPoints } from '../../utils/miniGamesUtil';

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
  const [rulesModalVisible, setRulesModalVisible] = useState(false);

  const lucky7Slots = unlockedMiniGames?.['lucky-7'];
  const playsLeft = extractPlayableSlots(lucky7Slots);
  const nextUnlockText = getNextUnlockText(lucky7Slots);

  const spinSoundRef = useRef<WebSound | null>(null);
  const winSoundRef = useRef<WebSound | null>(null);

  useEffect(() => {
    spinSoundRef.current = new WebSound('spinWheelSound');
    winSoundRef.current = new WebSound('spinWin');
    dispatch(fetchUnlockedMiniGames());
  }, [dispatch]);

  const spinReels = async () => {
    if (isSpinning) return;

    if (playsLeft <= 0) {
      showToast({
        type: 'info',
        text1: t('lucky7.errors.noPlaysLeft', 'No plays left'),
        text2: nextUnlockText || t('lucky7.errors.allPlaysUsed', 'You have used all plays for today. Plays unlock every 24 hours.'),
      });
      return;
    }

    setIsSpinning(true);
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
        text2:
          error?.response?.data?.message ||
          error?.message ||
          t('lucky7.errors.spinNotAllowed', 'Backend did not allow this spin right now.'),
      });
      dispatch(invalidateUnlockedMiniGamesCache());
      dispatch(fetchUnlockedMiniGames());
      return;
    }

    const [final1, final2, final3] = pickReelsForPoints(wonPoints);

    let count = 0;
    const interval = setInterval(() => {
      setReel1(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      setReel2(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      setReel3(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      count++;

      if (count > 25) {
        clearInterval(interval);
        setReel1(final1);
        setReel2(final2);
        setReel3(final3);
        setIsSpinning(false);
        spinSoundRef.current?.stop();

        if (wonPoints > 0) {
          winSoundRef.current?.play();
          triggerCoinCelebration();
        }
        setResultModal({ won: wonPoints > 0, points: wonPoints });
        dispatch(fetchUser());
      }
    }, 80);
  };

  return (
    <Container maxWidth="1000px" style={{ paddingBottom: '60px' }}>
      {/* Top Header Bar */}
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
            {t('lucky7.headerTitle', 'Lucky 777 Slot')}
          </h2>
          <span className="game-stage-subtitle">
            VIP Casino Lounge
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

      {/* 2-Column Responsive Layout: Left (Slot Machine) & Right (Campaign + Rules) */}
      <div className="game-screen-grid">
        {/* Left: 3D Slot Machine Arena Card */}
        <div className="card game-arena-card">
          {/* Arena Header */}
          <div className="game-arena-header">
            <div>
              <span
                className="game-arena-badge"
                style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
              >
                LUCKY 7 &bull; 1,000 PTS JACKPOT
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                {t('lucky7.subtitle', 'Hit three lucky sevens across the reels to trigger the top jackpot payout!')}
              </p>
            </div>
            <div
              className="game-slots-pill"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' }}
            >
              <Sparkles size={14} />
              {t('lucky7.labels.slotPlaysAvailableShort', '{{count}} Plays Left', { count: playsLeft })}
            </div>
          </div>

          {/* 3 Slot Reels Container */}
          <div className="casino-cabinet-frame" style={{ width: '100%', maxWidth: '440px', margin: '8px 0' }}>
            {/* Reels Area with Laser Payline */}
            <div style={{ position: 'relative', width: '100%', padding: '6px 0' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '-8px',
                  right: '-8px',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #FF4B2B, #FFD700, #FF4B2B, transparent)',
                  boxShadow: '0 0 8px #FF4B2B',
                  zIndex: 2,
                  pointerEvents: 'none',
                  opacity: 0.75,
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[reel1, reel2, reel3].map((symbol, idx) => (
                  <div
                    key={idx}
                    className="reel-box"
                    style={{
                      transform: isSpinning ? 'scale(0.96) translateY(2px)' : 'scale(1)',
                      transition: 'transform 0.08s ease',
                    }}
                  >
                    <span>{symbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Paytable Ribbon */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                fontSize: '11px',
                color: '#CBD5E1',
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              <span style={{ color: '#FFD700', whiteSpace: 'nowrap' }}>7️⃣7️⃣7️⃣ = 1000 PTS</span>
              <span style={{ color: '#60A5FA', whiteSpace: 'nowrap' }}>💎💎💎 = 300 PTS</span>
              <span style={{ color: '#34D399', whiteSpace: 'nowrap' }}>Match 2 = 50 PTS</span>
            </div>
          </div>

          {/* Spin Lever CTA Button */}
          <button
            type="button"
            onClick={spinReels}
            disabled={isSpinning || playsLeft <= 0}
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '16px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '16px',
              fontWeight: 800,
              cursor: isSpinning || playsLeft <= 0 ? 'not-allowed' : 'pointer',
              opacity: isSpinning || playsLeft <= 0 ? 0.7 : 1,
              boxShadow: '0 6px 18px rgba(220, 38, 38, 0.35)',
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
          {playsLeft <= 0 && nextUnlockText && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              ⏳ {nextUnlockText}
            </span>
          )}
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

          {/* Rules Card */}
          <div className="card game-rules-card">
            <h4 className="game-rules-title">
              {t('lucky7.rulesTitle', 'Rules & How to Play')}
            </h4>
            <div className="game-rules-list">
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Pull the slot lever to spin all three reels.</span>
              </div>
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Match three 7s for the maximum 1,000 Points Jackpot prize.</span>
              </div>
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>Matching any 3 icons or any 2 identical icons earns bonus reward points.</span>
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

      {/* Rules Modal */}
      <CustomModal
        visible={rulesModalVisible}
        onClose={() => setRulesModalVisible(false)}
        title={t('lucky7.rulesModalTitle', 'Lucky 7 Slot Rules')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
          <p>{t('lucky7.rules.rule1', '1. Pull the slot lever to spin all three reels.')}</p>
          <p>{t('lucky7.rules.rule2', '2. Match three 7s for the maximum 1,000 Points Jackpot prize.')}</p>
          <p>{t('lucky7.rules.rule3', '3. Matching any 3 icons or any 2 identical icons earns bonus reward points.')}</p>
          <Button
            title={t('lucky7.buttons.gotIt', 'Got it!')}
            onClick={() => setRulesModalVisible(false)}
            style={{ width: '100%', marginTop: '12px' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default Lucky7;
