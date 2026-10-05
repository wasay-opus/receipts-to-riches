import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, DollarSign, Sparkles, MapPin, Calendar, Clock, Image, Layers, HelpCircle, Megaphone, Lock, CheckCircle2, Circle } from 'lucide-react';
import { Button, Container, CustomModal, GameHelpMenu, showToast, triggerCoinCelebration } from '../../components';
import gameServices from '../../services/gameServices';
import { getLocalTimeWithOffset, getUSDateYYYYMMDD, getUSTimeHHMM, getUSTimeWithOffset, isMiddayOpenInUSTime } from '../../utils/usTime';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { getUserRewardPoints } from '../../utils/userDisplay';
import { getScannedReceipt, clearScannedReceipt } from '../../utils/scannedReceiptStore';
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
  const { t, i18n } = useTranslation();
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

  const isZdtGame = selectedGameSlug === 'zdt';
  const [selectedMode, setSelectedMode] = useState<'full day' | 'midday' | null>(isZdtGame ? 'full day' : null);
  const [tempSelectedMode, setTempSelectedMode] = useState<'full day' | 'midday' | null>(null);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [receiptTotal, setReceiptTotal] = useState('');
  const [drawOption, setDrawOption] = useState<'full day' | 'midday'>('full day');
  const [receiptDate, setReceiptDate] = useState(getUSDateYYYYMMDD());
  const [receiptTime, setReceiptTime] = useState(getUSTimeHHMM());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; points: number } | null>(null);
  const [middayClosedModalOpen, setMiddayClosedModalOpen] = useState(false);
  const [middayStatusData, setMiddayStatusData] = useState<{ is_open?: boolean | null; note?: string } | null>(null);

  // Sync state whenever selected game slug or URL changes
  useEffect(() => {
    const isZdt = selectedGameSlug === 'zdt';
    const explicitMode = (location.state as any)?.mode || null;
    setSelectedMode(isZdt ? 'full day' : explicitMode);
    setTempSelectedMode(explicitMode);
    setDrawOption(explicitMode === 'midday' ? 'midday' : 'full day');
    setMiddayClosedModalOpen(false);
    setResult(null);

    const localTimeStr = getLocalTimeWithOffset();
    let isMounted = true;
    gameServices
      .getMiddayStatus(localTimeStr)
      .then((response) => {
        if (!isMounted) return;
        const payload = response?.data?.data ?? response?.data;
        setMiddayStatusData(payload);
      })
      .catch(() => {
        if (isMounted) setMiddayStatusData(null);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGameSlug, location.search]);

  useEffect(() => {
    const preloaded = getScannedReceipt();
    if (preloaded.file && !receiptFile) {
      setReceiptFile(preloaded.file);
      setReceiptPreview(preloaded.previewUrl);
    }
  }, []);

  const checkIsMiddayOpen = (): boolean => {
    if (middayStatusData?.is_open !== undefined && middayStatusData?.is_open !== null) {
      return Boolean(middayStatusData.is_open);
    }
    const now = new Date();
    const localHour = now.getHours();
    const localMin = now.getMinutes();
    const isLocalOpen = localHour < 12 || (localHour === 12 && localMin === 0);
    const isUSOpen = isMiddayOpenInUSTime();
    return isLocalOpen && isUSOpen;
  };

  const handleDrawOptionClick = (option: 'full day' | 'midday') => {
    if (option === 'midday') {
      const isOpen = checkIsMiddayOpen();
      if (!isOpen) {
        setMiddayClosedModalOpen(true);
        setDrawOption('full day');
        setSelectedMode('full day');
        return;
      }
    }
    setDrawOption(option);
    setSelectedMode(option);
  };

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
        text2: t('cashGames.validations.uploadReceiptImage', 'Please upload or capture an image of your receipt.'),
      });
      return;
    }

    if (gameMeta.isZdt) {
      if (!zipCode.trim()) {
        showToast({
          type: 'error',
          text1: t('cashGames.validations.zipRequired', 'Zip code is required'),
          text2: t('cashGames.validations.enterZip', 'Please enter the 5-digit zip code from your receipt.'),
        });
        return;
      }
    } else {
      if (!receiptTotal.trim()) {
        showToast({
          type: 'error',
          text1: t('cashGames.validations.totalRequired', 'Receipt total is required'),
          text2: t('cashGames.validations.enterTotal', 'Please enter the total receipt amount.'),
        });
        return;
      }

      if (drawOption === 'midday' && !checkIsMiddayOpen()) {
        setMiddayClosedModalOpen(true);
        setDrawOption('full day');
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
      clearScannedReceipt();
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
      {/* Top Header Bar */}
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
          {selectedGameSlug === 'zdt'
            ? 'ZDT'
            : selectedMode === 'midday'
              ? `${selectedGameSlug === 'pick-3' ? 'Pick 3' : selectedGameSlug === 'pick-4' ? 'Pick 4' : selectedGameSlug === 'pick-5' ? 'Pick 5' : gameMeta.name} (${t('cashGames.tabs.midday', 'Mid Day')})`
              : selectedGameSlug === 'pick-3'
                ? 'Pick 3'
                : selectedGameSlug === 'pick-4'
                  ? 'Pick 4'
                  : selectedGameSlug === 'pick-5'
                    ? 'Pick 5'
                    : gameMeta.name}
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
                  ? t('cashGames.zdt.introText', 'Play the Zip Code, Date and Time info from any receipt. You can win up to $1,430,000 in prizes!')
                  : selectedGameSlug === 'pick-3'
                    ? t('cashGames.pick3.introText', 'Play the total (3-Digit) and time info from any receipt. You can win up to $1,095,000 prizes!')
                    : selectedGameSlug === 'pick-4'
                      ? t('cashGames.pick4.introText', 'Play the total (4-Digit) and time info from any receipt. You can win up to $1,825,000 prizes!')
                      : t('cashGames.pick5.introText', 'Play the total (5-Digit) and time info from any receipt. You can win up to $3,659,000 prizes!')}
              </p>
            </div>
          </div>

        {/* ZDT Specific: Vendor Zip Code */}
        {gameMeta.isZdt ? (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              {t('cashGames.labels.zipCode', 'Vendor Zip Code')}
            </label>
            <input
              className="form-input"
              type="text"
              maxLength={10}
              placeholder={t('cashGames.placeholders.enterZip', 'Enter Zip Code')}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              required
              style={{ borderRadius: '14px' }}
            />
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              {t('cashGames.labels.receiptTotal', 'Receipt Total ($)')}
            </label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              placeholder={t('cashGames.placeholders.enterTotal', 'Enter Total Amount')}
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
              {t('cashGames.labels.drawTiming', 'Draw Timing')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDrawOptionClick('full day')}
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
                {t('cashGames.tabs.fullDay', 'Full Day')}
              </button>
              <button
                type="button"
                onClick={() => handleDrawOptionClick('midday')}
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
                {t('cashGames.tabs.midday', 'Midday')}
              </button>
            </div>
          </div>
        )}

        {/* Receipt Date */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
            {t('cashGames.labels.receiptDate', 'Receipt Date')}
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
              {t('cashGames.labels.receiptTime', 'Receipt Time')}
            </label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {t('cashGames.labels.militaryTime', 'Convert Military Time')}
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
            {t('cashGames.buttons.reset', 'Reset')}
          </button>
        </div>

        {/* Upload Receipt Button with Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {receiptPreview && (
            <div
              style={{
                width: '100%',
                background: 'var(--bg-card-secondary)',
                padding: '10px 16px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'var(--bg-input)',
                  flexShrink: 0,
                  border: '1px solid var(--border-color)',
                }}
              >
                <img
                  src={receiptPreview}
                  alt="Receipt Preview"
                  onError={() => setReceiptPreview(null)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  flex: 1,
                  textAlign: 'left',
                }}
              >
                {t('picPick.receiptImageSelected', 'Receipt image selected')}
              </span>
            </div>
          )}

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
            <span>
              {receiptFile
                ? (receiptFile.name || t('common.changeImage', 'Change Receipt'))
                : t('cashGames.buttons.uploadReceipt', 'Upload Receipt')}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
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
          {loading ? t('common.loading', 'Submitting...') : t('cashGames.buttons.enterReceipt', 'Enter Receipt')}
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
            {t('home.growAudienceTitle', 'Grow Your Audience!')}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
            {t('home.growAudienceDesc', 'Advertise your brand, website, or mobile app directly to our active users. Tap here to launch your campaign!')}
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
            {t('home.getStarted', 'Get Started')} &rarr;
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
            {t('profile.menuRules', 'How to Win & Guidelines')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
              <span>{t('rules.receiptLegibilityDesc', 'Enter details exactly as printed on your store or vendor receipt.')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
              <span>{t('picPick.description1', 'Upload a clear photo showing the vendor name, date, time, and total.')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
              <span>{t('rules.receiptPhysicalOwnershipDesc', 'Store your physical receipt safely for winner validation.')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Mode Selection Modal matching Mobile */}
      <CustomModal
        visible={selectedMode === null && !middayClosedModalOpen && !gameMeta.isZdt}
        onClose={() => navigate(-1)}
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '6px 4px' }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              {t('cashGames.labels.selectMode', 'Select Game Mode')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              {t('cashGames.labels.selectImageSourceMsg', 'Choose how you want to play this game')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Full Day Option */}
            <div
              onClick={() => setTempSelectedMode('full day')}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px',
                borderRadius: '16px',
                border: tempSelectedMode === 'full day' ? '2px solid var(--green)' : '1px solid var(--border-color)',
                background: tempSelectedMode === 'full day' ? 'rgba(0, 103, 77, 0.08)' : 'var(--bg-card-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginTop: '2px', color: tempSelectedMode === 'full day' ? 'var(--green)' : 'var(--text-muted)' }}>
                {tempSelectedMode === 'full day' ? (
                  <CheckCircle2 size={22} color="var(--green)" />
                ) : (
                  <Circle size={22} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {t('cashGames.tabs.fullDay', 'Full Day')}
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {t('cashGames.labels.fullDayDesc', 'Submit your receipts anytime during the day. This game is always open and accepts your daily entries.')}
                </span>
              </div>
            </div>

            {/* Mid Day Option */}
            <div
              onClick={() => {
                if (!checkIsMiddayOpen()) {
                  setMiddayClosedModalOpen(true);
                } else {
                  setTempSelectedMode('midday');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px',
                borderRadius: '16px',
                border: tempSelectedMode === 'midday' ? '2px solid var(--green)' : '1px solid var(--border-color)',
                background: tempSelectedMode === 'midday' ? 'rgba(0, 103, 77, 0.08)' : 'var(--bg-card-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginTop: '2px', color: tempSelectedMode === 'midday' ? 'var(--green)' : 'var(--text-muted)' }}>
                {tempSelectedMode === 'midday' ? (
                  <CheckCircle2 size={22} color="var(--green)" />
                ) : (
                  <Circle size={22} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {t('cashGames.tabs.midday', 'Mid Day')}
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {t('cashGames.labels.middayDesc', 'Special daytime game! Only available between 12 AM and 12 PM your local time.')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '24px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              disabled={tempSelectedMode === null}
              onClick={() => {
                if (tempSelectedMode) {
                  setSelectedMode(tempSelectedMode);
                  setDrawOption(tempSelectedMode);
                }
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '24px',
                background: 'var(--green)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                cursor: tempSelectedMode === null ? 'not-allowed' : 'pointer',
                opacity: tempSelectedMode === null ? 0.5 : 1,
                boxShadow: tempSelectedMode ? '0 4px 12px rgba(0, 103, 77, 0.3)' : 'none',
              }}
            >
              {t('common.confirm', 'Confirm')}
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Mid Day Closed Modal matching Screenshot 3 & Mobile */}
      <CustomModal
        visible={middayClosedModalOpen}
        onClose={() => setMiddayClosedModalOpen(false)}
        maxWidth="380px"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
            padding: '10px 4px 6px 4px',
          }}
        >
          {/* Modal Header */}
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {t('cashGames.labels.middayClosed', 'Mid Day Closed')}
          </h3>

          {/* Mint Green Shield Icon with Teal Lock */}
          <div
            style={{
              width: '80px',
              height: '88px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* SVG Shield shape */}
            <svg
              width="80"
              height="88"
              viewBox="0 0 80 88"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ position: 'absolute', inset: 0 }}
            >
              <path
                d="M40 0L76 13V44C76 68 49 85.5 40 88C31 85.5 4 68 4 44V13L40 0Z"
                fill="#C6F6D5"
              />
            </svg>

            {/* Lock with Radiant Sparks */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Radiating Spark Lines */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2px',
                }}
              >
                <div style={{ width: '3px', height: '6px', background: '#059669', borderRadius: '2px', transform: 'rotate(-30deg)' }} />
                <div style={{ width: '3px', height: '8px', background: '#059669', borderRadius: '2px' }} />
                <div style={{ width: '3px', height: '6px', background: '#059669', borderRadius: '2px', transform: 'rotate(30deg)' }} />
              </div>
              <Lock size={30} color="#059669" strokeWidth={2.5} />
            </div>
          </div>

          {/* Warning Message */}
          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--text-muted)',
              lineHeight: '1.45',
              margin: 0,
              maxWidth: '290px',
            }}
          >
            {i18n.language.startsWith('es')
              ? t('cashGames.labels.middayBackendNote', 'El juego de mediodía está disponible de 12:00 a. m. a 12:00 p. m. en su hora local.')
              : (middayStatusData?.note || t('cashGames.labels.middayBackendNote', 'Midday is available from 12:00 AM to 12:00 PM in your local time.'))}
          </p>

          {/* Green OK Button */}
          <button
            type="button"
            onClick={() => setMiddayClosedModalOpen(false)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '24px',
              background: '#00D066',
              color: '#052E16',
              border: 'none',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 208, 102, 0.35)',
              transition: 'transform 0.15s ease',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {t('common.ok', 'OK')}
          </button>
        </div>
      </CustomModal>

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
