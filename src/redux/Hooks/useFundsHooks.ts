import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../Store';
import {
  fetchAllFunds,
  addFunds,
  clearFundsError,
  clearAddFundsError,
  resetFundsState,
} from '../Slices/fundsSlice';

export const useFundsDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  const onFetchAllFunds = useCallback(() => dispatch(fetchAllFunds()), [dispatch]);
  const onAddFunds = useCallback(
    (amount: number) => dispatch(addFunds(amount)),
    [dispatch],
  );
  const onClearFundsError = useCallback(() => dispatch(clearFundsError()), [dispatch]);
  const onClearAddFundsError = useCallback(() => dispatch(clearAddFundsError()), [dispatch]);
  const onResetFundsState = useCallback(() => dispatch(resetFundsState()), [dispatch]);

  return useMemo(
    () => ({
      fetchAllFunds: onFetchAllFunds,
      addFunds: onAddFunds,
      clearFundsError: onClearFundsError,
      clearAddFundsError: onClearAddFundsError,
      resetFundsState: onResetFundsState,
    }),
    [onFetchAllFunds, onAddFunds, onClearFundsError, onClearAddFundsError, onResetFundsState],
  );
};

export const useFundsState = () => {
  return useSelector((state: RootState) => state.funds);
};
