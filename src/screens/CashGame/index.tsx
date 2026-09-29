import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, DollarSign, Sparkles } from 'lucide-react';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import gameServices from '../../services/gameServices';
import { getUSTimeHHMM, getUSTimeWithOffset } from '../../utils/usTime';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { getUserRewardPoints } from '../../utils/userDisplay';

const extractMessage = (payload: any, fallback: string) => {
  const message = payload?.message ?? payload?.data?.message ?? payload?.user_friendly_message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

export const CashGame: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector((state: RootState) => state.user);
  const routeGame = (location.state as any)?.game ?? {};
  const selectedGameSlug = String(routeGame?.slug ?? routeGame?.game_slug ?? '').trim();
  const selectedGameType = String(routeGame?.game_type?.slug ?? routeGame?.gameType ?? routeGame?.type ?? 'cash').trim();
  const selectedGameName = String(
    routeGame?.name ?? routeGame?.title ?? t('cashGames.labels.defaultGameName', 'Cash Game Receipt')
  ).trim();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptTotal, setReceiptTotal] = useState('');
  const [receiptTime, setReceiptTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; points: number } | null>(null);
  const [middayStatus, setMiddayStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const localTime = receiptTime || getUSTimeHHMM();

    gameServices
      .getMiddayStatus(localTime)
      .then((response) => {
        if (!isMounted) return;
        const payload = response?.data?.data ?? response?.data ?? response;
        const status =
          payload?.status ??
          payload?.message ??
          payload?.midday_status ??
          payload?.is_open;
        setMiddayStatus(status === undefined ? null : String(status));
      })
      .catch(() => {
        if (isMounted) setMiddayStatus(null);
      });

    return () => {
      isMounted = false;
    };
  }, [receiptTime]);

  const handleSubmit = async () => {
    if (!selectedGameSlug) {
      showToast({
        type: 'error',
        text1: t('cashGames.errors.gameNotAvailable', 'Game is not available'),
        text2: t('cashGames.errors.selectLiveGameFromPlay', 'Please select a live cash game from the Play screen.'),
      });
      navigate('/play');
      return;
    }
    if (!receiptFile) {
      showToast({ type: 'error', text1: t('cashGames.validations.receiptImageRequired', 'Receipt image is required') });
      return;
    }
    if (!receiptTotal.trim()) {
      showToast({ type: 'error', text1: t('cashGames.validations.totalRequired', 'Receipt total is required') });
      return;
    }

    setLoading(true);
    try {
      const pointsBefore = getUserRewardPoints(userData);
      const response = await gameServices.storeGame({
        type: selectedGameType || 'cash',
        game_slug: selectedGameSlug,
        total: receiptTotal.trim(),
        time: receiptTime || getUSTimeHHMM(),
        played_at: getUSTimeWithOffset(),
        receipt: {
          uri: receiptFile.name,
          type: receiptFile.type,
          name: receiptFile.name,
          file: receiptFile,
        },
      });
      const resultMessage = extractMessage(
        response?.data,
        t('cashGames.labels.receiptSubmittedSuccessfully', 'Receipt submitted successfully.')
      );
      // games/store-game doesn't return a points field - refresh the wallet and
      // diff it to find out what was actually credited for this submission.
      let points = 0;
      try {
        const updatedUser = await dispatch(fetchUser()).unwrap();
        const pointsAfter = getUserRewardPoints(updatedUser?.data ?? updatedUser);
        points = Math.max(0, pointsAfter - pointsBefore);
      } catch {
        // wallet refresh failed - fall back to showing the message with 0 points rather than guessing
      }
      setResult({
        message: resultMessage,
        points,
      });
      if (points > 0) {
        triggerCoinCelebration();
      }
      setReceiptFile(null);
      setReceiptTotal('');
      setReceiptTime('');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('cashGames.errors.submissionFailed', 'Submission Failed'),
        text2: error?.message || String(error || t('cashGames.errors.tryAgain', 'Please try again.')),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="540px" style={{ gap: '24px', alignItems: 'center', paddingBottom: '40px' }}>
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
          {selectedGameName}
        </h2>
        <div style={{ width: '40px' }} />
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '18px',
          background: 'linear-gradient(135deg, #00674D 0%, #004D39 100%)',
          color: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 215, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFD700',
          }}
        >
          <DollarSign size={44} />
        </div>

        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#FFD700' }}>
            {t('cashGames.labels.submitGameTitle', 'Submit {{gameName}}', { gameName: selectedGameName })}
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '8px', maxWidth: '360px' }}>
            {t('cashGames.labels.uploadReceiptDetails', 'Upload your receipt details. Result and rewards are saved by the backend.')}
          </p>
          {middayStatus && (
            <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>
              {t('cashGames.labels.middayStatusLabel', 'Midday status: {{status}}', { status: middayStatus })}
            </p>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            className="form-input"
            type="file"
            accept="image/*"
            onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
          />
          <input
            className="form-input"
            type="number"
            placeholder={t('cashGames.labels.receiptTotalPlaceholder', 'Receipt total')}
            value={receiptTotal}
            onChange={(event) => setReceiptTotal(event.target.value)}
          />
          <input
            className="form-input"
            type="time"
            value={receiptTime}
            onChange={(event) => setReceiptTime(event.target.value)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          variant="gold"
          title={t('cashGames.buttons.submitReceipt', 'Submit Receipt')}
          loading={loading}
          icon={<Sparkles size={18} />}
          style={{ width: '100%', padding: '16px', fontSize: '16px' }}
        />
      </div>

      <CustomModal visible={Boolean(result)} onClose={() => navigate('/play')} maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
            {result?.message}
          </h3>
          <p style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: 700 }}>
            {t('cashGames.labels.pointsEarned', 'Points: +{{points}}', { points: result?.points ?? 0 })}
          </p>
          <Button
            title={t('cashGames.buttons.returnToGames', 'Return to Games')}
            onClick={() => navigate('/play')}
            style={{ width: '100%' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default CashGame;
