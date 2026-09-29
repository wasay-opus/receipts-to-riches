import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../Store';

export const selectFeedSlice = (state: RootState) => state.feed;

export const selectFeedData = createSelector(
  [selectFeedSlice],
  feedState => feedState.feedData,
);

export const selectFeedList = createSelector(
  [selectFeedSlice],
  feedState => feedState.feedList,
);

export const selectFeedLoading = createSelector(
  [selectFeedSlice],
  feedState => feedState.feedLoading,
);

export const selectFeedRefreshing = createSelector(
  [selectFeedSlice],
  feedState => feedState.feedRefreshing,
);

export const selectFeedError = createSelector(
  [selectFeedSlice],
  feedState => feedState.feedError,
);

export const selectCreatePostLoading = createSelector(
  [selectFeedSlice],
  feedState => feedState.createPostLoading,
);

export const selectCreatePostSuccess = createSelector(
  [selectFeedSlice],
  feedState => feedState.createPostSuccess,
);

export const selectCreatePostError = createSelector(
  [selectFeedSlice],
  feedState => feedState.createPostError,
);

export const selectCreatedPost = createSelector(
  [selectFeedSlice],
  feedState => feedState.createdPost,
);

export const selectUserProfileData = createSelector(
  [selectFeedSlice],
  feedState => feedState.userProfileData,
);

export const selectUserProfileLoading = createSelector(
  [selectFeedSlice],
  feedState => feedState.userProfileLoading,
);

export const selectUserProfileError = createSelector(
  [selectFeedSlice],
  feedState => feedState.userProfileError,
);

export const selectFollowsList = createSelector(
  [selectFeedSlice],
  feedState => feedState.followsList,
);

export const selectFollowsLoading = createSelector(
  [selectFeedSlice],
  feedState => feedState.followsLoading,
);

export const selectFollowsRefreshing = createSelector(
  [selectFeedSlice],
  feedState => feedState.followsRefreshing,
);

export const selectFollowsError = createSelector(
  [selectFeedSlice],
  feedState => feedState.followsError,
);

export const selectFollowsPagination = createSelector(
  [selectFeedSlice],
  feedState => feedState.followsPagination,
);

export const selectLikesList = createSelector(
  [selectFeedSlice],
  feedState => feedState.likesList,
);

export const selectLikesLoading = createSelector(
  [selectFeedSlice],
  feedState => feedState.likesLoading,
);

export const selectLikesRefreshing = createSelector(
  [selectFeedSlice],
  feedState => feedState.likesRefreshing,
);

export const selectLikesError = createSelector(
  [selectFeedSlice],
  feedState => feedState.likesError,
);

export const selectLikesPagination = createSelector(
  [selectFeedSlice],
  feedState => feedState.likesPagination,
);

export const selectFeedViewModel = createSelector(
  [selectFeedSlice],
  feedState => ({
    ...feedState,
  }),
);
