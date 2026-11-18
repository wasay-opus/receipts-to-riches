import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/Store';
import { resetPassword } from '../../redux/Slices/authSlice';
import { Button, FormInput, showToast } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import images from '../../constants/images';

export const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const email = (location.state as any)?.email || '';
  const token = (location.state as any)?.token || (location.state as any)?.otp || '';

  const validationSchema = Yup.object().shape({
    password: Yup.string()
      .min(8, t('passwordScreen.minCharacters', 'Password must be at least 8 characters'))
      .required(t('validation.newPasswordRequired', 'New password is required')),
    password_confirmation: Yup.string()
      .oneOf([Yup.ref('password')], t('validation.passwordsMustMatch', 'Passwords must match'))
      .required(t('validation.confirmPasswordRequired', 'Confirm password is required')),
  });

  const handleSubmit = async (values: { password: string; password_confirmation: string }) => {
    if (!email || !token) {
      showToast({
        type: 'error',
        text1: t('passwordScreen.resetFailed', 'Reset Failed'),
        text2: t('passwordScreen.missingDetails', 'Session expired. Please request a new verification code.'),
      });
      navigate('/forgot-password');
      return;
    }

    try {
      await dispatch(
        resetPassword({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          password: values.password,
          password_confirmation: values.password_confirmation,
        }),
      ).unwrap();

      showToast({
        type: 'success',
        text1: t('passwordScreen.resetSuccess', 'Password Reset Successful!'),
        text2: t('passwordScreen.signInNewPass', 'Please sign in with your new password.'),
      });

      navigate('/signin', { state: { email } });
    } catch (error: any) {
      const errorMsg = getUserFriendlyErrorMessage(
        error,
        t('passwordScreen.failedToReset', 'Failed to reset password. Please try again.'),
      );
      showToast({
        type: 'error',
        text1: t('passwordScreen.resetFailed', 'Reset Failed'),
        text2: errorMsg,
      });
    }
  };

  return (
    <div
      className="r2r-login-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'transparent',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '32px 32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          borderRadius: '26px',
          background: '#FFFFFF',
          border: '1px solid rgba(0, 77, 54, 0.08)',
          boxShadow: '0 24px 60px rgba(0, 77, 54, 0.12), 0 6px 18px rgba(0, 77, 54, 0.05)',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* Brand Logo & Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <img
            src={images.SplashLogo}
            alt="Receipts to Riches"
            style={{ width: '82px', height: '82px', objectFit: 'contain', marginBottom: '4px' }}
          />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {t('passwordScreen.setNewHeader', 'Reset Your Password')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '340px' }}>
            {t('passwordScreen.setNewSubtext', 'Create a new strong password for your account.')}
          </p>
        </div>

        <Formik
          initialValues={{ password: '', password_confirmation: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormInput
                label={t('passwordScreen.newPasswordLabel', 'New Password')}
                placeholder="••••••••"
                name="password"
                isPassword
                value={values.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && errors.password ? (errors.password as string) : undefined}
                leftIcon={<Lock size={18} />}
              />

              <FormInput
                label={t('passwordScreen.confirmPasswordLabel', 'Confirm New Password')}
                placeholder="••••••••"
                name="password_confirmation"
                isPassword
                value={values.password_confirmation}
                onChange={handleChange('password_confirmation')}
                onBlur={handleBlur('password_confirmation')}
                error={
                  touched.password_confirmation && errors.password_confirmation
                    ? (errors.password_confirmation as string)
                    : undefined
                }
                leftIcon={<Lock size={18} />}
              />

              <Button
                type="submit"
                loading={loading}
                title={t('passwordScreen.resetButton', 'Reset Password')}
                icon={<CheckCircle size={18} />}
                style={{ width: '100%', marginTop: '6px' }}
              />

              <Link
                to="/signin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginTop: '4px',
                }}
              >
                <ArrowLeft size={16} />
                <span>{t('auth.backToSignIn', 'Back to Sign In')}</span>
              </Link>
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ResetPassword;
