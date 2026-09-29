import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, User, Mail, Phone, Calendar, Save } from 'lucide-react';
import { AppDispatch, RootState } from '../../redux/Store';
import { Button, Container, FormInput, showToast } from '../../components';
import { editProfile, fetchUser } from '../../redux/Slices/userSlice';
import { getUserFullName, splitFullName } from '../../utils/userDisplay';

export const PersonalInfo: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user?.userData);
  const updateLoading = useSelector((state: RootState) => state.user?.editProfileLoading);
  const fullName = getUserFullName(user);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required(t('personalInfo.fullNameRequired', 'Full name is required')),
    email: Yup.string()
      .email(t('validation.invalidEmail', 'Invalid email'))
      .required(t('validation.emailRequired', 'Email is required')),
  });

  const handleSubmit = async (values: any) => {
    const payload = new FormData();
    const cleanName = values.name.trim();
    const { firstName, lastName } = splitFullName(cleanName);

    payload.append('first_name', firstName);
    payload.append('last_name', lastName);
    payload.append('name', cleanName);
    payload.append('phone', values.phone?.trim?.() ?? '');

    try {
      await dispatch(editProfile(payload)).unwrap();
      await dispatch(fetchUser()).unwrap();
      showToast({
        type: 'success',
        text1: t('personalInfo.profileUpdated', 'Profile Updated!'),
        text2: t('personalInfo.profileUpdatedDesc', 'Your personal information has been saved.'),
      });
      navigate('/profile');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('personalInfo.profileNotSaved', 'Profile not saved'),
        text2: error?.message || String(error || t('personalInfo.tryAgain', 'Please try again.')),
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
          {t('profile.personalInfo', 'Personal Information')}
        </h1>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <Formik
          enableReinitialize
          initialValues={{
            name: fullName,
            email: user?.email || '',
            phone: user?.phone || '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormInput
                label={t('personalInfo.fullName', 'Full Name')}
                name="name"
                value={values.name}
                onChange={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name ? (errors.name as string) : undefined}
                leftIcon={<User size={18} />}
              />

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

              <Button
                type="submit"
                title={t('personalInfo.saveChanges', 'Save Changes')}
                icon={<Save size={18} />}
                loading={updateLoading}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </form>
          )}
        </Formik>
      </div>
    </Container>
  );
};

export default PersonalInfo;
