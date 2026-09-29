import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import walletServices from '../../services/walletServices';

export interface ApiWallet {
  id?: number;
  balance?: number;
  points?: number;
  [key: string]: any;
}

interface WalletState {
  wallet: ApiWallet | null;
  loading: boolean;
  error: string | null;
  fetched: boolean;
  addPointsLoading: boolean;
  addPointsError: string | null;
}

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

const initialState: WalletState = {
  wallet: null,
  loading: false,
  error: null,
  fetched: false,
  addPointsLoading: false,
  addPointsError: null,
};

export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_: void, { rejectWithValue }) => {
    try {
      console.log('[WalletSlice] fetchWallet started');
      const response = await walletServices.getWallet();
      return response?.data;
    } catch (error: any) {
      console.error('[WalletSlice] fetchWallet failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch wallet'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch wallet');
    }
  },
);

export const addPoints = createAsyncThunk(
  'wallet/addPoints',
  async (points: number, { rejectWithValue }) => {
    try {
      console.log('[WalletSlice] addPoints started', { points });
      const response = await walletServices.addPoints(points);
      const data = response?.data;

      if ((response?.status === 200 || response?.status === 201) && data?.success !== false) {
        return data;
      }

      return rejectWithValue(extractMessage(data, 'Failed to add points'));
    } catch (error: any) {
      console.error('[WalletSlice] addPoints failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to add points'),
        );
      }
      return rejectWithValue(error.message || 'Failed to add points');
    }
  },
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError(state) {
      state.error = null;
    },
    clearAddPointsError(state) {
      state.addPointsError = null;
    },
    resetWalletState(state) {
      state.wallet = null;
      state.loading = false;
      state.error = null;
      state.fetched = false;
      state.addPointsLoading = false;
      state.addPointsError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchWallet.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fetched = true;
        state.wallet = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.error = action.payload as string;
      })
      .addCase(addPoints.pending, state => {
        state.addPointsLoading = true;
        state.addPointsError = null;
      })
      .addCase(addPoints.fulfilled, state => {
        state.addPointsLoading = false;
        state.addPointsError = null;
      })
      .addCase(addPoints.rejected, (state, action) => {
        state.addPointsLoading = false;
        state.addPointsError = action.payload as string;
      });
  },
});

export const { clearWalletError, clearAddPointsError, resetWalletState } = walletSlice.actions;
export default walletSlice.reducer;
