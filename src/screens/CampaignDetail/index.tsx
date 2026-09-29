import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ExternalLink, ScanLine } from 'lucide-react';
import { Button, Container, showToast } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import {
  fetchAllCampaigns,
  fetchMyCampaigns,
  incrementClicks,
} from '../../redux/Slices/campaignsSlice';

const formatDisplayDate = (value?: string): string => {
  if (!value) return '--';
  const dateOnly = value.split('T')[0];
  const parsedDate = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return '--';
  return parsedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const CampaignDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { allCampaigns, myCampaigns, loading } = useSelector((state: RootState) => state.campaigns);

  useEffect(() => {
    dispatch(fetchAllCampaigns(undefined));
    dispatch(fetchMyCampaigns());
  }, [dispatch]);

  const campaign = useMemo(() => {
    const all = [...(allCampaigns ?? []), ...(myCampaigns ?? [])];
    return all.find((item) => String(item.id) === String(id));
  }, [allCampaigns, id, myCampaigns]);

  const isVideo = campaign?.type?.trim().toLowerCase() === 'video';

  const handleOpenWebsite = async () => {
    if (!campaign?.url) return;

    try {
      await dispatch(incrementClicks(campaign.id)).unwrap();
    } catch {
      // Click tracking failure should not block opening the campaign website.
    }
    window.open(campaign.url, '_blank', 'noopener,noreferrer');
  };

  if (!campaign && loading) {
    return (
      <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
        <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
          {t('manageCampaigns.campaignDetail.loading', 'Loading campaign...')}
        </div>
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
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
        <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
          {t('manageCampaigns.campaignDetail.notFound', 'Campaign not found.')}
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
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
          {t('manageCampaigns.campaignDetail.heading', 'Campaign Details')}
        </h1>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={`pill-badge ${campaign.is_active ? 'pill-green' : 'pill-gold'}`}>
            {campaign.is_active
              ? t('manageCampaigns.campaignDetail.activeBadge', 'ACTIVE CAMPAIGN')
              : t('manageCampaigns.campaignDetail.inactiveBadge', 'INACTIVE CAMPAIGN')}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {t('manageCampaigns.campaignDetail.idLabel', 'ID: {{id}}', { id: campaign.id })}
          </span>
        </div>

        {campaign.file_url && (
          <div style={{ width: '100%', maxHeight: '320px', borderRadius: '14px', overflow: 'hidden', background: 'var(--bg-card-secondary)' }}>
            {isVideo ? (
              <video src={campaign.file_url} controls style={{ width: '100%', maxHeight: '320px' }} />
            ) : (
              <img src={campaign.file_url} alt={campaign.sponsor} style={{ width: '100%', maxHeight: '320px', objectFit: 'contain' }} />
            )}
          </div>
        )}

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
          {campaign.sponsor}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '8px' }}>
          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-card-secondary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('manageCampaigns.campaignDetail.approvalLabel', 'Approval')}</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: campaign.is_approved ? 'var(--green)' : '#D5AD60', marginTop: '4px' }}>
              {campaign.is_approved
                ? t('manageCampaigns.campaignDetail.approvedStatus', 'Approved')
                : t('manageCampaigns.campaignDetail.pendingStatus', 'Pending')}
            </h3>
          </div>

          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-card-secondary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('manageCampaigns.campaignDetail.typeLabel', 'Type')}</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#D5AD60', marginTop: '4px', textTransform: 'capitalize' }}>
              {campaign.type || t('manageCampaigns.campaignDetail.typeFallback', 'Campaign')}
            </h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-card-secondary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('manageCampaigns.campaignDetail.startDateLabel', 'Start Date')}</span>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
              {formatDisplayDate(campaign.start_date)}
            </p>
          </div>
          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-card-secondary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('manageCampaigns.campaignDetail.endDateLabel', 'End Date')}</span>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
              {formatDisplayDate(campaign.end_date)}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <Button
            onClick={() => navigate('/scan')}
            title={t('manageCampaigns.campaignDetail.uploadReceiptButton', 'Upload Receipt')}
            icon={<ScanLine size={18} />}
            style={{ flex: 1 }}
          />
          <Button
            onClick={handleOpenWebsite}
            title={t('manageCampaigns.campaignDetail.openSiteButton', 'Open Site')}
            icon={<ExternalLink size={18} />}
            variant="secondary"
            disabled={!campaign.url}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </Container>
  );
};

export default CampaignDetail;
