import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import locationServices from '../../services/locationServices';

export interface LocationItem {
  id: number | string;
  name: string;
}

interface LocationsState {
  states: LocationItem[];
  statesLoading: boolean;
  statesError: string | null;

  cities: LocationItem[];
  citiesLoading: boolean;
  citiesError: string | null;

  zipCodes: LocationItem[];
  zipCodesLoading: boolean;
  zipCodesError: string | null;
}

const extractMessage = (payload: any, fallback: string): string => {
  const message = payload?.message;
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }
  return fallback;
};

const normalizeLocationItems = (payload: unknown): LocationItem[] => {
  const raw = Array.isArray((payload as { data?: unknown } | undefined)?.data)
    ? (payload as { data: unknown[] }).data
    : Array.isArray(payload)
    ? payload
    : [];

  return raw.map((item: any) => ({
    id: item?.id ?? item?.state_id ?? item?.city_id ?? '',
    name: item?.name ?? item?.state_name ?? item?.city_name ?? item?.zip_code ?? '',
  })).filter(item => item.name);
};

const initialState: LocationsState = {
  states: [],
  statesLoading: false,
  statesError: null,

  cities: [],
  citiesLoading: false,
  citiesError: null,

  zipCodes: [],
  zipCodesLoading: false,
  zipCodesError: null,
};

export const fetchAllStates = createAsyncThunk(
  'locations/fetchAllStates',
  async (_: void, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[LocationsSlice] fetchAllStates started');
      }
      const response = await locationServices.getAllStates();
      return response?.data;
    } catch (error: any) {
      console.error('[LocationsSlice] fetchAllStates failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(extractMessage(error.response.data, 'Failed to fetch states'));
      }
      return rejectWithValue(error.message || 'Failed to fetch states');
    }
  },
);

export const fetchCitiesByState = createAsyncThunk(
  'locations/fetchCitiesByState',
  async (stateId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[LocationsSlice] fetchCitiesByState started', { stateId });
      }
      const response = await locationServices.getCitiesByState(stateId);
      return response?.data;
    } catch (error: any) {
      console.error('[LocationsSlice] fetchCitiesByState failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(extractMessage(error.response.data, 'Failed to fetch cities'));
      }
      return rejectWithValue(error.message || 'Failed to fetch cities');
    }
  },
);

export const fetchZipCodesByCity = createAsyncThunk(
  'locations/fetchZipCodesByCity',
  async (cityId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[LocationsSlice] fetchZipCodesByCity started', { cityId });
      }
      const response = await locationServices.getZipCodesByCity(cityId);
      return response?.data;
    } catch (error: any) {
      console.error('[LocationsSlice] fetchZipCodesByCity failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(extractMessage(error.response.data, 'Failed to fetch zip codes'));
      }
      return rejectWithValue(error.message || 'Failed to fetch zip codes');
    }
  },
);

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearCities(state) {
      state.cities = [];
      state.citiesError = null;
    },
    clearZipCodes(state) {
      state.zipCodes = [];
      state.zipCodesError = null;
    },
    resetLocationsState() {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder
      // States
      .addCase(fetchAllStates.pending, state => {
        state.statesLoading = true;
        state.statesError = null;
      })
      .addCase(fetchAllStates.fulfilled, (state, action) => {
        state.statesLoading = false;
        state.statesError = null;
        state.states = normalizeLocationItems(action.payload);
      })
      .addCase(fetchAllStates.rejected, (state, action) => {
        state.statesLoading = false;
        state.statesError = action.payload as string;
      })
      // Cities
      .addCase(fetchCitiesByState.pending, state => {
        state.citiesLoading = true;
        state.citiesError = null;
        state.cities = [];
      })
      .addCase(fetchCitiesByState.fulfilled, (state, action) => {
        state.citiesLoading = false;
        state.citiesError = null;
        state.cities = normalizeLocationItems(action.payload);
      })
      .addCase(fetchCitiesByState.rejected, (state, action) => {
        state.citiesLoading = false;
        state.citiesError = action.payload as string;
      })
      // Zip Codes
      .addCase(fetchZipCodesByCity.pending, state => {
        state.zipCodesLoading = true;
        state.zipCodesError = null;
        state.zipCodes = [];
      })
      .addCase(fetchZipCodesByCity.fulfilled, (state, action) => {
        state.zipCodesLoading = false;
        state.zipCodesError = null;
        state.zipCodes = normalizeLocationItems(action.payload);
      })
      .addCase(fetchZipCodesByCity.rejected, (state, action) => {
        state.zipCodesLoading = false;
        state.zipCodesError = action.payload as string;
      });
  },
});

export const { clearCities, clearZipCodes, resetLocationsState } = locationsSlice.actions;
export default locationsSlice.reducer;
