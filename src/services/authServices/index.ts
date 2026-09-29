import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

interface IApiResponse {
  [key: string]: any;
}

interface IAuthData {
  [key: string]: any;
}

interface ISocialLoginData {
  provider: string;
  id_token: string;
  fcm_token: string;
}

class AuthServices {
  register = async (data: IAuthData): Promise<IApiResponse> => {
    const response = await fetchApi({
      method: 'POST',
      endPoint: endPoints.SIGN_UP,
      data,
      params: undefined,
      token: false,
    });
    return response;
  };

  completeProfile = async (data: IAuthData): Promise<IApiResponse> => {
    const response = await fetchApi({
      method: 'POST',
      endPoint: endPoints.COMPLETE_PROFILE,
      data,
      params: undefined,
      token: true,
    });
    return response;
  };

  loginUser = async (data: IAuthData): Promise<IApiResponse> => {
    try {
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.LOGIN,
        data,
        params: undefined,
      });
      if (__DEV__) {
        console.log('API response:', response);
      }
      return response;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  logout = async (): Promise<IApiResponse> => {
    try {
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.LOGOUT,
        data: undefined,
        params: undefined,
        formData: undefined,
        token: true,
      });
      if (__DEV__) {
        console.log('Logout API response:', response);
      }
      return response;
    } catch (error) {
      console.error('Logout API error:', error);
      throw error;
    }
  };

  socialLogin = async (data: ISocialLoginData): Promise<IApiResponse> => {
    try {
      if (__DEV__) {
        console.log('[AuthAPI] Request -> POST', endPoints.SOCIAL_LOGIN, {
          provider: data.provider,
        });
      }
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.SOCIAL_LOGIN,
        data,
        params: undefined,
        formData: undefined,
      });
      if (__DEV__) {
        console.log('[AuthAPI] Success -> POST auth/social/login', {
          status: response?.status,
          success: response?.data?.success,
        });
      }
      return response;
    } catch (error) {
      console.error('Social login API error:', error);
      throw error;
    }
  };

  forgotPassword = async (data: IAuthData): Promise<IApiResponse> => {
    const response = await fetchApi({
      method: 'POST',
      endPoint: endPoints.FORGOT_PASSWORD,
      data,
      params: undefined,
      formData: undefined,
    });
    return response;
  };

  validatePasswordCode = async (data: IAuthData): Promise<IApiResponse> => {
    const response = await fetchApi({
      method: 'POST',
      endPoint: endPoints.VALIDATE_PASSWORD_CODE,
      data,
      params: undefined,
      formData: undefined,
    });
    return response;
  };

  resetPassword = async (data: IAuthData): Promise<IApiResponse> => {
    const response = await fetchApi({
      method: 'POST',
      endPoint: endPoints.RESET_PASSWORD,
      data,
      params: undefined,
      formData: undefined,
    });
    return response;
  };

  verifyOtp = async (data: { phone: string; otp: string }): Promise<IApiResponse> => {
    const response = await fetchApi({
      method: 'POST',
      endPoint: endPoints.VERIFY_OTP,
      data,
      params: undefined,
      formData: undefined,
    });
    return response;
  };

  resendOtp = async (data: { phone: string }): Promise<IApiResponse> => {
    const response = await fetchApi({
      method: 'POST',
      endPoint: endPoints.RESEND_OTP,
      data,
      params: undefined,
      formData: undefined,
    });
    return response;
  };
}

const authServices = new AuthServices();
export default authServices;
