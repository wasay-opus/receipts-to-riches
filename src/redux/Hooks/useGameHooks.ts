import { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../Store';
import {
  clearGamesError,
  fetchAllGames,
  fetchGamesBySlug,
  fetchUnlockedMiniGames,
  resetGamesState,
  recordGamePlayForVideoAd,
} from '../Slices/gamesSlice';
import { selectGamesViewModel } from '../Selectors/gamesSelectors';

export const useGameDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  return useMemo(
    () => ({
      fetchAllGames: () => dispatch(fetchAllGames()),
      fetchGamesBySlug: (slug: string) => dispatch(fetchGamesBySlug(slug)),
      fetchUnlockedMiniGames: () => dispatch(fetchUnlockedMiniGames()),
      recordGamePlayForVideoAd: () => dispatch(recordGamePlayForVideoAd()),
      clearGamesError: () => dispatch(clearGamesError()),
      resetGamesState: () => dispatch(resetGamesState()),
    }),
    [dispatch],
  );
};

export const useGameState = () => {
  return useSelector(selectGamesViewModel, shallowEqual);
};
