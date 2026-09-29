import { useCallback, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../Store';
import {
  CreateCommentPayload,
  GetFeedParams,
} from '../../services/feedServices';
import {
  fetchFeed,
  createPost,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment,
  clearFeedError,
  clearCreatePostError,
  resetCreatePostState,
  resetUpdatePostState,
  resetUserProfileState,
  resetFollowsState,
  toggleFollowsItemOptimistic,
  removeFollowsItemOptimistic,
  updatePostOptimistic,
  deletePostOptimistic,
  resetFeedState,
  togglePostLikeOptimistic,
  toggleCommentLikeOptimistic,
  toggleFollowUserOptimistic,
  addCommentOptimistic,
  removeCommentOptimistic,
  updateCommentOptimistic,
  toggleFollowUser,
  removeFollower,
  reportPost,
  reportUser,
  reportComment,
  fetchFeedUserProfile,
  fetchFollows,
  fetchPostLikes,
  resetLikesState,
  toggleLikesItemOptimistic,
} from '../Slices/feedSlice';
import { selectFeedViewModel } from '../Selectors/feedSelectors';

export const useFeedDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  const onFetchFeed = useCallback(
    (params?: GetFeedParams, isRefresh?: boolean) =>
      dispatch(fetchFeed({ params, isRefresh })),
    [dispatch],
  );
  const onPostCreate = useCallback(
    (formData: FormData) => dispatch(createPost(formData)),
    [dispatch],
  );
  const onUpdatePost = useCallback(
    (
      postId: number | string,
      payload: FormData | { description?: string; [key: string]: any },
    ) => dispatch(updatePost({ postId, payload })),
    [dispatch],
  );
  const onDeletePost = useCallback(
    (postId: number | string) => dispatch(deletePost(postId)),
    [dispatch],
  );
  const onLikePost = useCallback(
    (postId: number | string) => dispatch(likePost(postId)),
    [dispatch],
  );
  const onDislikePost = useCallback(
    (postId: number | string) => dispatch(dislikePost(postId)),
    [dispatch],
  );
  const onCreateComment = useCallback(
    (postId: number | string, payload: CreateCommentPayload) =>
      dispatch(createComment({ postId, payload })),
    [dispatch],
  );
  const onUpdateComment = useCallback(
    (commentId: number | string, body: string) =>
      dispatch(updateComment({ commentId, body })),
    [dispatch],
  );
  const onDeleteComment = useCallback(
    (commentId: number | string) => dispatch(deleteComment(commentId)),
    [dispatch],
  );
  const onLikeComment = useCallback(
    (commentId: number | string) => dispatch(likeComment(commentId)),
    [dispatch],
  );
  const onDislikeComment = useCallback(
    (commentId: number | string) => dispatch(dislikeComment(commentId)),
    [dispatch],
  );
  const onTogglePostLikeOptimistic = useCallback(
    (postId: number | string, liked: boolean) => {
      if (typeof togglePostLikeOptimistic === 'function') {
        dispatch(togglePostLikeOptimistic({ postId, liked }));
      }
    },
    [dispatch],
  );
  const onToggleCommentLikeOptimistic = useCallback(
    (commentId: number | string, liked: boolean, postId?: number | string) => {
      if (typeof toggleCommentLikeOptimistic === 'function') {
        dispatch(toggleCommentLikeOptimistic({ commentId, liked, postId }));
      }
    },
    [dispatch],
  );
  const onToggleFollowUserOptimistic = useCallback(
    (userId: number | string, isFollowing: boolean) => {
      if (typeof toggleFollowUserOptimistic === 'function') {
        dispatch(toggleFollowUserOptimistic({ userId, isFollowing }));
      }
    },
    [dispatch],
  );
  const onAddCommentOptimistic = useCallback(
    (postId: number | string, comment: any) => {
      if (typeof addCommentOptimistic === 'function') {
        dispatch(addCommentOptimistic({ postId, comment }));
      }
    },
    [dispatch],
  );
  const onRemoveCommentOptimistic = useCallback(
    (postId: number | string, commentId: number | string) => {
      if (typeof removeCommentOptimistic === 'function') {
        dispatch(removeCommentOptimistic({ postId, commentId }));
      }
    },
    [dispatch],
  );
  const onUpdateCommentOptimistic = useCallback(
    (commentId: number | string, text: string, postId?: number | string) => {
      if (typeof updateCommentOptimistic === 'function') {
        dispatch(updateCommentOptimistic({ commentId, text, postId }));
      }
    },
    [dispatch],
  );
  const onUpdatePostOptimistic = useCallback(
    (postId: number | string, description?: string, media_url?: string) => {
      if (typeof updatePostOptimistic === 'function') {
        dispatch(updatePostOptimistic({ postId, description, media_url }));
      }
    },
    [dispatch],
  );
  const onDeletePostOptimistic = useCallback(
    (postId: number | string) => {
      if (typeof deletePostOptimistic === 'function') {
        dispatch(deletePostOptimistic(postId));
      }
    },
    [dispatch],
  );
  const onToggleFollowUser = useCallback(
    (userId: number | string) => {
      if (typeof toggleFollowUser === 'function') {
        return dispatch(toggleFollowUser(userId));
      }
      return Promise.resolve({ type: 'feed/toggleFollowUser/rejected' } as any);
    },
    [dispatch],
  );
  const onRemoveFollower = useCallback(
    (userId: number | string) => {
      if (typeof removeFollower === 'function') {
        return dispatch(removeFollower(userId));
      }
      return Promise.resolve({ type: 'feed/removeFollower/rejected' } as any);
    },
    [dispatch],
  );
  const onReportPost = useCallback(
    (postId: number | string, reason: string) => {
      if (typeof reportPost === 'function') {
        return dispatch(reportPost({ postId, reason }));
      }
      return Promise.resolve({ type: 'feed/reportPost/rejected' } as any);
    },
    [dispatch],
  );
  const onReportUser = useCallback(
    (userId: number | string, reason: string) => {
      if (typeof reportUser === 'function') {
        return dispatch(reportUser({ userId, reason }));
      }
      return Promise.resolve({ type: 'feed/reportUser/rejected' } as any);
    },
    [dispatch],
  );
  const onReportComment = useCallback(
    (commentId: number | string, reason: string) => {
      if (typeof reportComment === 'function') {
        return dispatch(reportComment({ commentId, reason }));
      }
      return Promise.resolve({ type: 'feed/reportComment/rejected' } as any);
    },
    [dispatch],
  );
  const onClearFeedError = useCallback(
    () => dispatch(clearFeedError()),
    [dispatch],
  );
  const onClearCreatePostError = useCallback(
    () => dispatch(clearCreatePostError()),
    [dispatch],
  );
  const onResetCreatePostState = useCallback(
    () => dispatch(resetCreatePostState()),
    [dispatch],
  );
  const onResetUpdatePostState = useCallback(
    () => dispatch(resetUpdatePostState()),
    [dispatch],
  );
  const onResetFeedState = useCallback(
    () => dispatch(resetFeedState()),
    [dispatch],
  );
  const onResetUserProfileState = useCallback(
    () => dispatch(resetUserProfileState()),
    [dispatch],
  );
  const onFetchUserProfile = useCallback(
    (userId: number | string, params?: GetFeedParams) => {
      if (typeof fetchFeedUserProfile === 'function') {
        return dispatch(fetchFeedUserProfile({ userId, params }));
      }
      return Promise.resolve({
        type: 'feed/fetchFeedUserProfile/rejected',
      } as any);
    },
    [dispatch],
  );
  const onFetchFollows = useCallback(
    (options: {
      tab: 'followers' | 'following';
      user_id?: number | string;
      per_page?: number;
      page?: number;
      isRefresh?: boolean;
    }) => {
      if (typeof fetchFollows === 'function') {
        return dispatch(fetchFollows(options));
      }
      return Promise.resolve({
        type: 'feed/fetchFollows/rejected',
      } as any);
    },
    [dispatch],
  );
  const onResetFollowsState = useCallback(
    () => dispatch(resetFollowsState()),
    [dispatch],
  );
  const onToggleFollowsItemOptimistic = useCallback(
    (userId: number | string, isFollowing: boolean) => {
      if (typeof toggleFollowsItemOptimistic === 'function') {
        dispatch(toggleFollowsItemOptimistic({ userId, isFollowing }));
      }
    },
    [dispatch],
  );
  const onFetchPostLikes = useCallback(
    (options: {
      postId: number | string;
      reaction?: 'like' | 'dislike';
      per_page?: number;
      page?: number;
      isRefresh?: boolean;
    }) => {
      if (typeof fetchPostLikes === 'function') {
        return dispatch(fetchPostLikes(options));
      }
      return Promise.resolve({
        type: 'feed/fetchPostLikes/rejected',
      } as any);
    },
    [dispatch],
  );
  const onResetLikesState = useCallback(
    () => dispatch(resetLikesState()),
    [dispatch],
  );
  const onToggleLikesItemOptimistic = useCallback(
    (userId: number | string, isFollowing: boolean) => {
      if (typeof toggleLikesItemOptimistic === 'function') {
        dispatch(toggleLikesItemOptimistic({ userId, isFollowing }));
      }
    },
    [dispatch],
  );
  const onRemoveFollowsItemOptimistic = useCallback(
    (userId: number | string) => {
      if (typeof removeFollowsItemOptimistic === 'function') {
        dispatch(removeFollowsItemOptimistic(userId));
      }
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      fetchFeed: onFetchFeed,
      fetchFeedUserProfile: onFetchUserProfile,
      fetchFollows: onFetchFollows,
      fetchPostLikes: onFetchPostLikes,
      createPost: onPostCreate,
      updatePost: onUpdatePost,
      deletePost: onDeletePost,
      likePost: onLikePost,
      dislikePost: onDislikePost,
      createComment: onCreateComment,
      updateComment: onUpdateComment,
      deleteComment: onDeleteComment,
      likeComment: onLikeComment,
      dislikeComment: onDislikeComment,
      toggleFollowUser: onToggleFollowUser,
      removeFollower: onRemoveFollower,
      reportPost: onReportPost,
      reportUser: onReportUser,
      reportComment: onReportComment,
      togglePostLikeOptimistic: onTogglePostLikeOptimistic,
      toggleCommentLikeOptimistic: onToggleCommentLikeOptimistic,
      toggleFollowUserOptimistic: onToggleFollowUserOptimistic,
      toggleFollowsItemOptimistic: onToggleFollowsItemOptimistic,
      toggleLikesItemOptimistic: onToggleLikesItemOptimistic,
      removeFollowsItemOptimistic: onRemoveFollowsItemOptimistic,
      addCommentOptimistic: onAddCommentOptimistic,
      removeCommentOptimistic: onRemoveCommentOptimistic,
      updateCommentOptimistic: onUpdateCommentOptimistic,
      updatePostOptimistic: onUpdatePostOptimistic,
      deletePostOptimistic: onDeletePostOptimistic,
      clearFeedError: onClearFeedError,
      clearCreatePostError: onClearCreatePostError,
      resetCreatePostState: onResetCreatePostState,
      resetUpdatePostState: onResetUpdatePostState,
      resetUserProfileState: onResetUserProfileState,
      resetFollowsState: onResetFollowsState,
      resetLikesState: onResetLikesState,
      resetFeedState: onResetFeedState,
    }),
    [
      onFetchFeed,
      onFetchUserProfile,
      onFetchFollows,
      onFetchPostLikes,
      onPostCreate,
      onUpdatePost,
      onDeletePost,
      onLikePost,
      onDislikePost,
      onCreateComment,
      onUpdateComment,
      onDeleteComment,
      onLikeComment,
      onDislikeComment,
      onToggleFollowUser,
      onRemoveFollower,
      onReportPost,
      onReportUser,
      onReportComment,
      onTogglePostLikeOptimistic,
      onToggleCommentLikeOptimistic,
      onToggleFollowUserOptimistic,
      onToggleFollowsItemOptimistic,
      onToggleLikesItemOptimistic,
      onRemoveFollowsItemOptimistic,
      onAddCommentOptimistic,
      onRemoveCommentOptimistic,
      onUpdateCommentOptimistic,
      onUpdatePostOptimistic,
      onDeletePostOptimistic,
      onClearFeedError,
      onClearCreatePostError,
      onResetCreatePostState,
      onResetUpdatePostState,
      onResetUserProfileState,
      onResetFollowsState,
      onResetLikesState,
      onResetFeedState,
    ],
  );
};

export const useFeedState = () => {
  return useSelector(selectFeedViewModel, shallowEqual);
};
