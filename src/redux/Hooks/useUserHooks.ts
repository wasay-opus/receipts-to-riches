import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../Store';
import {
  changePasswordWithUpdateProfile,
  fetchUser,
  clearUserError,
  resetEditProfileState,
  resetChangePasswordState,
  clearUserData,
  deleteUser,
  clearDeleteUserStatus,
  resetDeleteUserState,
  editProfile,
  toggleSafeMode,
} from '../Slices/userSlice';
import { selectUserViewModel } from '../Selectors/userSelectors';

export const useUserDispatch = () => {
  const dispatch = useDispatch<AppDispatch>();

  return {
    fetchUser: () => dispatch(fetchUser()),
    editProfile: (profileData: any) => dispatch(editProfile(profileData)),
    changePasswordWithUpdateProfile: (passwordData: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => dispatch(changePasswordWithUpdateProfile(passwordData)),
    clearUserError: () => dispatch(clearUserError()),
    resetEditProfileState: () => dispatch(resetEditProfileState()),
    resetChangePasswordState: () => dispatch(resetChangePasswordState()),
    clearUserData: () => dispatch(clearUserData()),
    deleteUser: () => dispatch(deleteUser()),
    clearDeleteUserStatus: () => dispatch(clearDeleteUserStatus()),
    resetDeleteUserState: () => dispatch(resetDeleteUserState()),
    toggleSafeMode: (value: boolean) => dispatch(toggleSafeMode(value)),
  };
};

export const useUserState = () => {
  return useSelector(selectUserViewModel, shallowEqual);
};
