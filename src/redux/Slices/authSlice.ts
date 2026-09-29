import axios from 'axios';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authServices from '../../services/authServices';
import localStoreUtil, { saveAccessToken } from '../../utils/localStoreUtil';
import { showToast } from '../../components';
import { fetchAllGames, fetchUnlockedMiniGames, resetGamesState } from './gamesSlice';
import { fetchUser } from './userSlice';

interface AuthState {
  user: any | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isRegister: boolean;
  needsGuideVideo: boolean;
  isProfile: boolean;
  forgotPasswordSuccess: boolean;
  validateCodeSuccess: boolean;
  resetPasswordSuccess: boolean;
  changePasswordSuccess: boolean;
  validatePasswordToken?: string | null;
  deleteAccountSuccess: boolean;
  userId: number | null;
}

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

interface ProfileCompletionPayload {
  title: string;
  dob: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip_code: string;
  question_text: string;
  answer: string;
}

interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

const extractAuthResponseData = (payload: any) => payload?.data ?? payload;

const AUTH_TOKEN_KEYS = [
  'access_token',
  'token',
  'accessToken',
  'auth_token',
  'authToken',
] as const;

const extractAuthToken = (payload: any): string | null => {
  const responseData = extractAuthResponseData(payload);
  const searchForToken = (value: unknown, depth = 0): string | null => {
    if (depth > 6 || value == null) {
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const token = searchForToken(item, depth + 1);
        if (token) {
          return token;
        }
      }
      return null;
    }

    if (typeof value !== 'object') {
      return null;
    }

    const obj = value as Record<string, unknown>;
    for (const key of AUTH_TOKEN_KEYS) {
      const tokenCandidate = obj[key];
      if (typeof tokenCandidate === 'string' && tokenCandidate.trim().length > 0) {
        return tokenCandidate;
      }
    }

    for (const nestedValue of Object.values(obj)) {
      const token = searchForToken(nestedValue, depth + 1);
      if (token) {
        return token;
      }
    }

    return null;
  };

  return searchForToken(responseData) ?? searchForToken(payload);
};

const extractAuthUser = (payload: any): any | null => {
  const responseData = extractAuthResponseData(payload);
  return (
    responseData?.user ??
    responseData?.user_details ??
    responseData?.data?.user ??
    responseData?.data?.user_details ??
    responseData?.data?.data?.user ??
    responseData?.data?.data?.user_details ??
    payload?.user ??
    payload?.user_details ??
    payload?.data?.user ??
    payload?.data?.user_details ??
    payload?.data?.data?.user ??
    payload?.data?.data?.user_details ??
    null
  );
};

const hasCompletedProfile = (user: any): boolean =>
  user?.is_profile_complete === true;

const extractErrorMessage = (
  responseData: any,
  fallbackMessage: string,
): string => {
  const message = responseData?.message;

  const userFriendlyMessage = responseData?.user_friendly_message;
  if (
    typeof userFriendlyMessage === 'string' &&
    userFriendlyMessage.trim().length > 0
  ) {
    return userFriendlyMessage;
  }

  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  const nestedError = responseData?.data?.error;
  if (Array.isArray(nestedError) && typeof nestedError[0] === 'string') {
    return nestedError[0];
  }

  if (typeof nestedError === 'string' && nestedError.trim().length > 0) {
    return nestedError;
  }

  const rootError = responseData?.error;
  if (Array.isArray(rootError) && typeof rootError[0] === 'string') {
    return rootError[0];
  }

  if (typeof rootError === 'string' && rootError.trim().length > 0) {
    return rootError;
  }

  return fallbackMessage;
};

const extractErrorDetails = (
  responseData: any,
  fallbackMessage: string,
): ApiError => ({
  message: extractErrorMessage(responseData, fallbackMessage),
  errors: responseData?.errors || responseData?.data?.errors || {},
});

const clearAuthSessionState = (state: AuthState) => {
  state.user = null;
  state.token = null;
  state.loading = false;
  state.isAuthenticated = false;
  state.isRegister = false;
  state.needsGuideVideo = false;
  state.isProfile = false;
  state.error = null;
  state.changePasswordSuccess = false;
  state.validatePasswordToken = null;
  state.userId = null;
  localStoreUtil.removeData('accessToken');
};

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isRegister: false,
  needsGuideVideo: false,
  isProfile: false,
  forgotPasswordSuccess: false,
  validateCodeSuccess: false,
  resetPasswordSuccess: false,
  changePasswordSuccess: false,
  validatePasswordToken: null,
  deleteAccountSuccess: false,
  userId: null,
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await authServices.register(userData);
      const data = response?.data ?? response;
      if (response && response.success !== false) {
        const token = extractAuthToken(response) ?? extractAuthToken(data);
        if (token) {
          await saveAccessToken(token);
          dispatch(resetGamesState());
          dispatch(fetchAllGames());
          dispatch(fetchUnlockedMiniGames());
          dispatch(fetchUser());
        }
        showToast({
          type: 'success',
          text1: 'Sign Up Successful',
          text2: 'You have successfully signed up!',
        });
        return response;
      }

      return rejectWithValue(extractErrorDetails(response, 'Registration failed'));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractErrorDetails(error.response.data, 'Registration failed'),
        );
      }
      return rejectWithValue({
        message: error.message || 'Registration failed',
        errors: {},
      });
    }
  },
);

export const completeProfile = createAsyncThunk(
  'auth/completeProfile',
  async (profileData: ProfileCompletionPayload, { rejectWithValue }) => {
    try {
      const response = await authServices.completeProfile(profileData);
      const data = response?.data ?? response;
      if (response && response.success !== false) {
        const token = extractAuthToken(response) ?? extractAuthToken(data);
        if (token) {
          await saveAccessToken(token);
        }
        return response;
      }

      return rejectWithValue(
        extractErrorDetails(response, 'Profile completion failed'),
      );
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractErrorDetails(error.response.data, 'Profile completion failed'),
        );
      }
      return rejectWithValue({
        message: error.message || 'Profile completion failed',
        errors: {},
      });
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await authServices.loginUser(credentials);
      const data = response?.data ?? response;
      const token = extractAuthToken(response) ?? extractAuthToken(data);

      if (
        response &&
        response.success !== false &&
        typeof token === 'string'
      ) {
        await saveAccessToken(token);
        dispatch(resetGamesState());
        dispatch(fetchAllGames());
        dispatch(fetchUnlockedMiniGames());
        dispatch(fetchUser());
        return response;
      }

      return rejectWithValue(
        extractErrorMessage(response, 'Invalid login response. Please try again.'),
      );
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractErrorMessage(error.response.data, 'Invalid credentials.'),
        );
      }
      return rejectWithValue(error.message || 'Login failed');
    }
  },
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authServices.forgotPassword({
        email,
      });
      if (response && response.success !== false) {
        return response;
      }

      return rejectWithValue(
        extractErrorMessage(response, 'Password reset failed'),
      );
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractErrorMessage(error.response.data, 'Password reset failed'),
        );
      }
      return rejectWithValue(error.message || 'Password reset failed');
    }
  },
);

export const validatePasswordCode = createAsyncThunk(
  'auth/validatePasswordCode',
  async (codeData: { email: string; token: string }, { rejectWithValue }) => {
    try {
      const response = await authServices.validatePasswordCode(codeData);
      return response;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractErrorMessage(error.response.data, 'Code validation failed'),
        );
      }
      return rejectWithValue(error.message || 'Code validation failed');
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    resetData: ResetPasswordPayload,
    { rejectWithValue },
  ) => {
    try {
      const response = await authServices.resetPassword(resetData);
      return response;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractErrorMessage(error.response.data, 'Password reset failed'),
        );
      }
      return rejectWithValue(error.message || 'Password reset failed');
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_: void, { rejectWithValue }) => {
    try {
      await authServices.logout();
      return true;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractErrorMessage(error.response.data, 'Logout failed'),
        );
      }
      return rejectWithValue(error.message || 'Logout failed');
    }
  },
);

// export const changePassword = createAsyncThunk(
//   'auth/changePassword',
//   async (
//     passwordData: {
//       old_password: string;
//       new_password: string;
//       confirm_new_password: string;
//     },
//     { rejectWithValue },
//   ) => {
//     try {
//       const response = await authServices.changePassword(passwordData);
//       return response.data;
//     } catch (error: any) {
//       if (axios.isAxiosError(error) && error.response) {
//         return rejectWithValue(
//           error.response.data.message[0] || 'Password change failed',
//         );
//       }
//       return rejectWithValue(error.message || 'Password change failed');
//     }
//   },
// );

// export const deleteAccount = createAsyncThunk(
//   'auth/deleteAccount',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await authServices.deleteAccount();
//       return response.data;
//     } catch (error: any) {
//       if (axios.isAxiosError(error) && error.response) {
//         const message = Array.isArray(error.response.data?.message)
//           ? error.response.data.message[0]
//           : error.response.data?.message;
//         return rejectWithValue(message || 'Account deletion failed');
//       }
//       return rejectWithValue(error.message || 'Account deletion failed');
//     }
//   },
// );

// export const appleLogin = createAsyncThunk(
//   'auth/appleLogin',
//   async (
//     payload: {
//       apple_token: string;
//       device_id: string;
//       token: string;
//     },
//     { rejectWithValue },
//   ) => {
//     try {
//       const response = await authServices.appleLogin(payload);
//       return response.data;
//     } catch (error: any) {
//       if (axios.isAxiosError(error) && error.response) {
//         return rejectWithValue(
//           error.response.data.message?.[0] || 'Apple login failed',
//         );
//       }
//       return rejectWithValue(error.message || 'Apple login failed');
//     }
//   },
// );

// export const googleLogin = createAsyncThunk(
//   'auth/googleLogin',
//   async (
//     payload: {
//       google_token: string;
//       device_id: string;
//       token: string;
//     },
//     { rejectWithValue },
//   ) => {
//     try {
//       const response = await authServices.googleLogin(payload);
//       return response.data;
//     } catch (error: any) {
//       if (axios.isAxiosError(error) && error.response) {
//         return rejectWithValue(
//           error.response.data.message?.[0] || 'Google login failed',
//         );
//       }
//       return rejectWithValue(error.message || 'Google login failed');
//     }
//   },
// );

export const socialLogin = createAsyncThunk(
  'auth/socialLogin',
  async (
    payload: {
      provider: string;
      id_token: string;
      fcm_token: string;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await authServices.socialLogin(payload);
      const data = response?.data ?? response;
      const token = extractAuthToken(response) ?? extractAuthToken(data);

      if (
        response &&
        response.success !== false &&
        typeof token === 'string'
      ) {
        await saveAccessToken(token);
        dispatch(resetGamesState());
        dispatch(fetchAllGames());
        dispatch(fetchUnlockedMiniGames());
        dispatch(fetchUser());
        return response;
      }

      return rejectWithValue(
        extractErrorMessage(response, 'Social login failed. Please try again.'),
      );
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          extractErrorMessage(error.response.data, 'Social login failed.'),
        );
      }
      return rejectWithValue(error.message || 'Social login failed');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearAuthSessionState(state);
    },
    clearError(state) {
      state.loading = false;
      state.error = null;
      state.forgotPasswordSuccess = false;
      state.resetPasswordSuccess = false;
      state.validateCodeSuccess = false;
      state.changePasswordSuccess = false;
      state.deleteAccountSuccess = false;
    },
    setProfileComplete: (state, action: PayloadAction<boolean>) => {
      state.isProfile = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    completeGuideVideo: state => {
      state.needsGuideVideo = false;
      state.isRegister = false;
    },
    resetChangePasswordState: state => {
      state.changePasswordSuccess = false;
      state.error = null;
      state.loading = false;
    },
    resetDeleteAccountState: state => {
      state.deleteAccountSuccess = false;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      // Register cases
      .addCase(registerUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<any>) => {
        const token = extractAuthToken(action.payload);
        const user = extractAuthUser(action.payload);

        state.loading = false;
        state.user = user;
        state.token = token;
        state.isRegister = true;
        state.isAuthenticated = Boolean(token);
        state.isProfile = hasCompletedProfile(user);
        state.needsGuideVideo = Boolean(token);
        state.userId = user?.id ?? user?.user_id ?? null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as ApiError | string | undefined;
        const message =
          typeof payload === 'string'
            ? payload
            : payload?.message || 'Registration failed';
        state.error = message;

        showToast({
          type: 'error',
          text1: 'Registration Failed',
          text2: message,
        });
      })

      // Login cases
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        const token = extractAuthToken(action.payload);
        const user = extractAuthUser(action.payload);

        state.loading = false;
        state.error = null;
        state.user = user;
        state.token = token;
        state.userId = user?.id ?? user?.user_id ?? null;
        state.isAuthenticated = Boolean(token);
        state.isProfile = hasCompletedProfile(user);
        state.needsGuideVideo = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Login failed';
      })

      // Forgot password cases
      // In your authSlice.ts
      .addCase(forgotPassword.pending, state => {
        state.loading = true;
        state.forgotPasswordSuccess = false;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, state => {
        state.loading = false;
        state.forgotPasswordSuccess = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.forgotPasswordSuccess = false;
        state.error = action.payload as string;
      })

      .addCase(validatePasswordCode.pending, state => {
        state.loading = true;
        state.validateCodeSuccess = false;
        state.error = null;
      })
      .addCase(validatePasswordCode.fulfilled, (state, action) => {
        state.loading = false;
        state.validateCodeSuccess = true;
        state.validatePasswordToken = action.payload?.data?.token ?? null;
        state.error = null;
      })
      .addCase(validatePasswordCode.rejected, (state, action) => {
        state.loading = false;
        state.validateCodeSuccess = false;
        state.error = action.payload as string;
      })

      .addCase(resetPassword.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, state => {
        state.loading = false;
        state.resetPasswordSuccess = true;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, state => {
        clearAuthSessionState(state);
      })
      .addCase(logoutUser.rejected, state => {
        // Always clear local session even if server logout fails.
        clearAuthSessionState(state);
      });

    // New change password cases
    // .addCase(changePassword.pending, state => {
    //   state.loading = true;
    //   state.changePasswordSuccess = false;
    //   state.error = null;
    // })
    // .addCase(changePassword.fulfilled, state => {
    //   state.loading = false;
    //   state.changePasswordSuccess = true;
    //   state.error = null;
    // })
    // .addCase(changePassword.rejected, (state, action) => {
    //   state.loading = false;
    //   state.changePasswordSuccess = false;
    //   state.error = action.payload as string;
    // });

    // Delete account cases
    //   .addCase(deleteAccount.pending, state => {
    //     state.loading = true;
    //     state.deleteAccountSuccess = false;
    //     state.error = null;
    //   })
    //   .addCase(deleteAccount.fulfilled, state => {
    //     state.loading = false;
    //     state.deleteAccountSuccess = true;
    //     state.user = null;
    //     state.token = null;
    //     state.isAuthenticated = false;
    //     state.isRegister = false;
    //     state.isProfile = false;
    //     state.validatePasswordToken = null;
    //     localStoreUtil.removeData('accessToken');
    //   })
    //   .addCase(deleteAccount.rejected, (state, action) => {
    //     state.loading = false;
    //     state.deleteAccountSuccess = false;
    //     state.error = action.payload as string;
    //   })

    //   // 🍎 Apple Login
    //   .addCase(appleLogin.pending, state => {
    //     state.loading = true;
    //     state.error = null;
    //   })
    //   .addCase(appleLogin.fulfilled, (state, action: PayloadAction<any>) => {
    //     state.loading = false;
    //     state.user = action.payload?.data?.user_details;
    //     state.token = action.payload?.data?.token;
    //     state.userId = action.payload?.data?.user_details?.id;
    //     state.isAuthenticated = true;
    //     saveAccessToken(action.payload.data.token);
    //   })
    //   .addCase(appleLogin.rejected, (state, action) => {
    //     state.loading = false;
    //     state.error = action.payload as string;
    //   })

    //   // 🔵 Google Login
    //   .addCase(googleLogin.pending, state => {
    //     state.loading = true;
    //     state.error = null;
    //   })
    //   .addCase(googleLogin.fulfilled, (state, action: PayloadAction<any>) => {
    //     state.loading = false;
    //     state.user = action.payload?.data?.user_details;
    //     state.token = action.payload?.data?.token;
    //     state.userId = action.payload?.data?.user_details?.id;
    //     state.isAuthenticated = true;
    //     saveAccessToken(action.payload.data.token);
    //   })
    //   .addCase(googleLogin.rejected, (state, action) => {
    //     state.loading = false;
    //     state.error = action.payload as string;
    //   });

    builder
      // 🍎 Social Login
      .addCase(socialLogin.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(socialLogin.fulfilled, (state, action: PayloadAction<any>) => {
        const token = extractAuthToken(action.payload);
        const user = extractAuthUser(action.payload);

        state.loading = false;
        state.error = null;
        state.user = user;
        state.token = token;
        state.userId = user?.id ?? user?.user_id ?? null;
        state.isAuthenticated = Boolean(token);
        state.isProfile = hasCompletedProfile(user);
        state.needsGuideVideo = Boolean(token) && !hasCompletedProfile(user);
      })
      .addCase(socialLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Social login failed';
      });

    builder
      .addCase(completeProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeProfile.fulfilled, (state, action: PayloadAction<any>) => {
        const token = extractAuthToken(action.payload);
        const user = extractAuthUser(action.payload);

        state.loading = false;
        state.error = null;
        state.user = user ?? state.user;
        state.token = token ?? state.token;
        state.userId = user?.id ?? user?.user_id ?? state.userId;
        state.isAuthenticated = Boolean(token ?? state.token);
        state.isProfile = true;
        state.needsGuideVideo = true;
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as ApiError | string | undefined;
        const message =
          typeof payload === 'string'
            ? payload
            : payload?.message || 'Profile completion failed';
        state.error = message;
      });
  },
});

export const {
  logout,
  clearError,
  setProfileComplete,
  setAuthenticated,
  completeGuideVideo,
  resetChangePasswordState,
  resetDeleteAccountState,
} = authSlice.actions;
export default authSlice.reducer;
