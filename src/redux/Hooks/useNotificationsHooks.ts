import { useCallback, useMemo, useEffect, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../Store';
import {
  clearMarkAllAsReadError,
  clearMarkAsReadError,
  clearNotificationsError,
  fetchAllNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  resetNotificationsState,
} from '../Slices/notificationsSlice';
import { selectNotificationsViewModel } from '../Selectors/notificationsSelectors';

export const useNotificationsDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  const onFetchAllNotifications = useCallback(
    (force?: boolean) => dispatch(fetchAllNotifications(force)),
    [dispatch],
  );
  const onMarkAllNotificationsAsRead = useCallback(
    () => dispatch(markAllNotificationsAsRead()),
    [dispatch],
  );
  const onMarkNotificationAsRead = useCallback(
    (notificationId: number) => dispatch(markNotificationAsRead(notificationId)),
    [dispatch],
  );
  const onClearNotificationsError = useCallback(
    () => dispatch(clearNotificationsError()),
    [dispatch],
  );
  const onClearMarkAllAsReadError = useCallback(
    () => dispatch(clearMarkAllAsReadError()),
    [dispatch],
  );
  const onClearMarkAsReadError = useCallback(
    () => dispatch(clearMarkAsReadError()),
    [dispatch],
  );
  const onResetNotificationsState = useCallback(
    () => dispatch(resetNotificationsState()),
    [dispatch],
  );

  return useMemo(
    () => ({
      fetchAllNotifications: onFetchAllNotifications,
      markAllNotificationsAsRead: onMarkAllNotificationsAsRead,
      markNotificationAsRead: onMarkNotificationAsRead,
      clearNotificationsError: onClearNotificationsError,
      clearMarkAllAsReadError: onClearMarkAllAsReadError,
      clearMarkAsReadError: onClearMarkAsReadError,
      resetNotificationsState: onResetNotificationsState,
    }),
    [
      onFetchAllNotifications,
      onMarkAllNotificationsAsRead,
      onMarkNotificationAsRead,
      onClearNotificationsError,
      onClearMarkAllAsReadError,
      onClearMarkAsReadError,
      onResetNotificationsState,
    ],
  );
};

export const useNotificationsState = () => {
  return useSelector(selectNotificationsViewModel, shallowEqual);
};

/**
 * Smart Notification Syncing Hook for Web
 */
export const useNotificationSync = () => {
  const { fetchAllNotifications } = useNotificationsDispatch();
  const { loading, lastFetchedAt } = useNotificationsState();

  const loadingRef = useRef(loading);
  const lastFetchedAtRef = useRef(lastFetchedAt);
  const fetchAllNotificationsRef = useRef(fetchAllNotifications);

  useEffect(() => {
    loadingRef.current = loading;
    lastFetchedAtRef.current = lastFetchedAt;
  }, [loading, lastFetchedAt]);

  useEffect(() => {
    fetchAllNotificationsRef.current = fetchAllNotifications;
  }, [fetchAllNotifications]);

  useEffect(() => {
    const triggerFetch = async (force?: boolean) => {
      if (loadingRef.current) return;
      const now = Date.now();
      if (!force && lastFetchedAtRef.current && now - lastFetchedAtRef.current < 30000) return;

      try {
        await fetchAllNotificationsRef.current(force);
      } catch (err) {
        console.error('[useNotificationSync] Fetch failed:', err);
      }
    };

    triggerFetch();

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => triggerFetch(), 60000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerFetch();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
