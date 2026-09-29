import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Megaphone, Plus, ArrowUpRight, BarChart2 } from 'lucide-react';
import { Button, Container } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchMyCampaigns, renewCampaign } from '../../redux/Slices/campaignsSlice';
import { addFunds, fetchAllFunds } from '../../redux/Slices/fundsSlice';
import { CustomModal, FormInput, showToast } from '../../components';
import { promptAppInput } from '../../utils/sweetAlert';

export const ManageCampaigns: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { myCampaigns, loading, error } = useSelector((state: RootState) => state.campaigns);
  const { funds, loading: fundsLoading, addFundsLoading } = useSelector((state: RootState) => state.funds);
  const [fundAmount, setFundAmount] = useState('');
  const [showFundsModal, setShowFundsModal] = useState(false);

  useEffect(() => {
    dispatch(fetchMyCampaigns());
    dispatch(fetchAllFunds());
  }, [dispatch]);

  const getDateInputValue = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  };

  const totalFunds = useMemo(() => {
    if (!funds.length) return 0;
    const directBalance = funds.find((fund) =>
      typeof fund.total_balance === 'number' ||
      typeof fund.wallet_balance === 'number' ||
      typeof fund.balance === 'number' ||
      typeof fund.total === 'number',
    );

    if (directBalance) {
      return Number(
        directBalance.total_balance ??
          directBalance.wallet_balance ??
          directBalance.balance ??
          directBalance.total ??
          0,
      );
    }

    return funds.reduce((sum, fund) => sum + Number(fund.amount ?? 0), 0);
  }, [funds]);

  const handleAddFunds = async () => {
    const amount = Number(fundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ type: 'error', text1: t('manageCampaigns.manager.enterValidAmount', 'Enter a valid amount') });
      return;
    }

    try {
      const response = await dispatch(addFunds(amount)).unwrap();
      const approvalUrl = response?.data?.approval_url ?? response?.data?.approvalUrl;
      if (approvalUrl) {
        window.open(approvalUrl, '_blank', 'noopener,noreferrer');
      } else {
        showToast({ type: 'info', text1: t('manageCampaigns.manager.paypalOrderCreated', 'PayPal order created'), text2: response?.message });
      }
      setShowFundsModal(false);
      setFundAmount('');
      dispatch(fetchAllFunds());
    } catch (fundError: any) {
      showToast({
        type: 'error',
        text1: t('manageCampaigns.manager.fundsNotAddedTitle', 'Funds not added'),
        text2: fundError?.message || String(fundError || t('manageCampaigns.manager.tryAgainFallback', 'Please try again.')),
      });
    }
  };

  const handleRenewCampaign = async (campaignId: number) => {
    const startDate = await promptAppInput({
      title: t('manageCampaigns.manager.renewCampaignTitle', 'Renew campaign'),
      inputLabel: t('manageCampaigns.manager.startDateLabel', 'Start date'),
      inputValue: getDateInputValue(0),
      confirmButtonText: t('manageCampaigns.manager.nextButton', 'Next'),
      input: 'date',
    });
    if (!startDate) return;

    const endDate = await promptAppInput({
      title: t('manageCampaigns.manager.renewCampaignTitle', 'Renew campaign'),
      inputLabel: t('manageCampaigns.manager.endDateLabel', 'End date'),
      inputValue: getDateInputValue(30),
      confirmButtonText: t('manageCampaigns.manager.renewButton', 'Renew'),
      input: 'date',
    });
    if (!endDate) return;

    try {
      await dispatch(
        renewCampaign({
          campaign_id: campaignId,
          start_date: startDate,
          end_date: endDate,
        }),
      ).unwrap();
      showToast({ type: 'success', text1: t('manageCampaigns.manager.campaignRenewedTitle', 'Campaign renewed') });
      dispatch(fetchMyCampaigns());
    } catch (renewError: any) {
      showToast({
        type: 'error',
        text1: t('manageCampaigns.manager.campaignNotRenewedTitle', 'Campaign not renewed'),
        text2: renewError?.message || String(renewError || t('manageCampaigns.manager.tryAgainFallback', 'Please try again.')),
      });
    }
  };

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('manageCampaigns.manager.heading', 'Campaign Manager')}
          </h1>
        </div>

        <button
          onClick={() => navigate('/campaigns/create')}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '12px' }}
        >
          <Plus size={16} />
          <span>{t('manageCampaigns.manager.newCampaignButton', 'New Campaign')}</span>
        </button>
      </div>

      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('manageCampaigns.manager.availableFundsLabel', 'Available campaign funds')}</span>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {fundsLoading ? t('manageCampaigns.manager.loading', 'Loading...') : `$${totalFunds.toFixed(2)}`}
          </h2>
        </div>
        <Button
          title={t('manageCampaigns.manager.addFundsButton', 'Add Funds')}
          onClick={() => setShowFundsModal(true)}
          style={{ padding: '8px 14px', fontSize: '13px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading && myCampaigns.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('manageCampaigns.manager.loadingCampaigns', 'Loading campaigns...')}
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: '16px', color: '#EF4444', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {!loading && myCampaigns.length === 0 && !error && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('manageCampaigns.manager.noCampaigns', 'No campaigns created yet.')}
          </div>
        )}

        {myCampaigns.map((c) => (
          <div
            key={c.id}
            className="card"
            onClick={() => navigate(`/campaigns/${c.id}`)}
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {c.sponsor}
              </h3>
              <span className={`pill-badge ${c.is_active ? 'pill-green' : 'pill-gold'}`}>
                {c.is_active
                  ? t('manageCampaigns.manager.activeStatus', 'Active')
                  : t('manageCampaigns.manager.inactiveStatus', 'Inactive')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>
                {t('manageCampaigns.manager.approvalLabel', 'Approval:')}{' '}
                <strong style={{ color: c.is_approved ? 'var(--green)' : '#D5AD60' }}>
                  {c.is_approved
                    ? t('manageCampaigns.manager.approvedStatus', 'Approved')
                    : t('manageCampaigns.manager.pendingStatus', 'Pending')}
                </strong>
              </span>
              <span>
                {t('manageCampaigns.manager.typeLabel', 'Type:')}{' '}
                <strong style={{ color: '#D5AD60' }}>{c.type || t('manageCampaigns.manager.campaignFallback', 'Campaign')}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRenewCampaign(c.id);
                }}
                style={{ padding: '7px 12px', fontSize: '12px', borderRadius: '10px' }}
              >
                {t('manageCampaigns.manager.renewButton', 'Renew')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <CustomModal
        visible={showFundsModal}
        onClose={() => setShowFundsModal(false)}
        title={t('manageCampaigns.manager.addFundsModalTitle', 'Add Campaign Funds')}
        maxWidth="420px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormInput
            label={t('manageCampaigns.manager.amountLabel', 'Amount')}
            type="number"
            placeholder={t('manageCampaigns.manager.amountPlaceholder', '100')}
            value={fundAmount}
            onChange={(event) => setFundAmount(event.target.value)}
          />
          <Button
            title={t('manageCampaigns.manager.continueToPaypalButton', 'Continue to PayPal')}
            onClick={handleAddFunds}
            loading={addFundsLoading}
            style={{ width: '100%' }}
          />
        </div>
      </CustomModal>
    </Container>
  );
};

export default ManageCampaigns;
