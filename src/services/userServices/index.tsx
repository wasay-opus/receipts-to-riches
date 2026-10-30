import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';
import { getAccessToken } from '../../utils/localStoreUtil';

interface IUserData {
    [key: string]: any;
}

class UserServices {
    getUser = async (): Promise<IUserData> => {
        try {
            const response = await fetchApi({
                method: 'GET',
                endPoint: endPoints.GET_USER,
                data: undefined,
                params: undefined,
                token: true,
            });
            return response;
        } catch (error) {
            console.error('Get Users API error:', error);
            throw error;
        }
    };

    getUsers = async (): Promise<IUserData> => {
        return this.getUser();
    };

    getWallet = async (): Promise<IUserData> => {
        try {
            const response = await fetchApi({
                method: 'GET',
                endPoint: endPoints.GET_WALLET,
                data: undefined,
                params: undefined,
                token: true,
            });
            return response;
        } catch (error) {
            console.error('Get Wallet API error:', error);
            throw error;
        }
    };

    getUserById = async (id: string): Promise<IUserData> => {
        try {
            const response = await fetchApi({
                method: 'GET',
                endPoint: `${endPoints.GET_USER}/${id}`,
                data: undefined,
                params: undefined,
                token: true,
            });
            return response;
        } catch (error) {
            console.error('Get User By ID API error:', error);
            throw error;
        }
    };

    deleteUser = async (): Promise<IUserData> => {
        try {
            const response = await fetchApi({
                method: 'POST',
                endPoint: endPoints.DELETE_USER,
                data: undefined,
                params: undefined,
                token: true
            });
            return response;
        } catch (error) {
            console.error('Delete User API error:', error);
            throw error;
        }
    };

    updateUserProfile = async (data: IUserData): Promise<IUserData> => {
        try {
            const response = await fetchApi({
                method: 'POST',
                endPoint: endPoints.UPDATE_PROFILE,
                data,
                formData: true,
                params: undefined,
                token: true
            });
            return response;
        } catch (error) {
            console.error('Update User Profile API error:', error);
            throw error;
        }
    };

    editProfile = async (data: IUserData): Promise<IUserData> => {
        return this.updateUserProfile(data);
    };

    changePassword = async (data: IUserData): Promise<IUserData> => {
        try {
            // First attempt dedicated CHANGE_PASSWORD route
            const response = await fetchApi({
                method: 'POST',
                endPoint: endPoints.CHANGE_PASSWORD,
                data: {
                    current_password: data.current_password,
                    password: data.password,
                    password_confirmation: data.password_confirmation,
                },
                params: undefined,
                token: true,
            });
            if (response && response.success !== false) {
                return response;
            }
            throw new Error(response?.message || 'Change password failed');
        } catch (initialError) {
            // Fallback to UPDATE_PROFILE if dedicated route is not supported on backend
            try {
                const fallbackResponse = await fetchApi({
                    method: 'POST',
                    endPoint: endPoints.UPDATE_PROFILE,
                    data: {
                        password: data.password,
                        password_confirmation: data.password_confirmation,
                    },
                    formData: true,
                    params: undefined,
                    token: true,
                });
                return fallbackResponse;
            } catch (fallbackError) {
                console.error('Change Password API error:', fallbackError);
                throw initialError || fallbackError;
            }
        }
    };

    reviewReward = async (): Promise<IUserData> => {
        try {
            const response = await fetchApi({
                method: 'POST',
                endPoint: endPoints.REVIEW_REWARD,
                data: undefined,
                params: undefined,
                token: true,
            });
            return response;
        } catch (error: any) {
            const status = error?.response?.status;
            if (status !== 400 && status !== 409) {
                console.error('Review Reward API error:', error);
            }
            throw error;
        }
    };

    saveFcmToken = async (fcmToken: string): Promise<IUserData | null> => {
        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                if (__DEV__) {
                    console.log('[UserServices] Skipping saveFcmToken: User not authenticated');
                }
                return null;
            }

            console.log('[UserServices] saveFcmToken Request -> POST', endPoints.SAVE_FCM_TOKEN, { fcm_token: fcmToken });
            const response = await fetchApi({
                method: 'POST',
                endPoint: endPoints.SAVE_FCM_TOKEN,
                data: { fcm_token: fcmToken },
                params: undefined,
                token: true,
            });
            console.log('[UserServices] saveFcmToken Success -> status:', response?.status);
            return response;
        } catch (error) {
            console.error('Save FCM Token API error:', error);
            throw error;
        }
    };
}

const userServices = new UserServices();
export default userServices;
