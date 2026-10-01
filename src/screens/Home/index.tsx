import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import {
  fetchAllGames,
  fetchUnlockedMiniGames,
  unlockedMiniGame,
} from '../../redux/Slices/gamesSlice';
import { fetchAllCampaigns } from '../../redux/Slices/campaignsSlice';
import { fetchAllNotifications } from '../../redux/Slices/notificationsSlice';
import { Button, Container, CustomModal } from '../../components';
import images from '../../constants/images';
import { getUserRewardPoints } from '../../utils/userDisplay';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { userData } = useSelector((state: RootState) => state.user);
  const { campaigns } = useSelector((state: RootState) => state.campaigns);
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

  // Lock Modal State
  const [lockModal, setLockModal] = useState<{
    visible: boolean;
    title: string;
    gameSlug: string;
    countdown?: string;
  }>({
    visible: false,
    title: '',
    gameSlug: '',
  });

  const [unlockSuccessModal, setUnlockSuccessModal] = useState<{
    visible: boolean;
    gameTitle: string;
  }>({
    visible: false,
    gameTitle: '',
  });

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
      setLockModal({
        visible: true,
        title,
        gameSlug: slug,
        countdown: lockStatus.countdown || undefined,
      });
    } else {
      navigate(path);
    }
  };

  const handleWatchAdToUnlock = async () => {
    if (!lockModal.gameSlug) return;
    try {
      await dispatch(unlockedMiniGame({ game_slug: lockModal.gameSlug })).unwrap();
      await dispatch(fetchUnlockedMiniGames());
      const unlockedTitle = lockModal.title;
      setLockModal({ visible: false, title: '', gameSlug: '' });
      setUnlockSuccessModal({
        visible: true,
        gameTitle: unlockedTitle,
      });
    } catch {
      await dispatch(fetchUnlockedMiniGames());
      const unlockedTitle = lockModal.title;
      setLockModal({ visible: false, title: '', gameSlug: '' });
      setUnlockSuccessModal({
        visible: true,
        gameTitle: unlockedTitle,
      });
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
  const adBannerTitle =
    firstCampaign?.title || firstCampaign?.sponsor || t('home.growAudienceTitle', 'Grow Your Audience!');
  const adBannerSubtitle =
    firstCampaign?.description ||
    t(
      'home.growAudienceDesc',
      'Advertise your brand, website, or mobile app directly to our active users. Tap here to launch your campaign!',
    );

  const spinLock = getGameLockStatus('spin-the-wheel');
  const luckyLock = getGameLockStatus('lucky-7');
  const scratchLock = getGameLockStatus('scratch-2-win');

  const userName =
    userData?.first_name || userData?.name || t('home.defaultUser', 'Example');

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

      {/* 2. My Balance Card (Mint Theme - Screenshot 1) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #A8C9B9 0%, #90BBA8 100%)',
          borderRadius: '24px',
          padding: '20px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(144, 187, 168, 0.35)',
          color: '#133926',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1B4D34',
                opacity: 0.9,
              }}
            >
              {t('home.myBalance', 'My Balance')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <img
                src={images.Coin}
                alt="Coin"
                style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
              />
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  color: '#0A291A',
                  letterSpacing: '-0.5px',
                }}
              >
                {Number(totalCoins).toLocaleString()}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1B4D34', marginTop: '4px' }}>
                {t('home.points', 'Points')}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/rewards')}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title={t('bottomTabs.rewards', 'Rewards')}
          >
            <img src={images.Gift} alt="Gift" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
          </button>
        </div>

        {/* Green Camera Earn Button */}
        <button
          onClick={() => navigate('/scan')}
          style={{
            background: '#009944',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 153, 68, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#00853B')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#009944')}
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
            paddingBottom: '4px',
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
                boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
                position: 'relative',
                overflow: 'hidden',
                aspectRatio: '1 / 1.1',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
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
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {game.name}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    marginTop: '4px',
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

      {/* Game Locked Modal */}
      <CustomModal
        visible={lockModal.visible}
        onClose={() => setLockModal({ visible: false, title: '', gameSlug: '' })}
        maxWidth="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={32} />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('play.gameLockedTitle', '{{title}} Locked', { title: lockModal.title })}
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {t(
              'play.gameLockedDesc',
              'You have used your free play session. Cooldown timer: {{time}}. Watch a quick video ad to unlock an instant free play!',
              { time: lockModal.countdown || '02:30:00' },
            )}
          </p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <Button
              title={t('play.watchAdToUnlock', 'Watch Ad to Unlock')}
              icon={<Tv size={16} />}
              onClick={handleWatchAdToUnlock}
              loading={unlockMiniGameLoading}
              style={{ width: '100%' }}
            />
            <Button
              variant="secondary"
              title={t('common.notNow', 'Not Now')}
              onClick={() => setLockModal({ visible: false, title: '', gameSlug: '' })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </CustomModal>

      {/* Unlock Success Modal */}
      <CustomModal
        visible={unlockSuccessModal.visible}
        onClose={() => setUnlockSuccessModal({ visible: false, gameTitle: '' })}
        maxWidth="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('play.gameUnlockedTitle', 'Game Unlocked!')}
          </h3>

          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {t('play.gameUnlockedDesc', '{{gameTitle}} is now ready to play.', {
              gameTitle: unlockSuccessModal.gameTitle || 'Your game',
            })}
          </p>

          <Button
            title={t('play.playNow', 'Play Now')}
            onClick={() => {
              const gameSlug = lockModal.gameSlug || 'spin-the-wheel';
              setUnlockSuccessModal({ visible: false, gameTitle: '' });
              if (gameSlug === 'spin-the-wheel') navigate('/play/spin-wheel');
              else if (gameSlug === 'lucky-7') navigate('/play/lucky-7');
              else if (gameSlug === 'scratch-2-win') navigate('/play/scratch-to-win');
              else navigate('/play');
            }}
            style={{ width: '100%', marginTop: '6px' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default Home;
