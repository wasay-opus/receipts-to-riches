import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../Store';

const selectGamesSlice = (state: RootState) => state.games;

export const selectGamesViewModel = (state: RootState) => state.games;

export const selectAllGames = createSelector(
  [selectGamesSlice],
  gamesState => gamesState.allGames,
);

export const selectUnlockedMiniGames = createSelector(
  [selectGamesSlice],
  gamesState => gamesState.unlockedMiniGames,
);
