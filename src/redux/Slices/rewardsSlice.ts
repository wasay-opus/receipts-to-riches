import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import rewardServices from '../../services/rewardServices';

export interface ApiReward {
  id: number;
  name: string;
  title?: string;
  image: string;
  points: number;
  pointsRequired?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface RewardsState {
  rewards: ApiReward[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  claimLoading: boolean;
  claimError: string | null;
}

const normalizeReward = (item: any, index: number): ApiReward => {
  const parsedId = Number(item?.id);
  const parsedPoints = Number(item?.points ?? item?.pointsRequired ?? item?.required_points);
  const name =
    typeof item?.name === 'string' && item.name.trim().length > 0
      ? item.name
      : typeof item?.title === 'string' && item.title.trim().length > 0
      ? item.title
      : `Reward ${index + 1}`;
  const image =
    typeof item?.image_url === 'string' && item.image_url.trim().length > 0
      ? item.image_url
      : typeof item?.image === 'string'
      ? item.image
      : '';

  return {
    id: Number.isFinite(parsedId) ? parsedId : index + 1,
    name,
    title: name,
    image,
    points: Number.isFinite(parsedPoints) ? parsedPoints : 0,
    pointsRequired: Number.isFinite(parsedPoints) ? parsedPoints : 0,
    image_url:
      typeof item?.image_url === 'string' && item.image_url.trim().length > 0
        ? item.image_url
        : undefined,
    created_at: typeof item?.created_at === 'string' ? item.created_at : undefined,
    updated_at: typeof item?.updated_at === 'string' ? item.updated_at : undefined,
  };
};

const extractMessage = (payload: any, fallback: string): string => {
  const message = payload?.message;
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }
  const nestedDataError = payload?.data?.error;
  if (Array.isArray(nestedDataError) && typeof nestedDataError[0] === 'string') {
    return nestedDataError[0];
  }
  if (typeof nestedDataError === 'string' && nestedDataError.trim().length > 0) {
    return nestedDataError;
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

const extractRewardsList = (payload: any): any[] => {
  const sources = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.rewards,
    payload?.data?.rewards,
    payload?.data?.data?.rewards,
    payload?.items,
    payload?.data?.items,
    payload?.results,
    payload?.data?.results,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source;
    }
  }

  return [];
};

const initialState: RewardsState = {
  rewards: [],
  loading: false,
  error: null,
  fetched: false,
  claimLoading: false,
  claimError: null,
};

export const fetchAllRewards = createAsyncThunk(
  'rewards/fetchAllRewards',
  async (_: void, { rejectWithValue }) => {
    try {
      console.log('[RewardsSlice] fetchAllRewards started');
      const response = await rewardServices.getAllRewards();
      return response?.data;
    } catch (error: any) {
      console.error('[RewardsSlice] fetchAllRewards failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch rewards'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch rewards');
    }
  },
);

export const claimReward = createAsyncThunk(
  'rewards/claimReward',
  async (rewardId: number, { rejectWithValue }) => {
    try {
      console.log('[RewardsSlice] claimReward started', { rewardId });
      const response = await rewardServices.claimReward(rewardId);
      const data = response?.data;

      if ((response?.status === 200 || response?.status === 201) && data?.success !== false) {
        return data;
      }

      return rejectWithValue(extractMessage(data, 'Failed to claim reward'));
    } catch (error: any) {
      console.error('[RewardsSlice] claimReward failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to claim reward'),
        );
      }
      return rejectWithValue(error.message || 'Failed to claim reward');
    }
  },
);

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    clearRewardsError(state) {
      state.error = null;
    },
    resetRewardsState(state) {
      state.rewards = [];
      state.loading = false;
      state.error = null;
      state.fetched = false;
      state.claimLoading = false;
      state.claimError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAllRewards.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRewards.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fetched = true;
        const rewards = extractRewardsList(action.payload);
        state.rewards = rewards.map(normalizeReward);
      })
      .addCase(fetchAllRewards.rejected, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.error = action.payload as string;
      })
      .addCase(claimReward.pending, state => {
        state.claimLoading = true;
        state.claimError = null;
      })
      .addCase(claimReward.fulfilled, state => {
        state.claimLoading = false;
        state.claimError = null;
      })
      .addCase(claimReward.rejected, (state, action) => {
        state.claimLoading = false;
        state.claimError = action.payload as string;
      });
  },
});

export const { clearRewardsError, resetRewardsState } = rewardsSlice.actions;
export default rewardsSlice.reducer;
