import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, HelpCircle, Megaphone, Camera, Image as ImageIcon, Sparkles, ChevronDown, Check } from 'lucide-react';
import { Button, Container, CustomModal, GameHelpMenu, showToast, triggerCoinCelebration } from '../../components';
import images from '../../constants/images';
import gameServices from '../../services/gameServices';
import locationServices from '../../services/locationServices';
import { getUSDateYYYYMMDD, getUSTimeHHMM, getUSTimeWithOffset } from '../../utils/usTime';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { getUserRewardPoints } from '../../utils/userDisplay';
import { getScannedReceipt, clearScannedReceipt } from '../../utils/scannedReceiptStore';

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
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
    if (file) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
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
    if (isStatePick && !selectedState.trim()) {
      showToast({ type: 'error', text1: 'State required', text2: 'Please select a state from the dropdown.' });
      return;
    }

    setLoading(true);
    try {
      const pointsBefore = getUserRewardPoints(userData);
      const response = await gameServices.storeGame({
        type: gameType,
        game_slug: gameSlug,
        total: receiptTotal.trim(),
        state: isStatePick ? selectedState.trim() : undefined,
        date: getUSDateYYYYMMDD(),
        time: getUSTimeHHMM(),
        played_at: getUSTimeWithOffset(),
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

      if (points > 0) {
        triggerCoinCelebration();
      }

      setReceiptFile(null);
      setReceiptPreview(null);
      setReceiptTotal('');
      setSelectedState('');
      clearScannedReceipt();
    } catch (error: any) {
      const parsedError =
        error?.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(' ')
          : error?.response?.data?.message || error?.message || 'Submission failed. Please try again.';

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
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          {gameTitle}
        </h2>
        <GameHelpMenu gameSlug={isStatePick ? 'state' : 'pic-pick'} gameTitle={gameTitle} gameNumber={gameNumber} />
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
                type="number"
                step="0.01"
                placeholder={t('picPick.amountPlaceholder', 'Enter Amount')}
                value={receiptTotal}
                onChange={(e) => setReceiptTotal(e.target.value)}
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

              {/* Receipt Image Selected Box (matching Mobile Screenshot 3) */}
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

              {/* Camera and Gallery Icon Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', padding: '0 10px' }}>
                <label
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease',
                  }}
                  title="Take Photo"
                >
                  <Camera size={24} />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>

                <label
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease',
                  }}
                  title="Choose from Gallery"
                >
                  <ImageIcon size={24} />
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

        {/* Right Column: Sponsored Campaign Card & Guidelines */}
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
              {t('profile.menuRules', 'Instant Game Rules')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
                <span>{t('picPick.gameDescription', 'Submit receipt total amount matching the game tier.')}</span>
              </div>
              {isStatePick && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
                  <span>{t('picPick.errors.selectState', 'Select the US state where the purchase was made.')}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#15AE36', fontWeight: 800 }}>&bull;</span>
                <span>{t('picPick.description1', 'Take or upload a clean photo of your physical receipt.')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <CustomModal visible={Boolean(result)} onClose={() => navigate('/play')} maxWidth="400px">
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
            title={t('cashGames.buttons.returnToGames', 'Return to Games')}
            onClick={() => navigate('/play')}
            style={{ width: '100%', marginTop: '8px' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default PicPickGame;
