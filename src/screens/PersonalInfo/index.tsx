import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Formik, FormikProps, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, User, Mail, Phone, Calendar, Save, Camera, MapPin, AlertCircle, RotateCcw } from 'lucide-react';
import { AppDispatch, RootState } from '../../redux/Store';
import { Button, Container, FormInput, showToast } from '../../components';
import { editProfile, fetchUser, updateUserDataLocally } from '../../redux/Slices/userSlice';
import {
  getUserAvatarUrl,
  getUserCoverUrl,
  getUserFullName,
  splitFullName,
  DEFAULT_COVER_URL,
} from '../../utils/userDisplay';
import { confirmUnsavedChanges } from '../../utils/sweetAlert';
import images from '../../constants/images';

// Internal helper component to synchronize Formik dirty state to parent in real time
const FormDirtyWatcher: React.FC<{
  avatarChanged: boolean;
  coverChanged: boolean;
  onDirtyChange: (isDirty: boolean) => void;
}> = ({ avatarChanged, coverChanged, onDirtyChange }) => {
  const { dirty } = useFormikContext<any>();

  useEffect(() => {
    onDirtyChange(dirty || avatarChanged || coverChanged);
  }, [dirty, avatarChanged, coverChanged, onDirtyChange]);

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
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    () => getUserAvatarUrl(user) || null
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(
    () => getUserCoverUrl(user) || DEFAULT_COVER_URL
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      const url = getUserAvatarUrl(user);
      if (url) setAvatarPreview(url);
    }
  }, [user, avatarFile]);

  useEffect(() => {
    if (!coverFile) {
      const url = getUserCoverUrl(user);
      if (url) setCoverPreview(url);
    }
  }, [user, coverFile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setHasChanges(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result;
          setAvatarPreview(base64);
          localStorage.setItem('user_avatar', base64);
          localStorage.setItem('user_avatar_me', base64);
          if (user?.id) {
            localStorage.setItem(`user_avatar_${user.id}`, base64);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setHasChanges(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result;
          setCoverPreview(base64);
          localStorage.setItem('user_cover', base64);
          localStorage.setItem('user_cover_me', base64);
          if (user?.id) {
            localStorage.setItem(`user_cover_${user.id}`, base64);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validationSchema = Yup.object().shape({
    first_name: Yup.string(),
    last_name: Yup.string(),
    email: Yup.string().email(t('validation.invalidEmail', 'Invalid email')),
    phone: Yup.string(),
    bio: Yup.string(),
    dob: Yup.string(),
    address: Yup.string(),
    city: Yup.string(),
    state: Yup.string(),
    zip_code: Yup.string(),
    password: Yup.string(),
    password_confirmation: Yup.string(),
  });

  const handleSubmit = async (values: any) => {
    const trimmedBio = values.bio?.trim?.() ?? '';
    const payload = new FormData();

    if (values.first_name?.trim()) payload.append('first_name', values.first_name.trim());
    if (values.last_name?.trim()) payload.append('last_name', values.last_name.trim());
    const combinedName = `${values.first_name?.trim() || ''} ${values.last_name?.trim() || ''}`.trim();
    if (combinedName) {
      payload.append('name', combinedName);
    }
    if (values.email?.trim()) payload.append('email', values.email.trim());
    if (values.phone?.trim()) payload.append('phone', values.phone.trim());
    if (trimmedBio) {
      payload.append('bio', trimmedBio);
      payload.append('description', trimmedBio);
      payload.append('about', trimmedBio);
    }
    if (values.dob) payload.append('dob', values.dob);
    if (values.address?.trim()) payload.append('address', values.address.trim());
    if (values.city?.trim()) payload.append('city', values.city.trim());
    if (values.state?.trim()) payload.append('state', values.state.trim());
    if (values.zip_code?.trim()) payload.append('zip_code', values.zip_code.trim());
    if (values.password) {
      payload.append('password', values.password);
      if (values.password_confirmation) {
        payload.append('password_confirmation', values.password_confirmation);
      }
    }

    // Two SEPARATE optional image fields:
    // 1. "cover_image" -> Cover photo (banner) — file
    if (coverFile) {
      payload.append('cover_image', coverFile);
    }

    // 2. "image" -> Profile photo (avatar/dp) — file
    if (avatarFile) {
      payload.append('image', avatarFile);
    }

    try {
      await dispatch(editProfile(payload)).unwrap();
      dispatch(
        updateUserDataLocally({
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          name: `${values.first_name.trim()} ${values.last_name.trim()}`,
          phone: values.phone?.trim?.() ?? '',
          bio: trimmedBio,
          description: trimmedBio,
          about: trimmedBio,
          dob: values.dob || undefined,
          address: values.address?.trim?.() ?? '',
          city: values.city?.trim?.() ?? '',
          state: values.state?.trim?.() ?? '',
          zip_code: values.zip_code?.trim?.() ?? '',
          cover_image: coverPreview,
          cover_image_url: coverPreview,
          cover_photo: coverPreview,
          image: avatarPreview || user?.image,
          image_url: avatarPreview || user?.image_url,
        })
      );
      if (coverPreview) {
        localStorage.setItem('user_cover', coverPreview);
        localStorage.setItem('user_cover_me', coverPreview);
        if (user?.id) localStorage.setItem(`user_cover_${user.id}`, coverPreview);
      }
      if (avatarPreview) {
        localStorage.setItem('user_avatar', avatarPreview);
        localStorage.setItem('user_avatar_me', avatarPreview);
        if (user?.id) localStorage.setItem(`user_avatar_${user.id}`, avatarPreview);
      }
      if (trimmedBio) {
        localStorage.setItem(`user_bio_${user?.id || 'me'}`, trimmedBio);
      } else {
        localStorage.removeItem(`user_bio_${user?.id || 'me'}`);
      }
      try {
        await dispatch(fetchUser()).unwrap();
      } catch (err) {
        // User fetch error should not block navigation
      }
      setCoverFile(null);
      setAvatarFile(null);
      setHasChanges(false);
      showToast({
        type: 'success',
        text1: t('personalInfo.profileUpdated', 'Profile Updated!'),
        text2: t('personalInfo.profileUpdatedDesc', 'Your personal information and bio have been saved.'),
      });
      navigate(-1);
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('personalInfo.profileNotSaved', 'Profile not saved'),
        text2: error?.message || t('personalInfo.tryAgain', 'Please try again.'),
      });
    }
  };

  const handleBack = async () => {
    const isDirty = hasChanges || Boolean(formikRef.current?.dirty) || avatarFile !== null || coverFile !== null;

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
      setCoverFile(null);
      setAvatarPreview(getUserAvatarUrl(user) || null);
      setCoverPreview(getUserCoverUrl(user) || DEFAULT_COVER_URL);
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
    setCoverFile(null);
    setAvatarPreview(getUserAvatarUrl(user) || null);
    setCoverPreview(getUserCoverUrl(user) || DEFAULT_COVER_URL);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go Back"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, margin: 0 }}>
              {t('profile.personalInfo', 'Personal Information')}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
              {t('personalInfo.subtitle', 'Update your personal profile details and contact information')}
            </p>
          </div>
        </div>

        {hasChanges && (
          <span
            className="pill-badge pill-gold"
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              fontWeight: 700,
              color: 'var(--text-main)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={13} color="#D97706" />
            <span style={{ color: 'var(--text-main)' }}>{t('personalInfo.unsavedBadge', 'Unsaved changes')}</span>
          </span>
        )}
      </div>

      <div className="card" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
        {/* Cover Photo Banner - Tapping anywhere opens file picker for cover_image */}
        <div
          onClick={() => coverInputRef.current?.click()}
          title={t('personalInfo.changeCover', 'Click anywhere on cover banner to change')}
          style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            overflow: 'hidden',
            backgroundColor: '#1E293B',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <img
            src={coverPreview || DEFAULT_COVER_URL}
            alt="Cover Banner"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_COVER_URL;
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 60%, rgba(0,0,0,0.3) 100%)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            style={{ display: 'none' }}
          />

          {/* Cover photo change camera indicator on bottom-right */}
          <div
            title={t('personalInfo.changeCover', 'Change Cover Photo')}
            style={{
              position: 'absolute',
              bottom: '14px',
              right: '16px',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              transition: 'transform 0.15s ease',
              zIndex: 5,
            }}
          >
            <Camera size={20} />
          </div>
        </div>

        {/* Overlapping Avatar, Name & Bio Info */}
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-48px', marginBottom: '14px' }}>
            {/* Avatar Circle - Tapping anywhere opens file picker for image */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              title={t('personalInfo.changeAvatar', 'Click avatar to change profile photo')}
              style={{ position: 'relative', cursor: 'pointer', userSelect: 'none' }}
            >
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />

              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--bg-card-secondary)',
                  border: '4px solid var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  transition: 'transform 0.15s ease',
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

              {/* Avatar camera badge indicator */}
              <div
                title={t('personalInfo.changeAvatar', 'Change Profile Photo')}
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--green)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  zIndex: 2,
                }}
              >
                <Camera size={15} />
              </div>
            </div>
          </div>

          {/* User Name & Bio Header matching Screenshot 1 */}
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
              {fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Your Name'}
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
              {user?.bio || user?.description || user?.about || localStorage.getItem(`user_bio_${user?.id || 'me'}`) || 'No bio yet'}
            </p>
          </div>

        <Formik
          innerRef={formikRef}
          enableReinitialize
          initialValues={{
            first_name: user?.first_name || firstName || '',
            last_name: user?.last_name || lastName || '',
            bio:
              user?.bio ||
              user?.description ||
              user?.about ||
              localStorage.getItem(`user_bio_${user?.id || 'me'}`) ||
              '',
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
              <FormDirtyWatcher avatarChanged={avatarFile !== null} coverChanged={coverFile !== null} onDirtyChange={setHasChanges} />

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
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: 'var(--bg-card-secondary)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
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
                  style={{ flex: (dirty || avatarFile !== null || hasChanges) ? 2 : 1, width: '100%', padding: '12px 16px', whiteSpace: 'nowrap' }}
                />
              </div>
            </form>
          )}
        </Formik>
        </div>
      </div>

      {/* Floating Action Bar when Unsaved Changes exist */}
      {hasChanges && (
        <div className="unsaved-changes-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#F59E0B',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.7)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('personalInfo.unsavedBadge', 'Unsaved changes')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleDiscard}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {t('personalInfo.discard', 'Discard')}
            </button>
            <button
              type="button"
              onClick={() => formikRef.current?.submitForm()}
              disabled={updateLoading}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '10px',
                background: '#00D066',
                color: '#052E16',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                boxShadow: '0 3px 10px rgba(0, 208, 102, 0.3)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Save size={14} />
              <span>{updateLoading ? t('common.loading', 'Saving...') : t('personalInfo.saveChanges', 'Save Changes')}</span>
            </button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default PersonalInfo;
