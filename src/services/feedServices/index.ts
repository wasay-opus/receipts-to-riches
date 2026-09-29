import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

export interface IApiResponse {
  [key: string]: any;
}

export interface CreatePostMediaFile {
  uri: string;
  type?: string;
  name?: string;
}

export interface GetFeedParams {
  per_page?: number;
  page?: number;
  [key: string]: any;
}

export interface CreateCommentPayload {
  body: string;
  parent_id?: number | string;
  [key: string]: any;
}

class FeedServices {
  getFeed = async (params?: GetFeedParams): Promise<IApiResponse> => {
    try {
      const queryParams: GetFeedParams = {
        per_page: 15,
        ...params,
      };

      if (__DEV__) {
        console.log(
          '[FeedAPI] Request -> GET',
          endPoints.GET_FEED,
          queryParams,
        );
      }

      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.GET_FEED,
        data: undefined,
        params: queryParams,
        token: true,
      });

      if (__DEV__) {
        console.log('[FeedAPI] Success -> GET feed', {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }

      return response;
    } catch (error) {
      console.error('[FeedAPI] Error -> GET feed', error);
      throw error;
    }
  };

  createPost = async (formData: FormData): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log(
          '[FeedAPI] Request -> POST',
          endPoints.CREATE_POST,
          '(multipart/form-data)',
        );
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.CREATE_POST,
        data: formData,
        params: undefined,
        formData: true,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST feed/posts', {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error('[FeedAPI] Error -> POST feed/posts', error);
      throw error;
    }
  };

  updatePost = async (
    postId: number | string,
    payload: FormData | { description?: string; [key: string]: any },
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.UPDATE_POST(postId);
      const isFormData = payload instanceof FormData;

      if (__DEV__) {
        console.log(
          `[FeedAPI] Request -> ${
            isFormData ? 'POST (with _method=PUT)' : 'PUT'
          }`,
          endpoint,
          payload,
        );
      }

      let method: any = 'PUT';
      let requestData = payload;

      if (isFormData) {
        (payload as FormData).append('_method', 'PUT');
        method = 'POST';
      }

      const response = await fetchApi({
        method,
        endPoint: endpoint,
        data: requestData,
        formData: isFormData,
        token: true,
      });

      if (__DEV__) {
        console.log(
          `[FeedAPI] Success -> update post (${postId})`,
          response?.data,
        );
      }

      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> update post (${postId})`, error);
      throw error;
    }
  };

  deletePost = async (postId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.DELETE_POST(postId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> DELETE', endpoint);
      }
      const response = await fetchApi({
        method: 'DELETE',
        endPoint: endpoint,
        token: true,
      });
      if (__DEV__) {
        console.log(
          `[FeedAPI] Success -> DELETE post (${postId})`,
          response?.data,
        );
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> DELETE post (${postId})`, error);
      throw error;
    }
  };

  likePost = async (postId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.LIKE_POST(postId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST like post', {
          postId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> POST like post (${postId})`, error);
      throw error;
    }
  };

  dislikePost = async (postId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.DISLIKE_POST(postId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST dislike post', {
          postId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> POST dislike post (${postId})`, error);
      throw error;
    }
  };

  createComment = async (
    postId: number | string,
    payload: CreateCommentPayload,
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.CREATE_COMMENT(postId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint, payload);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: payload,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST create comment', {
          postId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(
        `[FeedAPI] Error -> POST create comment (${postId})`,
        error,
      );
      throw error;
    }
  };

  updateComment = async (
    commentId: number | string,
    body: string,
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.UPDATE_COMMENT(commentId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> PUT', endpoint, { body });
      }
      const response = await fetchApi({
        method: 'PUT',
        endPoint: endpoint,
        data: { body },
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> PUT update comment', {
          commentId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(
        `[FeedAPI] Error -> PUT update comment (${commentId})`,
        error,
      );
      throw error;
    }
  };

  deleteComment = async (commentId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.DELETE_COMMENT(commentId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> DELETE', endpoint);
      }
      const response = await fetchApi({
        method: 'DELETE',
        endPoint: endpoint,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> DELETE comment', {
          commentId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> DELETE comment (${commentId})`, error);
      throw error;
    }
  };

  likeComment = async (commentId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.LIKE_COMMENT(commentId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST like comment', {
          commentId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error(
        `[FeedAPI] Error -> POST like comment (${commentId})`,
        error,
      );
      throw error;
    }
  };

  dislikeComment = async (
    commentId: number | string,
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.DISLIKE_COMMENT(commentId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST dislike comment', {
          commentId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
        });
      }
      return response;
    } catch (error) {
      console.error(
        `[FeedAPI] Error -> POST dislike comment (${commentId})`,
        error,
      );
      throw error;
    }
  };

  getCommentLikes = async (
    commentId: number | string,
    params?: {
      reaction?: 'like' | 'dislike';
      per_page?: number;
      page?: number;
      [key: string]: any;
    },
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.GET_COMMENT_LIKES(commentId);
      const queryParams = {
        reaction: 'like',
        per_page: 20,
        ...params,
      };
      if (__DEV__) {
        console.log('[FeedAPI] Request -> GET', endpoint, queryParams);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endpoint,
        data: undefined,
        params: queryParams,
        token: true,
      });
      if (__DEV__) {
        console.log(`[FeedAPI] Success -> GET comment likes (${commentId})`, {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> GET comment likes (${commentId})`, error);
      throw error;
    }
  };

  toggleFollowUser = async (userId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.TOGGLE_FOLLOW(userId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST toggle follow user', {
          userId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(
        `[FeedAPI] Error -> POST toggle follow user (${userId})`,
        error,
      );
      throw error;
    }
  };

  unfollowUser = async (userId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.UNFOLLOW_USER(userId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> DELETE', endpoint);
      }
      const response = await fetchApi({
        method: 'DELETE',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> DELETE unfollow user', {
          userId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> DELETE unfollow user (${userId})`, error);
      throw error;
    }
  };

  removeFollower = async (userId: number | string): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.REMOVE_FOLLOWER(userId);
      if (__DEV__) {
        console.log('[FeedAPI] Request -> DELETE', endpoint);
      }
      const response = await fetchApi({
        method: 'DELETE',
        endPoint: endpoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> DELETE remove follower', {
          userId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(
        `[FeedAPI] Error -> DELETE remove follower (${userId})`,
        error,
      );
      throw error;
    }
  };

  reportPost = async (
    postId: number | string,
    reason: string,
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.REPORT_POST(postId);
      const payload = { reason };
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint, payload);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: payload,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST report post', {
          postId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> POST report post (${postId})`, error);
      throw error;
    }
  };

  reportUser = async (
    userId: number | string,
    reason: string,
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.REPORT_USER(userId);
      const payload = { reason };
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint, payload);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: payload,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST report user', {
          userId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> POST report user (${userId})`, error);
      throw error;
    }
  };

  reportComment = async (
    commentId: number | string,
    reason: string,
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.REPORT_COMMENT(commentId);
      const payload = { reason };
      if (__DEV__) {
        console.log('[FeedAPI] Request -> POST', endpoint, payload);
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endpoint,
        data: payload,
        params: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('[FeedAPI] Success -> POST report comment', {
          commentId,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(
        `[FeedAPI] Error -> POST report comment (${commentId})`,
        error,
      );
      throw error;
    }
  };

  getUserProfile = async (
    userId: number | string,
    params?: GetFeedParams,
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.GET_FEED_USER(userId);
      const queryParams: GetFeedParams = {
        per_page: 15,
        ...params,
      };
      if (__DEV__) {
        console.log('[FeedAPI] Request -> GET', endpoint, queryParams);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endpoint,
        data: undefined,
        params: queryParams,
        token: true,
      });
      if (__DEV__) {
        console.log(`[FeedAPI] Success -> GET user profile (${userId})`, {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> GET user profile (${userId})`, error);
      throw error;
    }
  };

  getFollows = async (params: {
    tab: 'followers' | 'following';
    user_id?: number | string;
    per_page?: number;
    page?: number;
    [key: string]: any;
  }): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.GET_FOLLOWS(params.user_id);
      const queryParams: Record<string, any> = {
        tab: params.tab,
        per_page: params.per_page ?? 20,
        page: params.page ?? 1,
      };

      if (__DEV__) {
        console.log('[FeedAPI] Request -> GET', endpoint, queryParams);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endpoint,
        data: undefined,
        params: queryParams,
        token: true,
      });
      if (__DEV__) {
        console.log(`[FeedAPI] Success -> GET follows (${params.tab})`, {
          endpoint,
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> GET follows (${params.tab})`, error);
      throw error;
    }
  };

  getPostLikes = async (
    postId: number | string,
    params?: {
      reaction?: 'like' | 'dislike';
      per_page?: number;
      page?: number;
      [key: string]: any;
    },
  ): Promise<IApiResponse> => {
    try {
      const endpoint = endPoints.GET_POST_LIKES(postId);
      const queryParams = {
        reaction: 'like',
        per_page: 20,
        ...params,
      };
      if (__DEV__) {
        console.log('[FeedAPI] Request -> GET', endpoint, queryParams);
      }
      const response = await fetchApi({
        method: 'GET',
        endPoint: endpoint,
        data: undefined,
        params: queryParams,
        token: true,
      });
      if (__DEV__) {
        console.log(`[FeedAPI] Success -> GET post likes (${postId})`, {
          status: response?.status,
          success: response?.data?.success,
          message: response?.data?.message,
          data: response?.data?.data,
        });
      }
      return response;
    } catch (error) {
      console.error(`[FeedAPI] Error -> GET post likes (${postId})`, error);
      throw error;
    }
  };
}

const feedServices = new FeedServices();
export default feedServices;
