import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../Store';

const selectNotificationsSlice = (state: RootState) => state.notifications;

export const selectUnreadNotificationsCount = createSelector(
  [selectNotificationsSlice],
  notificationsState =>
    notificationsState.notifications.filter(notification => !notification.read_at).length,
);

export const selectNotificationsViewModel = createSelector(
  [selectNotificationsSlice, selectUnreadNotificationsCount],
  (notificationsState, unreadCount) => ({
    ...notificationsState,
    unreadCount,
  }),
);
