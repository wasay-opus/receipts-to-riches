import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  X,
} from 'lucide-react';
import { Button, Container, showToast } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchMyCampaigns, storeCampaign } from '../../redux/Slices/campaignsSlice';
import { useLocationsDispatch, useLocationsState } from '../../redux/Hooks/useLocationsHooks';
import { getUSDateYYYYMMDD } from '../../utils/usTime';

export const CreateCampaign: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const isSubmitting = useSelector(
    (state: RootState) => state.campaigns.storeCampaignLoading,
  );

  const { fetchAllStates } = useLocationsDispatch();
  const { states, statesLoading } = useLocationsState();

  const [targetingOption, setTargetingOption] = useState<'global' | 'targeted'>('global');
  const [adType, setAdType] = useState<'image' | 'video'>('image');
  const [sponsor, setSponsor] = useState('');
  const [url, setUrl] = useState('');
  const [startDate, setStartDate] = useState(getUSDateYYYYMMDD());
  const [endDate, setEndDate] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (targetingOption === 'targeted' && states.length === 0) {
      fetchAllStates();
    }
  }, [targetingOption, states.length, fetchAllStates]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCampaignFile(file);
    if (file) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sponsor.trim()) {
      showToast({ type: 'error', text1: 'Sponsor name is required' });
      return;
    }
    if (!url.trim()) {
      showToast({ type: 'error', text1: 'Website URL is required' });
      return;
    }
    if (!startDate) {
      showToast({ type: 'error', text1: 'Start date is required' });
      return;
    }
    if (!endDate) {
      showToast({ type: 'error', text1: 'End date is required' });
      return;
    }
    if (!campaignFile) {
      showToast({ type: 'error', text1: 'Campaign media file is required' });
      return;
    }
    if (targetingOption === 'targeted' && !selectedState) {
      showToast({ type: 'error', text1: 'Please select a state for targeting' });
      return;
    }

    const formData = new FormData();
    formData.append('file', campaignFile, campaignFile.name);
    formData.append('type', adType);
    formData.append('sponsor', sponsor.trim());
    formData.append('url', url.trim());
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);

    if (targetingOption === 'targeted' && selectedState) {
      formData.append('is_global', '0');
      formData.append('locations[0][type]', 'state');
      formData.append('locations[0][value]', selectedState);
    } else {
      formData.append('is_global', '1');
    }

    try {
      await dispatch(storeCampaign(formData)).unwrap();
      showToast({
        type: 'success',
        text1: 'Campaign Created Successfully',
        text2: 'Your ad has been submitted for review.',
      });
      dispatch(fetchMyCampaigns());
      navigate('/campaigns');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Failed to Create Campaign',
        text2: error?.message || String(error || 'Please try again.'),
      });
    }
  };

  return (
    <Container maxWidth="560px" style={{ gap: '20px', paddingBottom: '40px' }}>
      {/* 1. Header (Screenshot 4) */}
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
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Request New Ad
        </h1>
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '-8px 0 0 0' }}>
        Upload your campaign media and submit the placement details.
      </p>

      {/* 2. Form Controls matching Screenshot 4 */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Targeting Options */}
        <div style={{ position: 'relative' }}>
          <select
            value={targetingOption}
            onChange={(e) => setTargetingOption(e.target.value as any)}
            style={{
              width: '100%',
              padding: '14px 40px 14px 18px',
              borderRadius: '24px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="global">Global (All Locations)</option>
            <option value="targeted">Location-Targeted (State)</option>
          </select>
          <ChevronDown
            size={18}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#009944',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Select Ad Type */}
        <div style={{ position: 'relative' }}>
          <select
            value={adType}
            onChange={(e) => setAdType(e.target.value as any)}
            style={{
              width: '100%',
              padding: '14px 40px 14px 18px',
              borderRadius: '24px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="image">Image Ad</option>
            <option value="video">Video Ad</option>
          </select>
          <ChevronDown
            size={18}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#009944',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Sponsor */}
        <input
          className="form-input"
          type="text"
          placeholder="Sponsor"
          value={sponsor}
          onChange={(e) => setSponsor(e.target.value)}
          required
          style={{
            borderRadius: '24px',
            padding: '14px 18px',
            fontSize: '14px',
          }}
        />

        {/* URL */}
        <input
          className="form-input"
          type="url"
          placeholder="URL (e.g. https://yourbrand.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{
            borderRadius: '24px',
            padding: '14px 18px',
            fontSize: '14px',
          }}
        />

        {/* Start Date */}
        <div style={{ position: 'relative' }}>
          <input
            type="date"
            placeholder="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '24px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          />
        </div>

        {/* End Date */}
        <div style={{ position: 'relative' }}>
          <input
            type="date"
            placeholder="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '24px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          />
        </div>

        {/* State Dropdown (Conditional on Targeted option) */}
        {targetingOption === 'targeted' && (
          <div style={{ position: 'relative' }}>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={statesLoading}
              style={{
                width: '100%',
                padding: '14px 40px 14px 18px',
                borderRadius: '24px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              <option value="">{statesLoading ? 'Loading states...' : 'Select Target State'}</option>
              {states.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#009944',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* Upload Campaign Media Dashed Box (Screenshot 4) */}
        <label
          style={{
            border: '2px dashed var(--border-color)',
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="file"
            accept={adType === 'video' ? 'video/*' : 'image/*'}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(0, 153, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#009944',
              flexShrink: 0,
            }}
          >
            <Upload size={24} />
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {campaignFile ? campaignFile.name : 'Upload campaign media'}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {campaignFile ? `${(campaignFile.size / 1024 / 1024).toFixed(2)} MB` : 'Select an image or video from your gallery'}
            </p>
          </div>
        </label>

        {/* Preview if image */}
        {filePreview && adType === 'image' && (
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              maxHeight: '200px',
              background: 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={filePreview} alt="Ad Preview" style={{ maxHeight: '200px', width: 'auto', objectFit: 'contain' }} />
            <button
              type="button"
              onClick={() => {
                setCampaignFile(null);
                setFilePreview(null);
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Create Button (Screenshot 4) */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            background: '#009944',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '28px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 800,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(0, 153, 68, 0.35)',
            marginTop: '8px',
            opacity: isSubmitting ? 0.7 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
      </form>
    </Container>
  );
};

export default CreateCampaign;
