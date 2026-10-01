import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';
import { getUSDateYYYYMMDD, getUSTimeHHMM, getUSTimeWithOffset } from '../../utils/usTime';

interface IApiResponse {
  [key: string]: any;
}

export interface StoreGameReceiptFile {
  uri: string;
  type?: string;
  name?: string;
  file?: File;
}

export interface StoreGamePayload {
  type: string;
  game_slug: string;
  time?: string;
  date?: string;
  zip_code?: string;
  total?: string;
  state?: string;
  receipt?: StoreGameReceiptFile;
  draw?: string;
  played_at?: string;
}

class GameServices {
  getAllGames = async (): Promise<IApiResponse> => {
    try {
      console.log('[GamesAPI] Request -> GET', endPoints.ALL_GAMES);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.ALL_GAMES,
        data: undefined,
        params: undefined,
        token: true,
      });
      const categories = Object.keys(response?.data?.data ?? {});
      console.log('[GamesAPI] Success -> GET games/get-all-games', {
        status: response?.status,
        categories,
      });
      console.log(
        '[GamesAPI] Response Data -> GET games/get-all-games',
        response?.data,
      );
      return response;
    } catch (error) {
      console.error('[GamesAPI] Error -> GET games/get-all-games', error);
      throw error;
    }
  };

  getGamesBySlug = async (slug: string): Promise<IApiResponse> => {
    try {
      const endPoint = `${endPoints.ALL_GAMES}/${slug}`;
      console.log('[GamesAPI] Request -> GET', endPoint);
      const response = await fetchApi({
        method: 'GET',
        endPoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[GamesAPI] Success -> GET games/get-all-games/:slug', {
        slug,
        status: response?.status,
      });
      console.log(
        '[GamesAPI] Response Data -> GET games/get-all-games/:slug',
        response?.data,
      );
      return response;
    } catch (error) {
      console.error('[GamesAPI] Error -> GET games/get-all-games/:slug', {
        slug,
        error,
      });
      throw error;
    }
  };

  getUnlockedMiniGames = async (): Promise<IApiResponse> => {
    try {
      console.log('[GamesAPI] Request -> GET', endPoints.UNLOCKED_MINI_GAMES);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.UNLOCKED_MINI_GAMES,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[GamesAPI] Success -> GET unlocked-mini-games', {
        status: response?.status,
      });
      return response;
    } catch (error) {
      console.error('[GamesAPI] Error -> GET unlocked-mini-games', error);
      throw error;
    }
  };

  getMiddayStatus = async (localTime: string): Promise<IApiResponse> => {
    try {
      const endPoint = `${endPoints.MIDDAY_TOGGLE}?local_time=${encodeURIComponent(localTime)}`;
      console.log('[GamesAPI] Request -> GET', endPoint);
      const response = await fetchApi({
        method: 'GET',
        endPoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[GamesAPI] Success -> GET midday-status', {
        status: response?.status,
      });
      return response;
    } catch (error) {
      console.error('[GamesAPI] Error -> GET midday-status', error);
      throw error;
    }
  };

  unlockMiniGames = async (data: any): Promise<IApiResponse> => {
    try {
      console.log('[GamesAPI] Request -> POST', endPoints.UNLOCK_MINI_GAME);
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.UNLOCK_MINI_GAME,
        data: data,
        params: undefined,
        token: true,
      });
      console.log('[GamesAPI] Success -> POST unlock-mini-game', {
        status: response?.status,
      });
      return response;
    } catch (error) {
      console.error('[GamesAPI] Error -> POST unlock-mini-game', error);
      throw error;
    }
  };

  storeGame = async (payload: StoreGamePayload): Promise<IApiResponse> => {
    try {
      console.log(
        '[GamesAPI] Request -> POST',
        endPoints.CASH_N_INSTANT_GAMES,
        {
          type: payload.type,
          game_slug: payload.game_slug,
        },
      );

      const formData = new FormData();
      formData.append('type', payload.type || 'cash');
      formData.append('game_slug', payload.game_slug);

      const resolvedDate = payload.date || getUSDateYYYYMMDD();
      const resolvedTime = payload.time || getUSTimeHHMM();
      const resolvedPlayedAt = payload.played_at || getUSTimeWithOffset();

      formData.append('date', resolvedDate);
      formData.append('time', resolvedTime);
      formData.append('played_at', resolvedPlayedAt);

      if (payload.zip_code) {
        formData.append('zip_code', payload.zip_code);
      }
      if (payload.total) {
        formData.append('total', payload.total);
      }
      if (payload.state) {
        formData.append('state', payload.state);
      }
      if (payload.draw) {
        formData.append('draw', payload.draw);
      }

      if (payload.receipt?.file) {
        formData.append(
          'receipt',
          payload.receipt.file,
          payload.receipt.name || payload.receipt.file.name || `receipt-${Date.now()}.jpg`,
        );
      } else if (payload.receipt?.uri) {
        throw new Error('Receipt upload requires a browser File object.');
      }

      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.CASH_N_INSTANT_GAMES,
        data: formData,
        params: undefined,
        formData: true,
        token: true,
      });

      console.log('[GamesAPI] Success -> POST games/store-game', {
        status: response?.status,
        data: response?.data,
      });
      return response;
    } catch (error) {
      console.error('[GamesAPI] Error -> POST games/store-game', error);
      throw error;
    }
  };

  playSpinTheWheel = async (): Promise<IApiResponse> => {
    try {
      console.log('[GamesAPI] Request -> POST', endPoints.SPIN_THE_WHEEL);
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.SPIN_THE_WHEEL,
        data: undefined,
        params: undefined,
        token: true,
        timeout: 45000,
      });
      console.log(
        '[GamesAPI] Success -> POST games/play-mini-game/spin-the-wheel',
        {
          status: response?.status,
          data: response?.data,
        },
      );
      return response;
    } catch (error) {
      console.error(
        '[GamesAPI] Error -> POST games/play-mini-game/spin-the-wheel',
        error,
      );
      throw error;
    }
  };

  playLucky7 = async (): Promise<IApiResponse> => {
    try {
      console.log('[GamesAPI] Request -> POST', endPoints.LUCKY_7);
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.LUCKY_7,
        data: undefined,
        params: undefined,
        token: true,
        timeout: 45000,
      });
      console.log('[GamesAPI] Success -> POST games/play-mini-game/lucky-7', {
        status: response?.status,
        data: response?.data,
      });
      return response;
    } catch (error) {
      console.error(
        '[GamesAPI] Error -> POST games/play-mini-game/lucky-7',
        error,
      );
      throw error;
    }
  };

  playScratch2Win = async (): Promise<IApiResponse> => {
    try {
      console.log('[GamesAPI] Request -> POST', endPoints.SCRATCH_2_WIN);
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.SCRATCH_2_WIN,
        data: undefined,
        params: undefined,
        token: true,
        timeout: 45000,
      });
      console.log(
        '[GamesAPI] Success -> POST games/play-mini-game/scratch-to-win',
        {
          status: response?.status,
          data: response?.data,
        },
      );
      return response;
    } catch (error) {
      console.error(
        '[GamesAPI] Error -> POST games/play-mini-game/scratch-to-win',
        error,
      );
      throw error;
    }
  };

  getUserReceipts = async (page = 1): Promise<IApiResponse> => {
    try {
      const endPoint = `${endPoints.GET_ALL_RECEIPTS}?page=${page}`;
      console.log('[GamesAPI] Request -> GET', endPoint);
      const response = await fetchApi({
        method: 'GET',
        endPoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[GamesAPI] Success -> GET games/user/receipts', {
        status: response?.status,
        page,
      });
      return response;
    } catch (error) {
      console.error('[GamesAPI] Error -> GET games/user/receipts', error);
      throw error;
    }
  };

  getStreakLeaderboard = async (): Promise<IApiResponse> => {
    try {
      console.log('[GamesAPI] Request -> GET', endPoints.STREAK_LEADERBOARD);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.STREAK_LEADERBOARD,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[GamesAPI] Success -> GET games/streak-leaderboard', {
        status: response?.status,
        data: response?.data,
      });
      return response;
    } catch (error) {
      console.error('[GamesAPI] Error -> GET games/streak-leaderboard', error);
      throw error;
    }
  };
}

const gameServices = new GameServices();
export default gameServices;
