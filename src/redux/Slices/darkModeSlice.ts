import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ThemeState {
  isDarkMode: boolean;
}

const initialState: ThemeState = {
  isDarkMode: false,
};

const darkModeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.isDarkMode = action.payload;
    },
    toggleDarkMode(state) {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const { setDarkMode, toggleDarkMode } = darkModeSlice.actions;
export default darkModeSlice.reducer;
