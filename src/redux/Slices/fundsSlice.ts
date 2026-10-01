import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import fundServices from '../../services/fundServices';

export interface PaypalOrderData {
  order_id?: string;
  approval_url?: string;
  approvalUrl?: string;
}

export interface PaypalOrderResponse {
  success?: boolean;
  message?: string;
  data?: PaypalOrderData;
}

export interface ApiFund {
  id: number;
  amount?: number;
  balance?: number;
  total_balance?: number;
  wallet_balance?: number;
  total?: number;
  [key: string]: unknown;
}

interface FundsState {
  funds: ApiFund[];
  balance: number;
  currency: string;
  loading: boolean;
  error: string | null;
  fetched: boolean;
  addFundsLoading: boolean;
  addFundsError: string | null;
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

type RawFund = {
  id?: unknown;
  amount?: unknown;
  balance?: unknown;
  total_balance?: unknown;
  wallet_balance?: unknown;
  total?: unknown;
  [key: string]: unknown;
};

const toSafeNumber = (value: unknown): number | undefined => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const normalizeFund = (item: RawFund, index: number): ApiFund => {
  const parsedId = Number(item?.id);

  return {
    ...item,
    id: Number.isFinite(parsedId) ? parsedId : index + 1,
    amount: toSafeNumber(item?.amount),
    balance: toSafeNumber(item?.balance),
    total_balance: toSafeNumber(item?.total_balance),
    wallet_balance: toSafeNumber(item?.wallet_balance),
    total: toSafeNumber(item?.total),
  };
};

const initialState: FundsState = {
  funds: [],
  balance: 0,
  currency: 'USD',
  loading: false,
  error: null,
  fetched: false,
  addFundsLoading: false,
  addFundsError: null,
};

export const fetchAllFunds = createAsyncThunk(
  'funds/fetchAllFunds',
  async (_: void, { rejectWithValue }) => {
    try {
      console.log('[FundsSlice] fetchAllFunds started');
      const response = await fundServices.getAllFunds();
      return response?.data;
    } catch (error: any) {
      console.error('[FundsSlice] fetchAllFunds failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch funds'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch funds');
    }
  },
);

export const addFunds = createAsyncThunk<
  PaypalOrderResponse,
  number,
  { rejectValue: string }
>('funds/addFunds', async (amount: number, { rejectWithValue }) => {
  try {
    console.log('[FundsSlice] addFunds started', { amount });
    const response = await fundServices.addFunds(amount);
    const data = response?.data;

    if (
      (response?.status === 200 || response?.status === 201) &&
      data
    ) {
      return data;
    }

    return rejectWithValue(extractMessage(data, 'Failed to add funds'));
  } catch (error: any) {
    console.error('[FundsSlice] addFunds failed', error);
    if (axios.isAxiosError(error) && error.response) {
      return rejectWithValue(
        extractMessage(error.response.data, 'Failed to add funds'),
      );
    }
    return rejectWithValue(error.message || 'Failed to add funds');
  }
});

const fundsSlice = createSlice({
  name: 'funds',
  initialState,
  reducers: {
    clearFundsError(state) {
      state.error = null;
    },
    clearAddFundsError(state) {
      state.addFundsError = null;
    },
    resetFundsState(state) {
      state.funds = [];
      state.balance = 0;
      state.currency = 'USD';
      state.loading = false;
      state.error = null;
      state.fetched = false;
      state.addFundsLoading = false;
      state.addFundsError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAllFunds.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllFunds.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fetched = true;

        const rawData = action.payload?.data ?? action.payload;
        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
          const bal = Number(
            rawData.balance ??
            rawData.total_balance ??
            rawData.wallet_balance ??
            rawData.amount ??
            0
          );
          state.balance = Number.isFinite(bal) ? bal : 0;
          state.currency = rawData.currency || 'USD';
          state.funds = [normalizeFund(rawData as RawFund, 0)];
        } else {
          const funds = Array.isArray(rawData) ? rawData : [];
          state.funds = funds.map((item: RawFund, index: number) =>
            normalizeFund(item as RawFund, index),
          );
          const first = state.funds[0];
          state.balance = Number(first?.balance ?? first?.total_balance ?? first?.wallet_balance ?? first?.amount ?? 0);
        }
      })
      .addCase(fetchAllFunds.rejected, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.error = action.payload as string;
      })
      .addCase(addFunds.pending, state => {
        state.addFundsLoading = true;
        state.addFundsError = null;
      })
      .addCase(addFunds.fulfilled, state => {
        state.addFundsLoading = false;
        state.addFundsError = null;
      })
      .addCase(addFunds.rejected, (state, action) => {
        state.addFundsLoading = false;
        state.addFundsError = action.payload as string;
      });
  },
});

export const { clearFundsError, clearAddFundsError, resetFundsState } =
  fundsSlice.actions;
export default fundsSlice.reducer;
