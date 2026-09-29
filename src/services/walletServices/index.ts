import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

interface IApiResponse {
  [key: string]: any;
}

class WalletServices {
  getWallet = async (): Promise<IApiResponse> => {
    try {
      console.log('[WalletAPI] Request -> GET', endPoints.GET_WALLET);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.GET_WALLET,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[WalletAPI] Success -> GET wallet/get-wallet', {
        status: response?.status,
      });
      return response;
    } catch (error) {
      console.error('[WalletAPI] Error -> GET wallet/get-wallet', error);
      throw error;
    }
  };

  addPoints = async (points: number): Promise<IApiResponse> => {
    try {
      console.log('[WalletAPI] Request -> POST', endPoints.ADD_POINTS, { points });
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.ADD_POINTS,
        data: { points },
        params: undefined,
        token: true,
      });
      console.log('[WalletAPI] Success -> POST wallet/add-points', {
        status: response?.status,
        success: response?.data?.success,
        message: response?.data?.message,
      });
      return response;
    } catch (error) {
      console.error('[WalletAPI] Error -> POST wallet/add-points', error);
      throw error;
    }
  };
}

const walletServices = new WalletServices();
export default walletServices;
