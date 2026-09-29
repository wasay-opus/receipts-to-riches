import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/Store';
import { login, socialLogin } from '../../redux/Slices/authSlice';
import { Button, FormInput, showToast } from '../../components';
import images from '../../constants/images';
import {
  getRememberedSignIn,
  saveRememberedSignIn,
  clearRememberedSignIn,
} from '../../utils/localStoreUtil';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

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

export const SignIn: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [rememberMe, setRememberMe] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<
    'google' | 'apple' | null
  >(null);

  useEffect(() => {
    getRememberedSignIn().then((saved) => {
      if (saved?.enabled && saved?.email) {
        setRememberMe(true);
        setInitialEmail(saved.email);
      }
    });
  }, []);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email(t('validation.invalidEmail', 'Invalid email address'))
      .required(t('validation.required', 'Email is required')),
    password: Yup.string()
      .min(6, t('validation.passwordMin', 'Password must be at least 6 characters'))
      .required(t('validation.required', 'Password is required')),
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      if (rememberMe) {
        await saveRememberedSignIn({ enabled: true, email: values.email });
      } else {
        await clearRememberedSignIn();
      }

      const result = await dispatch(
        login({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        })
      ).unwrap();

      showToast({
        type: 'success',
        text1: t('auth.welcomeBack', 'Welcome Back!'),
        text2: t('auth.loginSuccess', 'Signed in successfully.'),
      });

      navigate('/');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('auth.loginFailed', 'Sign In Failed'),
        text2: error?.message || t('auth.checkCredentials', 'Please check your credentials and try again.'),
      });
    }
  };

  const handleGoogleLogin = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      showToast({
        type: 'error',
        text1: t('auth.googleSignInNotConfiguredTitle', 'Google Sign-In Not Configured'),
        text2: t('auth.googleSignInNotConfiguredMsg', 'Set VITE_GOOGLE_CLIENT_ID to enable Google login on web.'),
      });
      return;
    }

    setSocialLoadingProvider('google');

    try {
      await loadGoogleIdentityScript();
      const idToken = await getGoogleCredential(clientId);

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
        text2: error?.message || t('auth.googleSignInFailedMsg', 'Please try Google sign-in again.'),
      });
    } finally {
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <img
            src={images.SplashLogo}
            alt="Receipts To Riches"
            style={{ width: '180px', objectFit: 'contain' }}
          />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
            {t('auth.welcomeBack', 'Welcome Back')}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('auth.signInSubtitle', 'Sign in to earn rewards from your receipts')}
          </p>
        </div>

        <Formik
          initialValues={{ email: initialEmail, password: '' }}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--green)', width: '16px', height: '16px' }}
                  />
                  <span>{t('auth.rememberMe', 'Remember Me')}</span>
                </label>

                <Link
                  to="/forgot-password"
                  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
                >
                  {t('auth.forgotPassword', 'Forgot Password?')}
                </Link>
              </div>

              <Button
                type="submit"
                loading={loading}
                title={t('auth.signIn', 'Sign In')}
                icon={<LogIn size={18} />}
                style={{ width: '100%', marginTop: '8px' }}
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
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1, padding: '10px', fontSize: '13px' }}
            disabled={loading || socialLoadingProvider !== null}
            onClick={handleGoogleLogin}
          >
            <img src={images.googleIcon} alt="Google" style={{ width: '18px', height: '18px' }} />
            <span>{socialLoadingProvider === 'google' ? t('auth.signingIn', 'Signing in...') : 'Google'}</span>
          </button>
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
          {t('auth.dontHaveAccount', "Don't have an account?")}{' '}
          <Link to="/signup" style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>
            {t('auth.signUp', 'Sign Up')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
