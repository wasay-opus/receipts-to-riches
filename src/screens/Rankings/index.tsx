import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, ArrowLeft, User as UserIcon, Info, Trophy, Gift } from 'lucide-react';
import { Container, CustomModal, showToast } from '../../components';
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

// Crown for 1st place matching Screenshot 4
const GoldenCrown: React.FC = () => (
  <svg
    width="42"
    height="32"
    viewBox="0 0 38 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top: '-22px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 6,
      filter: 'drop-shadow(0 2px 4px rgba(217, 119, 6, 0.45))',
      pointerEvents: 'none',
    }}
  >
    <path
      d="M4 22C10 24.5 28 24.5 34 22L32 9L24 16L19 4L14 16L6 9L4 22Z"
      fill="#F59E0B"
      stroke="#D97706"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="9" r="2.2" fill="#FEF3C7" />
    <circle cx="19" cy="4" r="2.8" fill="#FFFFFF" />
    <circle cx="32" cy="9" r="2.2" fill="#FEF3C7" />
  </svg>
);

// Rank Badge (1st, 2nd, 3rd) overlapping bottom-left of avatar matching Screenshot 4
const RankBadge: React.FC<{ rank: 1 | 2 | 3 }> = ({ rank }) => {
  const configs: Record<1 | 2 | 3, { text: string; bg: string; size: number; fontSize: string }> = {
    1: { text: '1st', bg: '#D97706', size: 26, fontSize: '11px' },
    2: { text: '2nd', bg: '#1E293B', size: 24, fontSize: '10.5px' },
    3: { text: '3rd', bg: '#78350F', size: 24, fontSize: '10.5px' },
  };
  const config = configs[rank];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '-2px',
        left: '-4px',
        width: `${config.size}px`,
        height: `${config.size}px`,
        borderRadius: '50%',
        backgroundColor: config.bg,
        border: '2px solid #FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontSize: config.fontSize,
        fontWeight: 800,
        lineHeight: 1,
        zIndex: 6,
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
      }}
    >
      {config.text}
    </div>
  );
};

// Fallback avatar handler
const UserAvatar: React.FC<{
  src?: string;
  name: string;
  size: number;
  borderColor?: string;
}> = ({ src, name, size, borderColor = '#FFFFFF' }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: `3px solid ${borderColor}`,
          background: '#475569',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
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
        border: `3px solid ${borderColor}`,
        background: '#475569',
        flexShrink: 0,
        boxShadow: '0 4px 14px rgba(0,0,0,0.16)',
      }}
    />
  );
};

const PodiumSlot: React.FC<{ user: PodiumUserData }> = ({ user }) => {
  const isFirst = user.rank === 1;
  const isSecond = user.rank === 2;
  const cardHeight = isFirst ? 230 : isSecond ? 190 : 170;
  const avatarSize = isFirst ? 74 : isSecond ? 64 : 60;
  const overlapOffset = Math.round(avatarSize / 2);

  // Status title matching Screenshot 4: 1st Dominating, 2nd Active Chaser, 3rd Rising Star
  const tierTitle =
    user.title ||
    (user.rank === 1 ? 'Dominating' : user.rank === 2 ? 'Active Chaser' : 'Rising Star');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '175px',
        minWidth: '110px',
        position: 'relative',
      }}
    >
      {/* Overlapping Avatar Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 4,
          marginBottom: `-${overlapOffset}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isFirst && <GoldenCrown />}
        <UserAvatar
          src={user.avatar}
          name={user.name}
          size={avatarSize}
          borderColor="#FFFFFF"
        />
        <RankBadge rank={user.rank} />
      </div>

      {/* Styled Golden/Cream Podium Card matching Screenshot 4 */}
      <div
        style={{
          width: '100%',
          height: `${cardHeight}px`,
          background: '#FFF8E7',
          border: isFirst ? '2px solid #FCD34D' : '1.5px solid #FEE5A5',
          borderRadius: '22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: `${overlapOffset + 12}px`,
          paddingBottom: '14px',
          paddingLeft: '6px',
          paddingRight: '6px',
          boxShadow: isFirst
            ? '0 10px 24px rgba(251, 191, 36, 0.22)'
            : '0 6px 16px rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box',
        }}
      >
        {/* Full Name */}
        <strong
          style={{
            fontSize: isFirst ? '15px' : '13.5px',
            fontWeight: 800,
            color: '#111827',
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

        {/* Tier Title: Dominating, Active Chaser, Rising Star */}
        <span
          style={{
            fontSize: isFirst ? '13px' : '12px',
            fontWeight: 600,
            color: '#374151',
            textAlign: 'center',
            marginTop: '4px',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tierTitle}
        </span>

        {/* Streak with Fire Flame Icon matching Screenshot 4 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            marginTop: isFirst ? '12px' : '8px',
          }}
        >
          <span style={{ fontSize: '15px', lineHeight: 1 }}>🔥</span>
          <span
            style={{
              fontSize: isFirst ? '14px' : '13px',
              fontWeight: 700,
              color: '#111827',
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
  const [infoModalOpen, setInfoModalOpen] = useState(false);

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
      {/* Top Header Bar matching Screenshot 2 & 3 */}
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

        <button
          type="button"
          onClick={() => setInfoModalOpen(true)}
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
            color: '#00D066',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
          }}
          aria-label="How the leaderboard works"
        >
          <Info size={20} />
        </button>
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

      {/* Remaining Leaderboard Rankings (Rank 4, 5, 6...) matching Screenshot 4 */}
      {dataset.rankings.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
          }}
        >
          {dataset.rankings.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                {/* Rank Number */}
                <span
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    minWidth: '22px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.rank}
                </span>

                {/* Avatar */}
                <UserAvatar
                  src={item.avatar}
                  name={item.name}
                  size={42}
                  borderColor="var(--border-color)"
                />

                {/* User Name */}
                <span
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>

              {/* Streak with flame */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  marginLeft: '12px',
                }}
              >
                <span style={{ fontSize: '15px', lineHeight: 1 }}>🔥</span>
                <strong
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#EA580C',
                  }}
                >
                  {item.streak}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Streak Leaderboard Info Modal */}
      <CustomModal
        visible={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        maxWidth="560px"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
            padding: '10px 12px 14px 12px',
          }}
        >
          {/* Circular Green Info Icon Badge */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 208, 102, 0.14)',
              border: '1.5px solid rgba(0, 208, 102, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00D066',
              boxShadow: '0 0 20px rgba(0, 208, 102, 0.15)',
            }}
          >
            <Info size={32} strokeWidth={2.4} />
          </div>

          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.2px' }}>
              {t('rankingsScreen.infoTitle', 'Streak Leaderboard')}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              {t('rankingsScreen.infoSubtitle', 'How the leaderboard works')}
            </p>
          </div>

          {/* 3 Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', textAlign: 'left' }}>
            {/* Card 1: Daily Streaks */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '20px',
                background: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(249, 115, 22, 0.15)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F97316',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Flame size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                  {t('rankingsScreen.dailyStreaksTitle', 'Daily Streaks')}
                </h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                  {t('rankingsScreen.dailyStreaksDesc', 'Log in and play every day to increase your daily streak. The longer your active streak, the higher your ranking!')}
                </p>
              </div>
            </div>

            {/* Card 2: Top 3 Podium */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '20px',
                background: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F59E0B',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Trophy size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                  {t('rankingsScreen.topThreeTitle', 'Top 3 Podium')}
                </h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                  {t('rankingsScreen.topThreeDesc', 'The players with the highest active streaks earn a featured spot on the Top 3 Podium.')}
                </p>
              </div>
            </div>

            {/* Card 3: Bonus Rewards */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '20px',
                background: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(0, 208, 102, 0.15)',
                  border: '1px solid rgba(0, 208, 102, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00D066',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Gift size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                  {t('rankingsScreen.bonusRewardsTitle', 'Bonus Rewards')}
                </h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                  {t('rankingsScreen.bonusRewardsDesc', 'Maintain your streak to earn exclusive multipliers, unlock locked games faster, and gain recognition on the leaderboard.')}
                </p>
              </div>
            </div>
          </div>

          {/* Green Got It Button */}
          <button
            type="button"
            onClick={() => setInfoModalOpen(false)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '26px',
              background: '#00D066',
              color: '#052E16',
              border: 'none',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 208, 102, 0.35)',
              marginTop: '4px',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {t('common.gotIt', 'Got It!')}
          </button>
        </div>
      </CustomModal>
    </Container>
  );
};

export default Rankings;

