import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { User, Mail, Lock, Phone, UserPlus, Gift } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/Store';
import { registerUser, socialLogin } from '../../redux/Slices/authSlice';
import { Button, FormInput, showToast } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import images from '../../constants/images';

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';

const loadGoogleIdentityScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Google sign-in script failed to load.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in script failed to load.'));
    document.head.appendChild(script);
  });

const getGoogleCredential = (clientId: string) =>
  new Promise<string>((resolve, reject) => {
    const googleIdentity = window.google?.accounts?.id;

    if (!googleIdentity) {
      reject(new Error('Google sign-in is unavailable in this browser.'));
      return;
    }

    let settled = false;
    const settleOnce = (handler: () => void) => {
      if (!settled) {
        settled = true;
        handler();
      }
    };

    googleIdentity.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
      callback: response => {
        if (response?.credential) {
          settleOnce(() => resolve(response.credential as string));
          return;
        }

        settleOnce(() => reject(new Error('Google did not return an ID token.')));
      },
    });

    googleIdentity.prompt(notification => {
      const isNotDisplayed = notification?.isNotDisplayed?.() === true;
      const isSkipped = notification?.isSkippedMoment?.() === true;

      if (isNotDisplayed || isSkipped) {
        const reason =
          notification?.getNotDisplayedReason?.() ||
          notification?.getSkippedReason?.() ||
          'Google sign-in was cancelled or blocked.';
        settleOnce(() => reject(new Error(reason)));
      }
    });
  });

export const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [socialLoadingProvider, setSocialLoadingProvider] = useState<
    'google' | 'apple' | null
  >(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const processGoogleCredential = async (idToken: string) => {
    setSocialLoadingProvider('google');
    try {
      await dispatch(
        socialLogin({
          provider: 'google',
          id_token: idToken,
          fcm_token: '',
        }),
      ).unwrap();

      showToast({
        type: 'success',
        text1: t('auth.googleSignInTitle', 'Google Sign-In'),
        text2: t('auth.loginSuccess', 'Signed in successfully.'),
      });
      navigate('/');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('auth.googleSignInFailedTitle', 'Google Sign-In Failed'),
        text2: getUserFriendlyErrorMessage(
          error,
          t('auth.googleSignInFailedMsg', 'Please try Google sign-in again.'),
        ),
      });
    } finally {
      setSocialLoadingProvider(null);
    }
  };

  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_WEB_CLIENT_ID;
    if (!clientId) return;

    loadGoogleIdentityScript()
      .then(() => {
        if (!window.google?.accounts?.id || !googleBtnRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
          callback: response => {
            if (response?.credential) {
              processGoogleCredential(response.credential);
            }
          },
        });

        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          shape: 'rectangular',
          theme: 'outline',
          text: 'signup_with',
          size: 'large',
          width: 250,
        });
      })
      .catch(() => {});
  }, [dispatch, navigate, t]);

  const handleGoogleLogin = async () => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_WEB_CLIENT_ID;

    if (!clientId) {
      showToast({
        type: 'error',
        text1: t('auth.googleSignInNotConfiguredTitle', 'Google Sign-In'),
        text2: t('auth.googleSignInNotConfiguredMsg', 'Set VITE_GOOGLE_CLIENT_ID to enable Google login on web.'),
      });
      return;
    }

    setSocialLoadingProvider('google');

    try {
      await loadGoogleIdentityScript();
      const idToken = await getGoogleCredential(clientId);
      await processGoogleCredential(idToken);
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('auth.googleSignInFailedTitle', 'Google Sign-In Failed'),
        text2: getUserFriendlyErrorMessage(
          error,
          t('auth.googleSignInFailedMsg', 'Please try Google sign-in again.'),
        ),
      });
      setSocialLoadingProvider(null);
    }
  };

  const handleAppleLogin = () => {
    showToast({
      type: 'error',
      text1: t('auth.appleSignInNotConfiguredTitle', 'Apple Sign-In Not Configured'),
      text2: t('auth.appleSignInNotConfiguredMsg', 'Add Apple web OAuth settings before enabling this login.'),
    });
  };

  const validationSchema = Yup.object().shape({
    first_name: Yup.string()
      .min(2, t('validation.nameTooShort', 'First name is too short'))
      .required(t('validation.required', 'First name is required')),
    last_name: Yup.string()
      .min(2, t('validation.nameTooShort', 'Last name is too short'))
      .required(t('validation.required', 'Last name is required')),
    email: Yup.string()
      .email(t('validation.invalidEmail', 'Invalid email address'))
      .required(t('validation.required', 'Email is required')),
    phone: Yup.string()
      .min(7, t('validation.phoneTooShort', 'Valid phone number is required'))
      .required(t('validation.required', 'Phone number is required')),
    password: Yup.string()
      .min(6, t('validation.passwordMin', 'Password must be at least 6 characters'))
      .required(t('validation.required', 'Password is required')),
    password_confirmation: Yup.string()
      .oneOf([Yup.ref('password')], t('validation.passwordsMustMatch', 'Passwords must match'))
      .required(t('validation.required', 'Password confirmation is required')),
    terms: Yup.boolean().oneOf([true], t('validation.acceptTerms', 'You must accept terms & conditions')),
  });

  const handleSubmit = async (values: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    referralCode?: string;
  }) => {
    try {
      const payload: any = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        name: `${values.first_name.trim()} ${values.last_name.trim()}`,
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      };

      if (values.referralCode && values.referralCode.trim().length > 0) {
        payload.referral_code = values.referralCode.trim();
      }

      const res = await dispatch(registerUser(payload)).unwrap();

      showToast({
        type: 'success',
        text1: t('auth.accountCreated', 'Account Created!'),
        text2: res?.message || t('auth.otpSentToPhone', 'Please verify the code sent to your phone.'),
      });

      navigate('/otp-verification', {
        state: {
          email: payload.email,
          phone: payload.phone,
          isPhoneVerification: true,
        },
      });
    } catch (error: any) {
      const errorMsg = getUserFriendlyErrorMessage(
        error,
        t('auth.tryAgain', 'Please check your information and try again.'),
      );

      showToast({
        type: 'error',
        text1: t('auth.signUpFailed', 'Registration Failed'),
        text2: errorMsg,
      });

      if (
        error?.is_phone_verified === false ||
        (typeof errorMsg === 'string' &&
          errorMsg.toLowerCase().includes('verify your phone'))
      ) {
        setTimeout(() => {
          navigate('/otp-verification', {
            state: {
              email: values.email.trim(),
              phone: error?.phone || values.phone.trim(),
              isPhoneVerification: true,
            },
          });
        }, 1200);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'var(--bg-main)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
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
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px' }}>
            {t('auth.createAccount', 'Create Account')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('auth.signUpSubtitle', 'Join and start turning receipts into cash & prizes!')}
          </p>
        </div>

        <Formik
          initialValues={{
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            password: '',
            password_confirmation: '',
            referralCode: '',
            terms: false,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormInput
                  label={t('auth.firstName', 'First Name')}
                  placeholder="John"
                  type="text"
                  name="first_name"
                  value={values.first_name}
                  onChange={handleChange('first_name')}
                  onBlur={handleBlur('first_name')}
                  error={touched.first_name && errors.first_name ? errors.first_name : undefined}
                  leftIcon={<User size={18} />}
                />

                <FormInput
                  label={t('auth.lastName', 'Last Name')}
                  placeholder="Doe"
                  type="text"
                  name="last_name"
                  value={values.last_name}
                  onChange={handleChange('last_name')}
                  onBlur={handleBlur('last_name')}
                  error={touched.last_name && errors.last_name ? errors.last_name : undefined}
                  leftIcon={<User size={18} />}
                />
              </div>

              <FormInput
                label={t('auth.email', 'Email Address')}
                placeholder="name@example.com"
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && errors.email ? errors.email : undefined}
                leftIcon={<Mail size={18} />}
              />

              <FormInput
                label={t('auth.phoneNumber', 'Phone Number')}
                placeholder="+1 555 123 4567"
                type="tel"
                name="phone"
                value={values.phone}
                onChange={handleChange('phone')}
                onBlur={handleBlur('phone')}
                error={touched.phone && errors.phone ? errors.phone : undefined}
                leftIcon={<Phone size={18} />}
              />

              <FormInput
                label={t('auth.password', 'Password')}
                placeholder="••••••••"
                type="password"
                name="password"
                isPassword
                value={values.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && errors.password ? errors.password : undefined}
                leftIcon={<Lock size={18} />}
              />

              <FormInput
                label={t('auth.confirmPassword', 'Confirm Password')}
                placeholder="••••••••"
                type="password"
                name="password_confirmation"
                isPassword
                value={values.password_confirmation}
                onChange={handleChange('password_confirmation')}
                onBlur={handleBlur('password_confirmation')}
                error={touched.password_confirmation && errors.password_confirmation ? errors.password_confirmation : undefined}
                leftIcon={<Lock size={18} />}
              />

              <FormInput
                label={t('auth.referralCode', 'Referral Code (Optional)')}
                placeholder="PROMO2026"
                type="text"
                name="referralCode"
                value={values.referralCode}
                onChange={handleChange('referralCode')}
                onBlur={handleBlur('referralCode')}
                leftIcon={<Gift size={18} />}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={values.terms}
                    onChange={(e) => setFieldValue('terms', e.target.checked)}
                    style={{ accentColor: 'var(--green)', width: '16px', height: '16px', marginTop: '2px' }}
                  />
                  <span>
                    {t('auth.agreeTo', 'I agree to the')}{' '}
                    <Link to="/profile/terms" target="_blank" style={{ color: 'var(--green)', fontWeight: 600 }}>
                      {t('auth.termsAndConditions', 'Terms & Conditions')}
                    </Link>{' '}
                    &{' '}
                    <Link to="/profile/privacy" target="_blank" style={{ color: 'var(--green)', fontWeight: 600 }}>
                      {t('auth.privacyPolicy', 'Privacy Policy')}
                    </Link>
                  </span>
                </label>
                {touched.terms && errors.terms && (
                  <span style={{ fontSize: '12px', color: 'var(--error)' }}>{errors.terms}</span>
                )}
              </div>

              <Button
                type="submit"
                loading={loading}
                title={t('auth.createAccount', 'Create Account')}
                icon={<UserPlus size={18} />}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </form>
          )}
        </Formik>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('common.or', 'OR')}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '13px' }}
              disabled={loading || socialLoadingProvider !== null}
              onClick={handleGoogleLogin}
            >
              <img src={images.googleIcon} alt="Google" style={{ width: '18px', height: '18px' }} />
              <span>{socialLoadingProvider === 'google' ? t('auth.signingIn', 'Signing in...') : 'Google'}</span>
            </button>
            <div
              ref={googleBtnRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.001,
                overflow: 'hidden',
                cursor: 'pointer',
                zIndex: 10,
              }}
            />
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1, padding: '10px', fontSize: '13px' }}
            disabled={loading || socialLoadingProvider !== null}
            onClick={handleAppleLogin}
          >
            <img src={images.appleIcon} alt="Apple" style={{ width: '18px', height: '18px' }} />
            <span>Apple</span>
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
          {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
          <Link to="/signin" style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>
            {t('auth.signIn', 'Sign In')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
