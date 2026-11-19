import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CoinsLayer } from './CoinsLayer';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronDown,
  Bell,
  Camera,
  ScanLine,
  ChevronRight,
  Lock,
  Megaphone,
  CheckCircle2,
  Tv,
  Sparkles,
  Crown,
  Volume2,
  VolumeX,
  Gamepad2,
  Gift,
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
import { CashGameIcon } from '../../components/CashGameIcon';
import { getUserRewardPoints, getUserFullName } from '../../utils/userDisplay';
import { getGameGuideVideoUrl } from '../../utils/gameVideoUtil';

const AD_DURATION_SECONDS = 15;

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const [celebrationBanner, setCelebrationBanner] = useState<{
    title: string;
    subtitle?: string;
  } | null>(null);

  const { userData } = useSelector((state: RootState) => state.user);
  const isRegister = useSelector((state: RootState) => state.auth.isRegister);
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
    Math.min(
      7,
      Number(
        userData?.streak_count ??
        userData?.play_streak_count ??
        userData?.current_streak ??
        1
      ) || 1
    )
  );

  // Video Ad Modal State matching Play screen
  const [adGame, setAdGame] = useState<{ slug: string; title: string } | null>(null);
  const [adSecondsLeft, setAdSecondsLeft] = useState(AD_DURATION_SECONDS);
  const [unlocking, setUnlocking] = useState(false);
  const [adMuted, setAdMuted] = useState(false);
  const [adVideoReady, setAdVideoReady] = useState(false);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const adTimerRef = useRef<any>(null);

  // Preload ad video in background for instant playback
  useEffect(() => {
    const preloader = document.createElement('video');
    preloader.src = 'https://api.receiptstoriches.net/images/game-guide/video-folder/IMG_6536.mp4';
    preloader.preload = 'auto';
    preloader.load();
  }, []);

  useEffect(() => {
    if (adGame) {
      setAdSecondsLeft(AD_DURATION_SECONDS);
      setAdVideoReady(false);
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
    if (typeof window !== 'undefined' && sessionStorage.getItem('profile_completed_just_now') === 'true') {
      return;
    }
    const isComplete = userData?.is_profile_complete;
    if (isRegister && userData && isComplete !== true && isComplete !== 1 && isComplete !== '1') {
      navigate('/secret-question', { replace: true });
    }
  }, [isRegister, userData?.is_profile_complete, navigate]);

  useEffect(() => {
    const stateCelebration = (location.state as any)?.rewardCelebration;
    let pendingReward = stateCelebration;
    if (!pendingReward) {
      try {
        const stored = sessionStorage.getItem('pending_home_reward');
        if (stored) {
          pendingReward = JSON.parse(stored);
        }
      } catch {}
    }

    if (pendingReward) {
      sessionStorage.removeItem('pending_home_reward');
      window.history.replaceState({}, document.title);

      const pointsWon = Number(pendingReward.points) || 0;

      // Show points won (+XX Points Won!), NOT the game name
      const title = pointsWon > 0
        ? `+${pointsWon} Points Won!`
        : (pendingReward.title || 'Receipt Entered Successfully');
      const subtitle = pendingReward.subtitle || (pointsWon > 0 ? 'Added to your wallet' : undefined);

      // 1. First: trigger coins falling from top to bottom with audio!
      triggerCoinCelebration();
      dispatch(fetchUser());

      // 2. Second: after coins start raining, slide down receipt success banner
      const bannerTimer = setTimeout(() => {
        setCelebrationBanner({
          title,
          subtitle,
        });
      }, 750);

      const dismissTimer = setTimeout(() => {
        setCelebrationBanner(null);
      }, 5500);

      return () => {
        clearTimeout(bannerTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [location.state, dispatch]);

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
      badgeColor: '#A855F7',
      path: '/play/cash-game?slug=zdt',
    },
    {
      id: 'pick-3',
      name: 'PICK 3',
      price: '$3,000',
      gradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
      badgeColor: '#EF4444',
      path: '/play/cash-game?slug=pick-3',
    },
    {
      id: 'pick-4',
      name: 'PICK 4',
      price: '$4,000',
      gradient: 'linear-gradient(135deg, #00B050 0%, #10B981 100%)',
      badgeColor: '#10B981',
      path: '/play/cash-game?slug=pick-4',
    },
    {
      id: 'pick-5',
      name: 'PICK 5',
      price: '$5,000',
      gradient: 'linear-gradient(135deg, #0070BA 0%, #00B4D8 100%)',
      badgeColor: '#38BDF8',
      path: '/play/cash-game?slug=pick-5',
    },
  ] as const;

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
    <div className="home-gaming-canvas">
      <div className="home-stage-container">
        <CoinsLayer />
        <Container className="home-dashboard-content" maxWidth="1200px" isPadding={false} style={{ gap: '24px', position: 'relative', zIndex: 10, width: '100%', margin: '0 auto' }}>
      <style>{`
        @keyframes slideDownToast {
          0% { transform: translate(-50%, -100px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      {/* Top Slide-Down Celebration Banner (Receipt Entered Successfully / Game Won) */}
      {celebrationBanner && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            width: 'calc(100% - 32px)',
            maxWidth: '460px',
            background: 'linear-gradient(135deg, #00B050 0%, #00873D 100%)',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '18px',
            boxShadow: '0 12px 32px rgba(0, 176, 80, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideDownToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={22} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.2px' }}>
              {celebrationBanner.title}
            </h4>
            {celebrationBanner.subtitle && (
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.92)', fontWeight: 600 }}>
                {celebrationBanner.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCelebrationBanner(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '20px',
              lineHeight: 1,
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* 1. Header Greeting */}
      <div
        className="home-greeting-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '4px',
          minHeight: '46px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
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
                  : 'https://randomuser.me/api/portraits/men/32.jpg')
              }
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = images.example || images.Profile;
              }}
            />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
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
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {userName}
            </h2>
          </div>
        </div>
      </div>

      {/* 2. Hero "My Balance" Card (Centerpiece) */}
      <section
        className="balance-banner relative overflow-hidden home-balance-banner-card"
        data-purpose="balance-banner"
      >
        {/* Luxury curved background highlights & radial mesh */}
        <div className="home-balance-glow-orb-1" />
        <div className="home-balance-glow-orb-2" />
        <div className="home-balance-glow-orb-3" />

        {/* Sparkling particles */}
        <div className="home-balance-sparkle-1">✦</div>
        <div className="home-balance-sparkle-2">✦</div>
        <div className="home-balance-sparkle-3">✦</div>

        <div className="home-balance-top-row">
          <div className="home-balance-header-col">
            <div className="home-balance-badge-row">
              <span
                className="home-balance-title-pill"
              >
                TOTAL REWARDS BALANCE
              </span>
            </div>

            {/* Points and 3D Gold Coin */}
            <div className="home-balance-points-row">
              <div
                className="home-balance-coin-icon-wrap"
              >
                <img
                  alt="Gold Star Coin"
                  src={images.goldCoin05}
                  className="home-balance-coin-img"
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(15deg) scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(0deg) scale(1)')}
                />
              </div>
              <div>
                <div className="home-balance-value-row">
                  <span
                    className="home-balance-points-val"
                  >
                    {Number(totalCoins).toLocaleString()}
                  </span>
                  <span className="home-balance-points-unit">
                    Points
                  </span>
                </div>
                <p className="home-balance-payout-text">
                  <span className="home-balance-payout-label">Instant Payout Available</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: 3D Glossy Gift Box suspended on golden pedestal aura */}
          <div
            onClick={() => navigate('/rewards')}
            className="home-balance-gift-trigger"
            title={t('bottomTabs.rewards', 'Rewards')}
          >
            <div className="aura-rings home-balance-gift-aura-outer" />
            <div className="animate-pulse-glow home-balance-gift-aura-inner" />
            <div
              className="home-balance-gift-wrapper"
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img
                alt="Glossy Gift Box"
                src={images.giftWithGoldGlow06}
                className="home-balance-gift-img"
              />
            </div>
          </div>
        </div>

        {/* Bottom Action Bar: Standout High-Tech "Scan Receipt to earn 40 points extra" CTA */}
        <div className="home-scan-cta-wrapper">
          <div
            onClick={() => navigate('/scan')}
            className="scan-receipt-cta group home-scan-cta-bar"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.012)';
              e.currentTarget.style.borderColor = '#6ee7b7';
              e.currentTarget.style.background = 'linear-gradient(90deg, #011b15 0%, #041a12 50%, #011b15 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.45)';
              e.currentTarget.style.background = 'linear-gradient(90deg, #022c22 0%, #072418 50%, #022c22 100%)';
            }}
          >
            <div className="home-scan-cta-left">
              <div
                className="scan-cta-icon group-hover:rotate-6 transition-transform duration-300 home-scan-icon-box"
              >
                <ScanLine size={24} color="#022c22" strokeWidth={2.5} />
              </div>
              <div>
                <span className="home-scan-cta-title">
                  {t('home.useCameraEarnPoints', 'Scan Receipt to earn 40 points extra')}
                </span>
                <span className="home-scan-cta-subtitle">
                  Instant verification • Unlimited daily scans
                </span>
              </div>
            </div>
            <div className="home-scan-cta-right">
              <span
                className="home-scan-bonus-badge"
              >
                +40 PTS
              </span>
              <div
                className="scan-cta-chevron transition-colors duration-200 home-scan-chevron-box"
              >
                <ChevronRight size={18} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Daily Streak Card (Ultra Glass with Prestigious 3D Golden Trophy) */}
      <section
        className="ultra-glass home-streak-section"
        data-purpose="daily-streak"
      >
        {/* Pedestal spotlight glow behind Trophy */}
        <div className="home-streak-glow-spotlight" />

        <div className="home-streak-content-col">
          <div className="home-streak-header-block">
            <div className="home-streak-title-row">
              <span className="home-streak-fire-badge">
                🔥
              </span>
              <span className="home-streak-title-text">
                {t('home.streakTitle', 'Daily Streak (Unlocks 500 points)')}
              </span>
              <span className="home-streak-day-badge">
                Day {streakDays} of 7
              </span>
            </div>
            <p className="home-streak-subtitle-text">
              Login &amp; play consecutive <strong className="home-streak-bold-days">07 days</strong> to receive a grand bonus of <strong className="home-streak-bold-points">500 points</strong>
            </p>
          </div>

          {/* 7-Day Milestone Interactive Progress Stepper */}
          <div className="home-streak-stepper-wrap">
            <div className="home-streak-track-bg" />
            <div
              className="home-streak-track-fill"
              style={{
                width: `${Math.min(100, Math.max(16, ((streakDays - 1) / 6) * 100))}%`,
              }}
            />

            <div className="home-streak-milestones-row">
              {Array.from({ length: 7 }, (_, index) => {
                const dayNumber = index + 1;
                const isGrand = dayNumber === 7;
                const isDone = dayNumber < streakDays;
                const isToday = dayNumber === streakDays;
                const isLocked = dayNumber > streakDays;
                const paddedDay = String(dayNumber).padStart(2, '0');

                return (
                  <div key={dayNumber} className="home-streak-milestone-item">
                    {isGrand ? (
                      <div
                        className={`home-streak-milestone-circle ${
                          isDone
                            ? 'home-streak-circle-done'
                            : isToday
                            ? 'home-streak-circle-today'
                            : 'home-streak-circle-grand-bonus'
                        }`}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        {isDone ? (
                          <CheckCircle2 size={15} strokeWidth={3} />
                        ) : isToday ? (
                          <span className="home-streak-today-inner-dot" />
                        ) : (
                          <span className="home-streak-grand-gift-icon">🎁</span>
                        )}
                      </div>
                    ) : isDone ? (
                      <div className="home-streak-milestone-circle home-streak-circle-done">
                        <CheckCircle2 size={15} strokeWidth={3} />
                      </div>
                    ) : isToday ? (
                      <div className="home-streak-milestone-circle home-streak-circle-today">
                        <span className="home-streak-today-inner-dot" />
                      </div>
                    ) : (
                      <div className="home-streak-milestone-circle home-streak-circle-locked">
                        <Lock size={13} strokeWidth={2.4} />
                      </div>
                    )}

                    <div className="home-streak-milestone-label-col">
                      <span
                        className={`home-streak-day-num ${
                          isGrand
                            ? 'home-streak-day-num--grand'
                            : isDone
                            ? 'home-streak-day-num--done'
                            : isToday
                            ? 'home-streak-day-num--today'
                            : 'home-streak-day-num--locked'
                        }`}
                      >
                        {paddedDay}
                      </span>
                      {isDone && (
                        <span className="home-streak-day-subtext home-streak-day-subtext--done">DONE</span>
                      )}
                      {isToday && (
                        <span className="home-streak-day-subtext home-streak-day-subtext--today">TODAY</span>
                      )}
                      {isGrand && !isDone && !isToday && (
                        <span className="home-streak-day-subtext home-streak-bonus-tag">+500</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Large Prestigious 3D Golden Trophy */}
        <div
          className="home-streak-trophy-wrapper"
        >
          <img
            alt="Gold Trophy"
            src={images.goldTrophy07}
            className="home-streak-trophy-img"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      </section>

      {/* 4. Win Cash Games Section */}
      <section className="home-cash-games-section" data-purpose="cash-games">
        <div className="home-cash-games-header">
          <div className="home-cash-games-title-group">
            <div className="home-cash-games-icon-wrap">
              <Gamepad2 size={20} color="#FFFFFF" />
            </div>
            <div>
              <div className="home-cash-games-title-row">
                <h2 className="home-cash-games-heading">
                  Win Cash Games
                </h2>
                <span className="home-cash-games-nobuyin-badge">
                  NO BUY-IN
                </span>
              </div>
              <p className="home-cash-games-subtitle">
                Play 100% free daily for your chance to win instant cash
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/play')}
            className="home-cash-games-view-all-btn"
          >
            <span>View All Games</span>
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* 4 High-Octane Vibrant Jackpot Game Cards Grid */}
        <div className="home-games-grid">
          {/* Card 1: Purple Velvet ($1,000) with 3D Crown */}
          <div
            onClick={() => navigate('/play/cash-game?slug=zdt')}
            className="game-card shadow-glow-purple group home-cash-game-card home-cash-game-card--zdt"
          >
            <div className="home-cash-card-header">
              <span className="home-cash-card-badge">
                ✦ JACKPOT
              </span>
              <span className="home-cash-card-tag">DAILY</span>
            </div>

            <div className="home-cash-card-watermark-wrap">
              <img
                alt="Gold Crown"
                src={images.crown01}
                className="card-watermark group-hover:rotate-6 transition-transform duration-500 home-cash-card-watermark-img"
              />
            </div>

            <div className="home-cash-card-body">
              <div className="home-cash-card-title">
                ZDT
              </div>
              <div className="home-cash-card-amount">
                $1,000
              </div>
              <span className="home-cash-card-label">
                CASH PRIZE
              </span>
            </div>
          </div>

          {/* Card 2: Crimson Ruby ($3,000) with 3D Target */}
          <div
            onClick={() => navigate('/play/cash-game?slug=pick-3')}
            className="game-card shadow-glow-red group home-cash-game-card home-cash-game-card--pick3"
          >
            <div className="home-cash-card-header">
              <span className="home-cash-card-badge">
                ✦ JACKPOT
              </span>
              <span className="home-cash-card-tag">POPULAR</span>
            </div>

            <div className="home-cash-card-watermark-wrap">
              <img
                alt="Red Target"
                src={images.target02}
                className="card-watermark group-hover:rotate-6 transition-transform duration-500 home-cash-card-watermark-img"
              />
            </div>

            <div className="home-cash-card-body">
              <div className="home-cash-card-title">
                PICK 3
              </div>
              <div className="home-cash-card-amount">
                $3,000
              </div>
              <span className="home-cash-card-label">
                CASH PRIZE
              </span>
            </div>
          </div>

          {/* Card 3: Emerald Jade ($4,000) with 3D Four-Leaf Clover */}
          <div
            onClick={() => navigate('/play/cash-game?slug=pick-4')}
            className="game-card shadow-glow-emerald group home-cash-game-card home-cash-game-card--pick4"
          >
            <div className="home-cash-card-header">
              <span className="home-cash-card-badge">
                ✦ JACKPOT
              </span>
              <span className="home-cash-card-tag">LUCKY</span>
            </div>

            <div className="home-cash-card-watermark-wrap">
              <img
                alt="Four Leaf Clover"
                src={images.clover03}
                className="card-watermark group-hover:rotate-6 transition-transform duration-500 home-cash-card-watermark-img"
              />
            </div>

            <div className="home-cash-card-body">
              <div className="home-cash-card-title">
                PICK 4
              </div>
              <div className="home-cash-card-amount">
                $4,000
              </div>
              <span className="home-cash-card-label">
                CASH PRIZE
              </span>
            </div>
          </div>

          {/* Card 4: Sapphire Blue ($5,000) with 3D Star */}
          <div
            onClick={() => navigate('/play/cash-game?slug=pick-5')}
            className="game-card shadow-glow-blue group home-cash-game-card home-cash-game-card--pick5"
          >
            <div className="home-cash-card-header">
              <span className="home-cash-card-badge">
                ✦ MEGA JACKPOT
              </span>
              <span className="home-cash-card-tag">TOP</span>
            </div>

            <div className="home-cash-card-watermark-wrap">
              <img
                alt="Blue Star"
                src={images.blueStar04}
                className="card-watermark group-hover:rotate-6 transition-transform duration-500 home-cash-card-watermark-img"
              />
            </div>

            <div className="home-cash-card-body">
              <div className="home-cash-card-title">
                PICK 5
              </div>
              <div className="home-cash-card-amount">
                $5,000
              </div>
              <span className="home-cash-card-label">
                CASH PRIZE
              </span>
            </div>
          </div>
        </div>
      </section>

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

      {/* 6. Instant Win Games */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="home-section-title" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {t('home.instantWin', 'Instant Win Games')}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/play')}
            className="home-view-all-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#00D066',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '0',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            {t('common.viewAll', 'View All')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Pic-Pick Banner */}
          <div
            onClick={() => navigate('/play/pic-pick?variant=picpick', { state: { variant: 'picpick' } })}
            className="boxes-card"
            style={{
              boxShadow: '0 6px 16px rgba(220, 38, 38, 0.25)',
            }}
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
            className="boxes-card"
            style={{
              boxShadow: '0 6px 16px rgba(126, 34, 206, 0.25)',
            }}
          >
            <img
              src={images.statePickbg}
              alt="State Pick"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>

      {/* 7. WIN POINTS GAMES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="home-section-title" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.2px', margin: 0 }}>
              {t('home.winPoints', 'WIN POINTS GAMES')}
            </h3>
            <p className="home-section-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
              {t('home.winPointsSubtitle', 'Earn points and rewards with every receipt entered')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/play')}
            className="home-view-all-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#00D066',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '0',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            {t('common.viewAll', 'View All')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* 1. Spin the Wheel - Rotating Wheel Cover Animation */}
          <div
            onClick={() => handleMiniGameClick('spin-the-wheel', 'Spin the Wheel', '/play/spin-wheel')}
            className="win-point-game-card win-point-game-card--wheel"
            style={{
              background: '#042216',
            }}
          >
            <img
              src={images.BigWinGame}
              alt="Spin the Wheel"
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

          {/* 2. Lucky 7 - Jackpot Reel Rolling Cover Animation */}
          <div
            onClick={() => handleMiniGameClick('lucky-7', 'Lucky 7', '/play/lucky-7')}
            className="win-point-game-card win-point-game-card--lucky"
            style={{
              background: '#1A0B36',
            }}
          >
            <img
              src={images.Game777}
              alt="Lucky 7"
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

          {/* 3. Scratch 2 Win - Scratching & Shimmer Reveal Cover Animation */}
          <div
            onClick={() => handleMiniGameClick('scratch-2-win', 'Scratch 2 Win', '/play/scratch-to-win')}
            className="win-point-game-card win-point-game-card--scratch"
            style={{
              background: '#380909',
            }}
          >
            <img
              src={images.ScratchGame}
              alt="Scratch 2 Win"
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
        maxWidth="620px"
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
                background: '#0B0F17',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={adVideoRef}
                key={adGame?.slug || 'ad-video'}
                src={getGameGuideVideoUrl(adGame?.slug || adGame?.title, (t('language', 'en') || '').startsWith('es'))}
                autoPlay
                muted={adMuted}
                playsInline
                preload="auto"
                loop
                onCanPlay={() => setAdVideoReady(true)}
                onPlaying={() => setAdVideoReady(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Video Loading Spinner Overlay */}
              {!adVideoReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: '#0B0F17',
                    color: '#94A3B8',
                    zIndex: 2,
                  }}
                >
                  <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Loading video ad...</span>
                </div>
              )}

              {/* Sound / Unmute Audio Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setAdMuted(prev => !prev);
                  if (adVideoRef.current) {
                    adVideoRef.current.muted = !adVideoRef.current.muted;
                    if (!adVideoRef.current.muted) {
                      adVideoRef.current.play().catch(() => {});
                    }
                  }
                }}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(6px)',
                  color: '#FFFFFF',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  zIndex: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
                aria-label={adMuted ? 'Unmute video audio' : 'Mute video audio'}
              >
                {adMuted ? <VolumeX size={15} color="#EF4444" /> : <Volume2 size={15} color="#10B981" />}
                <span>{adMuted ? 'Unmute' : 'Sound On'}</span>
              </button>

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
    </div>
  </div>
  );
};

export default Home;
