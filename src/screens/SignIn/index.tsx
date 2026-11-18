import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/Store';
import { login, socialLogin } from '../../redux/Slices/authSlice';
import { Button, FormInput, showToast } from '../../components';
import { AuthBackground } from '../../components/AuthBackground';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import images from '../../constants/images';
import { signInWithGoogleFirebase } from '../../config/firebase';
import { pendingPhoneVerification } from '../../services/pendingPhoneVerification';
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
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number | string;
              locale?: string;
            },
          ) => void;
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

export const SignIn: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const passedEmail =
    (location.state as any)?.email ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('last_registered_email') : '') ||
    '';

  const [rememberMe, setRememberMe] = useState(false);
  const [initialEmail, setInitialEmail] = useState(passedEmail);
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<
    'google' | null
  >(null);
  const googleBtnRef = React.useRef<HTMLDivElement>(null);

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
      const isUnverifiedPhone =
        error?.is_phone_verified === false ||
        (typeof error?.message === 'string' &&
          error.message.toLowerCase().includes('verify your phone')) ||
        (typeof error === 'string' && error.toLowerCase().includes('verify your phone'));

      if (isUnverifiedPhone) {
        pendingPhoneVerification.setVerificationToken(error?.verificationToken);
        if (!error?.phone) {
          pendingPhoneVerification.setGoogleToken(idToken);
          navigate('/otp-verification', {
            state: { email: error?.email, isPhoneVerification: true, socialPhone: true, codeSent: false },
          });
          return;
        }
        pendingPhoneVerification.setGoogleToken(idToken);
        showToast({
          type: 'info',
          text1: t('auth.verifyPhone', 'Verify Phone Number'),
          text2: error?.phone
            ? t('auth.verifyPhoneFirst', 'Please verify your phone number first.')
            : 'No phone number is linked to this Google account.',
        });
        navigate('/otp-verification', {
          state: {
            email: error?.email,
            phone: error?.phone,
            isPhoneVerification: true,
            socialPhone: true,
            codeSent: false,
          },
        });
        return;
      }

      const errorMessage = getUserFriendlyErrorMessage(
        error,
        t('auth.googleSignInFailedMsg', 'Please try Google sign-in again.'),
      );

      showToast({
        type: 'error',
        text1: t('auth.googleSignInFailedTitle', 'Google Sign-In Failed'),
        text2: errorMessage,
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
        if (!window.google?.accounts?.id) return;

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

        if (!googleBtnRef.current) return;
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          shape: 'rectangular',
          theme: 'outline',
          text: 'signin_with',
          size: 'large',
          width: 250,
        });
      })
      .catch(() => { });
  }, [dispatch, navigate, t]);

  useEffect(() => {
    if (passedEmail) {
      setInitialEmail(passedEmail);
      try {
        sessionStorage.removeItem('last_registered_email');
      } catch { }
      return;
    }

    getRememberedSignIn().then((saved) => {
      if (saved?.enabled && saved?.email) {
        setRememberMe(true);
        setInitialEmail(saved.email);
      }
    });
  }, [passedEmail]);

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
      const isUnverifiedPhone =
        error?.is_phone_verified === false ||
        (typeof error?.message === 'string' &&
          error.message.toLowerCase().includes('verify your phone')) ||
        (typeof error === 'string' && error.toLowerCase().includes('verify your phone'));

      if (isUnverifiedPhone) {
        pendingPhoneVerification.setVerificationToken(error?.verificationToken);
        pendingPhoneVerification.setLogin(values.email.trim().toLowerCase(), values.password);
        if (!error?.phone) {
          navigate('/otp-verification', {
            state: { email: values.email.trim().toLowerCase(), isPhoneVerification: true, loginPhone: true, codeSent: false },
          });
          return;
        }
        showToast({
          type: 'info',
          text1: t('auth.verifyPhone', 'Verify Phone Number'),
          text2: t('auth.verifyPhoneFirst', 'Please verify your phone number first.'),
        });
        navigate('/otp-verification', {
          state: {
            email: values.email.trim(),
            phone: error?.phone,
            isPhoneVerification: true,
            loginPhone: true,
            codeSent: false,
          },
        });
        return;
      }

      const errorMessage = getUserFriendlyErrorMessage(
        error,
        t('auth.checkCredentials', 'Please check your credentials and try again.'),
      );

      showToast({
        type: 'error',
        text1: t('auth.loginFailed', 'Sign In Failed'),
        text2: errorMessage,
      });
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoadingProvider('google');

    try {
      // 1. Try Firebase Popup Auth (identical to Mobile app Firebase Auth)
      const idToken = await signInWithGoogleFirebase();
      await processGoogleCredential(idToken);
    } catch (firebaseErr: any) {
      if (firebaseErr?.code === 'auth/popup-closed-by-user') {
        setSocialLoadingProvider(null);
        return;
      }

      // Fallback: If popup was blocked or failed, try standard Google Identity Services
      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_WEB_CLIENT_ID;

      if (!clientId) {
        showToast({
          type: 'error',
          text1: t('auth.googleSignInFailedTitle', 'Google Sign-In Failed'),
          text2: getUserFriendlyErrorMessage(
            firebaseErr,
            t('auth.googleSignInFailedMsg', 'Please try Google sign-in again.'),
          ),
        });
        setSocialLoadingProvider(null);
        return;
      }

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
    }
  };

  return (
    <div className="r2r-login-page">
      {/* Centered White Login Card with Refined Proportions matching Approved Reference */}
      <div className="card r2r-login-card">
        {/* R2R Circular Brand Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <img
            src={images.SplashLogo}
            alt="Receipts To Riches"
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 14px rgba(0, 77, 54, 0.12))',
            }}
          />
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#0A3323',
              marginTop: '10px',
              marginBottom: '4px',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              width: '100%',
            }}
          >
            {t('auth.welcomeBack', 'Welcome Back!')}
          </h2>
          <p
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: '#5A7A6C',
              textAlign: 'center',
              margin: 0,
              marginBottom: '14px',
              width: '100%',
            }}
          >
            {t('auth.signInSubtitle', 'Sign in to earn rewards from your receipts')}
          </p>
        </div>

        <Formik<{ email: string; password: string }>
          initialValues={{ email: initialEmail || passedEmail, password: '' }}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
              <FormInput
                label={t('auth.email', 'Email')}
                placeholder="checking@gmail.com"
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && errors.email ? String(errors.email) : undefined}
                leftIcon={<Mail size={18} strokeWidth={2} color="#007A55" />}
                style={{ backgroundColor: '#F3FAF6', borderColor: '#D6EFE3' }}
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
                error={touched.password && errors.password ? String(errors.password) : undefined}
                leftIcon={<Lock size={18} strokeWidth={2} color="#007A55" />}
                style={{ backgroundColor: '#F3FAF6', borderColor: '#D6EFE3' }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '14px',
                  marginTop: '2px',
                  marginBottom: '2px',
                  width: '100%',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: '#2C4A3E',
                    fontWeight: 600,
                    margin: 0,
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      accentColor: '#007A55',
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                  />
                  <span>{t('auth.rememberMe', 'Remember Me')}</span>
                </label>

                <Link
                  to="/forgot-password"
                  style={{
                    color: '#CDA13A',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#B58D2E')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#CDA13A')}
                >
                  {t('auth.forgotPassword', 'Forgot Password?')}
                </Link>
              </div>

              <Button
                type="submit"
                loading={loading}
                title={t('auth.signIn', 'Sign In')}
                icon={<LogIn size={18} strokeWidth={2.4} />}
                className="r2r-login-btn"
                style={{ width: '100%', marginTop: '6px' }}
              />
            </form>
          )}
        </Formik>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#D6EFE3' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#5A7A6C' }}>{t('common.or', 'OR')}</span>
          <div style={{ flex: 1, height: '1px', background: '#D6EFE3' }} />
        </div>

        <div className="r2r-social-row">
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <button
              type="button"
              className="r2r-social-btn"
              style={{ width: '100%' }}
              disabled={loading || socialLoadingProvider !== null}
              onClick={handleGoogleLogin}
            >
              <img src={images.googleIcon} alt="Google" style={{ width: '18px', height: '18px' }} />
              <span>{socialLoadingProvider === 'google' ? t('auth.signingIn', 'Signing in...') : 'Google'}</span>
            </button>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: '#5A7A6C', textAlign: 'center', margin: 0, marginTop: '2px' }}>
          {t('auth.dontHaveAccount', "Don't have an account?")}{' '}
          <Link
            to="/signup"
            style={{ color: '#007A55', fontWeight: 700, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {t('auth.signUp', 'Sign Up')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
