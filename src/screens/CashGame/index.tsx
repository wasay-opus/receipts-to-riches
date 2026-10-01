import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, DollarSign, Sparkles, MapPin, Calendar, Clock, Image, Layers, HelpCircle, Megaphone } from 'lucide-react';
import { Button, Container, CustomModal, GameHelpMenu, showToast, triggerCoinCelebration } from '../../components';
import gameServices from '../../services/gameServices';
import { getUSDateYYYYMMDD, getUSTimeHHMM, getUSTimeWithOffset } from '../../utils/usTime';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { getUserRewardPoints } from '../../utils/userDisplay';
import images from '../../constants/images';

const extractMessage = (payload: any, fallback: string) => {
  if (payload?.errors && typeof payload.errors === 'object') {
    const errorList = Object.values(payload.errors).flat().filter(Boolean);
    if (errorList.length > 0) return errorList.join(' ');
  }
  const message = payload?.message ?? payload?.data?.message ?? payload?.user_friendly_message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const CASH_GAME_META: Record<
  string,
  { name: string; prize: string; gradient: string; isZdt: boolean }
> = {
  zdt: {
    name: 'ZDT',
    prize: '$1,000',
    gradient: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
    isZdt: true,
  },
  'pick-3': {
    name: 'PICK 3',
    prize: '$3,000',
    gradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
    isZdt: false,
  },
  'pick-4': {
    name: 'PICK 4',
    prize: '$4,000',
    gradient: 'linear-gradient(135deg, #00B050 0%, #10B981 100%)',
    isZdt: false,
  },
  'pick-5': {
    name: 'PICK 5',
    prize: '$5,000',
    gradient: 'linear-gradient(135deg, #0070BA 0%, #00B4D8 100%)',
    isZdt: false,
  },
};

export const CashGame: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector((state: RootState) => state.user);

  const routeGame = (location.state as any)?.game ?? {};
  const querySlug = new URLSearchParams(location.search).get('slug') || '';
  const selectedGameSlug = String(
    routeGame?.slug ?? routeGame?.game_slug ?? querySlug ?? 'zdt',
  )
    .trim()
    .toLowerCase();

  const selectedGameType = String(
    routeGame?.game_type?.slug ?? routeGame?.gameType ?? routeGame?.type ?? 'cash',
  ).trim();

  const gameMeta = CASH_GAME_META[selectedGameSlug] || {
    name: routeGame?.name || selectedGameSlug.toUpperCase(),
    prize: routeGame?.price ? `$${routeGame.price}` : '$1,000',
    gradient: 'linear-gradient(135deg, #00674D 0%, #004D39 100%)',
    isZdt: selectedGameSlug === 'zdt',
  };

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [receiptTotal, setReceiptTotal] = useState('');
  const [drawOption, setDrawOption] = useState<'full day' | 'midday'>('full day');
  const [receiptDate, setReceiptDate] = useState(getUSDateYYYYMMDD());
  const [receiptTime, setReceiptTime] = useState(getUSTimeHHMM());
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
    if (file) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedGameSlug) {
      showToast({
        type: 'error',
        text1: t('cashGames.errors.gameNotAvailable', 'Game is not available'),
        text2: t('cashGames.errors.selectLiveGameFromPlay', 'Please select a live cash game.'),
      });
      return;
    }

    if (!receiptFile) {
      showToast({
        type: 'error',
        text1: t('cashGames.validations.receiptImageRequired', 'Receipt image is required'),
        text2: 'Please upload or capture an image of your receipt.',
      });
      return;
    }

    if (gameMeta.isZdt) {
      if (!zipCode.trim()) {
        showToast({
          type: 'error',
          text1: t('cashGames.validations.zipRequired', 'Zip code is required'),
          text2: 'Please enter the 5-digit zip code from your receipt.',
        });
        return;
      }
    } else {
      if (!receiptTotal.trim()) {
        showToast({
          type: 'error',
          text1: t('cashGames.validations.totalRequired', 'Receipt total is required'),
          text2: 'Please enter the total receipt amount.',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const pointsBefore = getUserRewardPoints(userData);
      const payload: any = {
        type: selectedGameType || 'cash',
        game_slug: selectedGameSlug,
        date: receiptDate || getUSDateYYYYMMDD(),
        time: receiptTime || getUSTimeHHMM(),
        played_at: getUSTimeWithOffset(),
        receipt: {
          uri: receiptFile.name,
          type: receiptFile.type,
          name: receiptFile.name,
          file: receiptFile,
        },
      };

      if (gameMeta.isZdt) {
        payload.zip_code = zipCode.trim();
      } else {
        payload.total = receiptTotal.trim();
        if (drawOption === 'midday') {
          payload.draw = 'midday';
        }
      }

      const response = await gameServices.storeGame(payload);
      const resultMessage = extractMessage(
        response?.data,
        t('cashGames.labels.receiptSubmittedSuccessfully', 'Receipt submitted successfully.'),
      );

      let points = 0;
      try {
        const updatedUser = await dispatch(fetchUser()).unwrap();
        const pointsAfter = getUserRewardPoints(updatedUser?.data ?? updatedUser);
        points = Math.max(0, pointsAfter - pointsBefore);
      } catch {
        // Fallback
      }

      setResult({
        message: resultMessage,
        points,
      });

      if (points > 0) {
        triggerCoinCelebration();
      }

      setReceiptFile(null);
      setReceiptPreview(null);
      setZipCode('');
      setReceiptTotal('');
    } catch (error: any) {
      const parsedError =
        error?.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(' ')
          : error?.response?.data?.message || error?.message || t('cashGames.errors.tryAgain', 'Please try again.');

      showToast({
        type: 'error',
        text1: t('cashGames.errors.submissionFailed', 'Submission Failed'),
        text2: parsedError,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setZipCode('');
    setReceiptTotal('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptDate(getUSDateYYYYMMDD());
    setReceiptTime(getUSTimeHHMM());
  };

  return (
    <Container maxWidth="1020px" style={{ gap: '20px', paddingBottom: '60px' }}>
      {/* Top Header Bar matching Screenshot 3 */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
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
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', textTransform: 'capitalize' }}>
          {selectedGameSlug === 'zdt' ? 'ZDT' : selectedGameSlug === 'pick-3' ? 'Pick 3' : selectedGameSlug === 'pick-4' ? 'Pick 4' : selectedGameSlug === 'pick-5' ? 'Pick 5' : gameMeta.name}
        </h2>
        <GameHelpMenu gameSlug={selectedGameSlug} gameTitle={gameMeta.name} />
      </div>

      {/* Main 2-Column Responsive Web Layout */}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Submission Form Card */}
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{
            width: '100%',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div>
              <span
                style={{
                  background: gameMeta.gradient,
                  color: '#FFFFFF',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  display: 'inline-block',
                }}
              >
                {gameMeta.name} &bull; {gameMeta.prize}
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                {gameMeta.isZdt
                  ? 'Play the Zip Code, Date and Time info from any receipt. You can win up to $1,430,000 in prizes!'
                  : `Enter receipt info and amount to enter the ${gameMeta.prize} draw!`}
              </p>
            </div>
          </div>

        {/* ZDT Specific: Vendor Zip Code */}
        {gameMeta.isZdt ? (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              Vendor Zip Code
            </label>
            <input
              className="form-input"
              type="text"
              maxLength={10}
              placeholder="Enter Zip Code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              required
              style={{ borderRadius: '14px' }}
            />
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              Receipt Total ($)
            </label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              placeholder="Enter Total Amount"
              value={receiptTotal}
              onChange={(e) => setReceiptTotal(e.target.value)}
              required
              style={{ borderRadius: '14px' }}
            />
          </div>
        )}

        {/* Non-ZDT Pick Games: Draw Toggle */}
        {!gameMeta.isZdt && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              Draw Timing
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDrawOption('full day')}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: drawOption === 'full day' ? '2px solid var(--green)' : '1px solid var(--border-color)',
                  background: drawOption === 'full day' ? 'rgba(0, 103, 77, 0.1)' : 'var(--bg-input)',
                  fontWeight: drawOption === 'full day' ? 700 : 500,
                  color: drawOption === 'full day' ? 'var(--green)' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Full Day
              </button>
              <button
                type="button"
                onClick={() => setDrawOption('midday')}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: drawOption === 'midday' ? '2px solid var(--green)' : '1px solid var(--border-color)',
                  background: drawOption === 'midday' ? 'rgba(0, 103, 77, 0.1)' : 'var(--bg-input)',
                  fontWeight: drawOption === 'midday' ? 700 : 500,
                  color: drawOption === 'midday' ? 'var(--green)' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Midday
              </button>
            </div>
          </div>
        )}

        {/* Receipt Date */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
            Receipt Date
          </label>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
              style={{ borderRadius: '14px', width: '100%' }}
            />
          </div>
        </div>

        {/* Receipt Time */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              Receipt Time
            </label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Convert Military Time
            </span>
          </div>
          <input
            className="form-input"
            type="time"
            value={receiptTime}
            onChange={(e) => setReceiptTime(e.target.value)}
            required
            style={{ borderRadius: '14px', width: '100%' }}
          />
        </div>

        {/* Reset Link Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--green)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '4px 12px',
            }}
          >
            Reset
          </button>
        </div>

        {/* Upload Receipt Button with Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card-secondary)',
              color: 'var(--text-main)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <Image size={18} />
            <span>{receiptFile ? receiptFile.name : 'Upload Receipt'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {receiptPreview && (
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                maxHeight: '140px',
                background: 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src={receiptPreview} alt="Receipt Preview" style={{ maxHeight: '140px', width: 'auto', objectFit: 'contain' }} />
            </div>
          )}
        </div>

        {/* Enter Receipt Green CTA Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '24px',
            background: 'var(--green)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '15px',
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(0, 103, 77, 0.3)',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? 'Submitting...' : 'Enter Receipt'}
        </button>
      </form>

      {/* Right Column: Sponsored Campaign Card & Game Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {/* Sponsored Ad Banner */}
        <div
          className="card"
          style={{
            padding: '24px 20px',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(21, 174, 54, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15AE36',
            }}
          >
            <Megaphone size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Grow Your Audience!
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
            Advertise your brand, website, or mobile app directly to our active users. Tap here to launch your campaign!
          </p>
          <button
            type="button"
            onClick={() => navigate('/campaigns/create')}
            style={{
              background: '#15AE36',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '24px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px',
            }}
          >
            Get Started &rarr;
          </button>
        </div>

        {/* Quick How to Win Card */}
        <div
          className="card"
          style={{
            padding: '22px 20px',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            How to Win & Guidelines
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
              <span>Enter details exactly as printed on your store or vendor receipt.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
              <span>Upload a clear photo showing the vendor name, date, time, and total.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
              <span>Store your physical receipt safely for winner validation.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Success Modal */}
      <CustomModal visible={Boolean(result)} onClose={() => navigate('/play')} maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 103, 77, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green)',
            }}
          >
            <Sparkles size={32} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {result?.message}
          </h3>
          {result?.points ? (
            <p style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: 700 }}>
              Points Earned: +{result.points}
            </p>
          ) : null}
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
