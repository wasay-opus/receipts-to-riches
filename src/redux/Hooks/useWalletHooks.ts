import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../Store';
import {
  fetchWallet,
  addPoints,
  clearWalletError,
  clearAddPointsError,
  resetWalletState,
} from '../Slices/walletSlice';

export const useWalletDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  const onFetchWallet = useCallback(() => dispatch(fetchWallet()), [dispatch]);
  const onAddPoints = useCallback(
    (points: number) => dispatch(addPoints(points)),
    [dispatch],
  );
  const onClearWalletError = useCallback(() => dispatch(clearWalletError()), [dispatch]);
  const onClearAddPointsError = useCallback(() => dispatch(clearAddPointsError()), [dispatch]);
  const onResetWalletState = useCallback(() => dispatch(resetWalletState()), [dispatch]);

  return useMemo(
    () => ({
      fetchWallet: onFetchWallet,
      addPoints: onAddPoints,
      clearWalletError: onClearWalletError,
      clearAddPointsError: onClearAddPointsError,
      resetWalletState: onResetWalletState,
    }),
    [onFetchWallet, onAddPoints, onClearWalletError, onClearAddPointsError, onResetWalletState],
  );
};

export const useWalletState = () => {
  return useSelector((state: RootState) => state.wallet);
};
