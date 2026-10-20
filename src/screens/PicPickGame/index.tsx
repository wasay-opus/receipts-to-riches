import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, HelpCircle, Megaphone, Image as ImageIcon, Sparkles, ChevronDown, Check } from 'lucide-react';
import { Button, Container, CustomModal, GameHelpMenu, showToast, triggerCoinCelebration } from '../../components';
import images from '../../constants/images';
import gameServices from '../../services/gameServices';
import locationServices from '../../services/locationServices';
import { getLocalTimeWithOffset, getUSDateYYYYMMDD, getUSTimeHHMM, isDeviceInUSTimezone, UNSUPPORTED_TIMEZONE_MESSAGE } from '../../utils/usTime';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { getUserRewardPoints } from '../../utils/userDisplay';
import { getScannedReceipt, clearScannedReceipt } from '../../utils/scannedReceiptStore';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';

const extractMessage = (payload: any, fallback: string) => {
  const message = payload?.message ?? payload?.data?.message ?? payload?.user_friendly_message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

export const PicPickGame: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector((state: RootState) => state.user);

  const challenge = (location.state as any)?.challenge;
  const isStatePick =
    challenge?.isState ||
    String(challenge?.gameType || challenge?.type || '').toLowerCase() === 'state' ||
    String(challenge?.gameSlug || '').toLowerCase().includes('state');

  const gameNumber = challenge?.number || '3';
  const gameAmount = challenge?.amount || '$1500';
  const gameTitle = challenge?.title || (isStatePick ? `State Game ${gameNumber}` : `Pic-Pick Game ${gameNumber}`);
  const gameSlug = challenge?.gameSlug || challenge?.game_slug || (isStatePick ? (gameNumber === '3' ? '1500-game' : (gameNumber === '4' ? '2500-game-state' : '3500-game')) : (gameNumber === '1' ? '500-game' : (gameNumber === '2' ? '1000-game' : '2500-game-pic-pick')));
  const gameType = isStatePick ? 'state' : 'pic-pick';

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptTotal, setReceiptTotal] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [statesList, setStatesList] = useState<string[]>(US_STATES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; points: number } | null>(null);

  useEffect(() => {
    const preloaded = getScannedReceipt();
    if (preloaded.file && !receiptFile) {
      setReceiptFile(preloaded.file);
      setReceiptPreview(preloaded.previewUrl);
    }
  }, []);

  useEffect(() => {
    if (!isStatePick) return;
    locationServices
      .getAllStates()
      .then((res) => {
        const raw = res?.data?.data || res?.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const names = raw
            .map((s: any) => (typeof s === 'string' ? s : s?.state_name || s?.name || s?.state || s?.state_id || ''))
            .filter((name: string) => Boolean(name && name.trim()));
          if (names.length > 0) {
            setStatesList(names);
          }
        }
      })
      .catch(() => {
        // Fallback to US_STATES list
      });
  }, [isStatePick]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
    if (file) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
  };

  const getAmountLimits = (num: string) => {
    if (num === '3' || num === '1') {
      return { max: 9.99, maxIntDigits: 1, label: 'Up to $9.99', placeholder: '0.01 - 9.99' };
    }
    if (num === '4' || num === '2') {
      return { max: 99.99, maxIntDigits: 2, label: 'Up to $99.99', placeholder: '0.01 - 99.99' };
    }
    if (num === '5') {
      return { max: 999.99, maxIntDigits: 3, label: 'Up to $999.99', placeholder: '0.01 - 999.99' };
    }
    return { max: 999.99, maxIntDigits: 3, label: 'Up to $999.99', placeholder: '0.01 - 999.99' };
  };

  const amountConfig = getAmountLimits(String(gameNumber));

  const handleAmountChange = (val: string) => {
    if (val === '') {
      setReceiptTotal('');
      return;
    }
    if (!/^\d*\.?\d*$/.test(val)) return;

    const parts = val.split('.');
    const intPart = parts[0];
    const decPart = parts[1];

    if (intPart && intPart.length > amountConfig.maxIntDigits) {
      return;
    }
    if (decPart && decPart.length > 2) {
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num > amountConfig.max) {
      return;
    }
    setReceiptTotal(val);
  };

  const handleSubmit = async () => {
    if (!receiptFile) {
      showToast({ type: 'error', text1: 'Receipt photo required', text2: 'Please upload or capture a receipt photo.' });
      return;
    }
    if (!receiptTotal.trim()) {
      showToast({ type: 'error', text1: 'Amount required', text2: 'Please enter the receipt amount.' });
      return;
    }
    const numericTotal = parseFloat(receiptTotal);
    if (isNaN(numericTotal) || numericTotal <= 0) {
      showToast({ type: 'error', text1: 'Invalid amount', text2: 'Please enter a valid amount greater than 0.' });
      return;
    }
    if (numericTotal > amountConfig.max) {
      showToast({
        type: 'error',
        text1: 'Amount exceeded',
        text2: `Maximum allowed amount for ${gameTitle} is $${amountConfig.max.toFixed(2)}.`,
      });
      return;
    }
    if (isStatePick && !selectedState.trim()) {
      showToast({ type: 'error', text1: 'State required', text2: 'Please select a state from the dropdown.' });
      return;
    }
    if (!zipCode.trim()) {
      showToast({ type: 'error', text1: 'Zip code required', text2: 'Please enter the receipt vendor zip code.' });
      return;
    }

    if (!isDeviceInUSTimezone()) {
      showToast({
        type: 'error',
        text1: 'Submission Failed',
        text2: UNSUPPORTED_TIMEZONE_MESSAGE,
      });
      return;
    }

    setLoading(true);
    try {
      const pointsBefore = getUserRewardPoints(userData);
      const response = await gameServices.storeGame({
        type: gameType,
        game_slug: gameSlug,
        total: receiptTotal.trim(),
        zip_code: zipCode.trim(),
        state: isStatePick ? selectedState.trim() : undefined,
        date: getUSDateYYYYMMDD(),
        time: getUSTimeHHMM(),
        played_at: getLocalTimeWithOffset(),
        receipt: {
          uri: receiptFile.name,
          type: receiptFile.type,
          name: receiptFile.name,
          file: receiptFile,
        },
      });

      let points = 0;
      try {
        const updatedUser = await dispatch(fetchUser()).unwrap();
        const pointsAfter = getUserRewardPoints(updatedUser?.data ?? updatedUser);
        points = Math.max(0, pointsAfter - pointsBefore);
      } catch {
        // Fallback
      }

      setResult({
        message: extractMessage(response?.data, 'Receipt submitted successfully.'),
        points,
      });

      triggerCoinCelebration();

      setReceiptFile(null);
      setReceiptPreview(null);
      setReceiptTotal('');
      setZipCode('');
      setSelectedState('');
      clearScannedReceipt();
    } catch (error: any) {
      const parsedError = getUserFriendlyErrorMessage(error, 'Submission failed. Please try again.');

      showToast({
        type: 'error',
        text1: 'Submission failed',
        text2: parsedError,
      });
    } finally {
      setLoading(false);
    }
  };

  const cardGradient = isStatePick
    ? (gameNumber === '4'
        ? 'linear-gradient(135deg, #FE8904 0%, #E65100 100%)'
        : (gameNumber === '5'
            ? 'linear-gradient(135deg, #981076 0%, #6E0058 100%)'
            : 'linear-gradient(135deg, #5B00F0 0%, #3B00A0 100%)'))
    : (gameNumber === '1'
        ? 'linear-gradient(135deg, #E11D48 0%, #9F1239 100%)'
        : (gameNumber === '2'
            ? 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)'
            : 'linear-gradient(135deg, #FE8904 0%, #5B00F0 100%)'));

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
            {gameTitle}
          </h2>
          <span className="game-stage-subtitle">
            {isStatePick ? 'State Pick Arena' : 'Instant Receipt Pick'}
          </span>
        </div>
        <GameHelpMenu gameSlug={isStatePick ? 'state' : 'pic-pick'} gameTitle={gameTitle} gameNumber={gameNumber} />
      </div>

      {/* Main 2-Column Responsive Web Layout */}
      <div className="game-screen-grid">
        {/* Left Column: Game Action Card & Submit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {/* Game Card with Sunburst Background */}
          <div
            style={{
              width: '100%',
              background: cardGradient,
              borderRadius: '24px',
              padding: '28px 24px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              boxSizing: 'border-box',
            }}
          >
            {/* Sunburst Mask Overlay */}
            <img
              src={images.cardBgMask}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.35,
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
              }}
            />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '0.3px', margin: 0 }}>
                {gameTitle}
              </h3>
              <h2 style={{ fontSize: '38px', fontWeight: 900, marginTop: '4px', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
                {gameAmount}
              </h2>
              <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '8px', maxWidth: '280px', lineHeight: '1.4' }}>
                {t('picPick.gameDescription', 'Enter the receipt total and submit picture of receipt.')}
              </p>
            </div>

            {/* Input Fields Container */}
            <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
              {/* Amount Pill Input */}
              <input
                type="text"
                inputMode="decimal"
                placeholder={amountConfig.placeholder || t('picPick.amountPlaceholder', 'Enter Amount')}
                value={receiptTotal}
                onChange={(e) => handleAmountChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '28px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                }}
              />

              {/* Vendor Zip Code Pill Input */}
              <input
                type="text"
                maxLength={10}
                placeholder={t('cashGames.placeholders.enterZip', 'Enter Zip Code')}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '28px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                }}
              />

              {/* State Pill Dropdown (for State games) */}
              {isStatePick && (
                <div style={{ position: 'relative', width: '100%' }}>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '28px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: selectedState ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                      fontSize: '15px',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="" style={{ background: '#1F2937', color: '#FFF' }}>
                      {t('basicInfo.selectState', 'Select State')}
                    </option>
                    {statesList.map((stateName) => (
                      <option key={stateName} value={stateName} style={{ background: '#1F2937', color: '#FFF' }}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    style={{
                      position: 'absolute',
                      right: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  />
                </div>
              )}

              {/* Receipt Image Selected Box */}
              {receiptPreview && (
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.45)',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
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
                      background: '#000',
                      flexShrink: 0,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <img
                      src={receiptPreview}
                      alt="Receipt"
                      onError={() => setReceiptPreview(null)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      flex: 1,
                      textAlign: 'left',
                    }}
                  >
                    {t('picPick.receiptImageSelected', 'Receipt image selected')}
                  </span>
                </div>
              )}

              {/* Browse Files Button */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '6px' }}>
                <label
                  style={{
                    padding: '10px 20px',
                    borderRadius: '14px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease, background 0.2s ease',
                  }}
                  title={t('scanScreen.browseFiles', 'Browse Files')}
                >
                  <ImageIcon size={18} />
                  <span>{t('scanScreen.browseFiles', 'Browse Files')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Continue Green CTA Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '28px',
              background: 'var(--green)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '16px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(0, 103, 77, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            {loading ? t('common.loading', 'Submitting...') : t('common.continue', 'Continue')}
          </button>
        </div>

        {/* Right Column: Side Column (Campaign Card & Rules) */}
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

          {/* Quick How to Win Card */}
          <div className="card game-rules-card">
            <h4 className="game-rules-title">
              {t('profile.menuRules', 'Instant Game Rules')}
            </h4>
            <div className="game-rules-list">
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>{t('picPick.gameDescription', 'Submit receipt total amount matching the game tier.')}</span>
              </div>
              {isStatePick && (
                <div className="game-rules-item">
                  <span className="game-rules-bullet">&bull;</span>
                  <span>{t('picPick.errors.selectState', 'Select the US state where the purchase was made.')}</span>
                </div>
              )}
              <div className="game-rules-item">
                <span className="game-rules-bullet">&bull;</span>
                <span>{t('picPick.description1', 'Take or upload a clean photo of your physical receipt.')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <CustomModal visible={Boolean(result)} onClose={() => navigate('/home')} maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <img src={images.Coin} alt="Prize" style={{ width: '80px', height: '80px' }} />
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
              {result?.message}
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: 700, marginTop: '4px' }}>
              {t('home.points', 'Points')}: +{result?.points ?? 0}
            </p>
          </div>
          <Button
            title={t('common.backToHome', 'Back to Home')}
            onClick={() => navigate('/home')}
            style={{ width: '100%', marginTop: '8px' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default PicPickGame;
