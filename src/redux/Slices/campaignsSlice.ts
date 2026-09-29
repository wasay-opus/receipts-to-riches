import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
const IMAGE_URL: string = (import.meta as any).env?.VITE_IMAGE_URL || '';
import campaignServices, {
  RenewCampaignPayload,
} from '../../services/campaignServices';
import { normalizeWebUrl } from '../../utils/url';

export type CampaignType = 'video' | 'image';

export interface ApiCampaign {
  id: number;
  user_id: number;
  file: string;
  file_url?: string;
  url?: string;
  type: string;
  sponsor: string;
  start_date?: string;
  end_date?: string;
  state?: string | null;
  city?: string | null;
  zip_code?: string | null;
  is_active: number;
  is_approved: number;
  rejection_reason: string | null;
  created_at?: string;
  updated_at?: string;
}

interface CampaignsState {
  campaigns: ApiCampaign[];
  allCampaigns: ApiCampaign[];
  myCampaigns: ApiCampaign[];
  imageCampaigns: ApiCampaign[];
  videoCampaigns: ApiCampaign[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  lastFetchedAt: number;
  incrementViewsLoading: boolean;
  incrementViewsError: string | null;
  incrementClicksLoading: boolean;
  incrementClicksError: string | null;
  renewCampaignLoading: boolean;
  renewCampaignError: string | null;
  storeCampaignLoading: boolean;
  storeCampaignError: string | null;
}

const CAMPAIGNS_CACHE_TTL_MS = 30 * 60 * 1000;

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

type RawCampaign = {
  id?: unknown;
  user_id?: unknown;
  file?: unknown;
  file_url?: unknown;
  url?: unknown;
  type?: unknown;
  sponsor?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  state?: unknown;
  city?: unknown;
  zip_code?: unknown;
  is_active?: unknown;
  is_approved?: unknown;
  rejection_reason?: unknown;
  views?: unknown;
  clicks?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const toTrimmedString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeCampaignUrl = (value: string): string => {
  return value.replace(/\/images\/campaigns\/campaigns\//i, '/images/campaigns/');
};

const buildCampaignFileUrl = (file: string, fileUrl?: unknown): string | undefined => {
  const directFileUrl = toTrimmedString(fileUrl);

  if (directFileUrl) {
    if (/^https?:\/\//i.test(directFileUrl)) {
      return normalizeCampaignUrl(directFileUrl);
    }

    const normalizedBase = toTrimmedString(IMAGE_URL).replace(/\/+$/, '');
    const normalizedFileUrl = directFileUrl.replace(/^\/+/, '');

    if (normalizedBase) {
      return normalizeCampaignUrl(`${normalizedBase}/${normalizedFileUrl}`);
    }

    return normalizeCampaignUrl(normalizedFileUrl);
  }

  if (!file) {
    return undefined;
  }

  if (/^https?:\/\//i.test(file)) {
    return normalizeCampaignUrl(file);
  }

  const normalizedBase = toTrimmedString(IMAGE_URL).replace(/\/+$/, '');
  const normalizedFile = file.replace(/^\/+/, '');

  if (!normalizedBase) {
    return undefined;
  }

  return normalizeCampaignUrl(`${normalizedBase}/${normalizedFile}`);
};

const buildCampaignWebsiteUrl = (value?: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  return normalizeWebUrl(value) ?? undefined;
};

const normalizeCampaign = (item: RawCampaign, index: number): ApiCampaign => {
  const campaignId = toSafeNumber(item?.id, index + 1);
  const file = toTrimmedString(item?.file);
  const fileUrl = buildCampaignFileUrl(file, item?.file_url);
  const websiteUrl = buildCampaignWebsiteUrl(item?.url);
  const sponsor = toTrimmedString(item?.sponsor);

  return {
    id: campaignId,
    user_id: toSafeNumber(item?.user_id),
    file,
    file_url: fileUrl,
    url: websiteUrl,
    type: toTrimmedString(item?.type),
    sponsor: sponsor || `Campaign ${campaignId}`,
    start_date: toTrimmedString(item?.start_date) || undefined,
    end_date: toTrimmedString(item?.end_date) || undefined,
    state: typeof item?.state === 'string' ? item.state : null,
    city: typeof item?.city === 'string' ? item.city : null,
    zip_code: typeof item?.zip_code === 'string' ? item.zip_code : null,
    is_active: toSafeNumber(item?.is_active),
    is_approved: toSafeNumber(item?.is_approved),
    rejection_reason: typeof item?.rejection_reason === 'string' ? item.rejection_reason : null,
    created_at: toTrimmedString(item?.created_at) || undefined,
    updated_at: toTrimmedString(item?.updated_at) || undefined,
  };
};

const normalizeCampaignCollection = (payload: unknown): ApiCampaign[] => {
  const source = payload as any;
  const candidates = [
    source,
    source?.data,
    source?.data?.data,
    source?.campaigns,
    source?.data?.campaigns,
    source?.data?.data?.campaigns,
    source?.items,
    source?.data?.items,
    source?.results,
    source?.data?.results,
  ];
  const rawCampaigns = candidates.find(Array.isArray) ?? [];

  return rawCampaigns.map((item, index) => normalizeCampaign(item as RawCampaign, index));
};

const splitCampaignsByType = (campaigns: ApiCampaign[]) => {
  return campaigns.reduce(
    (accumulator, campaign) => {
      const normalizedType = campaign.type.trim().toLowerCase();

      if (normalizedType === 'image') {
        accumulator.imageCampaigns.push(campaign);
      } else if (normalizedType === 'video') {
        accumulator.videoCampaigns.push(campaign);
      }

      return accumulator;
    },
    {
      imageCampaigns: [] as ApiCampaign[],
      videoCampaigns: [] as ApiCampaign[],
    },
  );
};

const initialState: CampaignsState = {
  campaigns: [],
  allCampaigns: [],
  myCampaigns: [],
  imageCampaigns: [],
  videoCampaigns: [],
  loading: false,
  error: null,
  fetched: false,
  lastFetchedAt: 0,
  incrementViewsLoading: false,
  incrementViewsError: null,
  incrementClicksLoading: false,
  incrementClicksError: null,
  renewCampaignLoading: false,
  renewCampaignError: null,
  storeCampaignLoading: false,
  storeCampaignError: null,
};

export const fetchAllCampaigns = createAsyncThunk(
  'campaigns/fetchAllCampaigns',
  async (_: CampaignType | undefined, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[CampaignsSlice] fetchAllCampaigns started');
      }
      const response = await campaignServices.getAllCampaigns();
      return response?.data;
    } catch (error: any) {
      console.error('[CampaignsSlice] fetchAllCampaigns failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch campaigns'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch campaigns');
    }
  },
  {
    condition: (_type, { getState }) => {
      const state = getState() as { campaigns: CampaignsState };
      if (state.campaigns.loading) {
        return false;
      }

      if (
        state.campaigns.fetched &&
        state.campaigns.lastFetchedAt > 0 &&
        Date.now() - state.campaigns.lastFetchedAt < CAMPAIGNS_CACHE_TTL_MS
      ) {
        return false;
      }

      return true;
    },
  },
);

export const fetchMyCampaigns = createAsyncThunk(
  'campaigns/fetchMyCampaigns',
  async (_: void, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[CampaignsSlice] fetchMyCampaigns started');
      }
      const response = await campaignServices.getMyCampaigns();
      return response?.data;
    } catch (error: any) {
      console.error('[CampaignsSlice] fetchMyCampaigns failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch campaigns'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch campaigns');
    }
  },
);

export const incrementViews = createAsyncThunk(
  'campaigns/incrementViews',
  async (campaignIds: number[], { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[CampaignsSlice] incrementViews started', { campaignIds });
      }
      const response = await campaignServices.incrementViews(campaignIds);
      const data = response?.data;

      if ((response?.status === 200 || response?.status === 201) && data?.success !== false) {
        return data;
      }

      return rejectWithValue(extractMessage(data, 'Failed to increment views'));
    } catch (error: any) {
      console.error('[CampaignsSlice] incrementViews failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to increment views'),
        );
      }
      return rejectWithValue(error.message || 'Failed to increment views');
    }
  },
);

export const incrementClicks = createAsyncThunk(
  'campaigns/incrementClicks',
  async (campaignId: number, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[CampaignsSlice] incrementClicks started', { campaignId });
      }
      const response = await campaignServices.incrementClicks(campaignId);
      const data = response?.data;

      if ((response?.status === 200 || response?.status === 201) && data?.success !== false) {
        return data;
      }

      return rejectWithValue(extractMessage(data, 'Failed to increment clicks'));
    } catch (error: any) {
      console.error('[CampaignsSlice] incrementClicks failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to increment clicks'),
        );
      }
      return rejectWithValue(error.message || 'Failed to increment clicks');
    }
  },
);

export const renewCampaign = createAsyncThunk(
  'campaigns/renewCampaign',
  async (payload: RenewCampaignPayload, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[CampaignsSlice] renewCampaign started', payload);
      }
      const response = await campaignServices.renewCampaign(payload);
      const data = response?.data;

      if ((response?.status === 200 || response?.status === 201) && data?.success !== false) {
        return data;
      }

      return rejectWithValue(extractMessage(data, 'Failed to renew campaign'));
    } catch (error: any) {
      console.error('[CampaignsSlice] renewCampaign failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to renew campaign'),
        );
      }
      return rejectWithValue(error.message || 'Failed to renew campaign');
    }
  },
);

export const storeCampaign = createAsyncThunk(
  'campaigns/storeCampaign',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[CampaignsSlice] storeCampaign started');
      }
      const response = await campaignServices.storeCampaign(formData);
      const data = response?.data;

      if ((response?.status === 200 || response?.status === 201) && data?.success !== false) {
        return data;
      }

      return rejectWithValue(extractMessage(data, 'Failed to store campaign'));
    } catch (error: any) {
      console.error('[CampaignsSlice] storeCampaign failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to store campaign'),
        );
      }
      return rejectWithValue(error.message || 'Failed to store campaign');
    }
  },
);

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    clearCampaignsError(state) {
      state.error = null;
    },
    clearIncrementViewsError(state) {
      state.incrementViewsError = null;
    },
    clearIncrementClicksError(state) {
      state.incrementClicksError = null;
    },
    clearRenewCampaignError(state) {
      state.renewCampaignError = null;
    },
    clearStoreCampaignError(state) {
      state.storeCampaignError = null;
    },
    resetCampaignsState(state) {
      state.campaigns = [];
      state.allCampaigns = [];
      state.myCampaigns = [];
      state.imageCampaigns = [];
      state.videoCampaigns = [];
      state.loading = false;
      state.error = null;
      state.fetched = false;
      state.lastFetchedAt = 0;
      state.incrementViewsLoading = false;
      state.incrementViewsError = null;
      state.incrementClicksLoading = false;
      state.incrementClicksError = null;
      state.renewCampaignLoading = false;
      state.renewCampaignError = null;
      state.storeCampaignLoading = false;
      state.storeCampaignError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAllCampaigns.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fetched = true;
        state.lastFetchedAt = Date.now();
        const campaigns = normalizeCampaignCollection(action.payload);

        const groupedCampaigns = splitCampaignsByType(campaigns);
        state.campaigns = campaigns;
        state.allCampaigns = campaigns;
        state.imageCampaigns = groupedCampaigns.imageCampaigns;
        state.videoCampaigns = groupedCampaigns.videoCampaigns;
      })
      .addCase(fetchAllCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.error = action.payload as string;
      })
      .addCase(fetchMyCampaigns.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fetched = true;
        state.myCampaigns = normalizeCampaignCollection(action.payload);
      })
      .addCase(fetchMyCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.error = action.payload as string;
      })
      .addCase(incrementViews.pending, state => {
        state.incrementViewsLoading = true;
        state.incrementViewsError = null;
      })
      .addCase(incrementViews.fulfilled, state => {
        state.incrementViewsLoading = false;
        state.incrementViewsError = null;
      })
      .addCase(incrementViews.rejected, (state, action) => {
        state.incrementViewsLoading = false;
        state.incrementViewsError = action.payload as string;
      })
      .addCase(incrementClicks.pending, state => {
        state.incrementClicksLoading = true;
        state.incrementClicksError = null;
      })
      .addCase(incrementClicks.fulfilled, state => {
        state.incrementClicksLoading = false;
        state.incrementClicksError = null;
      })
      .addCase(incrementClicks.rejected, (state, action) => {
        state.incrementClicksLoading = false;
        state.incrementClicksError = action.payload as string;
      })
      .addCase(renewCampaign.pending, state => {
        state.renewCampaignLoading = true;
        state.renewCampaignError = null;
      })
      .addCase(renewCampaign.fulfilled, state => {
        state.renewCampaignLoading = false;
        state.renewCampaignError = null;
      })
      .addCase(renewCampaign.rejected, (state, action) => {
        state.renewCampaignLoading = false;
        state.renewCampaignError = action.payload as string;
      })
      .addCase(storeCampaign.pending, state => {
        state.storeCampaignLoading = true;
        state.storeCampaignError = null;
      })
      .addCase(storeCampaign.fulfilled, state => {
        state.storeCampaignLoading = false;
        state.storeCampaignError = null;
        state.lastFetchedAt = 0;
      })
      .addCase(storeCampaign.rejected, (state, action) => {
        state.storeCampaignLoading = false;
        state.storeCampaignError = action.payload as string;
      });
  },
});

export const {
  clearCampaignsError,
  clearIncrementViewsError,
  clearIncrementClicksError,
  clearRenewCampaignError,
  clearStoreCampaignError,
  resetCampaignsState,
} = campaignsSlice.actions;
export default campaignsSlice.reducer;
