import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import images from '../../constants/images';
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

export const PicPickGame: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector((state: RootState) => state.user);
  const challenge = (location.state as any)?.challenge;
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptTotal, setReceiptTotal] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; points: number } | null>(null);

  const gameSlug =
    challenge?.gameSlug ??
    challenge?.game_slug ??
    challenge?.slug ??
    '';
  const gameType =
    challenge?.gameType ??
    challenge?.game_type ??
    '';
  const isStatePick = String(gameType).toLowerCase() === 'state' || String(gameSlug).toLowerCase().includes('state');

  const handleSubmit = async () => {
    if (!String(gameSlug).trim() || !String(gameType).trim()) {
      showToast({
        type: 'error',
        text1: t('picPick.errors.gameNotAvailable', 'Game is not available'),
        text2: t('picPick.errors.selectLiveGame', 'Please select a live Pic Pick game from the Play screen.'),
      });
      navigate('/play/pic-pick');
      return;
    }
    if (!receiptFile) {
      showToast({ type: 'error', text1: t('picPick.errors.receiptImageRequired', 'Receipt image is required') });
      return;
    }
    if (!receiptTotal.trim()) {
      showToast({ type: 'error', text1: t('picPick.errors.receiptTotalRequired', 'Receipt total is required') });
      return;
    }

    setLoading(true);
    try {
      const pointsBefore = getUserRewardPoints(userData);
      const response = await gameServices.storeGame({
        type: gameType,
        game_slug: gameSlug,
        total: receiptTotal.trim(),
        state: isStatePick ? stateValue.trim() : undefined,
        time: getUSTimeHHMM(),
        played_at: getUSTimeWithOffset(),
        receipt: {
          uri: receiptFile.name,
          type: receiptFile.type,
          name: receiptFile.name,
          file: receiptFile,
        },
      });
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
        message: extractMessage(response?.data, t('picPick.success.submitted', 'Receipt submitted successfully.')),
        points,
      });
      if (points > 0) {
        triggerCoinCelebration();
      }
      setReceiptFile(null);
      setReceiptTotal('');
      setStateValue('');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('picPick.errors.submissionFailedTitle', 'Submission failed'),
        text2: error?.message || String(error || t('picPick.errors.tryAgain', 'Please try again.')),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="540px" style={{ gap: '20px', paddingBottom: '40px' }}>
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
          {challenge?.title ?? t('picPick.defaultChallengeTitle', 'Pic Pick Challenge')}
        </h2>
        <div style={{ width: '40px' }} />
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={24} color="var(--green)" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              {t('picPick.submitReceipt', 'Submit Receipt')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('picPick.submitReceiptDesc', 'Receipt data will be saved through the game submission API.')}
            </p>
          </div>
        </div>

        <input
          className="form-input"
          type="file"
          accept="image/*"
          onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
        />
        <input
          className="form-input"
          type="number"
          placeholder={t('picPick.receiptTotalPlaceholder', 'Receipt total')}
          value={receiptTotal}
          onChange={(event) => setReceiptTotal(event.target.value)}
        />
        {isStatePick && (
          <input
            className="form-input"
            placeholder={t('picPick.statePlaceholder', 'State')}
            value={stateValue}
            onChange={(event) => setStateValue(event.target.value)}
          />
        )}

        <Button
          title={t('picPick.submitReceipt', 'Submit Receipt')}
          icon={<Sparkles size={18} />}
          onClick={handleSubmit}
          loading={loading}
          style={{ width: '100%' }}
        />
      </div>

      <CustomModal visible={Boolean(result)} onClose={() => navigate('/play')} maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <img src={images.Coin} alt={t('picPick.prizeImageAlt', 'Prize')} style={{ width: '80px', height: '80px' }} />
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
              {result?.message}
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: 700, marginTop: '4px' }}>
              {t('picPick.pointsEarned', 'Points: +{{points}}', { points: result?.points ?? 0 })}
            </p>
          </div>
          <Button
            title={t('picPick.returnToGames', 'Return to Games')}
            onClick={() => navigate('/play')}
            style={{ width: '100%', marginTop: '8px' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default PicPickGame;
