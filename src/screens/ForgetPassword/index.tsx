import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/Store';
import { forgotPassword } from '../../redux/Slices/authSlice';
import { Button, FormInput, showToast } from '../../components';
import images from '../../constants/images';

export const ForgetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email(t('validation.invalidEmail', 'Invalid email address'))
      .required(t('validation.required', 'Email is required')),
  });

  const handleSubmit = async (values: { email: string }) => {
    try {
      await dispatch(forgotPassword(values.email.trim().toLowerCase())).unwrap();
      showToast({
        type: 'success',
        text1: t('auth.otpSent', 'OTP Code Sent!'),
        text2: t('auth.checkInbox', 'Please check your email for the reset code.'),
      });
      navigate('/otp', { state: { email: values.email.trim().toLowerCase(), isForgot: true } });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('auth.requestFailed', 'Request Failed'),
        text2: error?.message || t('auth.tryAgain', 'Please try again.'),
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg-main)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <img
            src={images.SplashLogo}
            alt="Receipts To Riches"
            style={{ width: '160px', objectFit: 'contain' }}
          />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
            {t('auth.forgotPassword', 'Forgot Password')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('auth.forgotSubtitle', 'Enter your registered email to receive a password reset verification code.')}
          </p>
        </div>

        <Formik initialValues={{ email: '' }} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <FormInput
                label={t('auth.email', 'Email Address')}
                placeholder={t('auth.emailPlaceholder', 'name@example.com')}
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && errors.email ? errors.email : undefined}
                leftIcon={<Mail size={18} />}
              />

              <Button
                type="submit"
                loading={loading}
                title={t('auth.sendCode', 'Send Reset Code')}
                icon={<Send size={18} />}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </form>
          )}
        </Formik>

        <Link
          to="/signin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>{t('auth.backToSignIn', 'Back to Sign In')}</span>
        </Link>
      </div>
    </div>
  );
};

export default ForgetPassword;
