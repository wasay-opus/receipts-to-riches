import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bell, CheckCircle2, Trash2 } from 'lucide-react';
import { Container, showToast } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import {
  fetchAllNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../redux/Slices/notificationsSlice';
import notificationCenterServices from '../../services/notificationServices';
import { confirmAppAction } from '../../utils/sweetAlert';

const formatNotificationDate = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const Notification: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const {
    notifications,
    loading,
    error,
    markAllAsReadLoading,
    markAsReadLoadingId,
  } = useSelector((state: RootState) => state.notifications);

  useEffect(() => {
    dispatch(fetchAllNotifications(true));
    notificationCenterServices
      .getUnreadCount()
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? response;
        const count = payload?.count ?? payload?.unread_count ?? payload?.total ?? payload;
        setUnreadCount(Number.isFinite(Number(count)) ? Number(count) : null);
      })
      .catch(() => setUnreadCount(null));
  }, [dispatch]);

  const handleMarkAll = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      setUnreadCount(0);
      showToast({ type: 'success', text1: t('notification.markAllReadSuccess', 'All notifications marked read') });
    } catch (markError: any) {
      showToast({
        type: 'error',
        text1: t('notification.markAllReadFailed', 'Could not mark all read'),
        text2: markError?.message || String(markError || t('notification.tryAgain', 'Please try again.')),
      });
    }
  };

  const handleMarkOne = async (notificationId: number) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      setUnreadCount((current) => (current === null ? current : Math.max(0, current - 1)));
    } catch (markError: any) {
      showToast({
        type: 'error',
        text1: t('notification.markOneReadFailed', 'Could not mark notification read'),
        text2: markError?.message || String(markError || t('notification.tryAgain', 'Please try again.')),
      });
    }
  };

  const handleDeleteOne = async (notificationId: number) => {
    try {
      await notificationCenterServices.deleteNotification(notificationId);
      await dispatch(fetchAllNotifications(true)).unwrap();
      showToast({ type: 'success', text1: t('notification.deleteSuccess', 'Notification deleted') });
    } catch (deleteError: any) {
      showToast({
        type: 'error',
        text1: t('notification.deleteFailed', 'Could not delete notification'),
        text2: deleteError?.message || String(deleteError || t('notification.tryAgain', 'Please try again.')),
      });
    }
  };

  const handleClearAll = async () => {
    const confirmed = await confirmAppAction({
      title: t('notification.clearAllConfirmTitle', 'Clear all notifications?'),
      text: t('notification.clearAllConfirmText', 'This will remove your notification history from this list.'),
      confirmButtonText: t('notification.clearAllConfirmButton', 'Clear'),
    });
    if (!confirmed) return;

    try {
      await notificationCenterServices.clearAll();
      await dispatch(fetchAllNotifications(true)).unwrap();
      setUnreadCount(0);
      showToast({ type: 'success', text1: t('notification.clearAllSuccess', 'Notifications cleared') });
    } catch (clearError: any) {
      showToast({
        type: 'error',
        text1: t('notification.clearAllFailed', 'Could not clear notifications'),
        text2: clearError?.message || String(clearError || t('notification.tryAgain', 'Please try again.')),
      });
    }
  };

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {unreadCount !== null
              ? t('notification.headerTitleWithCount', 'Notifications ({{count}})', { count: unreadCount })
              : t('notification.headerTitle', 'Notifications')}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleMarkAll}
            disabled={markAllAsReadLoading || notifications.length === 0}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '12px' }}
          >
            {t('notification.markAllReadButton', 'Mark all read')}
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '12px', color: '#EF4444' }}
          >
            {t('notification.clearButton', 'Clear')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && notifications.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('notification.loading', 'Loading notifications...')}
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: '16px', color: '#EF4444', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {!loading && notifications.length === 0 && !error && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('notification.emptyState', 'No notifications yet.')}
          </div>
        )}

        {notifications.map((notification) => {
          const isRead = Boolean(notification.read_at);
          return (
            <div
              key={notification.id}
              onClick={() => !isRead && handleMarkOne(notification.id)}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                border: isRead ? '1px solid var(--border-color)' : '1.5px solid rgba(0, 103, 77, 0.35)',
                textAlign: 'left',
                cursor: isRead ? 'default' : 'pointer',
                opacity: markAsReadLoadingId === notification.id ? 0.65 : 1,
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--bg-card-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isRead ? <CheckCircle2 size={18} color="#10B981" /> : <Bell size={18} color="#00674D" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {notification.title}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatNotificationDate(notification.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {notification.body}
                </p>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteOne(notification.id);
                }}
                title={t('notification.deleteButtonTitle', 'Delete notification')}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  background: 'rgba(239, 68, 68, 0.06)',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </Container>
  );
};

export default Notification;
