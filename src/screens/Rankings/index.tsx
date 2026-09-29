import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Flame } from 'lucide-react';
import { Container, showToast } from '../../components';
import gameServices from '../../services/gameServices';
import { mapApiStreakLeaderboardToDataset } from './rankingsMapper';
import { LeaderboardDataset, PodiumUserData } from './types';

const emptyDataset: LeaderboardDataset = {
  topThree: [],
  rankings: [],
};

const getLeaderboardList = (payload: any): any[] => {
  const sources = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.leaderboard,
    payload?.rankings,
    payload?.users,
    payload?.results,
    payload?.streak_leaderboard,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.data)) return source.data;
    if (Array.isArray(source?.users)) return source.users;
    if (Array.isArray(source?.leaderboard)) return source.leaderboard;
    if (Array.isArray(source?.rankings)) return source.rankings;
  }

  return [];
};

const podiumOrder: Array<1 | 2 | 3> = [2, 1, 3];
const podiumHeight: Record<1 | 2 | 3, number> = { 1: 128, 2: 96, 3: 78 };
const avatarSize: Record<1 | 2 | 3, number> = { 1: 76, 2: 60, 3: 60 };

const PodiumSlot: React.FC<{ user: PodiumUserData }> = ({ user }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      flex: 1,
      maxWidth: '140px',
    }}
  >
    <span
      className="pill-badge"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-main)',
        fontWeight: 700,
        fontSize: '12px',
      }}
    >
      {user.streak}
    </span>

    <div style={{ position: 'relative' }}>
      {user.rank === 1 && (
        <Trophy
          size={22}
          color="var(--text-main)"
          style={{ position: 'absolute', top: '-26px', left: '50%', transform: 'translateX(-50%)' }}
        />
      )}
      <img
        src={
          user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1a1a1a&color=fff`
        }
        alt={user.name}
        style={{
          width: `${avatarSize[user.rank]}px`,
          height: `${avatarSize[user.rank]}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `3px solid ${user.ringColor || 'var(--text-main)'}`,
          background: 'var(--bg-card-secondary)',
        }}
      />
    </div>

    <strong
      style={{
        fontSize: '13px',
        color: 'var(--text-main)',
        textAlign: 'center',
        maxWidth: '120px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {user.name}
    </strong>

    <div
      style={{
        width: '100%',
        height: `${podiumHeight[user.rank]}px`,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderBottom: 'none',
        borderRadius: '14px 14px 0 0',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-muted)' }}>
        {user.rank}
      </span>
    </div>
  </div>
);

export const Rankings: React.FC = () => {
  const { t } = useTranslation();
  const [dataset, setDataset] = useState<LeaderboardDataset>(emptyDataset);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await gameServices.getStreakLeaderboard();
        const mapped = mapApiStreakLeaderboardToDataset(getLeaderboardList(response?.data));
        if (isMounted) {
          setDataset(mapped);
        }
      } catch (error: any) {
        if (isMounted) {
          showToast({
            type: 'error',
            text1: t('rankingsScreen.leaderboardNotLoaded', 'Leaderboard not loaded'),
            text2: error?.message || t('rankingsScreen.tryAgain', 'Please try again.'),
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const orderedPodium = podiumOrder
    .map((rank) => dataset.topThree.find((u) => u.rank === rank))
    .filter((u): u is PodiumUserData => Boolean(u));

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('rankingsScreen.title', 'Top Receipt Hunters')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {t('rankingsScreen.subtitle', 'Top weekly earners receive bonus cash and mega multiplier passes!')}
        </p>
      </div>

      {loading && dataset.topThree.length === 0 && dataset.rankings.length === 0 && (
        <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
          {t('rankingsScreen.loadingLeaderboard', 'Loading leaderboard...')}
        </div>
      )}

      {!loading && dataset.topThree.length === 0 && dataset.rankings.length === 0 && (
        <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
          {t('rankingsScreen.noLeaderboardData', 'No leaderboard data yet.')}
        </div>
      )}

      {orderedPodium.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: '10px',
            padding: '8px 0 0',
          }}
        >
          {orderedPodium.map((user) => (
            <PodiumSlot key={user.id} user={user} />
          ))}
        </div>
      )}

      {dataset.rankings.length > 0 && (
        <div className="card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dataset.rankings.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '10px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {item.rank}
                </span>
                <img
                  src={
                    item.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=1a1a1a&color=fff`
                  }
                  alt={item.name}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card-secondary)',
                  }}
                />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.name}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t('rankingsScreen.currentStreak', 'Current streak')}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Flame size={14} color="var(--text-main)" />
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{item.streak}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Rankings;
