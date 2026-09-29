import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Gift, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { fetchAllRewards, claimReward } from '../../redux/Slices/rewardsSlice';
import { fetchUser } from '../../redux/Slices/userSlice';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import images from '../../constants/images';
import { getUserRewardPoints } from '../../utils/userDisplay';

export const Rewards: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user?.userData);
  const {
    rewards: apiRewards,
    loading: rewardsLoading,
    error: rewardsError,
    claimLoading,
  } = useSelector((state: RootState) => state.rewards);
  const totalCoins = getUserRewardPoints(user);

  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchAllRewards());
    dispatch(fetchUser());
  }, [dispatch]);

  const rewardCatalog = apiRewards ?? [];
  const getRewardTitle = (reward: any) => reward.title ?? reward.name ?? t('rewardsScreen.defaultRewardName', 'reward');
  const getRewardPoints = (reward: any) =>
    Number(reward.pointsRequired ?? reward.points ?? reward.required_points ?? 0);
  const getRewardImage = (reward: any) => reward.image_url ?? reward.image ?? images.Gift;

  const handleRedeem = (reward: any) => {
    const required = getRewardPoints(reward);
    if (totalCoins < required) {
      showToast({
        type: 'error',
        text1: t('rewardsScreen.insufficientPointsTitle', 'Insufficient Points'),
        text2: t('rewardsScreen.pointsNeeded', 'You need {{points}} more points to claim this reward.', {
          points: required - totalCoins,
        }),
      });
      return;
    }

    setSelectedReward(reward);
  };

  const confirmRedeem = async () => {
    if (!selectedReward) return;

    try {
      const rewardId = Number(selectedReward.id);
      if (Number.isFinite(rewardId)) {
        await dispatch(claimReward(rewardId)).unwrap();
      }
      await dispatch(fetchUser());

      setRedeemSuccess(true);
      triggerCoinCelebration();
      showToast({
        type: 'success',
        text1: t('rewardsScreen.redemptionSuccessTitle', 'Redemption Successful!'),
        text2: t('rewardsScreen.redemptionSuccessDesc', 'Your gift card voucher has been sent to your registered email.'),
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('rewardsScreen.claimFailedTitle', 'Claim Failed'),
        text2: error?.message || t('rewardsScreen.claimFailedDesc', 'Could not process redemption. Please try again.'),
      });
    }
  };

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      {/* Balance Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #00674D 0%, #004D39 100%)',
          color: '#FFFFFF',
          padding: '24px',
          borderRadius: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(0, 103, 77, 0.3)',
        }}
      >
        <div>
          <span style={{ fontSize: '13px', opacity: 0.85, fontWeight: 600 }}>
            {t('rewardsScreen.availablePoints', 'AVAILABLE POINTS')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <img src={images.Coin} alt="Coin" style={{ width: '28px', height: '28px' }} />
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#FFD700' }}>
              {Number(totalCoins).toLocaleString()}
            </h2>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>{t('rewardsScreen.ptsLabel', 'PTS')}</span>
          </div>
        </div>

        <div className="pill-badge pill-gold" style={{ fontSize: '13px' }}>
          <Sparkles size={14} />
          <span>{t('rewardsScreen.goldHunterTier', 'Tier: Gold Hunter')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('rewardsScreen.catalog', 'Rewards Catalog')}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {t('rewardsScreen.subtitle', 'Redeem points for digital gift cards and instant cash transfers')}
        </p>
      </div>

      {/* Rewards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {rewardsLoading && rewardCatalog.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('rewardsScreen.loadingRewards', 'Loading rewards...')}
          </div>
        )}

        {!rewardsLoading && rewardsError && rewardCatalog.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {rewardsError}
          </div>
        )}

        {!rewardsLoading && !rewardsError && rewardCatalog.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('rewardsScreen.noRewardsApi', 'No rewards are available from the API right now.')}
          </div>
        )}

        {rewardCatalog.map((reward) => {
          const requiredPoints = getRewardPoints(reward);
          const title = getRewardTitle(reward);
          const image = getRewardImage(reward);
          const isEligible = totalCoins >= requiredPoints;
          return (
            <div
              key={reward.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: 'var(--bg-card-secondary)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={image}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <img src={images.Coin} alt="Pts" style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#D5AD60' }}>
                      {requiredPoints.toLocaleString()} {t('rewardsScreen.ptsLabel', 'PTS')}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant={isEligible ? 'primary' : 'secondary'}
                title={isEligible ? t('rewardsScreen.redeemVoucher', 'Redeem Voucher') : t('rewardsScreen.needMorePoints', 'Need More Points')}
                icon={isEligible ? <Gift size={16} /> : <Lock size={16} />}
                onClick={() => handleRedeem(reward)}
                disabled={!isEligible}
                style={{ width: '100%' }}
              />
            </div>
          );
        })}
      </div>

      {/* Confirmation / Success Modal */}
      <CustomModal
        visible={Boolean(selectedReward)}
        onClose={() => {
          setSelectedReward(null);
          setRedeemSuccess(false);
        }}
        maxWidth="420px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          {redeemSuccess ? (
            <>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('rewardsScreen.voucherDispatched', 'Voucher Dispatched!')}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {t('rewardsScreen.voucherSentDesc', 'Your {{title}} code has been sent to your registered email address.', {
                  title: selectedReward ? getRewardTitle(selectedReward) : t('rewardsScreen.defaultRewardName', 'reward'),
                })}
              </p>
              <Button
                title={t('common.done', 'Done')}
                onClick={() => {
                  setSelectedReward(null);
                  setRedeemSuccess(false);
                }}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </>
          ) : (
            <>
              <img src={images.Gift} alt="Gift" style={{ width: '64px', height: '64px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('rewardsScreen.redeemConfirmTitle', 'Redeem {{title}}?', {
                  title: selectedReward ? getRewardTitle(selectedReward) : t('rewardsScreen.defaultRewardName', 'reward'),
                })}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {t('rewardsScreen.pointsWillBeDeducted', '{{points}} Points will be deducted from your account.', {
                  points: selectedReward ? getRewardPoints(selectedReward).toLocaleString() : 0,
                })}
              </p>
              <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                <Button
                  variant="secondary"
                  title={t('common.cancel', 'Cancel')}
                  onClick={() => setSelectedReward(null)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={t('common.confirm', 'Confirm')}
                  onClick={confirmRedeem}
                  loading={claimLoading}
                  style={{ flex: 1 }}
                />
              </div>
            </>
          )}
        </div>
      </CustomModal>
    </Container>
  );
};

export default Rewards;
