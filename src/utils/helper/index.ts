import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import localStoreUtil, { getAccessToken } from '../localStoreUtil';
import { showToast } from '../../components/Toast';
import {
  getStatusFriendlyMessage,
  getUserFriendlyErrorMessage,
} from '../errorMessages';
import { store } from '../../redux/Store';

export const formatDateToISO8601 = (date: Date): string => {
  return date.toISOString();
};

export const formatDOBForAPI = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const base_url: string =
  (import.meta as any).env?.VITE_BASE_URL ||
  'https://receipts-to-riches.koderspedia.live/api';

const API_TIMEOUT_MS = 30000;
const API_FEEDBACK_COOLDOWN_MS = 3000;
let lastApiFeedbackTimestamp = 0;
let lastApiFeedbackMessage = '';

const maybeShowApiFeedback = (text1: string, text2: string) => {
  const now = Date.now();
  const nextMessage = `${text1}:${text2}`;
  const isWithinCooldown =
    now - lastApiFeedbackTimestamp < API_FEEDBACK_COOLDOWN_MS;
  const isDuplicateMessage = nextMessage === lastApiFeedbackMessage;

  if (isWithinCooldown && isDuplicateMessage) {
    return;
  }

  lastApiFeedbackTimestamp = now;
  lastApiFeedbackMessage = nextMessage;
  showToast({
    type: 'error',
    text1,
    text2,
    visibilityTime: 3000,
  });
};

const isMeaningfulString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const extractMessageFromPayload = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const data = payload as Record<string, unknown>;

  if (data.errors && typeof data.errors === 'object') {
    const errorEntries = Object.values(data.errors);
    const flattened = errorEntries.flat().filter(isMeaningfulString);
    if (flattened.length > 0) {
      return flattened.join(' ');
    }
  }

  const message = data.message;
  if (Array.isArray(message) && isMeaningfulString(message[0])) {
    return message[0].trim();
  }

  if (isMeaningfulString(message)) {
    return message.trim();
  }

  const nestedError = data.error;
  if (Array.isArray(nestedError) && isMeaningfulString(nestedError[0])) {
    return nestedError[0].trim();
  }

  if (isMeaningfulString(nestedError)) {
    return nestedError.trim();
  }

  const friendly = data.user_friendly_message;
  if (isMeaningfulString(friendly)) {
    return friendly.trim();
  }

  return '';
};

const isValidAccessToken = (token?: string): token is string => {
  if (typeof token !== 'string') {
    return false;
  }

  const normalizedToken = token.trim();
  if (!normalizedToken) {
    return false;
  }

  const invalidTokens = new Set([
    'apple',
    'google',
    'facebook',
    'github',
    'microsoft',
    'linkedin',
    'twitter',
    'bearer apple',
    'bearer google',
  ]);

  return !invalidTokens.has(normalizedToken.toLowerCase());
};

let lastHandledUnauthorizedToken: string | null = null;

const clearAuthenticatedSession = async (accessToken: string | null) => {
  if (lastHandledUnauthorizedToken === accessToken) {
    return;
  }

  lastHandledUnauthorizedToken = accessToken;

  store.dispatch({ type: 'auth/logout' });
  store.dispatch({ type: 'user/clearUserData' });
  store.dispatch({ type: 'games/resetGamesState' });
  store.dispatch({ type: 'campaigns/resetCampaignsState' });
  store.dispatch({ type: 'funds/resetFundsState' });
  store.dispatch({ type: 'wallet/resetWalletState' });
  store.dispatch({ type: 'rewards/resetRewardsState' });
  store.dispatch({ type: 'notifications/resetNotificationsState' });

  await Promise.allSettled([
    localStoreUtil.removeData('accessToken'),
    localStoreUtil.removeData('user'),
  ]);

  if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
    window.location.href = '/signin';
  }
};

export interface FetchApiOptions {
  method: Method;
  endPoint: string;
  token?: boolean;
  data?: any;
  params?: any;
  formData?: boolean;
  timeout?: number;
}

export interface ApiHeaders {
  tenant?: string;
  Authorization?: string;
  'Content-Type'?: string;
  Accept?: string;
}

export const fetchApi = async ({
  method,
  endPoint,
  token = false,
  data,
  params,
  formData = false,
  timeout = API_TIMEOUT_MS,
}: FetchApiOptions): Promise<any> => {
  try {
    const headers: ApiHeaders = {
      Accept: 'application/json',
    };

    if (token) {
      let accessToken = await getAccessToken();
      if (!isValidAccessToken(accessToken)) {
        const reduxToken = store.getState().auth?.token;
        if (isValidAccessToken(reduxToken)) {
          accessToken = reduxToken;
        }
      }
      if (isValidAccessToken(accessToken)) {
        headers.Authorization = `Bearer ${accessToken}`;
      } else {
        return Promise.reject(new Error('Unauthenticated: No active auth token'));
      }
    }

    if (formData) {
      // Allow browser Axios to set Content-Type header with multipart boundary
    } else if (data) {
      headers['Content-Type'] = 'application/json';
    }

    const cleanEndPoint = endPoint.startsWith('/') ? endPoint : `/${endPoint}`;
    const url = `${base_url}${cleanEndPoint}`;

    const config: AxiosRequestConfig = {
      method,
      url,
      data,
      params,
      headers: headers as any,
      timeout,
    };

    const response: AxiosResponse = await axios(config);
    const payload = response.data;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      if (payload.status === undefined) {
        payload.status = response.status;
      }
    }

    return {
      ...response,
      ...(payload && typeof payload === 'object' && !Array.isArray(payload)
        ? payload
        : {}),
      data: payload,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data;

      if (status === 401 && token) {
        const accessToken = (await getAccessToken()) || store.getState().auth?.token;
        if (isValidAccessToken(accessToken)) {
          await clearAuthenticatedSession(accessToken);
        }
      }

      const extractedMsg = extractMessageFromPayload(responseData);
      const friendlyMsg =
        extractedMsg ||
        getStatusFriendlyMessage(status) ||
        getUserFriendlyErrorMessage(error);

      if (friendlyMsg && status !== 401) {
        maybeShowApiFeedback('Error', friendlyMsg);
      }
    }
    throw error;
  }
};

export default fetchApi;
