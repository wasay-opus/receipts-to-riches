import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, X, Check, Loader2 } from 'lucide-react';
import feedServices from '../../services/feedServices';
import { showToast } from '../Toast';

export type ReportTargetType = 'post' | 'comment' | 'account';

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: string | number;
  targetType: ReportTargetType;
  targetName?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  'Harassment',
  'Spam',
  'Impersonation or fake account',
  'Posting scam or fraudulent receipts',
  'Inappropriate profile or bio',
  'Other',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  targetId,
  targetType,
  targetName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<string>('Harassment');
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedReason === 'Other') {
      setTimeout(() => {
        if (listContainerRef.current) {
          listContainerRef.current.scrollTo({
            top: listContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        textareaRef.current?.focus();
      }, 70);
    }
  }, [selectedReason]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
      setSelectedReason('Harassment');
      setCustomReason('');
      setSubmitting(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  if (!visible) return null;

  const getTitle = () => {
    switch (targetType) {
      case 'account':
        return t('report.reportUserTitle', 'Report User');
      case 'comment':
        return t('report.reportCommentTitle', 'Report Comment');
      case 'post':
      default:
        return t('report.reportPostTitle', 'Report Post');
    }
  };

  const getQuestion = () => {
    if (targetType === 'account') {
      const name = targetName ? (targetName.startsWith('@') ? targetName : `@${targetName}`) : 'this user';
      return t('report.whyReportingUser', 'Why are you reporting {{name}}?', { name });
    }
    if (targetType === 'comment') {
      return t('report.whyReportingComment', 'Why are you reporting this comment?');
    }
    return t('report.whyReportingPost', 'Why are you reporting this post?');
  };

  const handleSubmit = async () => {
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!finalReason) {
      showToast({
        type: 'error',
        text1: t('report.selectReasonTitle', 'Select a reason'),
        text2: t('report.selectReasonDesc', 'Please select or provide a reason for the report.'),
      });
      return;
    }

    setSubmitting(true);
    try {
      if (targetType === 'post') {
        await feedServices.reportPost(targetId, finalReason);
      } else if (targetType === 'comment') {
        await feedServices.reportComment(targetId, finalReason);
      } else if (targetType === 'account') {
        await feedServices.reportUser(targetId, finalReason);
      }

      showToast({
        type: 'success',
        text1: t('report.submittedTitle', 'Report Submitted'),
        text2: t('report.submittedDesc', 'Thank you. We will review this report promptly.'),
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('report.failedTitle', 'Report failed'),
        text2: error?.message || t('report.genericError', 'Unable to submit report. Please try again.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      {/* Modal Container */}
      <div
        className="card report-bottom-sheet"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-card)',
          borderRadius: isMobile ? '28px 28px 0 0' : '24px',
          border: '1px solid var(--border-color)',
          borderBottom: isMobile ? 'none' : '1px solid var(--border-color)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.45)',
          padding: isMobile ? '12px 20px 28px 20px' : '24px',
          boxSizing: 'border-box',
          maxHeight: isMobile ? '92vh' : '88vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle / pill indicator (mobile only) */}
        {isMobile && (
          <div
            style={{
              width: '44px',
              height: '4px',
              borderRadius: '999px',
              backgroundColor: 'var(--text-muted)',
              opacity: 0.35,
              margin: '0 auto 12px auto',
            }}
          />
        )}

        {/* Header matching Screenshot 3 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={20} color="#EF4444" />
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {getTitle()}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            title={t('common.close', 'Close')}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Subtitle / Prompt Question matching Screenshot 3 */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: '0 0 16px 0',
            fontWeight: 500,
          }}
        >
          {getQuestion()}
        </p>

        {/* Reasons list matching Screenshot 3 */}
        <div
          ref={listContainerRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
            paddingRight: '6px',
            paddingBottom: '24px',
            marginBottom: '16px',
            maxHeight: isMobile ? '64vh' : '58vh',
          }}
        >
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <div
                key={reason}
                onClick={() => setSelectedReason(reason)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: isSelected
                    ? '1.5px solid #EF4444'
                    : '1px solid var(--border-color)',
                  background: isSelected
                    ? 'rgba(239, 68, 68, 0.05)'
                    : 'var(--bg-card-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.18s ease',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--text-main)' : 'var(--text-secondary, var(--text-main))',
                    lineHeight: 1.35,
                  }}
                >
                  {reason}
                </span>

                {/* Radio checkmark circle matching Screenshot 3 */}
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '1.8px solid var(--text-muted)',
                    background: isSelected ? '#EF4444' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '12px',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </div>
              </div>
            );
          })}

          {/* If 'Other' selected, display custom explanation textarea */}
          {selectedReason === 'Other' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <textarea
                ref={textareaRef}
                className="report-custom-textarea"
                placeholder={t('report.customReasonPlaceholder', 'Please provide specific details for reporting...')}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  height: '100px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'var(--bg-card)',
                  border: '1.5px solid #EF4444',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  lineHeight: '1.45',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)',
                  flexShrink: 0,
                }}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || (selectedReason === 'Other' && !customReason.trim())}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '14px',
            background: submitting
              ? 'var(--text-muted)'
              : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="spin-animation" />
              <span>{t('report.submitting', 'Submitting report...')}</span>
            </>
          ) : (
            <span>{t('report.submitButton', 'Submit Report')}</span>
          )}
        </button>
      </div>
    </div>
  );
};
