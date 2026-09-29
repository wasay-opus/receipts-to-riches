import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

interface IApiResponse {
  [key: string]: any;
}

class WinnerServices {
  getAllWinners = async (): Promise<IApiResponse> => {
    try {
      console.log('[WinnersAPI] Request -> GET', endPoints.WINNERS);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.WINNERS,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[WinnersAPI] Success -> GET winners', {
        status: response?.status,
      });
      return response;
    } catch (error) {
      console.error('[WinnersAPI] Error -> GET winners', error);
      throw error;
    }
  };

  getResults = async (gameslug: string, draw?: string): Promise<IApiResponse> => {
    try {
      const endPoint = endPoints.RESULTS(gameslug);
      const params = {
        ...(draw ? { draw } : {}),
      };
      console.log('[ResultsAPI] Request -> GET', endPoint, params);
      const response = await fetchApi({
        method: 'GET',
        endPoint,
        data: undefined,
        params,
        token: true,
      });
      console.log('[ResultsAPI] Success -> GET results', {
        status: response?.status,
        gameslug,
        draw,
      });
      return response;
    } catch (error) {
      console.error('[ResultsAPI] Error -> GET results', { gameslug, error });
      throw error;
    }
  };
}

const winnerServices = new WinnerServices();
export default winnerServices;
