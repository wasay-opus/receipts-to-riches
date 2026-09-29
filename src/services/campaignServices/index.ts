import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

interface IApiResponse {
  [key: string]: any;
}

export interface RenewCampaignPayload {
  campaign_id: number;
  start_date: string;
  end_date: string;
}

class CampaignServices {
  getAllCampaigns = async (): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log('[CampaignAPI] Request -> GET', endPoints.GET_CAMPAIGNS);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.GET_CAMPAIGNS,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[CampaignAPI] Success -> GET campaigns', {
          status: response?.status,
          count: Array.isArray(response?.data?.data)
            ? response.data.data.length
            : 0,
        });
      }
      return response;
    } catch (error) {
      console.error('[CampaignAPI] Error -> GET campaigns', error);
      throw error;
    }
  };

  getMyCampaigns = async (): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log('[CampaignAPI] Request -> GET', endPoints.MY_CAMPAIGNS);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.MY_CAMPAIGNS,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[CampaignAPI] Success -> GET my campaigns', {
          status: response?.status,
          count: Array.isArray(response?.data?.data)
            ? response.data.data.length
            : 0,
        });
      }
      return response;
    } catch (error) {
      console.error('[CampaignAPI] Error -> GET my campaigns', error);
      throw error;
    }
  };

  incrementViews = async (campaignIds: number[]): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log(
          '[CampaignAPI] Request -> POST',
          endPoints.INCREMENT_VIEWS,
          { campaign_ids: campaignIds },
        );
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.INCREMENT_VIEWS,
        data: { campaign_ids: campaignIds },
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[CampaignAPI] Success -> POST campaigns/increment-views', {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error(
        '[CampaignAPI] Error -> POST campaigns/increment-views',
        error,
      );
      throw error;
    }
  };

  incrementClicks = async (campaignId: number): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log(
          '[CampaignAPI] Request -> POST',
          endPoints.INCREMENT_CLICKS,
          { campaign_id: campaignId },
        );
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.INCREMENT_CLICKS,
        data: { campaign_id: campaignId },
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log(
          '[CampaignAPI] Success -> POST campaigns/increment-clicks',
          {
            status: response?.status,
            success: response?.data?.success,
            message: response?.data?.message,
          },
        );
      }
      return response;
    } catch (error) {
      console.error(
        '[CampaignAPI] Error -> POST campaigns/increment-clicks',
        error,
      );
      throw error;
    }
  };

  renewCampaign = async (
    payload: RenewCampaignPayload,
  ): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log(
          '[CampaignAPI] Request -> POST',
          endPoints.RENEW_CAMPAIGN,
          payload,
        );
      }

      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.RENEW_CAMPAIGN,
        data: payload,
        params: undefined,
        token: true,
      });

      if (__DEV__) {
        console.log('[CampaignAPI] Success -> POST campaigns/renew', {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }

      return response;
    } catch (error) {
      console.error('[CampaignAPI] Error -> POST campaigns/renew', error);
      throw error;
    }
  };

  storeCampaign = async (formData: FormData): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log(
          '[CampaignAPI] Request -> POST',
          endPoints.STORE_CAMPAIGN,
          '(multipart/form-data)',
        );
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.STORE_CAMPAIGN,
        data: formData,
        params: undefined,
        formData: true,
        token: true,
      });
      if (__DEV__) {
        console.log('[CampaignAPI] Success -> POST campaigns (store)', {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error('[CampaignAPI] Error -> POST campaigns (store)', error);
      throw error;
    }
  };
}

const campaignServices = new CampaignServices();
export default campaignServices;
