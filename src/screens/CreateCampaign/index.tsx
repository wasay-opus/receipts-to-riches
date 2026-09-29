import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Megaphone, DollarSign, Gift, CheckCircle, MapPin } from 'lucide-react';
import { Button, Container, FormInput, showToast } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchMyCampaigns, storeCampaign } from '../../redux/Slices/campaignsSlice';
import { useLocationsDispatch, useLocationsState } from '../../redux/Hooks/useLocationsHooks';

export const CreateCampaign: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const isSubmitting = useSelector((state: RootState) => state.campaigns.storeCampaignLoading);

  const {
    fetchAllStates,
    fetchCitiesByState,
    fetchZipCodesByCity,
    clearCities,
    clearZipCodes,
  } = useLocationsDispatch();
  const { states, statesLoading, cities, citiesLoading, zipCodes, zipCodesLoading } = useLocationsState();

  const [targetLocation, setTargetLocation] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedZip, setSelectedZip] = useState('');

  useEffect(() => {
    if (targetLocation && states.length === 0) {
      fetchAllStates();
    }
  }, [targetLocation, states.length, fetchAllStates]);

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedCityId('');
    setSelectedZip('');
    clearZipCodes();
    if (stateId) {
      fetchCitiesByState(stateId);
    } else {
      clearCities();
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedZip('');
    if (cityId) {
      fetchZipCodesByCity(cityId);
    } else {
      clearZipCodes();
    }
  };

  const validationSchema = Yup.object().shape({
    sponsor: Yup.string().required(t('manageCampaigns.createCampaign.validation.sponsorRequired', 'Sponsor is required')),
    url: Yup.string()
      .url(t('manageCampaigns.createCampaign.validation.urlInvalid', 'Enter a valid website URL'))
      .required(t('manageCampaigns.createCampaign.validation.urlRequired', 'Website URL is required')),
    type: Yup.string().oneOf(['image', 'video']).required(t('manageCampaigns.createCampaign.validation.typeRequired', 'Campaign type is required')),
    startDate: Yup.string().required(t('manageCampaigns.createCampaign.validation.startDateRequired', 'Start date is required')),
    endDate: Yup.string().required(t('manageCampaigns.createCampaign.validation.endDateRequired', 'End date is required')),
  });

  const handleSubmit = async (values: any) => {
    if (!campaignFile) {
      showToast({ type: 'error', text1: t('manageCampaigns.createCampaign.mediaRequiredToast', 'Campaign media is required') });
      return;
    }
    if (targetLocation && !selectedStateId) {
      showToast({ type: 'error', text1: t('manageCampaigns.createCampaign.selectStateToast', 'Select a state to target, or turn off location targeting') });
      return;
    }

    const formData = new FormData();
    formData.append('file', campaignFile, campaignFile.name);
    formData.append('type', values.type);
    formData.append('sponsor', values.sponsor.trim());
    formData.append('url', values.url.trim());
    formData.append('start_date', values.startDate);
    formData.append('end_date', values.endDate);

    if (targetLocation && selectedStateId) {
      formData.append('is_global', '0');
      const stateName = states.find((s) => String(s.id) === selectedStateId)?.name ?? '';
      const cityName = cities.find((c) => String(c.id) === selectedCityId)?.name ?? '';

      if (selectedZip) {
        formData.append('locations[0][type]', 'zip');
        formData.append('locations[0][value]', selectedZip);
      } else if (selectedCityId) {
        formData.append('locations[0][type]', 'city');
        formData.append('locations[0][value]', cityName);
      } else {
        formData.append('locations[0][type]', 'state');
        formData.append('locations[0][value]', stateName);
      }
    } else {
      formData.append('is_global', '1');
    }

    try {
      await dispatch(storeCampaign(formData)).unwrap();
      showToast({
        type: 'success',
        text1: t('manageCampaigns.createCampaign.submittedTitle', 'Campaign Submitted!'),
        text2: t('manageCampaigns.createCampaign.submittedMessage', 'Your campaign has been submitted for review.'),
      });
      dispatch(fetchMyCampaigns());
      navigate('/campaigns');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('manageCampaigns.createCampaign.notSavedTitle', 'Campaign not saved'),
        text2: error?.message || String(error || t('manageCampaigns.createCampaign.tryAgainFallback', 'Please try again.')),
      });
    }
  };

  return (
    <Container maxWidth="540px" style={{ gap: '20px', paddingBottom: '40px' }}>
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
          {t('manageCampaigns.createCampaign.heading', 'Launch Brand Campaign')}
        </h1>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <Formik
          initialValues={{ sponsor: '', url: '', type: 'image', startDate: '', endDate: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormInput
                label={t('manageCampaigns.createCampaign.sponsorLabel', 'Sponsor / Brand')}
                placeholder={t('manageCampaigns.createCampaign.sponsorPlaceholder', 'e.g. Organic Valley')}
                name="sponsor"
                value={values.sponsor}
                onChange={handleChange('sponsor')}
                onBlur={handleBlur('sponsor')}
                error={touched.sponsor && errors.sponsor ? (errors.sponsor as string) : undefined}
                leftIcon={<Megaphone size={18} />}
              />

              <FormInput
                label={t('manageCampaigns.createCampaign.urlLabel', 'Website URL')}
                placeholder={t('manageCampaigns.createCampaign.urlPlaceholder', 'https://example.com')}
                name="url"
                value={values.url}
                onChange={handleChange('url')}
                onBlur={handleBlur('url')}
                error={touched.url && errors.url ? (errors.url as string) : undefined}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>
                  {t('manageCampaigns.createCampaign.typeLabel', 'Campaign Type')}
                  <select
                    className="form-input"
                    name="type"
                    value={values.type}
                    onChange={handleChange('type')}
                    onBlur={handleBlur('type')}
                  >
                    <option value="image">{t('manageCampaigns.createCampaign.typeImage', 'Image')}</option>
                    <option value="video">{t('manageCampaigns.createCampaign.typeVideo', 'Video')}</option>
                  </select>
                </label>

                <FormInput
                  label={t('manageCampaigns.createCampaign.startDateLabel', 'Start Date')}
                  type="date"
                  name="startDate"
                  value={values.startDate}
                  onChange={handleChange('startDate')}
                  onBlur={handleBlur('startDate')}
                  error={touched.startDate && errors.startDate ? (errors.startDate as string) : undefined}
                  leftIcon={<DollarSign size={18} />}
                />
              </div>

              <FormInput
                label={t('manageCampaigns.createCampaign.endDateLabel', 'End Date')}
                type="date"
                name="endDate"
                value={values.endDate}
                onChange={handleChange('endDate')}
                onBlur={handleBlur('endDate')}
                error={touched.endDate && errors.endDate ? (errors.endDate as string) : undefined}
                leftIcon={<Gift size={18} />}
              />

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>
                {t('manageCampaigns.createCampaign.mediaLabel', 'Campaign Media')}
                <input
                  className="form-input"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(event) => setCampaignFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={targetLocation}
                    onChange={(event) => {
                      setTargetLocation(event.target.checked);
                      if (!event.target.checked) {
                        setSelectedStateId('');
                        setSelectedCityId('');
                        setSelectedZip('');
                      }
                    }}
                  />
                  <MapPin size={16} />
                  {t('manageCampaigns.createCampaign.targetLocationLabel', 'Target a specific location (default: shown everywhere)')}
                </label>

                {targetLocation && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t('manageCampaigns.createCampaign.stateLabel', 'State')}
                      <select
                        className="form-input"
                        value={selectedStateId}
                        onChange={(event) => handleStateChange(event.target.value)}
                        disabled={statesLoading}
                      >
                        <option value="">{statesLoading ? t('manageCampaigns.createCampaign.loadingOption', 'Loading...') : t('manageCampaigns.createCampaign.selectStateOption', 'Select state')}</option>
                        {states.map((state) => (
                          <option key={state.id} value={String(state.id)}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t('manageCampaigns.createCampaign.cityLabel', 'City (optional)')}
                      <select
                        className="form-input"
                        value={selectedCityId}
                        onChange={(event) => handleCityChange(event.target.value)}
                        disabled={!selectedStateId || citiesLoading}
                      >
                        <option value="">{citiesLoading ? t('manageCampaigns.createCampaign.loadingOption', 'Loading...') : t('manageCampaigns.createCampaign.allCitiesOption', 'All cities')}</option>
                        {cities.map((city) => (
                          <option key={city.id} value={String(city.id)}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t('manageCampaigns.createCampaign.zipLabel', 'Zip (optional)')}
                      <select
                        className="form-input"
                        value={selectedZip}
                        onChange={(event) => setSelectedZip(event.target.value)}
                        disabled={!selectedCityId || zipCodesLoading}
                      >
                        <option value="">{zipCodesLoading ? t('manageCampaigns.createCampaign.loadingOption', 'Loading...') : t('manageCampaigns.createCampaign.allZipsOption', 'All zips')}</option>
                        {zipCodes.map((zip) => (
                          <option key={zip.id} value={zip.name}>
                            {zip.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                title={t('manageCampaigns.createCampaign.submitButton', 'Create & Submit Campaign')}
                icon={<CheckCircle size={18} />}
                loading={isSubmitting}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </form>
          )}
        </Formik>
      </div>
    </Container>
  );
};

export default CreateCampaign;
