import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../Store';
import {
  claimReward,
  clearRewardsError,
  fetchAllRewards,
  resetRewardsState,
} from '../Slices/rewardsSlice';

export const useRewardsDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  const onFetchAllRewards = useCallback(() => dispatch(fetchAllRewards()), [dispatch]);
  const onClaimReward = useCallback(
    (rewardId: number) => dispatch(claimReward(rewardId)),
    [dispatch],
  );
  const onClearRewardsError = useCallback(() => dispatch(clearRewardsError()), [dispatch]);
  const onResetRewardsState = useCallback(() => dispatch(resetRewardsState()), [dispatch]);

  return useMemo(
    () => ({
      fetchAllRewards: onFetchAllRewards,
      claimReward: onClaimReward,
      clearRewardsError: onClearRewardsError,
      resetRewardsState: onResetRewardsState,
    }),
    [onFetchAllRewards, onClaimReward, onClearRewardsError, onResetRewardsState],
  );
};

export const useRewardsState = () => {
  return useSelector((state: RootState) => state.rewards);
};
