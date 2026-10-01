import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, User, Mail, Phone, Calendar, Save, Camera, MapPin, AlignLeft } from 'lucide-react';
import { AppDispatch, RootState } from '../../redux/Store';
import { Button, Container, FormInput, showToast } from '../../components';
import { editProfile, fetchUser } from '../../redux/Slices/userSlice';
import { getUserFullName, splitFullName } from '../../utils/userDisplay';
import images from '../../constants/images';

export const PersonalInfo: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user?.userData);
  const updateLoading = useSelector((state: RootState) => state.user?.editProfileLoading);
  const fullName = getUserFullName(user);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.image_url || user?.image || null
  );

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
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
      showToast({
        type: 'success',
        text1: 'Profile Updated!',
        text2: 'Your personal information and bio have been saved.',
      });
      navigate('/profile');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Profile not saved',
        text2: error?.message || 'Please try again.',
      });
    }
  };

  const { firstName, lastName } = splitFullName(fullName);

  return (
    <Container maxWidth="560px" style={{ gap: '20px', paddingBottom: '40px' }}>
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
          {t('profile.personalInfo', 'Personal Information')}
        </h1>
      </div>

      <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
        {/* Avatar Upload Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--bg-card-secondary)',
                border: '3px solid var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'var(--green)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Tap camera to change photo
          </span>
        </div>

        <Formik
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
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormInput
                  label="First Name"
                  name="first_name"
                  value={values.first_name}
                  onChange={handleChange('first_name')}
                  onBlur={handleBlur('first_name')}
                  error={touched.first_name && errors.first_name ? (errors.first_name as string) : undefined}
                  leftIcon={<User size={18} />}
                />
                <FormInput
                  label="Last Name"
                  name="last_name"
                  value={values.last_name}
                  onChange={handleChange('last_name')}
                  onBlur={handleBlur('last_name')}
                  error={touched.last_name && errors.last_name ? (errors.last_name as string) : undefined}
                  leftIcon={<User size={18} />}
                />
              </div>

              {/* Bio Field */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Bio / About Me
                </label>
                <textarea
                  className="form-input"
                  name="bio"
                  rows={3}
                  placeholder="Tell us a little about yourself..."
                  value={values.bio}
                  onChange={handleChange('bio')}
                  onBlur={handleBlur('bio')}
                  style={{ width: '100%', resize: 'none', borderRadius: '14px' }}
                />
              </div>

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

              <FormInput
                label="Date of Birth"
                name="dob"
                type="date"
                value={values.dob}
                onChange={handleChange('dob')}
                onBlur={handleBlur('dob')}
                leftIcon={<Calendar size={18} />}
              />

              <FormInput
                label="Street Address"
                name="address"
                placeholder="123 Main St"
                value={values.address}
                onChange={handleChange('address')}
                onBlur={handleBlur('address')}
                leftIcon={<MapPin size={18} />}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <FormInput
                  label="City"
                  name="city"
                  placeholder="City"
                  value={values.city}
                  onChange={handleChange('city')}
                  onBlur={handleBlur('city')}
                />
                <FormInput
                  label="State"
                  name="state"
                  placeholder="State"
                  value={values.state}
                  onChange={handleChange('state')}
                  onBlur={handleBlur('state')}
                />
                <FormInput
                  label="Zip Code"
                  name="zip_code"
                  placeholder="Zip"
                  value={values.zip_code}
                  onChange={handleChange('zip_code')}
                  onBlur={handleBlur('zip_code')}
                />
              </div>

              <Button
                type="submit"
                title={t('personalInfo.saveChanges', 'Save Changes')}
                icon={<Save size={18} />}
                loading={updateLoading}
                style={{ width: '100%', marginTop: '10px', padding: '14px' }}
              />
            </form>
          )}
        </Formik>
      </div>
    </Container>
  );
};

export default PersonalInfo;
