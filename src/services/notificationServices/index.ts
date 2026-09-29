import endPoints from '../../redux/constants/endPoints';
import { fetchApi } from '../../utils/helper';

interface IApiResponse {
  [key: string]: any;
}

class NotificationCenterServices {
  getAllNotifications = async (): Promise<IApiResponse> => {
    try {
      console.log('[NotificationAPI] Request -> GET', endPoints.GET_NOTIFICATIONS);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.GET_NOTIFICATIONS,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[NotificationAPI] Success -> GET notifications', {
        status: response?.status,
        count: Array.isArray(response?.data?.data?.data)
          ? response.data.data.data.length
          : Array.isArray(response?.data?.data)
          ? response.data.data.length
          : 0,
      });
      return response;
    } catch (error) {
      console.error('[NotificationAPI] Error -> GET notifications', error);
      throw error;
    }
  };

  getUnreadNotifications = async (): Promise<IApiResponse> => {
    try {
      console.log('[NotificationAPI] Request -> GET', endPoints.GET_UNREAD_NOTIFICATIONS);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.GET_UNREAD_NOTIFICATIONS,
        data: undefined,
        params: undefined,
        token: true,
      });
      return response;
    } catch (error) {
      console.error('[NotificationAPI] Error -> GET notifications/unread', error);
      throw error;
    }
  };

  getUnreadCount = async (): Promise<IApiResponse> => {
    try {
      console.log('[NotificationAPI] Request -> GET', endPoints.GET_UNREAD_NOTIFICATIONS_COUNT);
      const response = await fetchApi({
        method: 'GET',
        endPoint: endPoints.GET_UNREAD_NOTIFICATIONS_COUNT,
        data: undefined,
        params: undefined,
        token: true,
      });
      return response;
    } catch (error) {
      console.error('[NotificationAPI] Error -> GET notifications/unread-count', error);
      throw error;
    }
  };

  markAsRead = async (notificationId: string | number): Promise<IApiResponse> => {
    try {
      const endPoint = endPoints.MARK_READ(notificationId);
      console.log('[NotificationAPI] Request -> POST', endPoint);
      const response = await fetchApi({
        method: 'POST',
        endPoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[NotificationAPI] Success -> POST notification read', {
        status: response?.status,
        success: response?.data?.success,
        message: response?.data?.message,
        notificationId,
      });
      return response;
    } catch (error) {
      console.error('[NotificationAPI] Error -> POST notification read', error);
      throw error;
    }
  };

  markAllAsRead = async (): Promise<IApiResponse> => {
    try {
      console.log('[NotificationAPI] Request -> POST', endPoints.MARK_ALL_AS_READ);
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.MARK_ALL_AS_READ,
        data: undefined,
        params: undefined,
        token: true,
      });
      console.log('[NotificationAPI] Success -> POST notifications/mark-all-read', {
        status: response?.status,
        success: response?.data?.success,
        message: response?.data?.message,
      });
      return response;
    } catch (error) {
      console.error('[NotificationAPI] Error -> POST notifications/mark-all-read', error);
      throw error;
    }
  };

  deleteNotification = async (notificationId: string | number): Promise<IApiResponse> => {
    try {
      const endPoint = endPoints.DELETE_NOTIFICATION(notificationId);
      console.log('[NotificationAPI] Request -> DELETE', endPoint);
      const response = await fetchApi({
        method: 'DELETE',
        endPoint,
        data: undefined,
        params: undefined,
        token: true,
      });
      return response;
    } catch (error) {
      console.error('[NotificationAPI] Error -> DELETE notification', error);
      throw error;
    }
  };

  clearAll = async (): Promise<IApiResponse> => {
    try {
      console.log('[NotificationAPI] Request -> POST', endPoints.CLEAR_ALL_NOTIFICATIONS);
      const response = await fetchApi({
        method: 'POST',
        endPoint: endPoints.CLEAR_ALL_NOTIFICATIONS,
        data: undefined,
        params: undefined,
        token: true,
      });
      return response;
    } catch (error) {
      console.error('[NotificationAPI] Error -> POST notifications/clear-all', error);
      throw error;
    }
  };
}

const notificationCenterServices = new NotificationCenterServices();
export default notificationCenterServices;
