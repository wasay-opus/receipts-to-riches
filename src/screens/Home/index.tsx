import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  ScanLine,
  Gift,
  Flame,
  Gamepad2,
  ChevronRight,
  Sparkles,
  Trophy,
  CheckCircle2,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { fetchUser } from '../../redux/Slices/userSlice';
import { fetchAllGames } from '../../redux/Slices/gamesSlice';
import { fetchAllCampaigns } from '../../redux/Slices/campaignsSlice';
import { Button, Container } from '../../components';
import images from '../../constants/images';
import { getUserRewardPoints } from '../../utils/userDisplay';

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { userData } = useSelector((state: RootState) => state.user);
  const { campaigns, loading: campaignsLoading } = useSelector((state: RootState) => state.campaigns);
  const { allGames, loading: gamesLoading } = useSelector((state: RootState) => state.games);
  const totalCoins = getUserRewardPoints(userData);
  const streakDays =
    userData?.play_streak_count ?? userData?.streak_count ?? userData?.current_streak ?? 0;

  useEffect(() => {
    dispatch(fetchUser());
    dispatch(fetchAllGames(undefined));
    dispatch(fetchAllCampaigns(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (userData?.is_profile_complete === false) {
      navigate('/secret-question', { replace: true });
    }
  }, [userData?.is_profile_complete, navigate]);

  const games = useMemo(() => {
    const flatGames = allGames
      ? Array.isArray(allGames)
        ? allGames
        : Object.values(allGames).flatMap((value) => (Array.isArray(value) ? value : []))
      : [];

    const metaBySlug: Record<string, any> = {
      'spin-the-wheel': {
        desc: t('home.gameDescSpinWheel', 'Live spin game from API'),
        image: images.playminispin,
        path: '/play/spin-wheel',
        badge: t('home.badgePopular', 'Popular'),
      },
      'scratch-2-win': {
        desc: t('home.gameDescScratch', 'Live scratch game from API'),
        image: images.playminiscratch,
        path: '/play/scratch-to-win',
        badge: t('home.badgeHot', 'Hot'),
      },
      'lucky-7': {
        desc: t('home.gameDescLucky7', 'Live slot game from API'),
        image: images.playmini777,
        path: '/play/lucky-7',
        badge: t('home.badgeJackpot', 'Jackpot'),
      },
      'pic-pick': {
        desc: t('home.gameDescPicPick', 'Live receipt challenge from API'),
        image: images.picpickbg,
        path: '/play/pic-pick',
        badge: t('home.badgeNew', 'New'),
      },
    };

    return flatGames
      .map((game: any) => {
        const slug = String(game?.slug ?? game?.game_slug ?? '').toLowerCase();
        const typeSlug = String(game?.game_type?.slug ?? '').toLowerCase();
        const meta = metaBySlug[slug] ?? (typeSlug === 'pic-pick' || typeSlug === 'state' ? metaBySlug['pic-pick'] : null);
        if (!meta) return null;
        return {
          id: game?.id ?? slug,
          title: game?.name ?? t('home.defaultGameName', 'Game'),
          desc: game?.price
            ? t('home.entryCost', 'Entry cost: {{price}} points', { price: game.price })
            : meta.desc,
          image: meta.image,
          path: meta.path,
          badge: meta.badge,
        };
      })
      .filter(Boolean)
      .slice(0, 4);
  }, [allGames, t]);

  const featuredCampaigns = (campaigns ?? []).slice(0, 3);
  const getCampaignTitle = (campaign: any) =>
    campaign?.title ?? campaign?.sponsor ?? campaign?.name ?? t('home.defaultCampaignName', 'Campaign');
  const getCampaignDescription = (campaign: any) =>
    campaign?.brand ?? campaign?.description ?? campaign?.sponsor ?? '';
  const getCampaignPoints = (campaign: any) => {
    const value = campaign?.points ?? campaign?.bonus_points ?? campaign?.reward_points;
    return Number.isFinite(Number(value))
      ? `${Number(value).toLocaleString()} ${t('home.pts', 'PTS')}`
      : '';
  };

  return (
    <Container maxWidth="720px" style={{ gap: '24px', paddingBottom: '32px' }}>
      {/* 1. Hero Balance & Action Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 135, 101, 0.9) 0%, rgba(0, 77, 57, 0.95) 100%)',
          color: '#FFFFFF',
          padding: '24px',
          borderRadius: '24px',
          boxShadow:
            '0 24px 48px rgba(0, 0, 0, 0.35), 0 8px 20px rgba(0, 103, 77, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Glass sheen highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0) 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(255,215,0,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: 600 }}>
              {t('home.totalBalance', 'Total Reward Points')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <img src={images.Coin} alt={t('home.coinAlt', 'Coin')} style={{ width: '32px', height: '32px' }} />
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#FFD700', letterSpacing: '-0.5px' }}>
                {Number(totalCoins).toLocaleString()}
              </h1>
              <span style={{ fontSize: '16px', opacity: 0.9, fontWeight: 600 }}>{t('home.pts', 'PTS')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/rewards')}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Gift size={14} />
            <span>{t('home.redeem', 'Redeem')}</span>
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/scan')}
            style={{
              background: '#FFFFFF',
              color: '#00674D',
              border: 'none',
              borderRadius: '16px',
              padding: '14px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <ScanLine size={20} />
            <span>{t('home.scanReceipt', 'Scan Receipt')}</span>
          </button>

          <button
            onClick={() => navigate('/play')}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D5AD60 100%)',
              color: '#050816',
              border: 'none',
              borderRadius: '16px',
              padding: '14px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(213, 173, 96, 0.3)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Gamepad2 size={20} />
            <span>{t('home.playGames', 'Play Games')}</span>
          </button>
        </div>
      </div>

      {/* 2. Daily Streak Card */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={20} color="#F59E0B" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
              {t('home.dailyStreak', 'Daily Check-in Streak')}
            </h3>
          </div>
          <span className="pill-badge pill-gold">
            {streakDays} {t('home.daysActive', 'Days Active')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isCompleted = day <= streakDays;
            return (
              <div
                key={day}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '10px 4px',
                  borderRadius: '12px',
                  background: isCompleted ? 'rgba(0, 103, 77, 0.1)' : 'var(--bg-card-secondary)',
                  border: isCompleted ? '1px solid rgba(0, 103, 77, 0.3)' : '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: '11px', color: isCompleted ? 'var(--green)' : 'var(--text-muted)', fontWeight: 600 }}>
                  D{day}
                </span>
                {isCompleted ? (
                  <CheckCircle2 size={18} color="#10B981" />
                ) : (
                  <img src={images.Coin} alt={t('home.ptsAlt', 'Pts')} style={{ width: '16px', height: '16px', opacity: 0.5 }} />
                )}
                <span style={{ fontSize: '10px', fontWeight: 600, color: isCompleted ? 'var(--green)' : 'var(--text-muted)' }}>
                  +{day * 10}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Mini Games Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#D5AD60" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('home.instantWinGames', 'Instant Win Mini Games')}
            </h2>
          </div>
          <button
            onClick={() => navigate('/play')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--green)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <span>{t('common.viewAll', 'View All')}</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {gamesLoading && games.length === 0 && (
            <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
              {t('home.loadingGames', 'Loading games...')}
            </div>
          )}

          {!gamesLoading && games.length === 0 && (
            <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
              {t('home.noGamesAvailable', 'No games are available from the API right now.')}
            </div>
          )}

          {games.map((g) => (
            <div
              key={g.id}
              className="card"
              onClick={() => navigate(g.path)}
              style={{
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--green)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '12px', overflow: 'hidden' }}>
                <img
                  src={g.image}
                  alt={g.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFD700',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 215, 0, 0.4)',
                  }}
                >
                  {g.badge}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {g.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {g.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Active Campaigns & Offers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            {t('home.featuredCampaigns', 'Featured Offers & Bonus Points')}
          </h2>
          <button
            onClick={() => navigate('/campaigns')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--green)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <span>{t('common.viewAll', 'View All')}</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {campaignsLoading && featuredCampaigns.length === 0 && (
            <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
              {t('home.loadingCampaigns', 'Loading campaigns...')}
            </div>
          )}

          {!campaignsLoading && featuredCampaigns.length === 0 && (
            <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
              {t('home.noCampaignsAvailable', 'No featured campaigns are available from the API right now.')}
            </div>
          )}

          {featuredCampaigns.map((c: any) => (
            <div
              key={c.id}
              className="card"
              onClick={() => navigate('/scan')}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(0, 103, 77, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--green)',
                  }}
                >
                  <ScanLine size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {getCampaignTitle(c)}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {getCampaignDescription(c)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getCampaignPoints(c) && (
                  <span className="pill-badge pill-green">
                    {getCampaignPoints(c)}
                  </span>
                )}
                <ArrowUpRight size={16} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Home;
