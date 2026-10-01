import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, CheckCircle2, Gift, AlertCircle } from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { fetchAllRewards, claimReward } from '../../redux/Slices/rewardsSlice';
import { fetchUser } from '../../redux/Slices/userSlice';
import { Button, Container, CustomModal, triggerCoinCelebration } from '../../components';
import images from '../../constants/images';
import { getUserRewardPoints } from '../../utils/userDisplay';

// Crisp, perfectly-scaled vector logos for vouchers
const McDonaldLogo = () => (
  <svg viewBox="0 0 100 100" style={{ width: '64px', height: '64px' }}>
    <path
      d="M20 82 V44 C20 28 32 20 42 35 C50 48 50 82 50 82 C50 82 50 48 58 35 C68 20 80 28 80 44 V82"
      fill="none"
      stroke="#FFC72C"
      strokeWidth="11"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="50"
      y="94"
      textAnchor="middle"
      fill="#FFFFFF"
      fontFamily="Poppins, Arial, sans-serif"
      fontSize="11"
      fontWeight="700"
    >
      McDonald's
    </text>
  </svg>
);

const StarbucksLogo = () => (
  <svg viewBox="0 0 100 100" style={{ width: '68px', height: '68px' }}>
    <circle cx="50" cy="50" r="44" fill="#00704A" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
    <path
      d="M50 24 L53 32 L61 32 L55 37 L57 45 L50 40 L43 45 L45 37 L39 32 L47 32 Z"
      fill="#FFFFFF"
    />
    <circle cx="50" cy="52" r="10" fill="#FFFFFF" />
    <path
      d="M35 62 Q50 78 65 62 Q50 84 35 62 Z"
      fill="#FFFFFF"
    />
    {/* Mermaid crown stars */}
    <circle cx="32" cy="42" r="2.5" fill="#FFFFFF" />
    <circle cx="68" cy="42" r="2.5" fill="#FFFFFF" />
  </svg>
);

const WalmartLogo = () => (
  <svg viewBox="0 0 100 100" style={{ width: '64px', height: '64px' }}>
    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
      <g key={i} transform={`rotate(${angle} 50 50)`}>
        <path
          d="M50 16 C47 25 47 35 50 42 C53 35 53 25 50 16 Z"
          fill="#FFC220"
        />
      </g>
    ))}
  </svg>
);

const DunkinLogo = () => (
  <svg viewBox="0 0 120 70" style={{ width: '80px', height: '50px' }}>
    <text
      x="8"
      y="48"
      fontFamily="Poppins, Arial, sans-serif"
      fontSize="42"
      fontWeight="900"
      fill="#FF671F"
      letterSpacing="-2"
    >
      D
    </text>
    <text
      x="56"
      y="48"
      fontFamily="Poppins, Arial, sans-serif"
      fontSize="42"
      fontWeight="900"
      fill="#DA1884"
      letterSpacing="-2"
    >
      D
    </text>
  </svg>
);

export const Rewards: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.user?.userData);
  const {
    rewards: apiRewards,
    claimLoading,
  } = useSelector((state: RootState) => state.rewards);

  const totalCoins = getUserRewardPoints(user);
  const targetPoints = 15000;
  const progressPercent = Math.min(100, Math.max(0, (totalCoins / targetPoints) * 100));

  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [resultModal, setResultModal] = useState<{
    visible: boolean;
    variant: 'success' | 'error';
    title: string;
    description: string;
  }>({
    visible: false,
    variant: 'success',
    title: '',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchAllRewards());
    dispatch(fetchUser());
  }, [dispatch]);

  // Pre-configured popular vouchers matching Screenshot 3
  const popularVouchers = useMemo(() => [
    {
      id: 'mcdonald-10',
      name: "McDonald's $10 Voucher",
      points: 15000,
      bgColor: '#D9221C',
      component: <McDonaldLogo />,
    },
    {
      id: 'starbucks-10',
      name: 'StarBucks $10 Voucher',
      points: 15000,
      bgColor: '#00704A',
      component: <StarbucksLogo />,
    },
    {
      id: 'walmart-10',
      name: 'Walmart  $10 Voucher',
      points: 15000,
      bgColor: '#0071CE',
      component: <WalmartLogo />,
    },
    {
      id: 'dunkin-10',
      name: 'Dunkin-Donuts $10 Voucher',
      points: 15000,
      bgColor: '#E43590',
      component: <DunkinLogo />,
    },
  ], []);

  // Merge with API rewards if any additional exist
  const displayRewards = useMemo(() => {
    if (apiRewards && apiRewards.length > 0) {
      return apiRewards.map((r: any, idx: number) => {
        const fallback = popularVouchers[idx % popularVouchers.length];
        return {
          id: r.id || fallback.id,
          name: r.name || r.title || fallback.name,
          points: Number(r.points || r.pointsRequired || fallback.points),
          image_url: r.image_url || r.image,
          bgColor: fallback.bgColor,
          component: fallback.component,
        };
      });
    }
    return popularVouchers;
  }, [apiRewards, popularVouchers]);

  const handleRewardClick = (reward: any) => {
    setSelectedReward(reward);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;

    if (totalCoins < selectedReward.points) {
      setSelectedReward(null);
      setResultModal({
        visible: true,
        variant: 'error',
        title: t('rewards.unsuccessful', 'Redemption Unsuccessful'),
        description: t(
          'rewards.needMorePoints',
          'You need {{points}} more points to redeem this voucher.',
          { points: (selectedReward.points - totalCoins).toLocaleString() },
        ),
      });
      return;
    }

    try {
      const rewardId = Number(selectedReward.id);
      if (Number.isFinite(rewardId)) {
        await dispatch(claimReward(rewardId)).unwrap();
      }
      await dispatch(fetchUser());

      setSelectedReward(null);
      triggerCoinCelebration();
      setResultModal({
        visible: true,
        variant: 'success',
        title: t('rewards.successful', 'Redemption Successful!'),
        description: t(
          'rewards.voucherSentDesc',
          'Your {{name}} digital code has been dispatched to your email.',
          { name: selectedReward.name },
        ),
      });
    } catch (error: any) {
      setSelectedReward(null);
      setResultModal({
        visible: true,
        variant: 'error',
        title: t('rewards.claimFailed', 'Claim Failed'),
        description:
          error?.message ||
          t('rewards.failedDesc', 'Could not process redemption. Please try again later.'),
      });
    }
  };

  return (
    <Container maxWidth="500px" style={{ gap: '20px', paddingBottom: '40px' }}>
      {/* 1. Header with Back Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '4px' }}>
        <button
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
            color: '#00674D',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
          aria-label={t('common.back', 'Back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('rewards.title', 'Reward')}
        </h1>
      </div>

      {/* 2. Next Reward Progress Card (Screenshot 3 - Dark Theme) */}
      <div
        style={{
          background: '#121212',
          borderRadius: '24px',
          padding: '20px 20px',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
            {t('rewards.nextReward', 'Next Reward $10')}
          </h2>
          <span style={{ fontSize: '12.5px', color: '#9CA3AF', fontWeight: 500 }}>
            ({targetPoints.toLocaleString()} Points=$10)
          </span>
        </div>

        {/* Progress Track */}
        <div
          style={{
            width: '100%',
            height: '10px',
            borderRadius: '6px',
            background: '#262626',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: '6px',
              background: '#009944',
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {/* Points Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#00B050' }}>
            {t('rewards.points', 'Points')}
          </span>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>
            <span style={{ color: '#00B050' }}>{Number(totalCoins).toLocaleString()}</span>
            <span style={{ color: '#FFFFFF' }}>/{targetPoints.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 3. Popular Rewards Section (Screenshot 3) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('rewards.popularRewards', 'Popular Rewards')}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
          }}
        >
          {displayRewards.map((item) => (
            <div
              key={item.id}
              onClick={() => handleRewardClick(item)}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '22px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '8px',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.06)';
              }}
            >
              {/* Compact Brand Logo Container */}
              <div
                style={{
                  width: '100%',
                  height: '135px',
                  borderRadius: '18px',
                  background: item.bgColor || '#00674D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  padding: '10px',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                }}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }}
                  />
                ) : (
                  item.component || (
                    <img
                      src={images.Gift}
                      alt="Gift"
                      style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    />
                  )
                )}
              </div>

              {/* Title & Points */}
              <div style={{ width: '100%', padding: '0 4px' }}>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    lineHeight: 1.3,
                    minHeight: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.name}
                </h4>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#009944',
                    marginTop: '2px',
                    display: 'block',
                  }}
                >
                  {item.points.toLocaleString()} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <CustomModal
        visible={Boolean(selectedReward)}
        onClose={() => setSelectedReward(null)}
        maxWidth="380px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              background: selectedReward?.bgColor || '#00674D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {selectedReward?.image_url ? (
              <img
                src={selectedReward.image_url}
                alt={selectedReward.name}
                style={{ width: '50px', height: '50px', objectFit: 'contain' }}
              />
            ) : (
              selectedReward?.component || <Gift size={32} color="#FFFFFF" />
            )}
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('rewards.redeemTitle', 'Redeem {{name}}?', { name: selectedReward?.name })}
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {t(
              'rewards.pointsDeductionNotice',
              '{{points}} points will be deducted from your balance.',
              { points: selectedReward?.points?.toLocaleString() || '15,000' },
            )}
          </p>

          <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '4px' }}>
            <Button
              variant="secondary"
              title={t('common.cancel', 'Cancel')}
              onClick={() => setSelectedReward(null)}
              style={{ flex: 1 }}
            />
            <Button
              title={t('rewards.redeem', 'Redeem')}
              onClick={handleConfirmRedeem}
              loading={claimLoading}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </CustomModal>

      {/* Result Modal (Success / Error) */}
      <CustomModal
        visible={resultModal.visible}
        onClose={() => setResultModal((prev) => ({ ...prev, visible: false }))}
        maxWidth="380px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background:
                resultModal.variant === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              color: resultModal.variant === 'success' ? '#10B981' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {resultModal.variant === 'success' ? (
              <CheckCircle2 size={32} />
            ) : (
              <AlertCircle size={32} />
            )}
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            {resultModal.title}
          </h3>

          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {resultModal.description}
          </p>

          <Button
            title={t('common.done', 'Done')}
            onClick={() => setResultModal((prev) => ({ ...prev, visible: false }))}
            style={{ width: '100%', marginTop: '4px' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default Rewards;
