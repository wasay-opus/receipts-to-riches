import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/Store';
import { fetchAllFunds } from '../../redux/Slices/fundsSlice';
import fundServices from '../../services/fundServices';
import { showToast } from '../../components/Toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PaypalCallback: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing PayPal Payment...');

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      // Extract all query parameters (token, PayerID, etc.)
      const token = searchParams.get('token') || searchParams.get('order_id') || '';
      const payerId = searchParams.get('PayerID') || searchParams.get('payer_id') || searchParams.get('PayerId') || '';

      console.log('[PaypalCallback] Captured params:', { token, payerId });

      if (!token || !payerId) {
        if (isMounted) {
          setStatus('error');
          setMessage('Missing PayPal payment details (token or PayerID).');
          showToast({
            type: 'error',
            text1: 'Payment Failed',
            text2: 'Missing PayPal payment details.',
          });
          setTimeout(() => navigate('/manage-campaigns'), 2500);
        }
        return;
      }

      try {
        // Send GET request to callback URL with Accept: application/json and without auth token
        const response = await fundServices.capturePaypalPayment(token, payerId);
        console.log('[PaypalCallback] Server capture response:', response);

        if (isMounted) {
          setStatus('success');
          const successMsg = response?.message || 'Payment successfully captured! Funds have been added to your account.';
          setMessage(successMsg);

          showToast({
            type: 'success',
            text1: 'Payment Successful!',
            text2: successMsg,
          });

          // Refresh funds balance immediately
          dispatch(fetchAllFunds());

          // If opened inside popup, notify opener and close
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage(
                { type: 'PAYPAL_PAYMENT_SUCCESS', token, payerId },
                '*'
              );
              setTimeout(() => {
                window.close();
              }, 1200);
              return;
            } catch (err) {
              console.warn('[PaypalCallback] Could not postMessage to opener:', err);
            }
          }

          // Navigate back to manage campaigns
          setTimeout(() => {
            navigate('/manage-campaigns');
          }, 2000);
        }
      } catch (err: any) {
        console.error('[PaypalCallback] Capture error:', err);
        if (isMounted) {
          setStatus('error');
          const errMsg = err?.message || 'Could not capture PayPal payment. Please try again.';
          setMessage(errMsg);

          showToast({
            type: 'error',
            text1: 'Payment Not Captured',
            text2: errMsg,
          });

          // Still refresh funds in case it was already processed
          dispatch(fetchAllFunds());

          setTimeout(() => {
            navigate('/manage-campaigns');
          }, 3000);
        }
      }
    };

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate, dispatch]);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '20px',
        }}
      >
        {status === 'loading' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0, 103, 77, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--green)',
              }}
            >
              <Loader2 size={36} className="animate-spin" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('funds.verifyingPayment', 'Finalizing PayPal Payment')}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}
            >
              <CheckCircle2 size={38} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('funds.paymentSuccess', 'Payment Successful!')}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <AlertCircle size={38} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('funds.paymentFailed', 'Payment Error')}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {message}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaypalCallback;
