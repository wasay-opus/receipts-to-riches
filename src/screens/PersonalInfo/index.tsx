import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Formik, FormikProps, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, User, Mail, Phone, Calendar, Save, Camera, MapPin, AlertCircle, RotateCcw } from 'lucide-react';
import { AppDispatch, RootState } from '../../redux/Store';
import { Button, Container, FormInput, showToast } from '../../components';
import { editProfile, fetchUser } from '../../redux/Slices/userSlice';
import { getUserFullName, splitFullName } from '../../utils/userDisplay';
import { confirmUnsavedChanges } from '../../utils/sweetAlert';
import images from '../../constants/images';

// Internal helper component to synchronize Formik dirty state to parent in real time
const FormDirtyWatcher: React.FC<{
  avatarChanged: boolean;
  onDirtyChange: (isDirty: boolean) => void;
}> = ({ avatarChanged, onDirtyChange }) => {
  const { dirty } = useFormikContext<any>();

  useEffect(() => {
    onDirtyChange(dirty || avatarChanged);
  }, [dirty, avatarChanged, onDirtyChange]);

  return null;
};

export const PersonalInfo: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user?.userData);
  const updateLoading = useSelector((state: RootState) => state.user?.editProfileLoading);
  const fullName = getUserFullName(user);

  const formikRef = useRef<FormikProps<any>>(null);
  const saveSectionRef = useRef<HTMLDivElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.image_url || user?.image || null
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setHasChanges(true);
    }
  };

  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required(t('validation.firstNameRequired', 'First name is required')),
    last_name: Yup.string().required(t('validation.lastNameRequired', 'Last name is required')),
    email: Yup.string().email(t('validation.invalidEmail', 'Invalid email')).required(t('validation.emailRequired', 'Email is required')),
    phone: Yup.string(),
    bio: Yup.string(),
    dob: Yup.string(),
    address: Yup.string(),
    city: Yup.string(),
    state: Yup.string(),
    zip_code: Yup.string(),
  });

  const handleSubmit = async (values: any) => {
    const payload = new FormData();
    payload.append('first_name', values.first_name.trim());
    payload.append('last_name', values.last_name.trim());
    payload.append('name', `${values.first_name.trim()} ${values.last_name.trim()}`);
    payload.append('phone', values.phone?.trim?.() ?? '');
    payload.append('bio', values.bio?.trim?.() ?? '');
    if (values.dob) payload.append('dob', values.dob);
    if (values.address) payload.append('address', values.address.trim());
    if (values.city) payload.append('city', values.city.trim());
    if (values.state) payload.append('state', values.state.trim());
    if (values.zip_code) payload.append('zip_code', values.zip_code.trim());

    if (avatarFile) {
      payload.append('image', avatarFile);
    }

    try {
      await dispatch(editProfile(payload)).unwrap();
      await dispatch(fetchUser()).unwrap();
      setAvatarFile(null);
      setHasChanges(false);
      showToast({
        type: 'success',
        text1: t('personalInfo.profileUpdated', 'Profile Updated!'),
        text2: t('personalInfo.profileUpdatedDesc', 'Your personal information and bio have been saved.'),
      });
      navigate('/profile');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('personalInfo.profileNotSaved', 'Profile not saved'),
        text2: error?.message || t('personalInfo.tryAgain', 'Please try again.'),
      });
    }
  };

  const handleBack = async () => {
    const isDirty = hasChanges || Boolean(formikRef.current?.dirty) || avatarFile !== null;

    if (!isDirty) {
      navigate(-1);
      return;
    }

    // 1. Smoothly scroll down to the Save Changes section
    saveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setIsHighlighted(true);

    // 2. Short delay so user clearly sees the scroll to Save Changes before dialog appears
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 3. Prompt user: "Want to save changes?"
    const action = await confirmUnsavedChanges({
      title: t('personalInfo.wantToSaveChanges', 'Want to save changes?'),
      text: t('personalInfo.unsavedChangesText', 'You made changes to your personal information. Would you like to save them before leaving?'),
      saveButtonText: t('personalInfo.saveChangesButton', 'Save Changes'),
      discardButtonText: t('personalInfo.discardChangesButton', 'Discard & Exit'),
      keepEditingButtonText: t('personalInfo.keepEditingButton', 'Keep Editing'),
    });

    if (action === 'save') {
      formikRef.current?.submitForm();
    } else if (action === 'discard') {
      formikRef.current?.resetForm();
      setAvatarFile(null);
      setAvatarPreview(user?.image_url || user?.image || null);
      setHasChanges(false);
      navigate(-1);
    } else {
      // Keep editing - keep highlight pulse active for visual emphasis
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 3000);
    }
  };

  const handleDiscard = () => {
    formikRef.current?.resetForm();
    setAvatarFile(null);
    setAvatarPreview(user?.image_url || user?.image || null);
    setHasChanges(false);
    showToast({
      type: 'info',
      text1: t('personalInfo.discard', 'Changes Discarded'),
      text2: t('personalInfo.revertedToSaved', 'Form has been reset to saved values.'),
    });
  };

  // Browser reload / tab close protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const { firstName, lastName } = splitFullName(fullName);

  return (
    <Container maxWidth="720px" style={{ gap: '22px', paddingBottom: '90px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go Back"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {t('profile.personalInfo', 'Personal Information')}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t('personalInfo.subtitle', 'Update your personal profile details and contact information')}
            </p>
          </div>
        </div>

        {hasChanges && (
          <span
            className="pill-badge pill-gold"
            style={{ fontSize: '12px', padding: '6px 12px', animation: 'pulse 2s infinite' }}
          >
            <AlertCircle size={14} />
            <span>{t('personalInfo.unsavedBadge', 'Unsaved changes')}</span>
          </span>
        )}
      </div>

      <div className="card" style={{ padding: '28px', borderRadius: '22px' }}>
        {/* Avatar Upload Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--bg-card-secondary)',
                border: avatarFile ? '3px solid #D5AD60' : '3px solid var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: avatarFile ? '0 0 20px rgba(213, 173, 96, 0.45)' : 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
              }}
            >
              <img
                src={avatarPreview || images.example || images.Profile}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = images.example || images.Profile;
                }}
              />
            </div>
            <label
              title="Change profile picture"
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--green)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
                transition: 'transform 0.15s ease',
              }}
            >
              <Camera size={17} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <span style={{ fontSize: '13px', color: avatarFile ? '#D5AD60' : 'var(--text-muted)', fontWeight: avatarFile ? 600 : 400 }}>
            {avatarFile ? t('personalInfo.newPhotoSelected', 'New photo selected (unsaved)') : t('personalInfo.tapToChangePhoto', 'Tap camera to change photo')}
          </span>
        </div>

        <Formik
          innerRef={formikRef}
          enableReinitialize
          initialValues={{
            first_name: user?.first_name || firstName || '',
            last_name: user?.last_name || lastName || '',
            bio: user?.bio || user?.description || '',
            email: user?.email || '',
            phone: user?.phone || '',
            dob: user?.dob || '',
            address: user?.address || '',
            city: user?.city || '',
            state: user?.state || '',
            zip_code: user?.zip_code || '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, dirty }) => (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormDirtyWatcher avatarChanged={avatarFile !== null} onDirtyChange={setHasChanges} />

              {/* Row 1: First Name (50%) + Last Name (50%) */}
              <div className="form-grid-2">
                <FormInput
                  label={t('personalInfo.firstName', 'First Name')}
                  name="first_name"
                  placeholder="First Name"
                  value={values.first_name}
                  onChange={handleChange('first_name')}
                  onBlur={handleBlur('first_name')}
                  error={touched.first_name && errors.first_name ? (errors.first_name as string) : undefined}
                  leftIcon={<User size={18} />}
                />
                <FormInput
                  label={t('personalInfo.lastName', 'Last Name')}
                  name="last_name"
                  placeholder="Last Name"
                  value={values.last_name}
                  onChange={handleChange('last_name')}
                  onBlur={handleBlur('last_name')}
                  error={touched.last_name && errors.last_name ? (errors.last_name as string) : undefined}
                  leftIcon={<User size={18} />}
                />
              </div>

              {/* Row 2: Email (50%) + Phone (50%) */}
              <div className="form-grid-2">
                <FormInput
                  label={t('auth.emailAddress', 'Email Address')}
                  name="email"
                  type="email"
                  disabled
                  value={values.email}
                  onChange={handleChange('email')}
                  onBlur={handleBlur('email')}
                  leftIcon={<Mail size={18} />}
                />
                <FormInput
                  label={t('auth.phoneNumber', 'Phone Number')}
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={values.phone}
                  onChange={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  leftIcon={<Phone size={18} />}
                />
              </div>

              {/* Row 3: DOB (50%) + Street Address (50%) */}
              <div className="form-grid-2">
                <FormInput
                  label={t('auth.dob', 'Date of Birth')}
                  name="dob"
                  type="date"
                  value={values.dob}
                  onChange={handleChange('dob')}
                  onBlur={handleBlur('dob')}
                  leftIcon={<Calendar size={18} />}
                />
                <FormInput
                  label={t('auth.address', 'Street Address')}
                  name="address"
                  placeholder="123 Main St"
                  value={values.address}
                  onChange={handleChange('address')}
                  onBlur={handleBlur('address')}
                  leftIcon={<MapPin size={18} />}
                />
              </div>

              {/* Row 4: City (1fr) + State (1fr) + Zip Code (1fr) */}
              <div className="form-grid-3">
                <FormInput
                  label={t('auth.city', 'City')}
                  name="city"
                  placeholder="City"
                  value={values.city}
                  onChange={handleChange('city')}
                  onBlur={handleBlur('city')}
                />
                <FormInput
                  label={t('auth.state', 'State')}
                  name="state"
                  placeholder="State"
                  value={values.state}
                  onChange={handleChange('state')}
                  onBlur={handleBlur('state')}
                />
                <FormInput
                  label={t('auth.zipCode', 'Zip Code')}
                  name="zip_code"
                  placeholder="Zip"
                  value={values.zip_code}
                  onChange={handleChange('zip_code')}
                  onBlur={handleBlur('zip_code')}
                />
              </div>

              {/* Row 5: Bio / About Me (Full Width) */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  {t('personalInfo.bio', 'Bio / About Me')}
                </label>
                <textarea
                  className="form-input"
                  name="bio"
                  rows={3}
                  placeholder={t('personalInfo.bioPlaceholder', 'Tell us a little about yourself...')}
                  value={values.bio}
                  onChange={handleChange('bio')}
                  onBlur={handleBlur('bio')}
                  style={{ width: '100%', resize: 'none', borderRadius: '14px' }}
                />
              </div>

              {/* Save Section */}
              <div
                ref={saveSectionRef}
                className={isHighlighted ? 'save-section-highlight' : ''}
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '12px',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                }}
              >
                {(dirty || avatarFile !== null || hasChanges) && (
                  <button
                    type="button"
                    onClick={handleDiscard}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '14px',
                      background: 'var(--bg-card-secondary)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>{t('personalInfo.discard', 'Discard')}</span>
                  </button>
                )}
                <Button
                  type="submit"
                  title={t('personalInfo.saveChanges', 'Save Changes')}
                  icon={<Save size={18} />}
                  loading={updateLoading}
                  style={{ flex: (dirty || avatarFile !== null || hasChanges) ? 2 : 1, width: '100%', padding: '14px' }}
                />
              </div>
            </form>
          )}
        </Formik>
      </div>

      {/* Floating Action Bar when Unsaved Changes exist */}
      {hasChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            width: 'calc(100% - 32px)',
            maxWidth: '640px',
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            padding: '12px 18px',
            boxShadow: 'var(--shadow-lg), 0 0 25px rgba(0, 103, 77, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#FFD700',
                boxShadow: '0 0 8px #FFD700',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              {t('personalInfo.unsavedBadge', 'Unsaved changes')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDiscard}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 10px',
              }}
            >
              {t('personalInfo.discard', 'Discard')}
            </button>
            <Button
              onClick={() => formikRef.current?.submitForm()}
              loading={updateLoading}
              title={t('personalInfo.saveChanges', 'Save Changes')}
              icon={<Save size={16} />}
              style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '12px' }}
            />
          </div>
        </div>
      )}
    </Container>
  );
};

export default PersonalInfo;
