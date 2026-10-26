import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, CheckCircle2, Gift, AlertCircle } from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { fetchAllRewards, claimReward } from '../../redux/Slices/rewardsSlice';
import { fetchUser } from '../../redux/Slices/userSlice';
import { Button, Container, CustomModal, triggerCoinCelebration } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import images from '../../constants/images';
import { getUserRewardPoints } from '../../utils/userDisplay';

// Vector logos for vouchers matching Screenshot 1 exactly
const McDonaldLogo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <svg viewBox="0 0 100 68" style={{ width: '74px', height: '50px' }}>
      <path
        d="M18 66 V32 C18 14 32 8 42 24 C50 36 50 66 50 66 C50 66 50 36 58 24 C68 8 82 14 82 32 V66"
        fill="none"
        stroke="#FFC72C"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span
      style={{
        color: '#FFFFFF',
        fontWeight: 800,
        fontSize: '13px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        marginTop: '-2px',
        letterSpacing: '-0.3px',
      }}
    >
      McDonald's
    </span>
  </div>
);

const StarbucksLogo = () => (
  <svg viewBox="0 0 100 100" style={{ width: '84px', height: '84px' }}>
    <circle cx="50" cy="50" r="46" fill="#006241" />
    <circle cx="50" cy="50" r="41" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    {/* Inner Siren */}
    <path
      d="M50 20 L53.5 28 L61 28 L55 32.5 L57 40 L50 35 L43 40 L45 32.5 L39 28 L46.5 28 Z"
      fill="#FFFFFF"
    />
    <circle cx="50" cy="46" r="7.5" fill="#FFFFFF" />
    <path d="M34 54 Q50 72 66 54 Q50 82 34 54 Z" fill="#FFFFFF" />
    <path d="M26 44 Q38 62 28 74" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M74 44 Q62 62 72 74" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="28" cy="38" r="2.5" fill="#FFFFFF" />
    <circle cx="72" cy="38" r="2.5" fill="#FFFFFF" />
  </svg>
);

const WalmartLogo = () => (
  <svg viewBox="0 0 100 100" style={{ width: '82px', height: '82px' }}>
    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
      <g key={i} transform={`rotate(${angle} 50 50)`}>
        <path
          d="M50 12 C45.5 23 45.5 35 50 44 C54.5 35 54.5 23 50 12 Z"
          fill="#FFC220"
        />
      </g>
    ))}
  </svg>
);

const DunkinLogo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <svg viewBox="0 0 28 36" style={{ width: '22px', height: '28px' }}>
        <path d="M6 10 L22 10 L19 32 L9 32 Z" fill="#FFFFFF" stroke="#FF671F" strokeWidth="1.5" />
        <path d="M4 10 L24 10 L24 7 L4 7 Z" fill="#FF671F" />
        <circle cx="14" cy="21" r="3.5" fill="#DA1884" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, textAlign: 'left' }}>
        <span
          style={{
            color: '#FF671F',
            fontWeight: 900,
            fontSize: '15px',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '-0.3px',
          }}
        >
          DUNKIN'
        </span>
        <span
          style={{
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: '13px',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '-0.2px',
          }}
        >
          DONUTS
        </span>
      </div>
    </div>
  </div>
);

const RedGiftBoxIcon = () => (
  <svg viewBox="0 0 48 48" style={{ width: '38px', height: '38px' }}>
    <defs>
      <linearGradient id="giftRedBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Box body */}
    <rect x="8" y="18" width="32" height="24" rx="4" fill="url(#giftRedBg)" />
    {/* Lid */}
    <rect x="6" y="13" width="36" height="7" rx="2" fill="#B91C1C" />
    {/* Vertical Ribbon */}
    <rect x="21" y="13" width="6" height="29" fill="url(#goldRibbon)" />
    {/* Horizontal Ribbon */}
    <rect x="8" y="27" width="32" height="6" fill="url(#goldRibbon)" />
    {/* Bow loops */}
    <path
      d="M24 13 C20 7 13 7 14 11 C15 14 21 13 24 13 Z"
      fill="url(#goldRibbon)"
    />
    <path
      d="M24 13 C28 7 35 7 34 11 C33 14 27 13 24 13 Z"
      fill="url(#goldRibbon)"
    />
    <circle cx="24" cy="13" r="2" fill="#FDE68A" />
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

  // Pre-configured popular vouchers matching Screenshot 1
  const popularVouchers = useMemo(() => [
    {
      id: 'mcdonald-10',
      name: "McDonald's $10 Voucher",
      points: 15000,
      bgColor: '#DA291C',
      component: <McDonaldLogo />,
    },
    {
      id: 'starbucks-10',
      name: 'StarBucks $10 Voucher',
      points: 15000,
      bgColor: '#006241',
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
      bgColor: '#EA1586',
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
        description: getUserFriendlyErrorMessage(
          error,
          t('rewards.failedDesc', 'Could not process redemption. Please try again later.'),
        ),
      });
    }
  };

  return (
    <Container maxWidth="760px" style={{ gap: '20px', paddingBottom: '90px' }}>
      {/* 1. Header matching Screenshot 1 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
          paddingTop: '6px',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            left: 0,
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          aria-label={t('common.back', 'Back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {t('rewards.title', 'Reward')}
        </h1>
      </div>

      {/* 2. My Balance Card matching Screenshot 1 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #183327 0%, #11261D 100%)',
          borderRadius: '24px',
          padding: '20px 22px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid rgba(0, 208, 102, 0.25)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div>
          <span style={{ fontSize: '13px', color: '#9EB6A9', fontWeight: 600, display: 'block' }}>
            {t('home.myBalance', 'My Balance')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <img
              src={images.Coin}
              alt="Coin"
              style={{
                width: '28px',
                height: '28px',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
              }}
            />
            <span
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.5px',
                lineHeight: 1,
              }}
            >
              {Number(totalCoins).toLocaleString()}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#D5E6DC', marginTop: '3px' }}>
              {t('home.points', 'Points')}
            </span>
          </div>
        </div>

        <div
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '18px',
            background: '#091510',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <RedGiftBoxIcon />
        </div>
      </div>

      {/* 3. Popular Rewards Section (3 Column Grid) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {t('rewards.popularRewards', 'Popular Rewards')}
        </h3>

        <div className="rewards-grid">
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
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)';
              }}
            >
              {/* Brand Logo Container */}
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '18px',
                  background: item.bgColor || '#00674D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  padding: '12px',
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

              {/* Title & Points matching Screenshot 1 */}
              <div style={{ width: '100%', padding: '2px 4px 4px 4px' }}>
                <h4
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    lineHeight: 1.3,
                    minHeight: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 0,
                  }}
                >
                  {item.name}
                </h4>
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#00D066',
                    marginTop: '4px',
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
