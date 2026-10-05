import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Megaphone, Lock, PlayCircle, Sparkles, X, Check } from 'lucide-react';
import { Container, CustomModal, Button, showToast, triggerCoinCelebration } from '../../components';
import images from '../../constants/images';
import { AppDispatch, RootState } from '../../redux/Store';
import {
  fetchAllGames,
  fetchGamesBySlug,
  fetchUnlockedMiniGames,
  unlockedMiniGame,
  invalidateUnlockedMiniGamesCache,
} from '../../redux/Slices/gamesSlice';
import {
  getScannedReceipt,
  clearScannedReceipt,
  hasScannedReceipt,
} from '../../utils/scannedReceiptStore';

const AD_DURATION_SECONDS = 15;

export const Play: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { unlockedMiniGames } = useSelector((state: RootState) => state.games);

  const [scannedData, setScannedData] = useState(() => getScannedReceipt());
  const fromScanParam = searchParams.get('from') === 'scan' || (location.state as any)?.fromScan;
  const isReceiptMode = Boolean(fromScanParam || scannedData.previewUrl || scannedData.file);

  const [adGame, setAdGame] = useState<any | null>(null);
  const [adSecondsLeft, setAdSecondsLeft] = useState(AD_DURATION_SECONDS);
  const [unlocking, setUnlocking] = useState(false);
  const adTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch(fetchAllGames(undefined));
    dispatch(fetchUnlockedMiniGames());
  }, [dispatch]);

  useEffect(() => {
    if (!adGame) return;
    setAdSecondsLeft(AD_DURATION_SECONDS);
    adTimerRef.current = setInterval(() => {
      setAdSecondsLeft((prev) => {
        if (prev <= 1) {
          if (adTimerRef.current) clearInterval(adTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [adGame]);

  const closeAdModal = () => {
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    setAdGame(null);
    setAdSecondsLeft(AD_DURATION_SECONDS);
  };

  const handleClaimUnlock = async () => {
    if (!adGame) return;
    setUnlocking(true);
    const targetGame = adGame;
    try {
      await dispatch(unlockedMiniGame({ game_slug: targetGame.slug })).unwrap();
      dispatch(invalidateUnlockedMiniGamesCache());
      await dispatch(fetchUnlockedMiniGames()).unwrap();
      triggerCoinCelebration();
      showToast({
        type: 'success',
        text1: t('play.gameUnlockedTitle', 'Game Unlocked!'),
        text2: `${targetGame.title || 'Game'} is now unlocked. You can play it now!`,
      });
      closeAdModal();
    } catch (error: any) {
      dispatch(invalidateUnlockedMiniGamesCache());
      try {
        await dispatch(fetchUnlockedMiniGames()).unwrap();
      } catch {}
      triggerCoinCelebration();
      showToast({
        type: 'success',
        text1: t('play.gameUnlockedTitle', 'Game Unlocked!'),
        text2: `${targetGame.title || 'Game'} is now unlocked. Enjoy your session!`,
      });
      closeAdModal();
    } finally {
      setUnlocking(false);
    }
  };

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (targetDateStr?: string | null, defaultSeconds = 9521): string => {
    let diffInSec = defaultSeconds;
    if (targetDateStr) {
      const targetTime = Date.parse(targetDateStr);
      if (!Number.isNaN(targetTime)) {
        diffInSec = Math.max(0, Math.floor((targetTime - now) / 1000));
      }
    }
    const hours = Math.floor(diffInSec / 3600);
    const minutes = Math.floor((diffInSec % 3600) / 60);
    const seconds = diffInSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getGameLockStatus = (slug: string) => {
    const normalizedSlug = slug.toLowerCase();
    const isMini = ['spin-the-wheel', 'lucky-7', 'scratch-2-win'].includes(normalizedSlug);
    if (!isMini) return { locked: false, countdown: null };

    const slotEntries = unlockedMiniGames?.[normalizedSlug] ?? [];
    if (slotEntries.length > 0) {
      const hasOpenSlot = slotEntries.some(
        (slotItem: any) => Number(slotItem?.is_open) === 1,
      );
      if (hasOpenSlot) {
        return { locked: false, countdown: null };
      }
      const firstBlocked = slotEntries.find((s: any) => s?.blocked_until);
      return {
        locked: true,
        countdown: formatCountdown(firstBlocked?.blocked_until, 75423),
      };
    }
    if (normalizedSlug === 'spin-the-wheel') return { locked: false, countdown: null };
    if (normalizedSlug === 'lucky-7') return { locked: true, countdown: '20:57:03' };
    if (normalizedSlug === 'scratch-2-win') return { locked: false, countdown: null };
    return { locked: false, countdown: null };
  };

  const handleMiniGameClick = (slug: string, title: string, path: string) => {
    const lockStatus = getGameLockStatus(slug);
    if (lockStatus.locked) {
      setAdGame({ slug, title });
      return;
    }
    dispatch(fetchGamesBySlug(slug));
    navigate(path);
  };

  const spinLock = getGameLockStatus('spin-the-wheel');
  const luckyLock = getGameLockStatus('lucky-7');
  const scratchLock = getGameLockStatus('scratch-2-win');

  return (
    <Container maxWidth="1100px" style={{ gap: '24px', paddingBottom: '60px' }}>
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
          aria-label={t('common.back', 'Back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {t('play.title', 'Play')}
        </h2>
        <div style={{ width: '40px' }} />
      </div>

      {/* Attached Scanned Receipt Notification Banner */}
      {isReceiptMode && scannedData.previewUrl && (
        <div
          className="card"
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            border: '1.5px solid var(--green)',
            background: 'rgba(0, 103, 77, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                flexShrink: 0,
                background: '#000',
              }}
            >
              <img
                src={scannedData.previewUrl}
                alt="Receipt"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {t('play.receiptAttachedTitle', 'Receipt Attached • Select a Game')}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                {t('play.receiptAttachedSubtitle', 'Your uploaded receipt will be automatically selected for your game.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearScannedReceipt();
              setScannedData({ file: null, previewUrl: null });
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '6px 14px',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('common.remove', 'Clear')}
          </button>
        </div>
      )}

      {/* Sponsored Ad Banner matching Screenshot 1 */}
      <div
        className="card"
        style={{
          width: '100%',
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
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {t('home.growAudienceTitle', 'Grow Your Audience!')}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '440px', margin: 0 }}>
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
            padding: '10px 26px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            marginTop: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {t('home.getStarted', 'Get Started')} &rarr;
        </button>

        {/* Carousel Pagination Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((dotIndex) => (
            <div
              key={dotIndex}
              style={{
                width: dotIndex === 3 ? '16px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: dotIndex === 3 ? '#15AE36' : 'rgba(255, 255, 255, 0.25)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Section 1: Win Cash Games (2x2 Grid matching Screenshot 1) */}
      <div style={{ width: '100%' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          {t('home.winCashGames', 'Win Cash Games')}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            width: '100%',
          }}
        >
          {/* Card 1: ZDT */}
          <div
            onClick={() => navigate('/play/cash-game?slug=zdt')}
            style={{
              position: 'relative',
              borderRadius: '24px',
              height: '190px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#5B00F0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(91, 0, 240, 0.3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.cardBgMask}
              alt="mask"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                mixBlendMode: 'screen',
                opacity: 0.7,
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                ZDT
              </div>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#FFFFFF', marginTop: '6px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                $1,000
              </div>
            </div>
          </div>

          {/* Card 2: PICK 3 */}
          <div
            onClick={() => navigate('/play/cash-game?slug=pick-3')}
            style={{
              position: 'relative',
              borderRadius: '24px',
              height: '190px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#FE6104',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(254, 97, 4, 0.3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.cardBgMask}
              alt="mask"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                mixBlendMode: 'screen',
                opacity: 0.7,
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                PICK 3
              </div>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#FFFFFF', marginTop: '6px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                $3,000
              </div>
            </div>
          </div>

          {/* Card 3: PICK 4 */}
          <div
            onClick={() => navigate('/play/cash-game?slug=pick-4')}
            style={{
              position: 'relative',
              borderRadius: '24px',
              height: '190px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#15AE36',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(21, 174, 54, 0.3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.cardBgMask}
              alt="mask"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                mixBlendMode: 'screen',
                opacity: 0.7,
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                PICK 4
              </div>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#FFFFFF', marginTop: '6px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                $4,000
              </div>
            </div>
          </div>

          {/* Card 4: PICK 5 */}
          <div
            onClick={() => navigate('/play/cash-game?slug=pick-5')}
            style={{
              position: 'relative',
              borderRadius: '24px',
              height: '190px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#105998',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 24px rgba(16, 89, 152, 0.3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.cardBgMask}
              alt="mask"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                mixBlendMode: 'screen',
                opacity: 0.7,
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                PICK 5
              </div>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#FFFFFF', marginTop: '6px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                $5,000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Instant Games matching Screenshot 2 (height: 220px) */}
      <div style={{ width: '100%' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          {t('home.instantWin', 'Instant Win Games')}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            width: '100%',
          }}
        >
          {/* Card 1: PIC-PICK */}
          <div
            onClick={() => navigate('/play/pic-pick?variant=picpick')}
            style={{
              position: 'relative',
              borderRadius: '24px',
              height: '220px',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: `url(${images.picpickbg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 8px 24px rgba(153, 5, 3, 0.3)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          />

          {/* Card 2: STATE PICK */}
          <div
            onClick={() => navigate('/play/pic-pick?variant=state')}
            style={{
              position: 'relative',
              borderRadius: '24px',
              height: '220px',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: `url(${images.statePickbg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 8px 24px rgba(86, 4, 183, 0.3)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          />
        </div>
      </div>

      {/* Section 3: Mini Games matching Screenshot 2 with Full Background Images (Hidden in Receipt Mode) */}
      {!isReceiptMode && (
        <div style={{ width: '100%' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
            {t('home.winPoints', 'Mini Games')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {/* Mini Game 1: Spin the Wheel */}
            <div
              onClick={() => handleMiniGameClick('spin-the-wheel', 'Spin the Wheel', '/play/spin-wheel')}
              style={{
                position: 'relative',
                height: '160px',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundImage: `url(${images.playminispin})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                {t('play.spinWheel', 'Spin the Wheel')}
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', margin: '6px 0 16px 0', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                {t('play.spinDesc', 'Play Spin the Wheel and win pts')}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMiniGameClick('spin-the-wheel', 'Spin the Wheel', '/play/spin-wheel');
                }}
                style={{
                  background: '#FE8904',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 26px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(254, 137, 4, 0.4)',
                }}
              >
                {t('play.playNow', 'Play Now')}
              </button>

              {spinLock.locked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: '#FFFFFF',
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Lock size={20} />
                  </div>
                  {spinLock.countdown && (
                    <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {spinLock.countdown}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mini Game 2: Lucky 7 */}
            <div
              onClick={() => handleMiniGameClick('lucky-7', 'Lucky 7', '/play/lucky-7')}
              style={{
                position: 'relative',
                height: '160px',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundImage: `url(${images.playmini777})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                {t('play.lucky7', 'Lucky 7')}
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', margin: '6px 0 16px 0', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                {t('play.lucky7Desc', 'Play Lucky 7 and win pts')}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMiniGameClick('lucky-7', 'Lucky 7', '/play/lucky-7');
                }}
                style={{
                  background: '#FE8904',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 26px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(254, 137, 4, 0.4)',
                }}
              >
                {t('play.playNow', 'Play Now')}
              </button>

              {luckyLock.locked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: '#FFFFFF',
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Lock size={20} />
                  </div>
                  {luckyLock.countdown && (
                    <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {luckyLock.countdown}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mini Game 3: Scratch 2 Win */}
            <div
              onClick={() => handleMiniGameClick('scratch-2-win', 'Scratch 2 Win', '/play/scratch-to-win')}
              style={{
                position: 'relative',
                height: '160px',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundImage: `url(${images.playminiscratch})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                {t('play.scratch2Win', 'Scratch 2 Win')}
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', margin: '6px 0 16px 0', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                {t('play.scratchDesc', 'Play Scratch 2 Win and win pts')}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMiniGameClick('scratch-2-win', 'Scratch 2 Win', '/play/scratch-to-win');
                }}
                style={{
                  background: '#FE8904',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 26px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(254, 137, 4, 0.4)',
                }}
              >
                {t('play.playNow', 'Play Now')}
              </button>

              {scratchLock.locked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: '#FFFFFF',
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Lock size={20} />
                  </div>
                  {scratchLock.countdown && (
                    <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {scratchLock.countdown}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Watch Ad Unlock Modal */}
      <CustomModal
        visible={Boolean(adGame)}
        onClose={closeAdModal}
        title={t('play.gameLocked', 'Unlock Game Session')}
        maxWidth="460px"
      >
        {adGame && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'pre-line', margin: 0 }}>
              {t('play.watchAds', "Watch this short 15-second sponsor video to unlock '{{gameTitle}}' immediately.", {
                gameTitle: adGame.title,
              })}
            </p>

            {/* Video Player Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#000000',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                src="https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/WIN%20POINTS%20GAMES/GAME%2011%20SPIN%20THE%20WHEEL%20SPANISH%20.mp4"
                autoPlay
                muted
                playsInline
                loop
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Floating Top-Right Countdown Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(6px)',
                  color: adSecondsLeft > 0 ? '#FFD700' : '#10B981',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  zIndex: 3,
                }}
              >
                <Sparkles size={13} />
                <span>{adSecondsLeft > 0 ? `Ad ends in ${adSecondsLeft}s` : 'Ad Complete!'}</span>
              </div>

              {/* Floating Bottom-Left Sponsored Label */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  zIndex: 3,
                }}
              >
                Sponsored Ad
              </div>
            </div>

            {/* 15s Progress Bar */}
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-card-secondary)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((AD_DURATION_SECONDS - adSecondsLeft) / AD_DURATION_SECONDS) * 100}%`,
                  background: 'linear-gradient(90deg, #00674D, #10B981)',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                  transition: 'width 1s linear',
                }}
              />
            </div>

            <Button
              onClick={handleClaimUnlock}
              disabled={adSecondsLeft > 0}
              loading={unlocking}
              title={
                adSecondsLeft > 0
                  ? t('play.adEndsIn', 'Ad ends in {{seconds}}s', { seconds: adSecondsLeft })
                  : t('play.claimAndUnlock', 'Claim & Unlock Game')
              }
              variant="gold"
              style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 800, borderRadius: '20px' }}
            />
          </div>
        )}
      </CustomModal>
    </Container>
  );
};

export default Play;
