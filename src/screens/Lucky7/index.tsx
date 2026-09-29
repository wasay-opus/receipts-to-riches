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
    <Container maxWidth="540px" style={{ alignItems: 'center', gap: '24px', paddingBottom: '40px' }}>
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
          {t('lucky7.headerTitle', 'Lucky 777 Slot')}
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
        <span>{t('lucky7.labels.slotPlaysAvailable', '{{count}} Slot Plays Available', { count: playsLeft })}</span>
      </div>

      {/* Slot Machine Frame */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'linear-gradient(135deg, #151A2A 0%, #0E121F 100%)',
          borderRadius: '28px',
          border: '4px solid #D5AD60',
          padding: '24px 16px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={20} color="#FFD700" />
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFD700', letterSpacing: '1px' }}>
            {t('lucky7.labels.jackpot777', 'JACKPOT 777')}
          </span>
        </div>

        {/* 3 Slot Reels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%' }}>
          {[reel1, reel2, reel3].map((symbol, idx) => (
            <div
              key={idx}
              style={{
                height: '110px',
                background: '#FFFFFF',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)',
                border: '2px solid #E2E8F0',
                transform: isSpinning ? 'scale(0.96)' : 'scale(1)',
                transition: 'transform 0.1s ease',
              }}
            >
              {symbol}
            </div>
          ))}
        </div>

        {/* Paytable */}
        <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', gap: '16px' }}>
          <span>{t('lucky7.labels.paytableJackpot', '7️⃣7️⃣7️⃣ = 1000 PTS')}</span>
          <span>{t('lucky7.labels.paytableDiamond', '💎💎💎 = 300 PTS')}</span>
          <span>{t('lucky7.labels.paytableMatch2', 'Match 2 = 50 PTS')}</span>
        </div>
      </div>

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
        icon={<RotateCcw size={20} />}
        style={{ width: '80%', padding: '16px', fontSize: '17px', borderRadius: '20px' }}
      />

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
