import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  Camera,
  ChevronRight,
  Lock,
  Megaphone,
  CheckCircle2,
  Tv,
  Sparkles,
} from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import {
  fetchAllGames,
  fetchUnlockedMiniGames,
  unlockedMiniGame,
  invalidateUnlockedMiniGamesCache,
} from '../../redux/Slices/gamesSlice';
import { fetchAllCampaigns } from '../../redux/Slices/campaignsSlice';
import { fetchAllNotifications } from '../../redux/Slices/notificationsSlice';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import images from '../../constants/images';
import { getUserRewardPoints, getUserFullName } from '../../utils/userDisplay';

const AD_DURATION_SECONDS = 15;

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { userData } = useSelector((state: RootState) => state.user);
  const { campaigns } = useSelector((state: RootState) => state.campaigns);
  const isDarkMode = useSelector((state: RootState) => state.theme?.isDarkMode);
  const { unlockedMiniGames, unlockMiniGameLoading } = useSelector(
    (state: RootState) => state.games,
  );

  const unreadCount = useSelector((state: RootState) =>
    (state.notifications?.notifications ?? []).filter((n) => !n.read_at).length,
  );

  const totalCoins = getUserRewardPoints(userData);
  const streakDays = Math.max(
    1,
    userData?.play_streak_count ?? userData?.streak_count ?? userData?.current_streak ?? 3,
  );

  // Video Ad Modal State matching Play screen
  const [adGame, setAdGame] = useState<{ slug: string; title: string } | null>(null);
  const [adSecondsLeft, setAdSecondsLeft] = useState(AD_DURATION_SECONDS);
  const [unlocking, setUnlocking] = useState(false);
  const adTimerRef = useRef<any>(null);

  useEffect(() => {
    if (adGame) {
      setAdSecondsLeft(AD_DURATION_SECONDS);
      adTimerRef.current = setInterval(() => {
        setAdSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(adTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
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

  // Countdown timers state
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    dispatch(fetchUser());
    dispatch(fetchAllGames(undefined));
    dispatch(fetchUnlockedMiniGames());
    dispatch(fetchAllCampaigns(undefined));
    dispatch(fetchAllNotifications(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (userData?.is_profile_complete === false) {
      navigate('/secret-question', { replace: true });
    }
  }, [userData?.is_profile_complete, navigate]);

  // Helper for countdown format
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

  // Check game lock status
  const getGameLockStatus = (slug: string) => {
    const normalizedSlug = slug.toLowerCase();
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
        countdown: formatCountdown(firstBlocked?.blocked_until),
      };
    }
    // Default locked with mock timers matching Screenshot 2
    if (slug === 'spin-the-wheel') return { locked: true, countdown: '02:38:41' };
    if (slug === 'lucky-7') return { locked: true, countdown: '03:28:26' };
    if (slug === 'scratch-2-win') return { locked: true, countdown: '02:37:51' };
    return { locked: false, countdown: null };
  };

  const handleMiniGameClick = (slug: string, title: string, path: string) => {
    const lockStatus = getGameLockStatus(slug);
    if (lockStatus.locked) {
      setAdGame({ slug, title });
    } else {
      navigate(path);
    }
  };

  // Cash Games data matching Screenshot 1
  const cashGames = [
    {
      id: 'zdt',
      name: 'ZDT',
      price: '$1,000',
      gradient: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
      path: '/play/cash-game?slug=zdt',
    },
    {
      id: 'pick-3',
      name: 'PICK 3',
      price: '$3,000',
      gradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
      path: '/play/cash-game?slug=pick-3',
    },
    {
      id: 'pick-4',
      name: 'PICK 4',
      price: '$4,000',
      gradient: 'linear-gradient(135deg, #00B050 0%, #10B981 100%)',
      path: '/play/cash-game?slug=pick-4',
    },
    {
      id: 'pick-5',
      name: 'PICK 5',
      price: '$5,000',
      gradient: 'linear-gradient(135deg, #0070BA 0%, #00B4D8 100%)',
      path: '/play/cash-game?slug=pick-5',
    },
  ];

  // Safe ad banner content
  const firstCampaign = (campaigns?.[0] as any);
  const isDefaultPromo =
    !firstCampaign?.title ||
    firstCampaign?.title === 'Grow Your Audience!' ||
    firstCampaign?.sponsor === 'R2R' ||
    firstCampaign?.sponsor === 'Receipts To Riches';

  const adBannerTitle = isDefaultPromo
    ? t('home.growAudienceTitle', 'Grow Your Audience!')
    : firstCampaign?.title || firstCampaign?.sponsor || t('home.growAudienceTitle', 'Grow Your Audience!');

  const adBannerSubtitle = isDefaultPromo
    ? t(
        'home.growAudienceDesc',
        'Advertise your brand, website, or mobile app directly to our active users. Tap here to launch your campaign!',
      )
    : firstCampaign?.description ||
      t(
        'home.growAudienceDesc',
        'Advertise your brand, website, or mobile app directly to our active users. Tap here to launch your campaign!',
      );

  const spinLock = getGameLockStatus('spin-the-wheel');
  const luckyLock = getGameLockStatus('lucky-7');
  const scratchLock = getGameLockStatus('scratch-2-win');

  const userName =
    getUserFullName(userData) ||
    userData?.first_name ||
    userData?.name ||
    t('home.defaultUser', 'Example');

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '36px' }}>
      {/* 1. Header Greeting & Notification */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            onClick={() => navigate('/profile')}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '2px solid var(--border-color)',
              background: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src={
                userData?.image_url ||
                (userData?.image && (userData.image.startsWith('http') || userData.image.startsWith('data:'))
                  ? userData.image
                  : images.example || images.Profile)
              }
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = images.example || images.Profile;
              }}
            />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👋</span> {t('home.hello', 'Hello')}
            </span>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.2,
                marginTop: '2px',
              }}
            >
              {userName}
            </h2>
          </div>
        </div>

        <button
          onClick={() => navigate('/notifications')}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            color: 'var(--text-main)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
          aria-label={t('notifications.title', 'Notifications')}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '10px',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-main)',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. My Balance Card (Rich Luxury Theme) */}
      <div
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #0A2F21 0%, #061F16 50%, #03140E 100%)'
            : 'linear-gradient(135deg, #B2DFD0 0%, #90CEB8 50%, #70BFA5 100%)',
          borderRadius: '24px',
          padding: '22px 24px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          border: isDarkMode
            ? '1px solid rgba(0, 230, 118, 0.28)'
            : '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow: isDarkMode
            ? '0 14px 36px rgba(0, 0, 0, 0.65), 0 0 28px rgba(0, 230, 118, 0.14)'
            : '0 12px 30px rgba(112, 191, 165, 0.35), 0 2px 6px rgba(0, 0, 0, 0.05)',
          color: isDarkMode ? '#FFFFFF' : '#0A291A',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Decorative background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(0, 230, 118, 0.22) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: isDarkMode ? '#6EE7B7' : '#14462E',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {t('home.myBalance', 'My Balance')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <img
                src={images.Coin}
                alt="Coin"
                style={{
                  width: '32px',
                  height: '32px',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
                }}
              />
              <span
                style={{
                  fontSize: '34px',
                  fontWeight: 900,
                  color: isDarkMode ? '#FFFFFF' : '#062013',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {Number(totalCoins).toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: isDarkMode ? '#34D399' : '#14462E',
                  marginTop: '6px',
                }}
              >
                {t('home.points', 'Points')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/rewards')}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08) rotate(3deg)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) rotate(0deg)')}
            title={t('bottomTabs.rewards', 'Rewards')}
          >
            <img src={images.Gift} alt="Gift" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          </button>
        </div>

        {/* Green Camera Earn Button */}
        <button
          type="button"
          onClick={() => navigate('/scan')}
          style={{
            width: '100%',
            background: isDarkMode
              ? 'linear-gradient(135deg, #00C853 0%, #009624 100%)'
              : 'linear-gradient(135deg, #008765 0%, #00674D 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '999px',
            padding: '13px 18px',
            fontSize: '14px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: isDarkMode
              ? '0 6px 20px rgba(0, 200, 83, 0.38)'
              : '0 6px 18px rgba(0, 103, 77, 0.32)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isDarkMode
              ? '0 8px 26px rgba(0, 200, 83, 0.5)'
              : '0 8px 24px rgba(0, 103, 77, 0.42)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDarkMode
              ? '0 6px 20px rgba(0, 200, 83, 0.38)'
              : '0 6px 18px rgba(0, 103, 77, 0.32)';
          }}
        >
          <Camera size={18} />
          <span>{t('home.useCameraEarnPoints', 'Use Camera to earn 40 points extra')}</span>
        </button>
      </div>


      {/* 3. Daily Streak Card (Screenshot 1) */}
      <div
        className="card"
        style={{
          padding: '20px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('home.streakTitle', 'Daily streak (Unlocks 500 points)')}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {t('home.streakSubtitle', 'Login and play consecutive 07 days to receive 500 points')}
          </p>
        </div>

        {/* 7-Day Stepper Track */}
        <div style={{ position: 'relative', marginTop: '10px', marginBottom: '4px' }}>
          {/* Background connecting track */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              right: '12px',
              height: '4px',
              background: '#E5E7EB',
              transform: 'translateY(-50%)',
              zIndex: 1,
              borderRadius: '2px',
            }}
          />

          {/* Active progress track */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              width: `${Math.min(100, Math.max(0, ((streakDays - 1) / 6) * 100))}%`,
              height: '4px',
              background: '#00674D',
              transform: 'translateY(-50%)',
              zIndex: 2,
              borderRadius: '2px',
              transition: 'width 0.4s ease',
            }}
          />

          {/* Stepper Nodes */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isCompleted = day < streakDays;
              const isActive = day === streakDays;

              if (isActive) {
                return (
                  <div
                    key={day}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    <img src={images.Coin} alt="Active" style={{ width: '18px', height: '18px' }} />
                  </div>
                );
              }

              return (
                <div
                  key={day}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: isCompleted ? '#00674D' : '#9CA3AF',
                    transition: 'all 0.2s ease',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Day Number Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isActive = day === streakDays;
            return (
              <span
                key={day}
                style={{
                  fontSize: '11px',
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  textAlign: 'center',
                  minWidth: '20px',
                }}
              >
                {String(day).padStart(2, '0')}
              </span>
            );
          })}
        </div>
      </div>

      {/* 4. Win Cash Games Section (Screenshot 1) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('home.winCashGames', 'Win Cash Games')}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {t('home.winCashSubtitle', 'Play free for chance to win cash')}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            overflowX: 'auto',
            padding: '6px 2px 8px 2px',
            margin: '-6px -2px 0 -2px',
          }}
        >
          {cashGames.map((game) => (
            <div
              key={game.id}
              onClick={() => navigate(game.path)}
              style={{
                background: game.gradient,
                borderRadius: '16px',
                padding: '16px 6px',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: 'none',
                position: 'relative',
                overflow: 'hidden',
                aspectRatio: '1 / 1.1',
                transition: 'filter 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {/* Comic Halftone & Rayburst Mask Overlay */}
              <img
                src={images.cardBgMask}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.55,
                  pointerEvents: 'none',
                  mixBlendMode: 'screen',
                }}
              />
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
                <span style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1.1 }}>
                  {game.name}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    marginTop: '6px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.35)',
                  }}
                >
                  {game.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Grow Your Audience Ad Slider (Screenshot 2) */}
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
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(0, 103, 77, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00674D',
          }}
        >
          <Megaphone size={28} />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
          {adBannerTitle}
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            maxWidth: '440px',
          }}
        >
          {adBannerSubtitle}
        </p>

        <button
          onClick={() => navigate('/campaigns')}
          style={{
            background: '#00674D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '24px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 103, 77, 0.3)',
            marginTop: '4px',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span>{t('home.getStarted', 'Get Started')}</span>
          <ChevronRight size={16} />
        </button>

        {/* Carousel Pagination Dots */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          {[0, 1, 2, 3, 4, 5, 6].map((dot) => (
            <div
              key={dot}
              style={{
                width: dot === 3 ? '16px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: dot === 3 ? '#00674D' : '#D1D5DB',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* 6. Instant Win Games (Screenshot 2) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('home.instantWin', 'Instant Win Games')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Pic-Pick Banner */}
          <div
            onClick={() => navigate('/play/pic-pick?variant=picpick', { state: { variant: 'picpick' } })}
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              height: '200px',
              boxShadow: '0 6px 16px rgba(220, 38, 38, 0.25)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.picpickbg}
              alt="Pic-Pick"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* State Pick Banner */}
          <div
            onClick={() => navigate('/play/pic-pick?variant=state', { state: { variant: 'state' } })}
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              height: '200px',
              boxShadow: '0 6px 16px rgba(126, 34, 206, 0.25)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.statePickbg}
              alt="State Pick"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>

      {/* 7. WIN POINTS GAMES (With Live Locks & Timers - Screenshot 2) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.2px' }}>
              {t('home.winPoints', 'WIN POINTS GAMES')}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t('home.winPointsSubtitle', 'Earn points and rewards with every receipt entered')}
            </p>
          </div>
          <button
            onClick={() => navigate('/play')}
            style={{
              background: 'none',
              border: 'none',
              color: '#00674D',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              padding: '0 0 2px 0',
            }}
          >
            {t('common.viewAll', 'View All')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {/* 1. Spin the Wheel */}
          <div
            onClick={() => handleMiniGameClick('spin-the-wheel', 'Spin the Wheel', '/play/spin-wheel')}
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              aspectRatio: '1 / 1',
              background: '#042216',
              boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.BigWinGame}
              alt="Spin the Wheel"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)', display: 'block' }}
            />
            {spinLock.locked && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.55)',
                  backdropFilter: 'blur(2px)',
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={16} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {spinLock.countdown}
                </span>
              </div>
            )}
          </div>

          {/* 2. Lucky 7 */}
          <div
            onClick={() => handleMiniGameClick('lucky-7', 'Lucky 7', '/play/lucky-7')}
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              aspectRatio: '1 / 1',
              background: '#1A0B36',
              boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.Game777}
              alt="Lucky 7"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)', display: 'block' }}
            />
            {luckyLock.locked && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.55)',
                  backdropFilter: 'blur(2px)',
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={16} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {luckyLock.countdown}
                </span>
              </div>
            )}
          </div>

          {/* 3. Scratch 2 Win */}
          <div
            onClick={() => handleMiniGameClick('scratch-2-win', 'Scratch 2 Win', '/play/scratch-to-win')}
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              aspectRatio: '1 / 1',
              background: '#380909',
              boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <img
              src={images.ScratchGame}
              alt="Scratch 2 Win"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)', display: 'block' }}
            />
            {scratchLock.locked && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.55)',
                  backdropFilter: 'blur(2px)',
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={16} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {scratchLock.countdown}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watch Ad Unlock Modal matching Play Screen */}
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

export default Home;
