import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import notificationCenterServices from '../../services/notificationServices';

export interface ApiNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  image?: string | null;
  data?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface NotificationsPagination {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
}

interface NotificationsState {
  notifications: ApiNotification[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  lastFetchedAt: number;
  pagination: NotificationsPagination;
  markAsReadLoadingId: number | null;
  markAsReadError: string | null;
  markAllAsReadLoading: boolean;
  markAllAsReadError: string | null;
}

type RawNotification = {
  id?: unknown;
  user_id?: unknown;
  type?: unknown;
  title?: unknown;
  body?: unknown;
  image?: unknown;
  data?: unknown;
  read_at?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

const initialPagination: NotificationsPagination = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
  perPage: 0,
};

const initialState: NotificationsState = {
  notifications: [],
  loading: false,
  error: null,
  fetched: false,
  lastFetchedAt: 0,
  pagination: initialPagination,
  markAsReadLoadingId: null,
  markAsReadError: null,
  markAllAsReadLoading: false,
  markAllAsReadError: null,
};

const extractMessage = (payload: any, fallback: string): string => {
  const message = payload?.message;
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }
  const nestedError = payload?.error;
  if (Array.isArray(nestedError) && typeof nestedError[0] === 'string') {
    return nestedError[0];
  }
  if (typeof nestedError === 'string' && nestedError.trim().length > 0) {
    return nestedError;
  }
  return fallback;
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const toTrimmedString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeNotification = (
  item: RawNotification,
  index: number,
): ApiNotification => {
  const notificationId = toSafeNumber(item?.id, index + 1);

  return {
    id: notificationId,
    user_id: toSafeNumber(item?.user_id),
    type: toTrimmedString(item?.type) || 'notification',
    title: toTrimmedString(item?.title) || `Notification ${notificationId}`,
    body: toTrimmedString(item?.body),
    image: typeof item?.image === 'string' ? item.image : null,
    data:
      item?.data && typeof item.data === 'object' && !Array.isArray(item.data)
        ? (item.data as Record<string, unknown>)
        : null,
    read_at: typeof item?.read_at === 'string' ? item.read_at : null,
    created_at: toTrimmedString(item?.created_at) || undefined,
    updated_at: toTrimmedString(item?.updated_at) || undefined,
  };
};

export const fetchAllNotifications = createAsyncThunk<any, boolean | undefined>(
  'notifications/fetchAllNotifications',
  async (force, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[NotificationsSlice] fetchAllNotifications started');
      }
      const response = await notificationCenterServices.getAllNotifications();
      return response?.data;
    } catch (error: any) {
      console.error('[NotificationsSlice] fetchAllNotifications failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch notifications'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  },
  {
    condition: (force, { getState }) => {
      const state = getState() as { notifications: NotificationsState };
      if (state.notifications.loading) {
        return false;
      }

      if (
        !force &&
        state.notifications.fetched &&
        state.notifications.lastFetchedAt > 0 &&
        Date.now() - state.notifications.lastFetchedAt < 30 * 1000
      ) {
        return false;
      }

      return true;
    },
  },
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_: void, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[NotificationsSlice] markAllNotificationsAsRead started');
      }
      const response = await notificationCenterServices.markAllAsRead();
      const data = response?.data;

      if ((response?.status === 200 || response?.status === 201) && data?.success !== false) {
        return data;
      }

      return rejectWithValue(
        extractMessage(data, 'Failed to mark notifications as read'),
      );
    } catch (error: any) {
      console.error('[NotificationsSlice] markAllNotificationsAsRead failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(
            error.response.data,
            'Failed to mark notifications as read',
          ),
        );
      }
      return rejectWithValue(error.message || 'Failed to mark notifications as read');
    }
  },
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[NotificationsSlice] markNotificationAsRead started', notificationId);
      }
      const response = await notificationCenterServices.markAsRead(notificationId);
      const data = response?.data;

      if ((response?.status === 200 || response?.status === 201) && data?.success !== false) {
        return { notificationId, data };
      }

      return rejectWithValue(
        extractMessage(data, 'Failed to mark notification as read'),
      );
    } catch (error: any) {
      console.error('[NotificationsSlice] markNotificationAsRead failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(
            error.response.data,
            'Failed to mark notification as read',
          ),
        );
      }
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationsError(state) {
      state.error = null;
    },
    clearMarkAllAsReadError(state) {
      state.markAllAsReadError = null;
    },
    clearMarkAsReadError(state) {
      state.markAsReadError = null;
    },
    resetNotificationsState(state) {
      state.notifications = [];
      state.loading = false;
      state.error = null;
      state.fetched = false;
      state.lastFetchedAt = 0;
      state.pagination = initialPagination;
      state.markAsReadLoadingId = null;
      state.markAsReadError = null;
      state.markAllAsReadLoading = false;
      state.markAllAsReadError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAllNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fetched = true;
        state.lastFetchedAt = Date.now();

        const paginatedPayload =
          action.payload?.data && typeof action.payload.data === 'object'
            ? action.payload.data
            : null;

        const notifications = Array.isArray(paginatedPayload?.data)
          ? paginatedPayload.data
          : Array.isArray(action.payload?.data)
          ? action.payload.data
          : Array.isArray(action.payload)
          ? action.payload
          : [];

        state.notifications = notifications.map(
          (item: RawNotification, index: number) =>
            normalizeNotification(item, index),
        );

        state.pagination = {
          currentPage: toSafeNumber(paginatedPayload?.current_page, 1),
          lastPage: toSafeNumber(paginatedPayload?.last_page, 1),
          total: toSafeNumber(paginatedPayload?.total, state.notifications.length),
          perPage: toSafeNumber(paginatedPayload?.per_page, state.notifications.length),
        };
      })
      .addCase(fetchAllNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.fetched = true;
      })
      .addCase(markAllNotificationsAsRead.pending, state => {
        state.markAllAsReadLoading = true;
        state.markAllAsReadError = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, state => {
        const markedAt = new Date().toISOString();

        state.markAllAsReadLoading = false;
        state.markAllAsReadError = null;
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          read_at: notification.read_at || markedAt,
        }));
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.markAllAsReadLoading = false;
        state.markAllAsReadError = action.payload as string;
      })
      .addCase(markNotificationAsRead.pending, (state, action) => {
        state.markAsReadLoadingId = action.meta.arg;
        state.markAsReadError = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const markedAt = new Date().toISOString();
        const notificationId = action.payload.notificationId;

        state.markAsReadLoadingId = null;
        state.markAsReadError = null;
        state.notifications = state.notifications.map(notification =>
          notification.id === notificationId
            ? {
                ...notification,
                read_at: notification.read_at || markedAt,
              }
            : notification,
        );
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.markAsReadLoadingId = null;
        state.markAsReadError = action.payload as string;
      });
  },
});

export const {
  clearNotificationsError,
  clearMarkAllAsReadError,
  clearMarkAsReadError,
  resetNotificationsState,
} =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
