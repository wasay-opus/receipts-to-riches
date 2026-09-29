import { combineReducers } from '@reduxjs/toolkit';
import authSlice from '../Slices/authSlice';
import userSlice from '../Slices/userSlice';
import gamesSlice from '../Slices/gamesSlice';
import rewardsSlice from '../Slices/rewardsSlice';
import campaignsSlice from '../Slices/campaignsSlice';
import fundsSlice from '../Slices/fundsSlice';
import notificationsSlice from '../Slices/notificationsSlice';
import walletSlice from '../Slices/walletSlice';
import languageSlice from '../Slices/languageSlice';
import locationsSlice from '../Slices/locationsSlice';
import themeSlice from '../Slices/darkModeSlice';
import feedSlice from '../Slices/feedSlice';
// import contact from '../Slices/contactSlice';
// import ringtones from '../Slices/ringtoneSlice';

const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  games: gamesSlice,
  rewards: rewardsSlice,
  campaigns: campaignsSlice,
  funds: fundsSlice,
  notifications: notificationsSlice,
  wallet: walletSlice,
  language: languageSlice,
  locations: locationsSlice,
  theme: themeSlice,
  feed: feedSlice,
  // contacts: contact,
  // ringtones,
});

export default rootReducer;
