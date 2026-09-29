import { store } from '../../redux/Store';
import { fetchAllNotifications } from '../../redux/Slices/notificationsSlice';
import { showToast } from '../../components';

export const handleNotificationClick = (payload: any) => {
  console.log('Notification clicked:', payload);
  const screen = payload?.screen;
  if (screen) {
    window.location.href = `/${screen.toLowerCase()}`;
  } else {
    window.location.href = '/notifications';
  }
};

export const initializeNotifications = async () => {
  try {
    if ('Notification' in window && Notification.permission !== 'granted') {
      // Can request browser notification permission if desired
      // Notification.requestPermission();
    }
    return () => {};
  } catch (error) {
    console.warn('Browser notification init skipped:', error);
    return () => {};
  }
};
