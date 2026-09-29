import axios from 'axios';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import feedServices, {
  CreateCommentPayload,
  GetFeedParams,
} from '../../services/feedServices';

export interface FeedState {
  feedData: any | null;
  feedList: any[];
  feedLoading: boolean;
  feedRefreshing: boolean;
  feedError: string | null;
  feedPagination: any | null;
  createPostLoading: boolean;
  createPostSuccess: boolean;
  createPostError: string | null;
  createdPost: any | null;
  updatePostLoading: boolean;
  updatePostSuccess: boolean;
  updatePostError: string | null;
  updatedPost: any | null;
  deletePostLoadingMap: Record<string, boolean>;
  likeLoadingMap: Record<string, boolean>;
  commentLoadingMap: Record<string, boolean>;
  toggleFollowLoadingMap: Record<string, boolean>;
  reportLoadingMap: Record<string, boolean>;
  userProfileData: any | null;
  userProfileLoading: boolean;
  userProfileError: string | null;
  followsList: any[];
  followsLoading: boolean;
  followsRefreshing: boolean;
  followsError: string | null;
  followsPagination: any | null;
  likesList: any[];
  likesLoading: boolean;
  likesRefreshing: boolean;
  likesError: string | null;
  likesPagination: any | null;
}

const extractMessage = (payload: any, fallback: string): string => {
  const userFriendlyMessage = payload?.user_friendly_message;
  if (
    typeof userFriendlyMessage === 'string' &&
    userFriendlyMessage.trim().length > 0
  ) {
    return userFriendlyMessage;
  }

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

const extractFeedPayload = (payload: any) => {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  return data?.posts ?? data?.feed ?? data?.feeds ?? data?.items ?? data;
};

const extractFeedList = (payload: any): any[] => {
  const sources = [
    payload,
    payload?.data,
    payload?.posts,
    payload?.feed,
    payload?.feeds,
    payload?.items,
    payload?.results,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.data)) return source.data;
    if (Array.isArray(source?.posts)) return source.posts;
    if (Array.isArray(source?.feed)) return source.feed;
    if (Array.isArray(source?.items)) return source.items;
  }

  return [];
};

const initialState: FeedState = {
  feedData: null,
  feedList: [],
  feedLoading: false,
  feedRefreshing: false,
  feedError: null,
  feedPagination: null,
  createPostLoading: false,
  createPostSuccess: false,
  createPostError: null,
  createdPost: null,
  updatePostLoading: false,
  updatePostSuccess: false,
  updatePostError: null,
  updatedPost: null,
  deletePostLoadingMap: {},
  likeLoadingMap: {},
  commentLoadingMap: {},
  toggleFollowLoadingMap: {},
  reportLoadingMap: {},
  userProfileData: null,
  userProfileLoading: false,
  userProfileError: null,
  followsList: [],
  followsLoading: false,
  followsRefreshing: false,
  followsError: null,
  followsPagination: null,
  likesList: [],
  likesLoading: false,
  likesRefreshing: false,
  likesError: null,
  likesPagination: null,
};

export const fetchFeed = createAsyncThunk(
  'feed/fetchFeed',
  async (
    options: { params?: GetFeedParams; isRefresh?: boolean } | undefined,
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] fetchFeed started', options);
      }
      const response = await feedServices.getFeed(options?.params);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return {
          data,
          isRefresh: options?.isRefresh ?? false,
          page: options?.params?.page ?? 1,
        };
      }

      return rejectWithValue(extractMessage(data, 'Failed to fetch feed'));
    } catch (error: any) {
      console.error('[FeedSlice] fetchFeed failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch feed'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch feed');
    }
  },
);

export const createPost = createAsyncThunk(
  'feed/createPost',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] createPost started');
      }
      const response = await feedServices.createPost(formData);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return data;
      }

      return rejectWithValue(extractMessage(data, 'Failed to create post'));
    } catch (error: any) {
      console.error('[FeedSlice] createPost failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to create post'),
        );
      }
      return rejectWithValue(error.message || 'Failed to create post');
    }
  },
);

export const updatePost = createAsyncThunk(
  'feed/updatePost',
  async (
    {
      postId,
      payload,
    }: {
      postId: number | string;
      payload: FormData | { description?: string; [key: string]: any };
    },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] updatePost started', postId);
      }
      const response = await feedServices.updatePost(postId, payload);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { postId, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to update post'));
    } catch (error: any) {
      console.error('[FeedSlice] updatePost failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to update post'),
        );
      }
      return rejectWithValue(error.message || 'Failed to update post');
    }
  },
);

export const deletePost = createAsyncThunk(
  'feed/deletePost',
  async (postId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] deletePost started', postId);
      }
      const response = await feedServices.deletePost(postId);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { postId, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to delete post'));
    } catch (error: any) {
      console.error('[FeedSlice] deletePost failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to delete post'),
        );
      }
      return rejectWithValue(error.message || 'Failed to delete post');
    }
  },
);

export const likePost = createAsyncThunk(
  'feed/likePost',
  async (postId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] likePost started', postId);
      }
      const response = await feedServices.likePost(postId);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { postId, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to like post'));
    } catch (error: any) {
      console.error('[FeedSlice] likePost failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to like post'),
        );
      }
      return rejectWithValue(error.message || 'Failed to like post');
    }
  },
);

export const dislikePost = createAsyncThunk(
  'feed/dislikePost',
  async (postId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] dislikePost started', postId);
      }
      const response = await feedServices.dislikePost(postId);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { postId, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to dislike post'));
    } catch (error: any) {
      console.error('[FeedSlice] dislikePost failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to dislike post'),
        );
      }
      return rejectWithValue(error.message || 'Failed to dislike post');
    }
  },
);

export const createComment = createAsyncThunk(
  'feed/createComment',
  async (
    {
      postId,
      payload,
    }: {
      postId: number | string;
      payload: CreateCommentPayload;
    },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] createComment started', { postId, payload });
      }
      const response = await feedServices.createComment(postId, payload);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { postId, payload, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to post comment'));
    } catch (error: any) {
      console.error('[FeedSlice] createComment failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to post comment'),
        );
      }
      return rejectWithValue(error.message || 'Failed to post comment');
    }
  },
);

export const updateComment = createAsyncThunk(
  'feed/updateComment',
  async (
    {
      commentId,
      body,
    }: {
      commentId: number | string;
      body: string;
    },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] updateComment started', commentId);
      }
      const response = await feedServices.updateComment(commentId, body);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { commentId, body, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to update comment'));
    } catch (error: any) {
      console.error('[FeedSlice] updateComment failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to update comment'),
        );
      }
      return rejectWithValue(error.message || 'Failed to update comment');
    }
  },
);

export const deleteComment = createAsyncThunk(
  'feed/deleteComment',
  async (commentId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] deleteComment started', commentId);
      }
      const response = await feedServices.deleteComment(commentId);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { commentId, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to delete comment'));
    } catch (error: any) {
      console.error('[FeedSlice] deleteComment failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to delete comment'),
        );
      }
      return rejectWithValue(error.message || 'Failed to delete comment');
    }
  },
);

export const likeComment = createAsyncThunk(
  'feed/likeComment',
  async (commentId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] likeComment started', commentId);
      }
      const response = await feedServices.likeComment(commentId);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { commentId, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to like comment'));
    } catch (error: any) {
      console.error('[FeedSlice] likeComment failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to like comment'),
        );
      }
      return rejectWithValue(error.message || 'Failed to like comment');
    }
  },
);

export const dislikeComment = createAsyncThunk(
  'feed/dislikeComment',
  async (commentId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] dislikeComment started', commentId);
      }
      const response = await feedServices.dislikeComment(commentId);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { commentId, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to dislike comment'));
    } catch (error: any) {
      console.error('[FeedSlice] dislikeComment failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to dislike comment'),
        );
      }
      return rejectWithValue(error.message || 'Failed to dislike comment');
    }
  },
);

export const toggleFollowUser = createAsyncThunk(
  'feed/toggleFollowUser',
  async (userId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] toggleFollowUser started', userId);
      }
      const response = await feedServices.toggleFollowUser(userId);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { userId, data };
      }

      return rejectWithValue(
        extractMessage(data, 'Failed to update follow status'),
      );
    } catch (error: any) {
      console.error('[FeedSlice] toggleFollowUser failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to update follow status'),
        );
      }
      return rejectWithValue(error.message || 'Failed to update follow status');
    }
  },
);

export const removeFollower = createAsyncThunk(
  'feed/removeFollower',
  async (userId: number | string, { rejectWithValue }) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] removeFollower started', userId);
      }
      const response = await feedServices.removeFollower(userId);
      const data = response?.data;

      if (
        (response?.status === 200 ||
          response?.status === 201 ||
          response?.status === 204) &&
        data?.success !== false
      ) {
        return { userId, data };
      }

      return rejectWithValue(extractMessage(data, 'Failed to remove follower'));
    } catch (error: any) {
      console.error('[FeedSlice] removeFollower failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to remove follower'),
        );
      }
      return rejectWithValue(error.message || 'Failed to remove follower');
    }
  },
);

export const reportPost = createAsyncThunk(
  'feed/reportPost',
  async (
    { postId, reason }: { postId: number | string; reason: string },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] reportPost started', { postId, reason });
      }
      const response = await feedServices.reportPost(postId, reason);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { postId, reason, data };
      }

      return rejectWithValue(
        extractMessage(data, 'Failed to submit post report'),
      );
    } catch (error: any) {
      console.error('[FeedSlice] reportPost failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to submit post report'),
        );
      }
      return rejectWithValue(error.message || 'Failed to submit post report');
    }
  },
);

export const reportUser = createAsyncThunk(
  'feed/reportUser',
  async (
    { userId, reason }: { userId: number | string; reason: string },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] reportUser started', { userId, reason });
      }
      const response = await feedServices.reportUser(userId, reason);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { userId, reason, data };
      }

      return rejectWithValue(
        extractMessage(data, 'Failed to submit user report'),
      );
    } catch (error: any) {
      console.error('[FeedSlice] reportUser failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to submit user report'),
        );
      }
      return rejectWithValue(error.message || 'Failed to submit user report');
    }
  },
);

export const reportComment = createAsyncThunk(
  'feed/reportComment',
  async (
    { commentId, reason }: { commentId: number | string; reason: string },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] reportComment started', { commentId, reason });
      }
      const response = await feedServices.reportComment(commentId, reason);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { commentId, reason, data };
      }

      return rejectWithValue(
        extractMessage(data, 'Failed to submit comment report'),
      );
    } catch (error: any) {
      console.error('[FeedSlice] reportComment failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(
            error.response.data,
            'Failed to submit comment report',
          ),
        );
      }
      return rejectWithValue(
        error.message || 'Failed to submit comment report',
      );
    }
  },
);

export const fetchFeedUserProfile = createAsyncThunk(
  'feed/fetchFeedUserProfile',
  async (
    {
      userId,
      params,
    }: {
      userId: number | string;
      params?: GetFeedParams;
    },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] fetchFeedUserProfile started', {
          userId,
          params,
        });
      }
      const response = await feedServices.getUserProfile(userId, params);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return { userId, data };
      }

      return rejectWithValue(
        extractMessage(data, 'Failed to fetch user profile'),
      );
    } catch (error: any) {
      console.error('[FeedSlice] fetchFeedUserProfile failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch user profile'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  },
);

export const fetchFollows = createAsyncThunk(
  'feed/fetchFollows',
  async (
    options: {
      tab: 'followers' | 'following';
      user_id?: number | string;
      per_page?: number;
      page?: number;
      isRefresh?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] fetchFollows started', options);
      }
      const response = await feedServices.getFollows(options);
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return {
          data,
          tab: options.tab,
          isRefresh: options.isRefresh ?? false,
          page: options.page ?? 1,
        };
      }

      return rejectWithValue(
        extractMessage(data, `Failed to fetch ${options.tab}`),
      );
    } catch (error: any) {
      console.error(`[FeedSlice] fetchFollows failed (${options.tab})`, error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, `Failed to fetch ${options.tab}`),
        );
      }
      return rejectWithValue(error.message || `Failed to fetch ${options.tab}`);
    }
  },
);

export const fetchPostLikes = createAsyncThunk(
  'feed/fetchPostLikes',
  async (
    options: {
      postId: number | string;
      reaction?: 'like' | 'dislike';
      per_page?: number;
      page?: number;
      isRefresh?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      if (__DEV__) {
        console.log('[FeedSlice] fetchPostLikes started', options);
      }
      const response = await feedServices.getPostLikes(options.postId, {
        reaction: options.reaction || 'like',
        per_page: options.per_page || 20,
        page: options.page || 1,
      });
      const data = response?.data;

      if (
        (response?.status === 200 || response?.status === 201) &&
        data?.success !== false
      ) {
        return {
          postId: options.postId,
          data,
          isRefresh: options.isRefresh ?? false,
          page: options.page ?? 1,
        };
      }

      return rejectWithValue(
        extractMessage(data, 'Failed to fetch post likes'),
      );
    } catch (error: any) {
      console.error('[FeedSlice] fetchPostLikes failed', error);
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch post likes'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch post likes');
    }
  },
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    clearFeedError(state) {
      state.feedError = null;
    },
    clearCreatePostError(state) {
      state.createPostError = null;
    },
    resetCreatePostState(state) {
      state.createPostLoading = false;
      state.createPostSuccess = false;
      state.createPostError = null;
      state.createdPost = null;
    },
    resetUpdatePostState(state) {
      state.updatePostLoading = false;
      state.updatePostSuccess = false;
      state.updatePostError = null;
      state.updatedPost = null;
    },
    updatePostOptimistic(
      state,
      action: PayloadAction<{
        postId: string | number;
        description?: string;
        media_url?: string;
      }>,
    ) {
      const { postId, description, media_url } = action.payload;
      const strId = String(postId);
      const targetPost = state.feedList.find(
        (p: any) => String(p.id) === strId,
      );
      if (targetPost) {
        if (typeof description === 'string') {
          targetPost.description = description;
        }
        if (typeof media_url === 'string') {
          targetPost.media_url = media_url;
        }
      }
    },
    deletePostOptimistic(state, action: PayloadAction<string | number>) {
      const postId = String(action.payload);
      state.feedList = state.feedList.filter(
        (p: any) => String(p.id) !== postId,
      );
      if (
        state.feedPagination &&
        typeof state.feedPagination.total === 'number'
      ) {
        state.feedPagination.total = Math.max(
          0,
          state.feedPagination.total - 1,
        );
      }
    },
    resetFeedState(state) {
      state.feedData = null;
      state.feedList = [];
      state.feedLoading = false;
      state.feedRefreshing = false;
      state.feedError = null;
      state.feedPagination = null;
      state.createPostLoading = false;
      state.createPostSuccess = false;
      state.createPostError = null;
      state.createdPost = null;
      state.likeLoadingMap = {};
      state.commentLoadingMap = {};
      state.toggleFollowLoadingMap = {};
      state.reportLoadingMap = {};
      state.userProfileData = null;
      state.userProfileLoading = false;
      state.userProfileError = null;
    },
    resetUserProfileState(state) {
      state.userProfileData = null;
      state.userProfileLoading = false;
      state.userProfileError = null;
    },
    resetFollowsState(state) {
      state.followsList = [];
      state.followsLoading = false;
      state.followsRefreshing = false;
      state.followsError = null;
      state.followsPagination = null;
    },
    toggleFollowsItemOptimistic(
      state,
      action: PayloadAction<{ userId: string | number; isFollowing: boolean }>,
    ) {
      const { userId, isFollowing } = action.payload;
      const strUserId = String(userId);
      for (const item of state.followsList) {
        if (
          String(item.id) === strUserId ||
          String(item.user_id) === strUserId ||
          String(item.userId) === strUserId
        ) {
          item.is_followed = isFollowing;
          item.is_following = isFollowing;
          item.isFollowing = isFollowing;
        }
      }
    },
    removeFollowsItemOptimistic(state, action: PayloadAction<string | number>) {
      const userId = String(action.payload);
      state.followsList = state.followsList.filter(
        (item: any) =>
          String(item.id) !== userId &&
          String(item.user_id) !== userId &&
          String(item.userId) !== userId,
      );
    },
    resetLikesState(state) {
      state.likesList = [];
      state.likesLoading = false;
      state.likesRefreshing = false;
      state.likesError = null;
      state.likesPagination = null;
    },
    toggleLikesItemOptimistic(
      state,
      action: PayloadAction<{ userId: string | number; isFollowing: boolean }>,
    ) {
      const { userId, isFollowing } = action.payload;
      const strUserId = String(userId);
      for (const item of state.likesList) {
        if (
          String(item?.id ?? item?.user?.id ?? item?.user_id ?? '') ===
          strUserId
        ) {
          if (item?.user) {
            item.user.is_followed = isFollowing;
            item.user.is_following = isFollowing;
          }
          item.is_followed = isFollowing;
          item.is_following = isFollowing;
          item.isFollowing = isFollowing;
        }
      }
    },
    togglePostLikeOptimistic(
      state,
      action: PayloadAction<{ postId: string | number; liked: boolean }>,
    ) {
      const { postId, liked } = action.payload;
      const strId = String(postId);
      const targetPost = state.feedList.find(
        (p: any) => String(p.id) === strId,
      );
      if (targetPost) {
        targetPost.liked = liked;
        if (liked) {
          targetPost.likes_count = (targetPost.likes_count || 0) + 1;
          targetPost.disliked = false;
        } else {
          targetPost.likes_count = Math.max(
            0,
            (targetPost.likes_count || 0) - 1,
          );
        }
      }
    },
    addCommentOptimistic(
      state,
      action: PayloadAction<{ postId: string | number; comment: any }>,
    ) {
      const { postId, comment } = action.payload;
      const strId = String(postId);
      const targetPost = state.feedList.find(
        (p: any) => String(p.id) === strId,
      );
      if (targetPost) {
        if (!Array.isArray(targetPost.comments)) {
          targetPost.comments = [];
        }

        const parentId = comment.parent_id ?? comment.parentId;
        if (parentId) {
          const strParentId = String(parentId);
          const insertReply = (list: any[]): boolean => {
            for (const item of list) {
              if (String(item.id) === strParentId) {
                if (!Array.isArray(item.replies)) {
                  item.replies = [];
                }
                item.replies.push(comment);
                return true;
              }
              if (Array.isArray(item.replies) && insertReply(item.replies)) {
                return true;
              }
            }
            return false;
          };

          const inserted = insertReply(targetPost.comments);
          if (!inserted) {
            targetPost.comments.push(comment);
          }
        } else {
          targetPost.comments = [comment, ...targetPost.comments];
        }
        targetPost.comments_count = (targetPost.comments_count || 0) + 1;
      }
    },
    removeCommentOptimistic(
      state,
      action: PayloadAction<{
        postId: string | number;
        commentId: string | number;
      }>,
    ) {
      const { postId, commentId } = action.payload;
      const strId = String(postId);
      const targetPost = state.feedList.find(
        (p: any) => String(p.id) === strId,
      );
      if (targetPost && Array.isArray(targetPost.comments)) {
        const removeCommentFromList = (list: any[]): any[] => {
          return list
            .filter((c: any) => String(c.id) !== String(commentId))
            .map((c: any) => ({
              ...c,
              replies: Array.isArray(c.replies)
                ? removeCommentFromList(c.replies)
                : [],
            }));
        };
        targetPost.comments = removeCommentFromList(targetPost.comments);
        targetPost.comments_count = Math.max(
          0,
          (targetPost.comments_count || 1) - 1,
        );
      }
    },
    updateCommentOptimistic(
      state,
      action: PayloadAction<{
        postId?: string | number;
        commentId: string | number;
        text: string;
      }>,
    ) {
      const { postId, commentId, text } = action.payload;
      const strCommentId = String(commentId);

      const updateInComments = (comments: any[]): boolean => {
        for (const c of comments) {
          if (String(c.id) === strCommentId) {
            c.body = text;
            c.comment = text;
            c.text = text;
            return true;
          }
          if (Array.isArray(c.replies) && updateInComments(c.replies)) {
            return true;
          }
        }
        return false;
      };

      if (postId) {
        const targetPost = state.feedList.find(
          (p: any) => String(p.id) === String(postId),
        );
        if (targetPost && Array.isArray(targetPost.comments)) {
          updateInComments(targetPost.comments);
        }
      } else {
        for (const post of state.feedList) {
          if (Array.isArray(post.comments) && updateInComments(post.comments)) {
            break;
          }
        }
      }
    },
    toggleCommentLikeOptimistic(
      state,
      action: PayloadAction<{
        commentId: string | number;
        liked: boolean;
        postId?: string | number;
      }>,
    ) {
      const { commentId, liked, postId } = action.payload;
      const strCommentId = String(commentId);

      const toggleInComments = (comments: any[]): boolean => {
        for (const c of comments) {
          if (String(c.id) === strCommentId) {
            c.liked = liked;
            c.is_liked = liked;
            if (liked) {
              c.likes_count = (c.likes_count || 0) + 1;
            } else {
              c.likes_count = Math.max(0, (c.likes_count || 0) - 1);
            }
            return true;
          }
          if (Array.isArray(c.replies) && toggleInComments(c.replies)) {
            return true;
          }
        }
        return false;
      };

      if (postId) {
        const targetPost = state.feedList.find(
          (p: any) => String(p.id) === String(postId),
        );
        if (targetPost && Array.isArray(targetPost.comments)) {
          toggleInComments(targetPost.comments);
        }
      } else {
        for (const post of state.feedList) {
          if (Array.isArray(post.comments) && toggleInComments(post.comments)) {
            break;
          }
        }
      }
    },
    toggleFollowUserOptimistic(
      state,
      action: PayloadAction<{
        userId: string | number;
        isFollowing: boolean;
      }>,
    ) {
      const { userId, isFollowing } = action.payload;
      const strUserId = String(userId);
      for (const post of state.feedList) {
        if (post?.user && String(post.user.id) === strUserId) {
          post.user.is_followed = isFollowing;
          post.user.is_following = isFollowing;
          post.is_following = isFollowing;
        }
      }
      const profileUser = state.userProfileData?.user ?? state.userProfileData;
      if (profileUser && String(profileUser.id || profileUser.user_id || '') === strUserId) {
        profileUser.is_followed = isFollowing;
        profileUser.is_following = isFollowing;
      }
    },
  },
  extraReducers: builder => {
    builder
      // 🔹 fetchFeed
      .addCase(fetchFeed.pending, (state, action) => {
        const isRefresh = action.meta.arg?.isRefresh;
        if (isRefresh) {
          state.feedRefreshing = true;
        } else {
          state.feedLoading = true;
        }
        state.feedError = null;
      })
      .addCase(fetchFeed.fulfilled, (state, action: PayloadAction<any>) => {
        state.feedLoading = false;
        state.feedRefreshing = false;
        state.feedError = null;

        const payloadData = extractFeedPayload(action.payload?.data);
        state.feedData = payloadData;

        const rawList = extractFeedList(payloadData);

        const isRefresh = action.payload?.isRefresh;
        const page = action.payload?.page ?? 1;

        if (isRefresh || page === 1) {
          state.feedList = rawList;
        } else {
          const existingIds = new Set(state.feedList.map((p: any) => p.id));
          const newItems = rawList.filter((p: any) => !existingIds.has(p.id));
          state.feedList = [...state.feedList, ...newItems];
        }

        if (
          payloadData &&
          typeof payloadData === 'object' &&
          !Array.isArray(payloadData)
        ) {
          const paginationSource =
            payloadData?.data &&
            typeof payloadData.data === 'object' &&
            !Array.isArray(payloadData.data)
              ? payloadData.data
              : payloadData;
          state.feedPagination = {
            current_page: paginationSource.current_page,
            last_page: paginationSource.last_page,
            next_page_url: paginationSource.next_page_url,
            prev_page_url: paginationSource.prev_page_url,
            total: paginationSource.total,
            per_page: paginationSource.per_page,
          };
        }
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feedLoading = false;
        state.feedRefreshing = false;
        state.feedError =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to fetch feed';
      })

      // 🔹 createPost
      .addCase(createPost.pending, state => {
        state.createPostLoading = true;
        state.createPostSuccess = false;
        state.createPostError = null;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<any>) => {
        state.createPostLoading = false;
        state.createPostSuccess = true;
        state.createPostError = null;
        const newPost =
          action.payload?.data?.data ??
          action.payload?.data ??
          action.payload ??
          null;
        state.createdPost = newPost;
        if (newPost && newPost.id !== undefined && newPost.id !== null) {
          const strId = String(newPost.id);
          const alreadyExists = state.feedList.some(
            (p: any) => String(p.id) === strId,
          );
          if (!alreadyExists) {
            state.feedList = [newPost, ...state.feedList];
          }
          if (
            state.feedPagination &&
            typeof state.feedPagination.total === 'number'
          ) {
            state.feedPagination.total += 1;
          }
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createPostLoading = false;
        state.createPostSuccess = false;
        state.createPostError =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to create post';
      })

      // 🔹 updatePost
      .addCase(updatePost.pending, state => {
        state.updatePostLoading = true;
        state.updatePostSuccess = false;
        state.updatePostError = null;
      })
      .addCase(updatePost.fulfilled, (state, action: PayloadAction<any>) => {
        state.updatePostLoading = false;
        state.updatePostSuccess = true;
        state.updatePostError = null;
        const postData =
          action.payload.data?.data?.data ??
          action.payload.data?.data ??
          action.payload.data;
        state.updatedPost = postData;
        const strId = String(action.payload.postId);
        const targetIndex = state.feedList.findIndex(
          (p: any) => String(p.id) === strId,
        );
        if (targetIndex !== -1 && postData) {
          state.feedList[targetIndex] = {
            ...state.feedList[targetIndex],
            ...postData,
          };
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.updatePostLoading = false;
        state.updatePostSuccess = false;
        state.updatePostError =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to update post';
      })

      // 🔹 deletePost
      .addCase(deletePost.pending, (state, action) => {
        const postId = String(action.meta.arg);
        state.deletePostLoadingMap[postId] = true;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const postId = String(action.payload.postId);
        delete state.deletePostLoadingMap[postId];
        state.feedList = state.feedList.filter(
          (p: any) => String(p.id) !== postId,
        );
        if (
          state.feedPagination &&
          typeof state.feedPagination.total === 'number'
        ) {
          state.feedPagination.total = Math.max(
            0,
            state.feedPagination.total - 1,
          );
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        const postId = String(action.meta.arg);
        delete state.deletePostLoadingMap[postId];
      })

      // 🔹 likePost
      .addCase(likePost.pending, (state, action) => {
        const postId = String(action.meta.arg);
        state.likeLoadingMap[postId] = true;
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const postId = String(action.payload.postId);
        delete state.likeLoadingMap[postId];
        const targetPost = state.feedList.find(
          (p: any) => String(p.id) === postId,
        );
        if (targetPost) {
          targetPost.liked = true;
          targetPost.disliked = false;
        }
      })
      .addCase(likePost.rejected, (state, action) => {
        const postId = String(action.meta.arg);
        delete state.likeLoadingMap[postId];
      })

      // 🔹 dislikePost
      .addCase(dislikePost.pending, (state, action) => {
        const postId = String(action.meta.arg);
        state.likeLoadingMap[postId] = true;
      })
      .addCase(dislikePost.fulfilled, (state, action) => {
        const postId = String(action.payload.postId);
        delete state.likeLoadingMap[postId];
        const targetPost = state.feedList.find(
          (p: any) => String(p.id) === postId,
        );
        if (targetPost) {
          targetPost.liked = false;
          targetPost.disliked = true;
        }
      })
      .addCase(dislikePost.rejected, (state, action) => {
        const postId = String(action.meta.arg);
        delete state.likeLoadingMap[postId];
      })

      // 🔹 createComment
      .addCase(createComment.pending, (state, action) => {
        const postId = String(action.meta.arg.postId);
        state.commentLoadingMap[postId] = true;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const postId = String(action.payload.postId);
        delete state.commentLoadingMap[postId];

        const createdData = action.payload?.data?.data ?? action.payload?.data;
        if (createdData?.id) {
          const targetPost = state.feedList.find(
            (p: any) => String(p.id) === postId,
          );
          if (targetPost && Array.isArray(targetPost.comments)) {
            const updateCommentRecursively = (list: any[]): any[] => {
              return list.map((c: any) => {
                let updated = c;
                if (
                  String(c.id).startsWith('temp-') &&
                  (c.body === createdData.body ||
                    c.comment === createdData.body ||
                    c.text === createdData.body)
                ) {
                  updated = {
                    ...c,
                    ...createdData,
                    id: createdData.id,
                  };
                }
                if (Array.isArray(updated.replies)) {
                  updated = {
                    ...updated,
                    replies: updateCommentRecursively(updated.replies),
                  };
                }
                return updated;
              });
            };
            targetPost.comments = updateCommentRecursively(targetPost.comments);
          }
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        const postId = String((action.meta.arg as any)?.postId);
        delete state.commentLoadingMap[postId];
      })

      // 🔹 toggleFollowUser
      .addCase(toggleFollowUser.pending, (state, action) => {
        const userId = String(action.meta.arg);
        state.toggleFollowLoadingMap[userId] = true;
      })
      .addCase(toggleFollowUser.fulfilled, (state, action) => {
        const userId = String(action.payload.userId);
        delete state.toggleFollowLoadingMap[userId];
        const resData = action.payload?.data?.data ?? action.payload?.data;
        const isFollowed =
          typeof resData?.is_followed === 'boolean'
            ? resData.is_followed
            : typeof resData?.is_following === 'boolean'
            ? resData.is_following
            : undefined;

        if (typeof isFollowed === 'boolean') {
          for (const post of state.feedList) {
            if (post?.user && String(post.user.id) === userId) {
              post.user.is_followed = isFollowed;
              post.user.is_following = isFollowed;
              post.is_following = isFollowed;
            }
          }
          for (const item of state.followsList) {
            if (
              String(item.id) === userId ||
              String(item.user_id) === userId ||
              String(item.userId) === userId
            ) {
              item.is_followed = isFollowed;
              item.is_following = isFollowed;
              item.isFollowing = isFollowed;
            }
          }
          for (const item of state.likesList) {
            if (
              String(item?.id ?? item?.user?.id ?? item?.user_id ?? '') ===
              userId
            ) {
              if (item?.user) {
                item.user.is_followed = isFollowed;
                item.user.is_following = isFollowed;
              }
              item.is_followed = isFollowed;
              item.is_following = isFollowed;
              item.isFollowing = isFollowed;
            }
          }
          const profileUser = state.userProfileData?.user ?? state.userProfileData;
          if (
            profileUser &&
            String(profileUser.id || profileUser.user_id || '') === userId
          ) {
            profileUser.is_followed = isFollowed;
            profileUser.is_following = isFollowed;
          }
        }
      })
      .addCase(toggleFollowUser.rejected, (state, action) => {
        const userId = String(action.meta.arg);
        delete state.toggleFollowLoadingMap[userId];
      })

      // 🔹 reportPost
      .addCase(reportPost.pending, (state, action) => {
        const postId = String(action.meta.arg.postId);
        state.reportLoadingMap[`post-${postId}`] = true;
      })
      .addCase(reportPost.fulfilled, (state, action) => {
        const postId = String(action.payload.postId);
        delete state.reportLoadingMap[`post-${postId}`];
      })
      .addCase(reportPost.rejected, (state, action) => {
        const postId = String((action.meta.arg as any)?.postId);
        delete state.reportLoadingMap[`post-${postId}`];
      })

      // 🔹 reportUser
      .addCase(reportUser.pending, (state, action) => {
        const userId = String(action.meta.arg.userId);
        state.reportLoadingMap[`user-${userId}`] = true;
      })
      .addCase(reportUser.fulfilled, (state, action) => {
        const userId = String(action.payload.userId);
        delete state.reportLoadingMap[`user-${userId}`];
      })
      .addCase(reportUser.rejected, (state, action) => {
        const userId = String((action.meta.arg as any)?.userId);
        delete state.reportLoadingMap[`user-${userId}`];
      })

      // 🔹 reportComment
      .addCase(reportComment.pending, (state, action) => {
        const commentId = String(action.meta.arg.commentId);
        state.reportLoadingMap[`comment-${commentId}`] = true;
      })
      .addCase(reportComment.fulfilled, (state, action) => {
        const commentId = String(action.payload.commentId);
        delete state.reportLoadingMap[`comment-${commentId}`];
      })
      .addCase(reportComment.rejected, (state, action) => {
        const commentId = String((action.meta.arg as any)?.commentId);
        delete state.reportLoadingMap[`comment-${commentId}`];
      })

      // 🔹 updateComment
      .addCase(updateComment.fulfilled, (state, action) => {
        const { commentId, body } = action.payload;
        const strCommentId = String(commentId);
        const updateInComments = (comments: any[]): boolean => {
          for (const c of comments) {
            if (String(c.id) === strCommentId) {
              c.body = body;
              c.comment = body;
              c.text = body;
              return true;
            }
            if (Array.isArray(c.replies) && updateInComments(c.replies)) {
              return true;
            }
          }
          return false;
        };

        for (const post of state.feedList) {
          if (Array.isArray(post.comments) && updateInComments(post.comments)) {
            break;
          }
        }
      })

      // 🔹 deleteComment
      .addCase(deleteComment.fulfilled, (state, action) => {
        const commentId = String(action.payload.commentId);
        const removeCommentFromList = (list: any[]): any[] => {
          return list
            .filter((c: any) => String(c.id) !== commentId)
            .map((c: any) => ({
              ...c,
              replies: Array.isArray(c.replies)
                ? removeCommentFromList(c.replies)
                : [],
            }));
        };

        for (const post of state.feedList) {
          if (Array.isArray(post.comments)) {
            const initialLen = post.comments.length;
            post.comments = removeCommentFromList(post.comments);
            if (post.comments.length < initialLen) {
              post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
            }
          }
        }
      })

      // 🔹 likeComment
      .addCase(likeComment.pending, (state, action) => {
        const commentId = String(action.meta.arg);
        state.likeLoadingMap[`comment-${commentId}`] = true;
      })
      .addCase(likeComment.fulfilled, (state, action) => {
        const commentId = String(action.payload.commentId);
        delete state.likeLoadingMap[`comment-${commentId}`];
      })
      .addCase(likeComment.rejected, (state, action) => {
        const commentId = String(action.meta.arg);
        delete state.likeLoadingMap[`comment-${commentId}`];
      })

      // 🔹 dislikeComment
      .addCase(dislikeComment.pending, (state, action) => {
        const commentId = String(action.meta.arg);
        state.likeLoadingMap[`comment-${commentId}`] = true;
      })
      .addCase(dislikeComment.fulfilled, (state, action) => {
        const commentId = String(action.meta.arg);
        delete state.likeLoadingMap[`comment-${commentId}`];
      })

      // 🔹 fetchFeedUserProfile
      .addCase(fetchFeedUserProfile.pending, state => {
        state.userProfileLoading = true;
        state.userProfileError = null;
        state.userProfileData = null;
      })
      .addCase(
        fetchFeedUserProfile.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.userProfileLoading = false;
          state.userProfileError = null;
          state.userProfileData =
            action.payload?.data?.data ?? action.payload?.data ?? null;
        },
      )
      .addCase(fetchFeedUserProfile.rejected, (state, action) => {
        state.userProfileLoading = false;
        state.userProfileError =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to fetch user profile';
      })

      // 🔹 fetchFollows
      .addCase(fetchFollows.pending, (state, action) => {
        const isRefresh = action.meta.arg?.isRefresh;
        const page = action.meta.arg?.page ?? 1;
        if (isRefresh) {
          state.followsRefreshing = true;
        } else {
          state.followsLoading = true;
          if (page === 1) {
            state.followsList = [];
            state.followsPagination = null;
          }
        }
        state.followsError = null;
      })
      .addCase(fetchFollows.fulfilled, (state, action: PayloadAction<any>) => {
        state.followsLoading = false;
        state.followsRefreshing = false;
        state.followsError = null;

        const responseData = action.payload?.data?.data ?? action.payload?.data;
        const usersObj = responseData?.users ?? responseData;

        const rawList = Array.isArray(usersObj?.data)
          ? usersObj.data
          : Array.isArray(usersObj)
          ? usersObj
          : Array.isArray(responseData?.data)
          ? responseData.data
          : [];

        const isRefresh = action.payload?.isRefresh;
        const page = action.payload?.page ?? 1;

        if (isRefresh || page === 1) {
          state.followsList = rawList;
        } else {
          const existingIds = new Set(
            state.followsList.map((item: any) => item.id),
          );
          const newItems = rawList.filter(
            (item: any) => !existingIds.has(item.id),
          );
          state.followsList = [...state.followsList, ...newItems];
        }

        if (
          usersObj &&
          typeof usersObj === 'object' &&
          !Array.isArray(usersObj)
        ) {
          state.followsPagination = {
            current_page: usersObj.current_page,
            last_page: usersObj.last_page,
            next_page_url: usersObj.next_page_url,
            prev_page_url: usersObj.prev_page_url,
            total: usersObj.total,
            per_page: usersObj.per_page,
          };
        }
      })
      .addCase(fetchFollows.rejected, (state, action) => {
        state.followsLoading = false;
        state.followsRefreshing = false;
        state.followsError =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to fetch list';
      })
      // 🔹 removeFollower
      .addCase(removeFollower.fulfilled, (state, action) => {
        const userId = String(action.payload.userId);
        state.followsList = state.followsList.filter(
          (item: any) =>
            String(item.id) !== userId &&
            String(item.user_id) !== userId &&
            String(item.userId) !== userId,
        );
        if (state.followsPagination && state.followsPagination.total > 0) {
          state.followsPagination.total = Math.max(
            0,
            state.followsPagination.total - 1,
          );
        }
      })
      // 🔹 fetchPostLikes
      .addCase(fetchPostLikes.pending, (state, action) => {
        const isRefresh = action.meta.arg?.isRefresh;
        const page = action.meta.arg?.page ?? 1;
        if (isRefresh || page === 1) {
          state.likesRefreshing = Boolean(isRefresh);
          state.likesLoading = !isRefresh;
          if (!isRefresh) {
            state.likesList = [];
            state.likesPagination = null;
          }
        } else {
          state.likesLoading = true;
        }
        state.likesError = null;
      })
      .addCase(
        fetchPostLikes.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.likesLoading = false;
          state.likesRefreshing = false;
          state.likesError = null;

          const responseData =
            action.payload?.data?.data ?? action.payload?.data;

          const rawList = Array.isArray(responseData?.data)
            ? responseData.data
            : Array.isArray(responseData?.users?.data)
            ? responseData.users.data
            : Array.isArray(responseData?.users)
            ? responseData.users
            : Array.isArray(responseData)
            ? responseData
            : [];

          const isRefresh = action.payload?.isRefresh;
          const page = action.payload?.page ?? 1;

          if (isRefresh || page === 1) {
            state.likesList = rawList;
          } else {
            const existingIds = new Set(
              state.likesList.map((item: any) =>
                String(item?.id ?? item?.user?.id ?? item?.user_id ?? ''),
              ),
            );
            const newItems = rawList.filter(
              (item: any) =>
                !existingIds.has(
                  String(item?.id ?? item?.user?.id ?? item?.user_id ?? ''),
                ),
            );
            state.likesList = [...state.likesList, ...newItems];
          }

          const paginationSource =
            responseData?.users ??
            (responseData &&
            typeof responseData === 'object' &&
            !Array.isArray(responseData)
              ? responseData
              : null);

          if (paginationSource) {
            state.likesPagination = {
              current_page: paginationSource.current_page,
              last_page: paginationSource.last_page,
              next_page_url: paginationSource.next_page_url,
              prev_page_url: paginationSource.prev_page_url,
              total: paginationSource.total,
              per_page: paginationSource.per_page,
            };
          }
        },
      )
      .addCase(fetchPostLikes.rejected, (state, action) => {
        state.likesLoading = false;
        state.likesRefreshing = false;
        state.likesError =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to fetch likes';
      });
  },
});

export const {
  clearFeedError,
  clearCreatePostError,
  resetCreatePostState,
  resetUpdatePostState,
  resetUserProfileState,
  resetFollowsState,
  toggleFollowsItemOptimistic,
  removeFollowsItemOptimistic,
  resetLikesState,
  toggleLikesItemOptimistic,
  updatePostOptimistic,
  deletePostOptimistic,
  resetFeedState,
  togglePostLikeOptimistic,
  toggleCommentLikeOptimistic,
  toggleFollowUserOptimistic,
  addCommentOptimistic,
  removeCommentOptimistic,
  updateCommentOptimistic,
} = feedSlice.actions;

export default feedSlice.reducer;
