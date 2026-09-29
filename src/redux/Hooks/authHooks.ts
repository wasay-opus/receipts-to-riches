import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../Store';
import {
  login,
  logout,
  logoutUser,
  clearError,
  registerUser,
  completeProfile as completeProfileAction,
  setProfileComplete,
  completeGuideVideo,
  forgotPassword,
  setAuthenticated,
  validatePasswordCode,
  resetPassword,
  socialLogin,
  // changePassword,
  //   deleteAccount,
  resetDeleteAccountState,
  //   appleLogin,
  //   googleLogin,
} from '../Slices/authSlice';

export const useAuthDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  return {
    login: (credentials: {
      email: string;
      password: string;
      fcm_token: string;
    }) => dispatch(login(credentials)),
    logout: () => dispatch(logoutUser()),
    logoutLocal: () => dispatch(logout()),
    clearAuthError: () => dispatch(clearError()),
    register: (userData: any) => dispatch(registerUser(userData)),
    completeProfile: (profileData: {
      title: string;
      dob: string;
      address: string;
      apartment: string;
      city: string;
      state: string;
      zip_code: string;
      question_text: string;
      answer: string;
    }) => dispatch(completeProfileAction(profileData)),
    setProfileComplete: (isComplete: boolean) =>
      dispatch(setProfileComplete(isComplete)),
    completeGuideVideo: () => dispatch(completeGuideVideo()),
    forgotPassword: (email: string) => dispatch(forgotPassword(email)),
    setAuthenticated: (isAuthenticated: boolean) =>
      dispatch(setAuthenticated(isAuthenticated)),
    validatePasswordCode: (codeData: { email: string; token: string }) =>
      dispatch(validatePasswordCode(codeData)),
    resetPassword: (resetData: {
      email: string;
      token: string;
      password: string;
      password_confirmation: string;
    }) => dispatch(resetPassword(resetData)),
    // changePassword: (passwordData: {
    //   old_password: string;
    //   new_password: string;
    //   confirm_new_password: string;
    // }) => dispatch(changePassword(passwordData)),
    // resetChangePasswordState: () => dispatch(resetChangePasswordState()),
    // deleteAccount: () => dispatch(deleteAccount()),
    resetDeleteAccountState: () => dispatch(resetDeleteAccountState()),
    socialLogin: (data: {
      provider: string;
      id_token: string;
      fcm_token: string;
    }) => dispatch(socialLogin(data)),

    // googleLogin: (data: {
    //   google_token: string;
    //   device_id: string;
    //   token: string;
    // }) => dispatch(googleLogin(data)),
  };
};

export const useAuthState = () => {
  return useSelector((state: RootState) => state.auth);
};
