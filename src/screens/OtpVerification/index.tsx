import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowLeft, RotateCcw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/Store';
import { validatePasswordCode } from '../../redux/Slices/authSlice';
import authServices from '../../services/authServices';
import { Button, showToast } from '../../components';

export const OtpVerification: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const email = (location.state as any)?.email || '';
  const phone = (location.state as any)?.phone || '';
  const isForgot = (location.state as any)?.isForgot || false;
  const isPhoneVerification = (location.state as any)?.isPhoneVerification || !!phone;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

        navigate('/profile/change-password', { state: { email, otp: code } });
      } else if (phone || isPhoneVerification) {
        const response = await authServices.verifyOtp({
          phone: phone.trim(),
          otp: code,
        });

        if (response && response.success !== false) {
          showToast({
            type: 'success',
            text1: t('auth.verifiedSuccess', 'Phone Verified!'),
            text2: response?.message || t('auth.phoneVerifiedMsg', 'Your phone number has been verified.'),
          });
          navigate('/signin');
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
        text2: error?.message || t('auth.wrongCode', 'Invalid code or code expired.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      if (phone || isPhoneVerification) {
        const response = await authServices.resendOtp({ phone: phone.trim() });
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
        text2: error?.message || '',
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
          maxWidth: '460px',
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
            {t('auth.enterOtp', 'Verify Code')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('auth.otpSentTo', 'We sent a verification code to')}{' '}
            <strong style={{ color: 'var(--text-main)' }}>{phone || email || t('auth.yourEmailFallback', 'your phone/email')}</strong>
          </p>
        </div>

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
      </div>
    </div>
  );
};

export default OtpVerification;
