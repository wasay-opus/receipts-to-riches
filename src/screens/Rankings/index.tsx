import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { Container, showToast } from '../../components';
import images from '../../constants/images';
import gameServices from '../../services/gameServices';
import { mapApiStreakLeaderboardToDataset } from './rankingsMapper';
import { LeaderboardDataset } from './types';

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

      {dataset.topThree.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: '12px',
            padding: '24px 0 10px',
          }}
        >
          {dataset.topThree.map((user) => (
            <div
              key={user.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                maxWidth: '130px',
              }}
            >
              <div style={{ position: 'relative' }}>
                {user.rank === 1 && (
                  <Crown
                    size={24}
                    color="#FFD700"
                    style={{
                      position: 'absolute',
                      top: '-18px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=00674D&color=fff`}
                  alt={user.name}
                  style={{
                    width: user.rank === 1 ? '72px' : '58px',
                    height: user.rank === 1 ? '72px' : '58px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${user.ringColor || '#D5AD60'}`,
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: user.badgeColor || '#D5AD60',
                    color: '#050816',
                    fontWeight: 800,
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  #{user.rank}
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: user.rank === 1 ? '110px' : user.rank === 2 ? '90px' : '75px',
                  background: 'var(--bg-card)',
                  borderRadius: '16px 16px 8px 8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <strong style={{ fontSize: '12px', color: 'var(--text-main)', textAlign: 'center' }}>
                  {user.name}
                </strong>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#D5AD60', marginTop: '2px' }}>
                  {user.streak}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dataset.rankings.map((item) => (
          <div
            key={item.id}
            className="card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-muted)', width: '24px' }}>
                #{item.rank}
              </span>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {item.name}
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t('rankingsScreen.currentStreak', 'Current streak')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src={images.Coin} alt="Pts" style={{ width: '18px', height: '18px' }} />
              <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{item.streak}</strong>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default Rankings;
