import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, ArrowLeft, User as UserIcon } from 'lucide-react';
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

// Royal 5-peak golden crown for 1st place
const GoldenCrown: React.FC = () => (
  <svg
    width="48"
    height="36"
    viewBox="0 0 44 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top: '-24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 4,
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
      pointerEvents: 'none',
    }}
  >
    <defs>
      <linearGradient id="goldCrownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF275" />
        <stop offset="30%" stopColor="#FFC820" />
        <stop offset="70%" stopColor="#FFA000" />
        <stop offset="100%" stopColor="#FF8F00" />
      </linearGradient>
    </defs>
    {/* Base rim */}
    <path
      d="M7 25C14 27.5 30 27.5 37 25C37.5 28 35 29 22 29C9 29 6.5 28 7 25Z"
      fill="url(#goldCrownGradient)"
      stroke="#D97706"
      strokeWidth="0.8"
    />
    {/* Crown body with 5 peaks */}
    <path
      d="M6 24L7 9L15 17L22 4L29 17L37 9L38 24C31 27 13 27 6 24Z"
      fill="url(#goldCrownGradient)"
      stroke="#D97706"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Peak spheres */}
    <circle cx="7" cy="9" r="2.5" fill="#FFF275" stroke="#D97706" strokeWidth="0.8" />
    <circle cx="15" cy="17" r="2" fill="#FFF275" stroke="#D97706" strokeWidth="0.8" />
    <circle cx="22" cy="4" r="3" fill="#FFFFFF" stroke="#D97706" strokeWidth="1" />
    <circle cx="29" cy="17" r="2" fill="#FFF275" stroke="#D97706" strokeWidth="0.8" />
    <circle cx="37" cy="9" r="2.5" fill="#FFF275" stroke="#D97706" strokeWidth="0.8" />
    {/* Center red jewel */}
    <circle cx="22" cy="18" r="2.2" fill="#EF4444" stroke="#991B1B" strokeWidth="0.6" />
  </svg>
);

// Fire flame badge on bottom rim of avatar
const AvatarFlame: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      bottom: '-8px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '17px',
      lineHeight: 1,
      filter: 'drop-shadow(0 2px 4px rgba(255, 107, 0, 0.6))',
      pointerEvents: 'none',
    }}
  >
    🔥
  </div>
);

// Fallback avatar handler
const UserAvatar: React.FC<{
  src?: string;
  name: string;
  size: number;
  borderColor: string;
}> = ({ src, name, size, borderColor }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: `3.5px solid ${borderColor}`,
          background: '#181A20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}
      >
        <UserIcon size={Math.round(size * 0.52)} color="#FFFFFF" strokeWidth={2.2} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImageError(true)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        border: `3.5px solid ${borderColor}`,
        background: '#181A20',
        flexShrink: 0,
        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
      }}
    />
  );
};

interface PodiumTheme {
  background: string;
  borderColor: string;
  ringColor: string;
  cardHeight: number;
  avatarSize: number;
  overlapOffset: number;
  glow: string;
  nameColor: string;
  streakColor: string;
}

const PODIUM_STYLES: Record<1 | 2 | 3, PodiumTheme> = {
  1: {
    // Rich Golden Amber Gradient matching screenshot 2 (rank 1)
    background: 'linear-gradient(180deg, #FFC043 0%, #FFB020 50%, #FFA200 100%)',
    borderColor: '#FFD56B',
    ringColor: '#FFB800',
    cardHeight: 235,
    avatarSize: 76,
    overlapOffset: 38,
    glow: '0 10px 30px rgba(255, 178, 36, 0.35)',
    nameColor: '#111827',
    streakColor: '#1F2937',
  },
  2: {
    // Soft Warm Light-Gold / Cream-Yellow matching screenshot 2 (rank 2)
    background: 'linear-gradient(180deg, #FDE69E 0%, #FDD97A 50%, #FED062 100%)',
    borderColor: '#FFEEBA',
    ringColor: '#F59E0B',
    cardHeight: 185,
    avatarSize: 66,
    overlapOffset: 33,
    glow: '0 8px 24px rgba(253, 217, 122, 0.28)',
    nameColor: '#111827',
    streakColor: '#1F2937',
  },
  3: {
    // Warm Bronze-Peach Golden matching 3rd place podium
    background: 'linear-gradient(180deg, #FFD8A8 0%, #FFBE76 50%, #FFA94D 100%)',
    borderColor: '#FFE3C2',
    ringColor: '#F97316',
    cardHeight: 160,
    avatarSize: 60,
    overlapOffset: 30,
    glow: '0 8px 20px rgba(255, 190, 118, 0.25)',
    nameColor: '#111827',
    streakColor: '#1F2937',
  },
};

const PodiumSlot: React.FC<{ user: PodiumUserData }> = ({ user }) => {
  const theme = PODIUM_STYLES[user.rank] || PODIUM_STYLES[3];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '175px',
        minWidth: '120px',
        position: 'relative',
      }}
    >
      {/* Overlapping Avatar Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          marginBottom: `-${theme.overlapOffset}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {user.rank === 1 && <GoldenCrown />}
        <UserAvatar
          src={user.avatar}
          name={user.name}
          size={theme.avatarSize}
          borderColor={theme.ringColor}
        />
        <AvatarFlame />
      </div>

      {/* Styled Golden Podium Card matching mobile screenshot */}
      <div
        style={{
          width: '100%',
          height: `${theme.cardHeight}px`,
          background: theme.background,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: '22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: `${theme.overlapOffset + 14}px`,
          paddingBottom: '14px',
          paddingLeft: '8px',
          paddingRight: '8px',
          boxShadow: theme.glow,
          boxSizing: 'border-box',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        }}
      >
        {/* Username */}
        <strong
          style={{
            fontSize: user.rank === 1 ? '16px' : '14px',
            fontWeight: 800,
            color: theme.nameColor,
            textAlign: 'center',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.25,
            padding: '0 4px',
          }}
          title={user.name}
        >
          {user.name}
        </strong>

        {/* Streak with Fire Flame Icon matching screenshot 2 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            marginTop: '8px',
          }}
        >
          <span style={{ fontSize: '15px', lineHeight: 1 }}>🔥</span>
          <span
            style={{
              fontSize: user.rank === 1 ? '14px' : '13px',
              fontWeight: 700,
              color: theme.streakColor,
              whiteSpace: 'nowrap',
            }}
          >
            {user.streak}
          </span>
        </div>
      </div>
    </div>
  );
};

export const Rankings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  // Determine order for podium (e.g. [2, 1] if 2 users, [2, 1, 3] if 3 users)
  const orderedPodium = React.useMemo(() => {
    const top = dataset.topThree;
    if (!top || top.length === 0) return [];
    if (top.length === 1) return top;
    if (top.length === 2) {
      const r1 = top.find((u) => u.rank === 1);
      const r2 = top.find((u) => u.rank === 2);
      return [r2, r1].filter((u): u is PodiumUserData => Boolean(u));
    }
    // 3 users: 2nd place on left, 1st place center, 3rd place right
    const order: Array<1 | 2 | 3> = [2, 1, 3];
    return order
      .map((rank) => top.find((u) => u.rank === rank))
      .filter((u): u is PodiumUserData => Boolean(u));
  }, [dataset.topThree]);

  return (
    <Container maxWidth="640px" style={{ gap: '22px', paddingBottom: '40px' }}>
      {/* Top Header Bar matching Screenshot 2 */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
          }}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: 0,
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          {t('rankingsScreen.leaderboard', 'Leaderboard')}
        </h1>

        <div style={{ width: '40px' }} />
      </div>

      {/* Subtitle / Description */}
      <div style={{ textAlign: 'center', marginTop: '-10px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          {t('rankingsScreen.subtitle', 'Top weekly earners receive bonus cash and mega multiplier passes!')}
        </p>
      </div>

      {loading && dataset.topThree.length === 0 && dataset.rankings.length === 0 && (
        <div
          className="card"
          style={{
            padding: '28px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            borderRadius: '16px',
          }}
        >
          {t('rankingsScreen.loadingLeaderboard', 'Loading leaderboard...')}
        </div>
      )}

      {!loading && dataset.topThree.length === 0 && dataset.rankings.length === 0 && (
        <div
          className="card"
          style={{
            padding: '28px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            borderRadius: '16px',
          }}
        >
          {t('rankingsScreen.noLeaderboardData', 'No leaderboard data yet.')}
        </div>
      )}

      {/* Podium Cards Section matching Mobile App Screenshot */}
      {orderedPodium.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: '14px',
            paddingTop: '32px',
            paddingBottom: '8px',
            width: '100%',
          }}
        >
          {orderedPodium.map((user) => (
            <PodiumSlot key={user.id} user={user} />
          ))}
        </div>
      )}

      {/* Remaining Leaderboard Rankings (Rank 4, 5, 6...) */}
      {dataset.rankings.length > 0 && (
        <div
          className="card"
          style={{
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          {dataset.rankings.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '12px',
                background: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-color)',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {item.rank}
                </span>

                <UserAvatar
                  src={item.avatar}
                  name={item.name}
                  size={40}
                  borderColor="var(--border-color)"
                />

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {item.name}
                  </h4>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    {t('rankingsScreen.currentStreak', 'Current streak')}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>🔥</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                  {item.streak}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Rankings;
