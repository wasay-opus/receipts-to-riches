import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

interface IApiResponse {
  [key: string]: any;
}

class RewardServices {
  getAllRewards = async (): Promise<IApiResponse> => {
    try {
      console.log('[RewardsAPI] Request -> GET', endPoints.ALL_REWARDS);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.ALL_REWARDS,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[RewardsAPI] Success -> GET rewards/get-all-rewards', {
        status: response?.status,
        count: Array.isArray(response?.data?.data)
          ? response.data.data.length
          : 0,
      });
      return response;
    } catch (error) {
      console.error('[RewardsAPI] Error -> GET rewards/get-all-rewards', error);
      throw error;
    }
  };

  claimReward = async (rewardId: number): Promise<IApiResponse> => {
    try {
      const endPoint = `${endPoints.CLAIM_REWARD}/${rewardId}`;
      console.log('[RewardsAPI] Request -> GET', endPoint, {
        id: rewardId,
      });
      const response = await fetchApi({
        method: 'GET',
        endPoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[RewardsAPI] Success -> POST rewards/claim-reward', {
        status: response?.status,
        success: response?.data?.success,
        message: response?.data?.message,
      });
      return response;
    } catch (error) {
      console.error('[RewardsAPI] Error -> POST rewards/claim-reward', error);
      throw error;
    }
  };
}

const rewardServices = new RewardServices();
export default rewardServices;
