import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

interface IApiResponse {
  [key: string]: any;
}

interface PaypalOrderData {
  order_id?: string;
  approval_url?: string;
  approvalUrl?: string;
}

interface PaypalOrderResponse extends IApiResponse {
  success?: boolean;
  message?: string;
  data?: PaypalOrderData;
}

interface PaypalOrderHttpResponse {
  status?: number;
  data?: PaypalOrderResponse;
}

class FundServices {
  getAllFunds = async (): Promise<IApiResponse> => {
    try {
      console.log('[FundAPI] Request -> GET', endPoints.GET_FUNDS);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.GET_FUNDS,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[FundAPI] Success -> GET funds', {
        status: response?.status,
        count: Array.isArray(response?.data?.data)
          ? response.data.data.length
          : 0,
      });
      return response;
    } catch (error) {
      console.error('[FundAPI] Error -> GET funds', error);
      throw error;
    }
  };

  addFunds = async (amount: number): Promise<PaypalOrderHttpResponse> => {
    try {
      console.log('[FundAPI] Request -> POST', endPoints.ADD_FUNDS_PAYPAL, { amount });
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.ADD_FUNDS_PAYPAL,
        data: { amount },
        params: undefined,
        token: true,
      });
      console.log('[FundAPI] Success -> POST PayPal funds', {
        status: response?.status,
        success: response?.data?.success,
        message: response?.data?.message,
      });
      return response as PaypalOrderHttpResponse;
    } catch (error) {
      console.error('[FundAPI] Error -> POST funds', error);
      throw error;
    }
  };

  capturePaypalPayment = async (token: string, payerId: string): Promise<IApiResponse> => {
    try {
      console.log('[FundAPI] Request -> GET', endPoints.PAYPAL_CALLBACK, { token, payerId });
      const response = await fetchApi({
        method: 'GET',
        endPoint: `${endPoints.PAYPAL_CALLBACK}?token=${encodeURIComponent(token)}&PayerID=${encodeURIComponent(payerId)}`,
        data: undefined,
        params: undefined,
        token: false,
      });
      console.log('[FundAPI] Success -> GET PayPal callback', response);
      return response;
    } catch (error) {
      console.error('[FundAPI] Error -> GET PayPal callback', error);
      throw error;
    }
  };
}

const fundServices = new FundServices();
export default fundServices;
