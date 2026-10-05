import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Plus,
  Wallet,
  Calendar,
  Eye,
  MousePointer,
  Sparkles,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Button, Container, CustomModal, FormInput, showToast } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchMyCampaigns, renewCampaign } from '../../redux/Slices/campaignsSlice';
import { addFunds, fetchAllFunds } from '../../redux/Slices/fundsSlice';
import { promptAppInput } from '../../utils/sweetAlert';

type CampaignTab = 'active' | 'expired' | 'pending' | 'rejected';

export const ManageCampaigns: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { myCampaigns, loading: campaignsLoading, error: campaignsError } = useSelector(
    (state: RootState) => state.campaigns,
  );
  const { balance, loading: fundsLoading, addFundsLoading } = useSelector(
    (state: RootState) => state.funds,
  );

  const [activeTab, setActiveTab] = useState<CampaignTab>('active');
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

  // Group user campaigns by status tab matching Screenshot 3
  const groupedCampaigns = useMemo(() => {
    const active: typeof myCampaigns = [];
    const expired: typeof myCampaigns = [];
    const pending: typeof myCampaigns = [];
    const rejected: typeof myCampaigns = [];

    const now = new Date().getTime();

    myCampaigns.forEach((campaign) => {
      const isApproved = Number(campaign.is_approved);
      const isActive = Number(campaign.is_active);
      const isRejected =
        Boolean(campaign.rejection_reason) || isApproved === -1 || isApproved === 2;
      const isEndPassed = campaign.end_date
        ? new Date(campaign.end_date).getTime() < now
        : false;

      if (isRejected) {
        rejected.push(campaign);
      } else if (isApproved === 0) {
        pending.push(campaign);
      } else if (isApproved === 1 && (isActive === 0 || isEndPassed)) {
        expired.push(campaign);
      } else {
        active.push(campaign);
      }
    });

    return { active, expired, pending, rejected };
  }, [myCampaigns]);

  const currentTabList = groupedCampaigns[activeTab] || [];

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PAYPAL_PAYMENT_SUCCESS') {
        showToast({
          type: 'success',
          text1: 'Payment Successful',
          text2: 'Funds have been added to your account.',
        });
        dispatch(fetchAllFunds());
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch]);

  const handleAddFunds = async () => {
    const amount = Number(fundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ type: 'error', text1: 'Enter a valid amount' });
      return;
    }

    try {
      const response = await dispatch(addFunds(amount)).unwrap();
      const approvalUrl = response?.data?.approval_url ?? response?.data?.approvalUrl;
      if (approvalUrl) {
        window.open(approvalUrl, '_blank');
      } else {
        showToast({
          type: 'info',
          text1: 'PayPal Order Created',
          text2: response?.message || 'Redirecting to PayPal...',
        });
      }
      setShowFundsModal(false);
      setFundAmount('');
      dispatch(fetchAllFunds());
    } catch (fundError: any) {
      showToast({
        type: 'error',
        text1: 'Funds Not Added',
        text2: fundError?.message || String(fundError || 'Please try again.'),
      });
    }
  };

  const handleRenewCampaign = async (campaignId: number) => {
    const startDate = await promptAppInput({
      title: 'Renew Campaign',
      inputLabel: 'Start Date',
      inputValue: getDateInputValue(0),
      confirmButtonText: 'Next',
      input: 'date',
    });
    if (!startDate) return;

    const endDate = await promptAppInput({
      title: 'Renew Campaign',
      inputLabel: 'End Date',
      inputValue: getDateInputValue(30),
      confirmButtonText: 'Renew',
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
      showToast({ type: 'success', text1: 'Campaign Renewed Successfully' });
      dispatch(fetchMyCampaigns());
    } catch (renewError: any) {
      showToast({
        type: 'error',
        text1: 'Campaign Not Renewed',
        text2: renewError?.message || String(renewError || 'Please try again.'),
      });
    }
  };

  const emptyMessages: Record<CampaignTab, { title: string; desc: string }> = {
    active: {
      title: 'No active campaigns',
      desc: 'Campaigns in this category will appear here once they are active.',
    },
    expired: {
      title: 'No expired campaigns',
      desc: 'Campaigns in this category will appear here once they expire.',
    },
    pending: {
      title: 'No pending campaigns',
      desc: 'Campaigns in this category will appear here once submitted for review.',
    },
    rejected: {
      title: 'No rejected campaigns',
      desc: 'Campaigns in this category will appear here once they are available.',
    },
  };

  return (
    <Container maxWidth="600px" style={{ gap: '20px', paddingBottom: '70px', position: 'relative' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
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
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          Manage Campaigns
        </h1>
      </div>

      {/* 2. Total Balance Card (Screenshot 3) */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              TOTAL BALANCE
            </span>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 900,
                color: 'var(--text-main)',
                marginTop: '4px',
                letterSpacing: '-0.5px',
              }}
            >
              {fundsLoading ? '$...' : `$${balance.toFixed(2)}`}
            </h2>
          </div>

          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: 'rgba(0, 153, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#009944',
            }}
          >
            <Wallet size={26} />
          </div>
        </div>

        <button
          onClick={() => setShowFundsModal(true)}
          style={{
            width: '100%',
            background: '#009944',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 153, 68, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#00853B')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#009944')}
        >
          <Plus size={18} />
          <span>Add Funds</span>
        </button>
      </div>

      {/* 3. Campaigns Header & Filter Tabs (Screenshot 3) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          Campaigns
        </h3>

        {/* 4 Tabs: Active, Expired, Pending, Rejected */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px',
          }}
        >
          {(
            [
              { key: 'active', label: 'Active', count: groupedCampaigns.active.length },
              { key: 'expired', label: 'Expired', count: groupedCampaigns.expired.length },
              { key: 'pending', label: 'Pending', count: groupedCampaigns.pending.length },
              { key: 'rejected', label: 'Rejected', count: groupedCampaigns.rejected.length },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 4px',
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid #009944' : '3px solid transparent',
                  marginBottom: '-9px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  }}
                >
                  {tab.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    background: isActive ? '#009944' : 'var(--bg-card-secondary)',
                    color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Campaigns List / Empty State (Screenshot 3) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {campaignsLoading && myCampaigns.length === 0 && (
          <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading campaigns...
          </div>
        )}

        {!campaignsLoading && currentTabList.length === 0 && (
          <div
            className="card"
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {emptyMessages[activeTab].title}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '340px' }}>
              {emptyMessages[activeTab].desc}
            </p>
          </div>
        )}

        {!campaignsLoading &&
          currentTabList.map((c) => (
            <div
              key={c.id}
              className="card"
              onClick={() => navigate(`/campaigns/${c.id}`)}
              style={{
                padding: '18px 20px',
                borderRadius: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {c.sponsor}
                </h4>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background:
                      activeTab === 'active'
                        ? 'rgba(0, 153, 68, 0.15)'
                        : activeTab === 'pending'
                        ? 'rgba(213, 173, 96, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      activeTab === 'active'
                        ? '#009944'
                        : activeTab === 'pending'
                        ? '#D5AD60'
                        : '#EF4444',
                    textTransform: 'capitalize',
                  }}
                >
                  {activeTab}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '18px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <span>Type: <strong style={{ color: 'var(--text-main)' }}>{c.type}</strong></span>
                {c.start_date && (
                  <span>
                    Dates: <strong style={{ color: 'var(--text-main)' }}>{c.start_date} → {c.end_date || 'N/A'}</strong>
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenewCampaign(c.id);
                  }}
                  style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '10px' }}
                >
                  Renew
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* 5. Bottom Request New Ad Button (Screenshot 3) */}
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/campaigns/create')}
          style={{
            background: '#009944',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '28px',
            padding: '14px 28px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 6px 18px rgba(0, 153, 68, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Plus size={20} />
          <span>Request New Ad</span>
        </button>
      </div>

      {/* Add Funds Modal */}
      <CustomModal
        visible={showFundsModal}
        onClose={() => setShowFundsModal(false)}
        title="Add Campaign Funds"
        maxWidth="420px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormInput
            label="Amount (USD)"
            type="number"
            placeholder="e.g. 50"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
          />
          <Button
            title="Continue to PayPal"
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
