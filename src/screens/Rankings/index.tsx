import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, ArrowLeft, User as UserIcon, Info, Trophy, Receipt, Scale, X } from 'lucide-react';
import { Container, CustomModal, showToast } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
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

const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

// Crown for 1st place matching Screenshot 4
const GoldenCrown: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => (
  <svg
    width={isMobile ? "30" : "42"}
    height={isMobile ? "22" : "32"}
    viewBox="0 0 38 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top: isMobile ? '-16px' : '-22px',
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
const RankBadge: React.FC<{ rank: 1 | 2 | 3; isMobile?: boolean }> = ({ rank, isMobile }) => {
  const configs: Record<1 | 2 | 3, { text: string; bg: string; size: number; fontSize: string }> = {
    1: { text: '1st', bg: '#D97706', size: isMobile ? 20 : 26, fontSize: isMobile ? '9px' : '11px' },
    2: { text: '2nd', bg: '#1E293B', size: isMobile ? 18 : 24, fontSize: isMobile ? '8.5px' : '10.5px' },
    3: { text: '3rd', bg: '#78350F', size: isMobile ? 18 : 24, fontSize: isMobile ? '8.5px' : '10.5px' },
  };
  const config = configs[rank];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '-2px',
        left: isMobile ? '-2px' : '-4px',
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

const PodiumSlot: React.FC<{ user: PodiumUserData; isSolo?: boolean; isMobile?: boolean }> = ({
  user,
  isSolo,
  isMobile,
}) => {
  const isFirst = user.rank === 1;
  const isSecond = user.rank === 2;
  const cardHeight = isSolo
    ? (isMobile ? 240 : 275)
    : isMobile
    ? (isFirst ? 210 : isSecond ? 180 : 165)
    : (isFirst ? 255 : isSecond ? 215 : 195);
  const avatarSize = isMobile
    ? (isFirst ? 56 : isSecond ? 48 : 44)
    : (isFirst ? 76 : isSecond ? 66 : 62);
  const overlapOffset = Math.round(avatarSize / 2);

  // Status title matching Screenshot: 1st Dominating, 2nd Active Chaser, 3rd Rising Star
  const tierTitle =
    user.title ||
    (user.rank === 1 ? 'Dominating' : user.rank === 2 ? 'Active Chaser' : 'Rising Star');

  // Cash reward based on podium rank
  const cashReward = user.rank === 1 ? '$100' : user.rank === 2 ? '$50' : '$25';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: isSolo ? '220px' : isMobile ? '118px' : '180px',
        minWidth: 0,
        position: 'relative',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
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
        {isFirst && <GoldenCrown isMobile={isMobile} />}
        <UserAvatar
          src={user.avatar}
          name={user.name}
          size={avatarSize}
          borderColor="#FFFFFF"
        />
        <RankBadge rank={user.rank} isMobile={isMobile} />
      </div>

      {/* Styled Golden/Cream Podium Card matching Screenshot */}
      <div
        style={{
          width: '100%',
          minHeight: `${cardHeight}px`,
          background: isFirst
            ? 'linear-gradient(180deg, #FFFDF7 0%, #FFF8E7 100%)'
            : '#FFF8E7',
          border: isFirst ? '2px solid #F59E0B' : '1.5px solid #FEE5A5',
          borderRadius: isMobile ? '18px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: `${overlapOffset + (isMobile ? 8 : 14)}px`,
          paddingBottom: isMobile ? '10px' : '16px',
          paddingLeft: isMobile ? '4px' : '10px',
          paddingRight: isMobile ? '4px' : '10px',
          boxShadow: isFirst
            ? '0 10px 24px rgba(245, 158, 11, 0.2)'
            : '0 4px 14px rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box',
        }}
      >
        {/* Full Name */}
        <strong
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? (isFirst ? '12px' : '11px') : isFirst ? '16px' : '14px',
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
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? (isFirst ? '10px' : '9px') : isFirst ? '13px' : '12px',
            fontWeight: 600,
            color: '#4B5563',
            textAlign: 'center',
            marginTop: isMobile ? '1px' : '3px',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tierTitle}
        </span>

        {/* Prominent, Beautiful Cash Prize Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '4px' : '6px',
            background: isFirst
              ? 'linear-gradient(135deg, #FFB800 0%, #F59E0B 50%, #D97706 100%)'
              : isSecond
              ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
              : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
            color: '#FFFFFF',
            borderRadius: '24px',
            padding: isMobile
              ? isFirst ? '4px 10px' : '3px 8px'
              : isFirst ? '7px 18px' : '5px 14px',
            marginTop: isMobile ? '6px' : '10px',
            boxShadow: isFirst
              ? '0 6px 18px rgba(245, 158, 11, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
              : isSecond
              ? '0 4px 12px rgba(100, 116, 139, 0.3)'
              : '0 4px 12px rgba(180, 83, 9, 0.3)',
            border: isFirst
              ? '1.5px solid rgba(255, 255, 255, 0.45)'
              : '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <span style={{ fontSize: isMobile ? (isFirst ? '12px' : '11px') : isFirst ? '15px' : '13px', lineHeight: 1 }}>
            {isFirst ? '🏆' : isSecond ? '🥈' : '🥉'}
          </span>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? (isFirst ? '14px' : '12px') : isFirst ? '20px' : '16px',
              fontWeight: 900,
              letterSpacing: '-0.5px',
              color: '#FFFFFF',
              lineHeight: 1,
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            }}
          >
            {cashReward}
          </span>
        </div>

        {/* Streak with Fire Flame Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '4px' : '6px',
            marginTop: 'auto',
            paddingTop: isMobile ? '8px' : '12px',
          }}
        >
          <span style={{ fontSize: isMobile ? '13px' : '16px', lineHeight: 1 }}>🔥</span>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? (isFirst ? '11.5px' : '11px') : isFirst ? '14.5px' : '13px',
              fontWeight: 800,
              color: '#111827',
              whiteSpace: 'nowrap',
            }}
          >
            {user.streak} {isMobile ? 'd' : 'Days'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const Rankings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [dataset, setDataset] = useState<LeaderboardDataset>(emptyDataset);
  const [loading, setLoading] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(true);

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
            text2: getUserFriendlyErrorMessage(error, t('rankingsScreen.tryAgain', 'Please try again.')),
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
    <Container
      maxWidth="640px"
      style={{
        gap: isMobile ? '16px' : '22px',
        paddingBottom: isMobile ? '95px' : '40px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
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
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: 0,
            textAlign: 'center',
            letterSpacing: '-0.025em',
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
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            margin: 0,
          }}
        >
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
            gap: isMobile ? '8px' : '14px',
            paddingTop: isMobile ? '24px' : '32px',
            paddingBottom: '8px',
            width: '100%',
          }}
        >
          {orderedPodium.map((user) => (
            <PodiumSlot
              key={user.id}
              user={user}
              isSolo={orderedPodium.length === 1}
              isMobile={isMobile}
            />
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

      {/* Streak Leaderboard Info Modal matching Image 1 */}
      <CustomModal
        visible={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        maxWidth="480px"
        contentPadding="0px"
        showCloseButton={false}
      >
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            background: '#16181D',
            color: '#FFFFFF',
            borderRadius: '26px',
            padding: '28px 20px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
            boxSizing: 'border-box',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Integrated Sleek Dark Close Button */}
          <button
            type="button"
            onClick={() => setInfoModalOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#9CA3AF',
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Trophy in Golden Ring */}
          <div
            style={{
              width: '56px',
              height: '56px',
              minWidth: '56px',
              minHeight: '56px',
              maxWidth: '56px',
              maxHeight: '56px',
              flexShrink: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.08) 70%)',
              border: '2px solid rgba(245, 158, 11, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              boxShadow: '0 0 24px rgba(245, 158, 11, 0.25)',
              marginTop: '2px',
            }}
          >
            <Trophy
              size={28}
              color="#F59E0B"
              strokeWidth={2.2}
              style={{
                width: '28px',
                height: '28px',
                minWidth: '28px',
                minHeight: '28px',
                flexShrink: 0,
                display: 'block',
              }}
            />
          </div>

          {/* Heading and Subtitle */}
          <div style={{ textAlign: 'center', padding: '0 8px', flexShrink: 0 }}>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '22px',
                fontWeight: 800,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '-0.025em',
              }}
            >
              Streak Leaderboard
            </h3>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                color: '#9CA3AF',
                margin: '6px 0 0 0',
                lineHeight: 1.45,
              }}
            >
              Play daily games, upload receipts & win cash rewards!
            </p>
          </div>

          {/* Section: TOP 3 CASH REWARDS */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#F59E0B',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <Trophy size={13} color="#F59E0B" />
              <span>TOP 3 CASH REWARDS</span>
            </div>

            {/* 3 Pods: 2nd, 1st, 3rd matching Screenshot 1 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.15fr 1fr',
                gap: '10px',
                width: '100%',
                alignItems: 'center',
                boxSizing: 'border-box',
              }}
            >
              {/* 2nd Place */}
              <div
                style={{
                  background: '#1F2228',
                  border: '1px solid #2D313A',
                  borderRadius: '16px',
                  padding: '14px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <span>🥈</span>
                  <span>2nd</span>
                </div>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                  }}
                >
                  $50
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#94A3B8',
                  }}
                >
                  2nd Place
                </span>
              </div>

              {/* 1st Place (Prominent with Golden Border & Glow) */}
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.16) 0%, rgba(31, 34, 40, 0.95) 100%)',
                  border: '1.5px solid #F59E0B',
                  borderRadius: '18px',
                  padding: '16px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.2)',
                }}
              >
                <div
                  style={{
                    background: '#F59E0B',
                    borderRadius: '10px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#451A03',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <span>🏆</span>
                  <span>1st</span>
                </div>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '26px',
                    fontWeight: 900,
                    color: '#FBBF24',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                  }}
                >
                  $100
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#F59E0B',
                  }}
                >
                  1st Place
                </span>
              </div>

              {/* 3rd Place */}
              <div
                style={{
                  background: '#1F2228',
                  border: '1px solid #2D313A',
                  borderRadius: '16px',
                  padding: '14px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(217, 119, 6, 0.15)',
                    borderRadius: '10px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <span>🥉</span>
                  <span>3rd</span>
                </div>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                  }}
                >
                  $25
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#94A3B8',
                  }}
                >
                  3rd Place
                </span>
              </div>
            </div>
          </div>

          {/* Card 1: Daily Games & Receipts matching Screenshot 1 */}
          <div
            style={{
              width: '100%',
              background: '#1F2228',
              border: '1px solid #2D313A',
              borderRadius: '18px',
              padding: '16px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(0, 208, 102, 0.12)',
                border: '1px solid rgba(0, 208, 102, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00D066',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <Receipt size={21} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14.5px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: '0 0 6px 0',
                }}
              >
                Daily Games & Receipts
              </h4>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 450,
                  color: '#9CA3AF',
                  lineHeight: 1.5,
                  margin: '0 0 10px 0',
                }}
              >
                Play daily games requiring receipt uploads — Cash Games, Pic-Pick, and State Pick. Upload a valid receipt each day to build and maintain your streak.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Cash Games', 'Pic-Pick', 'State Pick'].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-block',
                      padding: '3px 9px',
                      background: 'rgba(0, 208, 102, 0.12)',
                      border: '1px solid rgba(0, 208, 102, 0.25)',
                      borderRadius: '8px',
                      color: '#00D066',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: 30-Day Tie-Breaker Rule matching Screenshot 1 */}
          <div
            style={{
              width: '100%',
              background: '#1F2228',
              border: '1px solid #2D313A',
              borderRadius: '18px',
              padding: '16px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(249, 115, 22, 0.12)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F97316',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <Scale size={21} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14.5px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: '0 0 6px 0',
                }}
              >
                30-Day Tie-Breaker Rule
              </h4>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 450,
                  color: '#9CA3AF',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                If two or more players maintain the same daily streak (e.g. 30 days), the winner is decided by who played more games and uploaded more receipts overall.
              </p>
            </div>
          </div>
        </div>
      </CustomModal>
    </Container>
  );
};

export default Rankings;

