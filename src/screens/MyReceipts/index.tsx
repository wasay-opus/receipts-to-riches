import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { Container, showToast } from '../../components';
import gameServices from '../../services/gameServices';
import i18n from '../../services/i18n/i18n';

const getReceiptList = (payload: any): any[] => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const formatReceiptDate = (value?: string) => {
  if (!value) return i18n.t('myReceipts.unknownDate', 'Unknown date');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const MyReceipts: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadReceipts = async () => {
      setLoading(true);
      try {
        const response = await gameServices.getUserReceipts(1);
        if (isMounted) {
          setReceipts(getReceiptList(response?.data));
        }
      } catch (error: any) {
        if (isMounted) {
          showToast({
            type: 'error',
            text1: t('myReceipts.notLoadedTitle', 'Receipts not loaded'),
            text2: error?.message || t('myReceipts.tryAgain', 'Please try again.'),
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReceipts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
              {t('myReceipts.historyTitle', 'My Receipts History')}
            </h1>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('myReceipts.receiptsUploadedCount', '{{count}} Receipts Uploaded', { count: receipts.length })}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/scan')}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '12px' }}
        >
          <Plus size={16} />
          <span>{t('myReceipts.scanNew', 'Scan New')}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && receipts.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('myReceipts.loadingReceipts', 'Loading receipts...')}
          </div>
        )}

        {!loading && receipts.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('myReceipts.noReceiptsYet', 'No receipts uploaded yet.')}
          </div>
        )}

        {receipts.map((receipt, index) => {
          const draw = receipt.draw;
          return (
            <div
              key={receipt.id ?? receipt.receipt_id ?? index}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(0, 103, 77, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--green)',
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {receipt.store ?? receipt.store_name ?? receipt.game?.name ?? t('myReceipts.receipt', 'Receipt')}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t('myReceipts.dateTotal', '{{date}} - Total: ${{amount}}', {
                      date: formatReceiptDate(receipt.date ?? receipt.created_at),
                      amount: receipt.total ?? receipt.amount ?? '0.00',
                    })}
                  </span>
                </div>
              </div>

              {draw && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="pill-badge pill-green" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                    {draw}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Container>
  );
};

export default MyReceipts;
