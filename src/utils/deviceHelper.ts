export const requestUserPermission = async (): Promise<boolean> => {
  return true;
};

export const getFcmToken = async (): Promise<string> => {
  return 'web_fcm_token_' + Math.random().toString(36).substring(7);
};

export const getUniqueDeviceId = async (): Promise<string> => {
  let id = localStorage.getItem('device_unique_id');
  if (!id) {
    id = 'web_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_unique_id', id);
  }
  return id;
};
