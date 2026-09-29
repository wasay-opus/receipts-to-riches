import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

export interface IApiResponse {
  [key: string]: any;
}

export interface VotePollPayload {
  option_id: number | string;
}

class PollServices {
  getPolls = async (): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log('[PollsAPI] Request -> GET', endPoints.GET_POLLS);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.GET_POLLS,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[PollsAPI] Success -> GET polls', {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error('[PollsAPI] Error -> GET polls', error);
      throw error;
    }
  };

  getPoll = async (pollId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.GET_POLL(pollId);
      if (__DEV__) {
        console.log('[PollsAPI] Request -> GET', endpoint);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log(`[PollsAPI] Success -> GET poll (${pollId})`, {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error(`[PollsAPI] Error -> GET poll (${pollId})`, error);
      throw error;
    }
  };

  votePoll = async (
    pollId: number | string,
    optionId: number | string,
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.VOTE_POLL(pollId);
      const payload: VotePollPayload = {
        option_id: optionId,
      };
      if (__DEV__) {
        console.log('[PollsAPI] Request -> POST', endpoint, payload);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: payload,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log(`[PollsAPI] Success -> POST vote poll (${pollId})`, {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(`[PollsAPI] Error -> POST vote poll (${pollId})`, error);
      throw error;
    }
  };

  getPollResults = async (pollId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.GET_POLL_RESULTS(pollId);
      if (__DEV__) {
        console.log('[PollsAPI] Request -> GET', endpoint);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log(`[PollsAPI] Success -> GET poll results (${pollId})`, {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(
        `[PollsAPI] Error -> GET poll results (${pollId})`,
        error,
      );
      throw error;
    }
  };
}

const pollServices = new PollServices();
export default pollServices;
