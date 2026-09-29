import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { Button, Container, FormInput, showToast } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import { changePasswordWithUpdateProfile } from '../../redux/Slices/userSlice';

export const PasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.user.changePasswordLoading);

  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string().required(t('validation.currentPasswordRequired', 'Current password is required')),
    newPassword: Yup.string()
      .min(6, t('passwordScreen.newPasswordMinLength', 'Minimum 6 characters'))
      .required(t('validation.newPasswordRequired', 'New password is required')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], t('validation.passwordsMustMatch', 'Passwords must match'))
      .required(t('validation.confirmPasswordRequired', 'Confirm password is required')),
  });

  const handleSubmit = async (values: any) => {
    try {
      await dispatch(
        changePasswordWithUpdateProfile({
          current_password: values.currentPassword,
          password: values.newPassword,
          password_confirmation: values.confirmPassword,
        }),
      ).unwrap();
      showToast({
        type: 'success',
        text1: t('passwordScreen.updateSuccessTitle', 'Password Updated!'),
        text2: t('passwordScreen.updateSuccessMsg', 'Your account password has been changed successfully.'),
      });
      navigate('/profile');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('passwordScreen.updateErrorTitle', 'Password not changed'),
        text2: error?.message || String(error || t('auth.tryAgain', 'Please try again.')),
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
          {t('passwordScreen.pageTitle', 'Change Password')}
        </h1>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <Formik
          initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormInput
                label={t('passwordScreen.currentPasswordLabel', 'Current Password')}
                placeholder="••••••••"
                name="currentPassword"
                isPassword
                value={values.currentPassword}
                onChange={handleChange('currentPassword')}
                onBlur={handleBlur('currentPassword')}
                error={touched.currentPassword && errors.currentPassword ? (errors.currentPassword as string) : undefined}
                leftIcon={<Lock size={18} />}
              />

              <FormInput
                label={t('passwordScreen.newPasswordLabel', 'New Password')}
                placeholder="••••••••"
                name="newPassword"
                isPassword
                value={values.newPassword}
                onChange={handleChange('newPassword')}
                onBlur={handleBlur('newPassword')}
                error={touched.newPassword && errors.newPassword ? (errors.newPassword as string) : undefined}
                leftIcon={<Lock size={18} />}
              />

              <FormInput
                label={t('passwordScreen.confirmPasswordLabel', 'Confirm New Password')}
                placeholder="••••••••"
                name="confirmPassword"
                isPassword
                value={values.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={touched.confirmPassword && errors.confirmPassword ? (errors.confirmPassword as string) : undefined}
                leftIcon={<Lock size={18} />}
              />

              <Button
                type="submit"
                title={t('passwordScreen.submitButton', 'Update Password')}
                icon={<CheckCircle size={18} />}
                loading={loading}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </form>
          )}
        </Formik>
      </div>
    </Container>
  );
};

export default PasswordScreen;
