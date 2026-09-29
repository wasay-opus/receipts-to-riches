import type { RootState } from '../Store';

export const selectThemeState = (state: RootState) => state.theme;

export const selectIsDarkMode = (state: RootState) =>
  selectThemeState(state).isDarkMode;
