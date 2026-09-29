import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import gameServices from '../../services/gameServices';

interface ApiGameType {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiGame {
  id: number;
  name: string;
  slug: string;
  price: string;
  game_type_id: number;
  created_at?: string;
  updated_at?: string;
  game_type?: ApiGameType;
}

export type GamesData = Record<string, ApiGame[]>;
export interface MiniGameSlotItem {
  id: number;
  user_id: number;
  game_id: number;
  slot: number;
  is_open: 0 | 1;
  blocked_until: string | null;
  created_at?: string;
  updated_at?: string;
  game?: ApiGame;
}

export type UnlockedMiniGamesData = Record<string, MiniGameSlotItem[]>;

interface GamesState {
  allGames: GamesData | null;
  gamesBySlug: Record<string, any>;
  unlockedMiniGames: UnlockedMiniGamesData;
  gamePlayCountSinceVideoAd: number;
  loading: boolean;
  slugLoading: boolean;
  unlockedMiniGamesLoading: boolean;
  error: string | null;
  slugError: string | null;
  unlockedMiniGamesError: string | null;
  fetched: boolean;
  lastFetchedAt: number;
  unlockedMiniGamesFetched: boolean;
  unlockedMiniGamesLastFetchedAt: number;
  lastRequestedSlug: string | null;
  unlockMiniGameLoading: boolean;
  unlockedMiniGame: boolean;
  unlockMiniGameError: string | null;
}

const GAMES_CACHE_KEY = '@ReceiptsToRiches/games-cache';
const GAMES_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const UNLOCKED_MINI_GAMES_TTL_MS = 30 * 60 * 1000;
export const GAME_PLAY_VIDEO_AD_THRESHOLD = 5;

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

const initialState: GamesState = {
  allGames: null,
  gamesBySlug: {},
  unlockedMiniGames: {},
  gamePlayCountSinceVideoAd: 0,
  loading: false,
  slugLoading: false,
  unlockedMiniGamesLoading: false,
  error: null,
  slugError: null,
  unlockedMiniGamesError: null,
  fetched: false,
  lastFetchedAt: 0,
  unlockedMiniGamesFetched: false,
  unlockedMiniGamesLastFetchedAt: 0,
  lastRequestedSlug: null,
  unlockMiniGameLoading: false,
  unlockedMiniGame: false,
  unlockMiniGameError: null,
};

type GamesCacheRecord = {
  payload: any;
  cachedAt: number;
};

const isFresh = (lastFetchedAt: number, ttlMs: number): boolean => {
  return lastFetchedAt > 0 && Date.now() - lastFetchedAt < ttlMs;
};

const readGamesCache = async (): Promise<GamesCacheRecord | null> => {
  try {
    const cachedValue = localStorage.getItem(GAMES_CACHE_KEY);
    if (!cachedValue) {
      return null;
    }

    const parsedValue = JSON.parse(cachedValue) as Partial<GamesCacheRecord>;
    const cachedAt = Number(parsedValue.cachedAt);

    if (!Number.isFinite(cachedAt)) {
      return null;
    }

    return {
      payload: parsedValue.payload,
      cachedAt,
    };
  } catch {
    return null;
  }
};

const writeGamesCache = async (payload: any): Promise<void> => {
  try {
    localStorage.setItem(
      GAMES_CACHE_KEY,
      JSON.stringify({
        payload,
        cachedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore cache write failures.
  }
};

const normalizeUnlockedMiniGames = (payload: any): UnlockedMiniGamesData => {
  const source = payload?.data ?? payload;
  if (!source || typeof source !== 'object') {
    return {};
  }

  const normalizedData: UnlockedMiniGamesData = {};

  Object.entries(source as Record<string, unknown>).forEach(
    ([slugKey, value]) => {
      if (!Array.isArray(value)) {
        return;
      }

      const normalizedSlug = String(slugKey || '').toLowerCase();
      normalizedData[normalizedSlug] = value.map(slotItem => {
        const item = (slotItem ?? {}) as Record<string, any>;
        const itemGame = (item.game ?? {}) as Record<string, any>;
        const itemGameType = (itemGame.game_type ?? {}) as Record<string, any>;

        const parsedId = Number(item.id);
        const parsedUserId = Number(item.user_id);
        const parsedGameId = Number(item.game_id);
        const parsedSlot = Number(item.slot);

        const parsedGameTypeId = Number(itemGame.game_type_id);

        return {
          id: Number.isFinite(parsedId) ? parsedId : 0,
          user_id: Number.isFinite(parsedUserId) ? parsedUserId : 0,
          game_id: Number.isFinite(parsedGameId) ? parsedGameId : 0,
          slot: Number.isFinite(parsedSlot) ? parsedSlot : 0,
          is_open: (Number(item.is_open) === 1 || String(item.is_open).toLowerCase() === 'true') ? 1 : 0,
          blocked_until:
            typeof item.blocked_until === 'string' &&
            item.blocked_until.trim().length > 0
              ? item.blocked_until
              : null,
          created_at:
            typeof item.created_at === 'string' ? item.created_at : undefined,
          updated_at:
            typeof item.updated_at === 'string' ? item.updated_at : undefined,
          game:
            Object.keys(itemGame).length > 0
              ? {
                  id: Number.isFinite(Number(itemGame.id))
                    ? Number(itemGame.id)
                    : 0,
                  name: typeof itemGame.name === 'string' ? itemGame.name : '',
                  slug: typeof itemGame.slug === 'string' ? itemGame.slug : '',
                  price:
                    typeof itemGame.price === 'string'
                      ? itemGame.price
                      : String(itemGame.price ?? ''),
                  game_type_id: Number.isFinite(parsedGameTypeId)
                    ? parsedGameTypeId
                    : 0,
                  created_at:
                    typeof itemGame.created_at === 'string'
                      ? itemGame.created_at
                      : undefined,
                  updated_at:
                    typeof itemGame.updated_at === 'string'
                      ? itemGame.updated_at
                      : undefined,
                  game_type:
                    Object.keys(itemGameType).length > 0
                      ? {
                          id: Number.isFinite(Number(itemGameType.id))
                            ? Number(itemGameType.id)
                            : 0,
                          name:
                            typeof itemGameType.name === 'string'
                              ? itemGameType.name
                              : '',
                          slug:
                            typeof itemGameType.slug === 'string'
                              ? itemGameType.slug
                              : '',
                          created_at:
                            typeof itemGameType.created_at === 'string'
                              ? itemGameType.created_at
                              : undefined,
                          updated_at:
                            typeof itemGameType.updated_at === 'string'
                              ? itemGameType.updated_at
                              : undefined,
                        }
                      : undefined,
                }
              : undefined,
        };
      });
    },
  );

  return normalizedData;
};

export const fetchAllGames = createAsyncThunk(
  'games/fetchAllGames',
  async (_: void | undefined, { rejectWithValue, dispatch }) => {
    try {
      if (__DEV__) {
        console.log('[GamesSlice] fetchAllGames started');
      }

      const cachedGames = await readGamesCache();
      if (cachedGames?.payload) {
        dispatch(hydrateAllGamesFromCache(cachedGames));
        if (isFresh(cachedGames.cachedAt, GAMES_CACHE_TTL_MS)) {
          return cachedGames.payload;
        }
      }

      const response = await gameServices.getAllGames();
      if (__DEV__) {
        const payload = response?.data?.data ?? {};
        const categoryStats = Object.entries(payload).reduce(
          (acc, [key, value]) => {
            acc[key] = Array.isArray(value) ? value.length : 0;
            return acc;
          },
          {} as Record<string, number>,
        );
        console.log('[GamesSlice] fetchAllGames success', {
          categories: categoryStats,
        });
      }
      return response.data;
    } catch (error: any) {
      console.error('[GamesSlice] fetchAllGames failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch games'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch games');
    }
  },
  {
    condition: (_: void, { getState }) => {
      const state = getState() as { games: GamesState };
      if (state.games.loading) {
        return false;
      }

      if (
        state.games.fetched &&
        isFresh(state.games.lastFetchedAt, GAMES_CACHE_TTL_MS)
      ) {
        return false;
      }

      return true;
    },
  },
);

export const fetchGamesBySlug = createAsyncThunk(
  'games/fetchGamesBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[GamesSlice] fetchGamesBySlug started', { slug });
      }
      const response = await gameServices.getGamesBySlug(slug);
      return {
        slug,
        response: response?.data,
      };
    } catch (error: any) {
      console.error('[GamesSlice] fetchGamesBySlug failed', { slug, error });
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue({
          slug,
          message: extractMessage(error.response.data, 'Failed to fetch games'),
        });
      }
      return rejectWithValue({
        slug,
        message: error.message || 'Failed to fetch games',
      });
    }
  },
);

export const fetchUnlockedMiniGames = createAsyncThunk(
  'games/fetchUnlockedMiniGames',
  async (_: void, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[GamesSlice] fetchUnlockedMiniGames started');
      }
      const response = await gameServices.getUnlockedMiniGames();
      return response?.data;
    } catch (error: any) {
      console.error('[GamesSlice] fetchUnlockedMiniGames failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(
            error.response.data,
            'Failed to fetch mini game unlock status',
          ),
        );
      }
      return rejectWithValue(
        error.message || 'Failed to fetch mini game unlock status',
      );
    }
  },
  {
    condition: (_: void, { getState }) => {
      const state = getState() as { games: GamesState };
      if (state.games.unlockedMiniGamesLoading) {
        return false;
      }

      if (
        state.games.unlockedMiniGamesFetched &&
        isFresh(
          state.games.unlockedMiniGamesLastFetchedAt,
          UNLOCKED_MINI_GAMES_TTL_MS,
        )
      ) {
        return false;
      }

      return true;
    },
  },
);

export const unlockedMiniGame = createAsyncThunk(
  'games/unlockedMiniGame',
  async (datas: any, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[GamesSlice] unlockedMiniGame started');
      }
      const response = await gameServices.unlockMiniGames(datas);
      return response?.data;
    } catch (error: any) {
      console.error('[GamesSlice] unlockedMiniGame failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(
            error.response.data,
            'Failed to fetch mini game unlock status',
          ),
        );
      }
      return rejectWithValue(
        error.message || 'Failed to fetch mini game unlock status',
      );
    }
  },
);

const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
    clearGamesError(state) {
      state.error = null;
      state.slugError = null;
      state.unlockedMiniGamesError = null;
    },
    recordGamePlayForVideoAd(state) {
      const nextCount = state.gamePlayCountSinceVideoAd + 1;
      state.gamePlayCountSinceVideoAd =
        nextCount >= GAME_PLAY_VIDEO_AD_THRESHOLD ? 0 : nextCount;
    },
    invalidateUnlockedMiniGamesCache(state) {
      state.unlockedMiniGamesFetched = false;
      state.unlockedMiniGamesLastFetchedAt = 0;
    },
    hydrateAllGamesFromCache(state, action) {
      const cachedRecord = action.payload as GamesCacheRecord;
      const payload =
        cachedRecord?.payload?.data ?? cachedRecord?.payload ?? null;
      state.allGames = payload;
      state.loading = false;
      state.error = null;
      state.fetched = true;
      state.lastFetchedAt = cachedRecord?.cachedAt ?? Date.now();
    },
    resetGamesState(state) {
      state.allGames = null;
      state.gamesBySlug = {};
      state.unlockedMiniGames = {};
      state.gamePlayCountSinceVideoAd = 0;
      state.loading = false;
      state.slugLoading = false;
      state.unlockedMiniGamesLoading = false;
      state.error = null;
      state.slugError = null;
      state.unlockedMiniGamesError = null;
      state.fetched = false;
      state.lastFetchedAt = 0;
      state.unlockedMiniGamesFetched = false;
      state.unlockedMiniGamesLastFetchedAt = 0;
      state.lastRequestedSlug = null;
      state.unlockMiniGameLoading = false;
      state.unlockedMiniGame = false;
      state.unlockMiniGameError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAllGames.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllGames.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fetched = true;
        state.lastFetchedAt = Date.now();
        state.allGames = action.payload?.data ?? action.payload ?? null;
        writeGamesCache(action.payload).catch(() => {});
      })
      .addCase(fetchAllGames.rejected, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.error = action.payload as string;
      })
      .addCase(fetchGamesBySlug.pending, (state, action) => {
        state.slugLoading = true;
        state.slugError = null;
        state.lastRequestedSlug = action.meta.arg;
      })
      .addCase(fetchGamesBySlug.fulfilled, (state, action) => {
        const slug = action.payload.slug;
        const responseData =
          action.payload.response?.data ?? action.payload.response ?? null;
        state.slugLoading = false;
        state.slugError = null;
        state.lastRequestedSlug = slug;
        state.gamesBySlug[slug] = responseData;
        if (__DEV__) {
          console.log('[GamesSlice] fetchGamesBySlug success', {
            slug,
            hasData: Boolean(state.gamesBySlug[slug]),
          });
          console.log('[GamesSlice] fetchGamesBySlug response', {
            slug,
            response: responseData,
          });
        }
      })
      .addCase(fetchGamesBySlug.rejected, (state, action) => {
        const payload = action.payload as
          | { slug?: string; message?: string }
          | undefined;
        state.slugLoading = false;
        state.lastRequestedSlug = payload?.slug ?? action.meta.arg;
        state.slugError = payload?.message ?? 'Failed to fetch games';
      })
      .addCase(fetchUnlockedMiniGames.pending, state => {
        state.unlockedMiniGamesLoading = true;
        state.unlockedMiniGamesError = null;
      })
      .addCase(fetchUnlockedMiniGames.fulfilled, (state, action) => {
        state.unlockedMiniGamesLoading = false;
        state.unlockedMiniGamesError = null;
        state.unlockedMiniGamesFetched = true;
        state.unlockedMiniGamesLastFetchedAt = Date.now();
        state.unlockedMiniGames = normalizeUnlockedMiniGames(action.payload);
      })
      .addCase(fetchUnlockedMiniGames.rejected, (state, action) => {
        state.unlockedMiniGamesLoading = false;
        state.unlockedMiniGamesFetched = true;
        state.unlockedMiniGamesError = action.payload as string;
      })

      .addCase(unlockedMiniGame.pending, state => {
        state.unlockMiniGameLoading = true;
        state.unlockMiniGameError = null;
      })
      .addCase(unlockedMiniGame.fulfilled, state => {
        state.unlockMiniGameLoading = false;
        state.unlockMiniGameError = null;
        state.unlockedMiniGame = true;
        state.unlockedMiniGamesLastFetchedAt = 0;
      })
      .addCase(unlockedMiniGame.rejected, (state, action) => {
        state.unlockMiniGameLoading = false;
        state.unlockedMiniGamesFetched = true;
        state.unlockMiniGameError = action.payload as string;
      });
  },
});

export const {
  clearGamesError,
  hydrateAllGamesFromCache,
  invalidateUnlockedMiniGamesCache,
  recordGamePlayForVideoAd,
  resetGamesState,
} = gamesSlice.actions;
export default gamesSlice.reducer;
