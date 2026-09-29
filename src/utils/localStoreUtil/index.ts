interface LocalStoreUtil {
  storeData: <T>(key: string, data: T) => Promise<boolean>;
  getData: <T>(key: string) => Promise<T | undefined>;
  removeData: (key: string) => Promise<boolean>;
  removeAll: () => Promise<boolean>;
}

const localStoreUtil: LocalStoreUtil = {
  storeData: async <T>(key: string, data: T) => {
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  getData: async <T>(key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item || item === undefined || item === 'undefined' || item === 'null') return undefined;
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch {
      return undefined;
    }
  },

  removeData: async (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  removeAll: async () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

export const saveAccessToken = (accessToken: string): Promise<boolean> =>
  localStoreUtil.storeData('accessToken', accessToken);

export const getAccessToken = (): Promise<string | undefined> =>
  localStoreUtil.getData<string>('accessToken');

export const saveUser = <T>(user: T): Promise<boolean> =>
  localStoreUtil.storeData('user', user);

export const getUser = <T>(): Promise<T | undefined> =>
  localStoreUtil.getData<T>('user');

export interface RememberedSignInState {
  enabled: boolean;
  email: string;
}

const REMEMBERED_SIGN_IN_KEY = 'rememberedSignIn';

export const saveRememberedSignIn = (
  value: RememberedSignInState,
): Promise<boolean> => localStoreUtil.storeData(REMEMBERED_SIGN_IN_KEY, value);

export const getRememberedSignIn = (): Promise<
  RememberedSignInState | undefined
> => localStoreUtil.getData<RememberedSignInState>(REMEMBERED_SIGN_IN_KEY);

export const clearRememberedSignIn = (): Promise<boolean> =>
  localStoreUtil.removeData(REMEMBERED_SIGN_IN_KEY);

export default localStoreUtil;
