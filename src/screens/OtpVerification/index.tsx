import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowLeft, RotateCcw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/Store';
import { validatePasswordCode, login, socialLogin, markNewUserOnboarding } from '../../redux/Slices/authSlice';
import authServices from '../../services/authServices';
import { Button, PhoneInput, sanitizePhoneNumber, showToast } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import { pendingPhoneVerification } from '../../services/pendingPhoneVerification';

const getPhoneVerificationError = (error: any): string => {
  const payload = error?.response?.data ?? error?.data ?? error;
  const phoneError =
    payload?.data?.error?.phone?.[0] ??
    payload?.errors?.phone?.[0] ??
    payload?.error?.phone?.[0];
  if (typeof phoneError === 'string' && /selected phone is invalid/i.test(phoneError)) {
    return 'The server does not recognize this phone number for verification. Use the number registered with your account or contact support.';
  }
  return getUserFriendlyErrorMessage(error, 'Please try again.');
};

export const OtpVerification: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, token } = useSelector((state: RootState) => state.auth);

  const email = (location.state as any)?.email || '';
  const initialPhone = (location.state as any)?.phone || '';
  const isForgot = (location.state as any)?.isForgot || false;
  const isPhoneVerification = (location.state as any)?.isPhoneVerification || !!initialPhone || !isForgot;
  const socialPhone = Boolean((location.state as any)?.socialPhone);
  const loginPhone = Boolean((location.state as any)?.loginPhone);

  const [currentPhone, setCurrentPhone] = useState(initialPhone);
  const [phoneSubmitted, setPhoneSubmitted] = useState(
    Boolean(initialPhone && (location.state as any)?.codeSent),
  );
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(isForgot || phoneSubmitted ? 60 : 0);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendPhoneOtp = async () => {
    const cleanPhone = sanitizePhoneNumber(currentPhone);
    if (!/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(cleanPhone)) {
      showToast({
        type: 'error',
        text1: t('validation.invalidPhone', 'Invalid Phone Number'),
        text2: t('validation.enterValidPhone', 'Please enter a valid phone number.'),
      });
      return;
    }

    setSendingPhoneOtp(true);
    try {
      const changeNumber = (socialPhone || loginPhone) &&
        sanitizePhoneNumber(initialPhone) !== cleanPhone;
      const response = changeNumber
        ? await authServices.changePhone(
            { phone: cleanPhone },
            pendingPhoneVerification.getVerificationToken() || token,
          )
        : await authServices.resendOtp({ phone: cleanPhone });
      if (response?.success === false || response?.data?.success === false) {
        throw new Error(response?.message || response?.data?.message || 'Could not send the code.');
      }
      setPhoneSubmitted(true);
      setTimer(60);
      showToast({
        type: 'success',
        text1: t('auth.otpSent', 'Code Sent!'),
        text2: response?.message || t('auth.checkPhone', 'A verification code has been sent to your phone.'),
      });
    } catch (error: any) {
      const message = getPhoneVerificationError(error);
      showToast({
        type: 'error',
        text1: t('auth.failedToSendCode', 'Failed to send code'),
        text2: message,
      });
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      showToast({
        type: 'error',
        text1: t('validation.invalidOtp', 'Invalid Code'),
        text2: t('validation.enterCompleteOtp', 'Please enter the complete verification code.'),
      });
      return;
    }

    setSubmitting(true);
    try {
      if (isForgot) {
        await dispatch(
          validatePasswordCode({
            email: email.trim().toLowerCase(),
            token: code,
          })
        ).unwrap();

        showToast({
          type: 'success',
          text1: t('auth.verifiedSuccess', 'Verification Successful!'),
          text2: t('auth.accountActive', 'Your code has been verified.'),
        });

        navigate('/reset-password', { state: { email, token: code } });
      } else if (currentPhone || isPhoneVerification) {
        const cleanPhone = sanitizePhoneNumber(currentPhone);
        const response = await authServices.verifyOtp({
          phone: cleanPhone,
          otp: code,
        });

        if (response && response.success !== false && response.data?.success !== false) {
          if (loginPhone) {
            const credentials = pendingPhoneVerification.getLogin();
            if (!credentials) throw new Error('Sign-in expired. Please sign in again.');
            await dispatch(login(credentials)).unwrap();
            pendingPhoneVerification.clearLogin();
            pendingPhoneVerification.clearVerificationToken();
            navigate('/', { replace: true });
            return;
          }
          if (socialPhone) {
            const idToken = pendingPhoneVerification.getGoogleToken();
            if (!idToken) throw new Error('Google sign-in expired. Please continue with Google again.');
            await dispatch(socialLogin({
              provider: 'google', id_token: idToken, fcm_token: '',
            })).unwrap();
            pendingPhoneVerification.clearGoogleToken();
            pendingPhoneVerification.clearVerificationToken();
            navigate('/', { replace: true });
            return;
          }

          const registration = pendingPhoneVerification.getRegistration();
          if (registration?.email === email) {
            try {
              await dispatch(login(registration)).unwrap();
              dispatch(markNewUserOnboarding());
              pendingPhoneVerification.clearRegistration();
              navigate('/secret-question', { replace: true });
              return;
            } catch {
              pendingPhoneVerification.clearRegistration();
            }
          }
          if (token) {
            navigate(registration ? '/secret-question' : '/', { replace: true });
            return;
          }
          showToast({
            type: 'success',
            text1: t('auth.verifiedSuccess', 'Phone Verified!'),
            text2: response?.message || t('auth.phoneVerifiedMsg', 'Your phone number has been verified.'),
          });
          if (email) {
            try {
              sessionStorage.setItem('last_registered_email', email);
            } catch {}
          }
          navigate('/signin', { state: { email } });
        } else {
          throw new Error(response?.message || 'Verification failed');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('auth.verificationFailed', 'Verification Failed'),
        text2: getUserFriendlyErrorMessage(
          error,
          t('auth.wrongCode', 'Invalid code or code expired.'),
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      if (currentPhone || isPhoneVerification) {
        const cleanPhone = sanitizePhoneNumber(currentPhone);
        const response = await authServices.resendOtp({ phone: cleanPhone });
        if (response?.success === false || response?.data?.success === false) {
          throw new Error(response?.message || response?.data?.message || 'Could not resend the code.');
        }
        setTimer(60);
        showToast({
          type: 'success',
          text1: t('auth.otpResent', 'Code Resent!'),
          text2: response?.message || t('auth.checkPhone', 'A fresh code has been sent to your phone.'),
        });
      } else {
        await authServices.forgotPassword({ email });
        setTimer(60);
        showToast({
          type: 'success',
          text1: t('auth.otpResent', 'Code Resent!'),
          text2: t('auth.checkInbox', 'A fresh code has been sent to your email.'),
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('auth.resendFailed', 'Failed to resend code'),
        text2: getPhoneVerificationError(error),
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
          padding: '28px 32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          borderRadius: '26px',
          background: '#FFFFFF',
          border: '1px solid rgba(0, 77, 54, 0.08)',
          boxShadow: '0 24px 60px rgba(0, 77, 54, 0.12), 0 6px 18px rgba(0, 77, 54, 0.05)',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 103, 77, 0.12)',
              border: '1px solid rgba(0, 103, 77, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green)',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {isPhoneVerification ? t('auth.verifyPhone', 'Verify Phone Number') : t('auth.enterOtp', 'Verify Code')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            {isPhoneVerification && !currentPhone
              ? 'Enter your US phone number to receive a verification code.'
              : isPhoneVerification && !phoneSubmitted
              ? 'Send a verification code to your registered phone number.'
              : `${t('auth.otpSentTo', 'We sent a verification code to')} `}
            {(!isPhoneVerification || currentPhone) && (
              <>{' '}<strong style={{ color: 'var(--text-main)' }}>{currentPhone || email}</strong></>
            )}
          </p>
        </div>

        {isPhoneVerification && !phoneSubmitted ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(socialPhone || loginPhone) && (
              <PhoneInput
                label={t('auth.phoneNumber', 'Phone Number')}
                value={currentPhone}
                onChange={setCurrentPhone}
                placeholder="### ### ####"
              />
            )}
            <Button
              onClick={handleSendPhoneOtp}
              loading={sendingPhoneOtp}
              title={t('auth.sendVerificationCode', 'Send Verification Code')}
              style={{ width: '100%' }}
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }} onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{
                width: '46px',
                height: '52px',
                borderRadius: '12px',
                border: digit ? '2px solid var(--green)' : '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '22px',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          loading={loading || submitting}
          title={t('auth.verifyAndProceed', 'Verify Code')}
          style={{ width: '100%' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {t('auth.didntReceiveCode', "Didn't receive code?")}
          </span>
          {timer > 0 ? (
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{timer}s</span>
          ) : (
            <button
              onClick={handleResend}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--green)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={14} />
              <span>{t('auth.resendCode', 'Resend Code')}</span>
            </button>
          )}
        </div>

        <Link
          to="/signin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>{t('auth.backToSignIn', 'Back to Sign In')}</span>
        </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default OtpVerification;
