import axios from 'axios';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import userServices from '../../services/userServices';

interface UserState {
  userData: any | null;
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
  editProfileLoading: boolean;
  editProfileSuccess: boolean;
  changePasswordLoading: boolean;
  changePasswordSuccess: boolean;
  contactUsLoading: boolean;
  contactUsSuccess: boolean;
  deleteUserLoading: boolean;
  deleteUserSuccess: boolean;
  assignUserRoleLoading: boolean;
  assignUserRoleSuccess: boolean;
  isSafeMode: boolean;
}

const extractMessage = (payload: any, fallback: string): string => {
  const userFriendlyMessage = payload?.user_friendly_message;
  if (
    typeof userFriendlyMessage === 'string' &&
    userFriendlyMessage.trim().length > 0
  ) {
    return userFriendlyMessage;
  }

  const message = payload?.message;
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }
  const nestedError = payload?.error;
  if (Array.isArray(nestedError) && typeof nestedError[0] === 'string') {
    return nestedError[0];
  }
  if (typeof nestedError === 'string' && nestedError.trim().length > 0) {
    return nestedError;
  }
  return fallback;
};

const extractWallet = (payload: any) => {
  const candidateWallet =
    payload?.data?.wallet ?? payload?.wallet ?? payload?.data;

  if (
    candidateWallet &&
    typeof candidateWallet === 'object' &&
    !Array.isArray(candidateWallet)
  ) {
    return candidateWallet;
  }

  return null;
};

const initialState: UserState = {
  userData: null,
  loading: false,
  error: null,
  updateLoading: false,
  editProfileLoading: false,
  editProfileSuccess: false,
  changePasswordLoading: false,
  changePasswordSuccess: false,
  contactUsLoading: false,
  contactUsSuccess: false,
  deleteUserLoading: false,
  deleteUserSuccess: false,
  assignUserRoleLoading: false,
  assignUserRoleSuccess: false,
  isSafeMode: false,
};

export const fetchUser = createAsyncThunk(
  'users/get-profile',
  async (_: void, { rejectWithValue }) => {
    try {
      const userPromise = userServices.getUser();
      const walletPromise = userServices.getWallet();

      const userResponse = await userPromise;
      let walletResponse: any = null;

      try {
        walletResponse = await walletPromise;
      } catch (walletError) {
        console.warn('[UserAPI] GET_WALLET failed, continuing with user payload', walletError);
      }

      const userPayload = userResponse?.data;
      const userData = userPayload?.data ?? userPayload ?? null;
      const walletData = extractWallet(walletResponse?.data);

      if (
        walletData &&
        userData &&
        typeof userData === 'object' &&
        !Array.isArray(userData)
      ) {
        return {
          ...(typeof userPayload === 'object' && userPayload ? userPayload : {}),
          data: {
            ...userData,
            wallet: walletData,
          },
        };
      }

      if (walletData && !userData) {
        return {
          ...(typeof userPayload === 'object' && userPayload ? userPayload : {}),
          data: { wallet: walletData },
        };
      }

      return userPayload;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to fetch user data'),
        );
      }
      return rejectWithValue(error.message || 'Failed to fetch user data');
    }
  },
);

import { showToast } from '../../components/Toast';

export const editProfile = createAsyncThunk(
  'user/editProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const response = await userServices.editProfile(profileData);
      const data = response?.data ?? response;
      if (response && response.success !== false) {
        showToast({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully',
        });
        return response;
      }
      return rejectWithValue(extractMessage(response, 'Failed to update profile'));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to update profile'),
        );
      }
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  },
);

export const changePasswordWithUpdateProfile = createAsyncThunk(
  'user/changePasswordWithUpdateProfile',
  async (
    passwordData: {
      current_password: string;
      password: string;
      password_confirmation: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await userServices.changePassword(
        passwordData,
      );
      if (response && response.success !== false) {
        return response;
      }
      return rejectWithValue(extractMessage(response, 'Failed to change password'));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to change password'),
        );
      }
      return rejectWithValue(error.message || 'Failed to change password');
    }
  },
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await userServices.deleteUser();
      return response?.data ?? response;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractMessage(error.response.data, 'Failed to delete user'),
        );
      }
      return rejectWithValue(error.message || 'Failed to delete user');
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
    resetEditProfileState(state) {
      state.editProfileLoading = false;
      state.editProfileSuccess = false;
      state.error = null;
    },
    resetChangePasswordState(state) {
      state.changePasswordLoading = false;
      state.changePasswordSuccess = false;
      state.error = null;
    },
    clearUserData(state) {
      state.userData = null;
    },
    setUpdateLoading(state, action: PayloadAction<boolean>) {
      state.updateLoading = action.payload;
    },
    updateUserDataLocally(state, action: PayloadAction<Partial<any>>) {
      if (state.userData) {
        state.userData = {
          ...state.userData,
          ...action.payload,
        };
      }
    },

    clearDeleteUserStatus(state) {
      state.deleteUserLoading = false;
      state.deleteUserSuccess = false;
      state.error = null;
    },
    resetDeleteUserState(state) {
      state.deleteUserLoading = false;
      state.deleteUserSuccess = false;
      state.error = null;
    },
    toggleSafeMode(state, action: PayloadAction<boolean>) {
      state.isSafeMode = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.userData = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.userData = null;
        state.error = action.payload as string;
      })
      .addCase(editProfile.pending, state => {
        state.editProfileLoading = true;
        state.editProfileSuccess = false;
        state.error = null;
      })
      .addCase(editProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.editProfileLoading = false;
        state.editProfileSuccess = true;
        const updatedUser =
          action.payload?.data?.data ??
          action.payload?.data?.user ??
          action.payload?.data ??
          action.payload;
        if (state.userData) {
          state.userData = {
            ...state.userData,
            ...updatedUser,
          };
        } else {
          state.userData = updatedUser ?? null;
        }
      })
      .addCase(editProfile.rejected, (state, action) => {
        state.editProfileLoading = false;
        state.editProfileSuccess = false;
        state.error = action.payload as string;
      })
      .addCase(changePasswordWithUpdateProfile.pending, state => {
        state.changePasswordLoading = true;
        state.changePasswordSuccess = false;
        state.error = null;
      })
      .addCase(changePasswordWithUpdateProfile.fulfilled, state => {
        state.changePasswordLoading = false;
        state.changePasswordSuccess = true;
        state.error = null;
      })
      .addCase(changePasswordWithUpdateProfile.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.changePasswordSuccess = false;
        state.error = action.payload as string;
      })
      //   .addCase(updateUserProfile.pending, state => {
      //     state.updateLoading = true;
      //     state.error = null;
      //   })
      //   .addCase(
      //     updateUserProfile.fulfilled,
      //     (state, action: PayloadAction<any>) => {
      //       state.updateLoading = false;
      //       if (state.userData) {
      //         state.userData = {
      //           ...state.userData,
      //           ...action.payload.data,
      //         };
      //       }
      //     },
      //   )
      //   .addCase(updateUserProfile.rejected, (state, action) => {
      //     state.updateLoading = false;
      //     state.error = action.payload as string;
      //   })
      //   .addCase(updateUserProfileWithImage.pending, state => {
      //     state.updateLoading = true;
      //     state.error = null;
      //   })
      //   .addCase(
      //     updateUserProfileWithImage.fulfilled,
      //     (state, action: PayloadAction<any>) => {
      //       state.updateLoading = false;
      //       if (state.userData) {
      //         state.userData = {
      //           ...state.userData,
      //           ...action.payload.data,
      //         };
      //       }
      //     },
      //   )
      //   .addCase(updateUserProfileWithImage.rejected, (state, action) => {
      //     state.updateLoading = false;
      //     state.error = action.payload as string;
      //   })

      //   // Change Password
      //   .addCase(changeUserPassword.pending, state => {
      //     state.changePasswordLoading = true;
      //     state.changePasswordSuccess = false;
      //     state.error = null;
      //   })
      //   .addCase(changeUserPassword.fulfilled, state => {
      //     state.changePasswordLoading = false;
      //     state.changePasswordSuccess = true;
      //     state.error = null;
      //   })
      //   .addCase(changeUserPassword.rejected, (state, action) => {
      //     state.changePasswordLoading = false;
      //     state.changePasswordSuccess = false;
      //     state.error = action.payload as string;
      //   })

      //   // Contact Us
      //   .addCase(submitContactUs.pending, state => {
      //     state.contactUsLoading = true;
      //     state.contactUsSuccess = false;
      //     state.error = null;
      //   })
      //   .addCase(submitContactUs.fulfilled, state => {
      //     state.contactUsLoading = false;
      //     state.contactUsSuccess = true;
      //     state.error = null;
      //   })
      //   .addCase(submitContactUs.rejected, (state, action) => {
      //     state.contactUsLoading = false;
      //     state.contactUsSuccess = false;
      //     state.error = action.payload as string;
      //   })

      // ✅ Delete User cases
      .addCase(deleteUser.pending, state => {
        state.deleteUserLoading = true;
        state.deleteUserSuccess = false;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, state => {
        state.deleteUserLoading = false;
        state.deleteUserSuccess = true;
        state.userData = null;
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteUserLoading = false;
        state.deleteUserSuccess = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearUserError,
  resetEditProfileState,
  resetChangePasswordState,
  clearUserData,
  setUpdateLoading,
  updateUserDataLocally,
  clearDeleteUserStatus,
  resetDeleteUserState,
  toggleSafeMode,
} = userSlice.actions;
export default userSlice.reducer;
