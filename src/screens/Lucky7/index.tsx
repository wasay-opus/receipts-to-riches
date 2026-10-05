import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, HelpCircle, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import { WebSound } from '../../utils/soundLoader';
import images from '../../constants/images';

const SYMBOLS = ['7️⃣', '💎', '🍒', '🔔', '🪙', '⭐'];

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

  const [reel1, setReel1] = useState('7️⃣');
  const [reel2, setReel2] = useState('7️⃣');
  const [reel3, setReel3] = useState('7️⃣');
  const [isSpinning, setIsSpinning] = useState(false);
  const [playsLeft, setPlaysLeft] = useState(3);
  const [resultModal, setResultModal] = useState<{ won: boolean; points: number } | null>(null);
  const [rulesModalVisible, setRulesModalVisible] = useState(false);

  const spinSoundRef = useRef<WebSound | null>(null);
  const winSoundRef = useRef<WebSound | null>(null);

  useEffect(() => {
    spinSoundRef.current = new WebSound('spinWheelSound');
    winSoundRef.current = new WebSound('spinWin');
  }, []);

  const spinReels = async () => {
    if (isSpinning || playsLeft <= 0) return;

    setIsSpinning(true);
    setPlaysLeft((prev) => prev - 1);
    spinSoundRef.current?.play();

    // Ask the backend for the real outcome BEFORE showing any result - the reel
    // animation is purely cosmetic and must land on whatever it actually awarded.
    let wonPoints = 0;
    try {
      const response = await gameServices.playLucky7();
      wonPoints = parseWonPoints(response?.data ?? response, 0);
    } catch (error: any) {
      setIsSpinning(false);
      spinSoundRef.current?.stop();
      showToast({
        type: 'error',
        text1: t('lucky7.errors.spinNotAvailable', 'Spin not available'),
        text2: error?.message || t('lucky7.errors.spinNotAllowed', 'Backend did not allow this spin right now.'),
      });
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
    <Container maxWidth="1100px" style={{ alignItems: 'center', gap: '24px', paddingBottom: '60px' }}>
      {/* Top Navigation Bar */}
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
            {t('lucky7.headerTitle', 'Lucky 777 Slot')}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
            VIP Casino Lounge
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

      {/* Plays Available Pill */}
      <div className="pill-badge pill-gold" style={{ fontSize: '14px', padding: '8px 20px', gap: '8px' }}>
        <Sparkles size={16} />
        <span style={{ fontWeight: 700 }}>
          {t('lucky7.labels.slotPlaysAvailable', '{{count}} Slot Plays Available', { count: playsLeft })}
        </span>
      </div>

      {/* Casino Arena Immersive Wrapper */}
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
            gap: '28px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: 3D Slot Cabinet */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="casino-cabinet-frame" style={{ width: '100%', maxWidth: '440px' }}>
              {/* Marquee Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.25) 50%, rgba(255,215,0,0.1) 100%)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,215,0,0.4)',
                  marginBottom: '16px',
                }}
              >
                <Trophy size={22} color="#FFD700" />
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#FFD700',
                    letterSpacing: '2px',
                    textShadow: '0 0 10px rgba(255,215,0,0.6)',
                  }}
                >
                  {t('lucky7.labels.jackpot777', 'JACKPOT 777')}
                </span>
                <Trophy size={22} color="#FFD700" />
              </div>

              {/* 3 Slot Reels Container with laser payline */}
              <div style={{ position: 'relative', width: '100%', padding: '4px 0' }}>
                {/* Laser Payline Line */}
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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
                  fontSize: '12px',
                  color: '#CBD5E1',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 600,
                }}
              >
                <span style={{ color: '#FFD700' }}>7️⃣7️⃣7️⃣ = 1000 PTS</span>
                <span style={{ color: '#60A5FA' }}>💎💎💎 = 300 PTS</span>
                <span style={{ color: '#34D399' }}>Match 2 = 50 PTS</span>
              </div>
            </div>

            {/* Spin Lever CTA Button */}
            <Button
              onClick={spinReels}
              disabled={isSpinning || playsLeft <= 0}
              loading={isSpinning}
              variant="gold"
              title={
                isSpinning
                  ? t('lucky7.buttons.rolling', 'ROLLING...')
                  : playsLeft > 0
                    ? t('lucky7.buttons.pullLever', 'PULL LEVER / SPIN')
                    : t('lucky7.buttons.noPlaysLeft', 'No Plays Left')
              }
              icon={<RotateCcw size={22} />}
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 800,
                borderRadius: '24px',
                boxShadow: '0 8px 24px rgba(213, 173, 96, 0.4)',
              }}
            />
          </div>

          {/* Right Column: VIP Payout & Rewards Dashboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Progressive Jackpot Vault Card */}
            <div className="game-glass-panel game-glass-panel-gold">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Sparkles size={20} color="#FFD700" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Progressive Grand Prize
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                1,000 PTS JACKPOT
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '6px', margin: 0, lineHeight: '1.45' }}>
                Hit three lucky sevens across the reels to trigger the top jackpot payout!
              </p>
            </div>

            {/* Prize Multipliers Guide */}
            <div className="game-glass-panel">
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
                Prize Multipliers
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <span>7️⃣ 7️⃣ 7️⃣</span>
                    <span>Triple 7s</span>
                  </span>
                  <span style={{ color: '#FFD700', fontWeight: 800 }}>+1,000 PTS</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <span>💎 💎 💎</span>
                    <span>Triple Diamonds</span>
                  </span>
                  <span style={{ color: '#60A5FA', fontWeight: 800 }}>+300 PTS</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <span>🍒 🍒 🔔</span>
                    <span>Any 2 Matching</span>
                  </span>
                  <span style={{ color: '#34D399', fontWeight: 800 }}>+50 PTS</span>
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
          <img src={images.Coin} alt="Coins" style={{ width: '80px', height: '80px' }} />
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
              {resultModal?.won
                ? t('lucky7.jackpotWonPoints', 'Jackpot! +{{points}} PTS', { points: resultModal.points })
                : t('lucky7.noWinThisTurn', 'Better luck next time!')}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {resultModal?.won
                ? t('lucky7.messages.winningsCredited', 'Your winnings have been credited to your balance!')
                : t('lucky7.messages.uploadMoreForSpins', 'Upload more receipts to get additional free spins.')}
            </p>
          </div>

          <Button
            title={t('lucky7.buttons.continue', 'Continue')}
            onClick={() => setResultModal(null)}
            style={{ width: '100%', marginTop: '8px' }}
          />
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
