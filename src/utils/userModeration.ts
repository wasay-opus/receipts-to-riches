const REPORTED_USERS_KEY = 'r2r_reported_users';
const REPORTED_POSTS_KEY = 'r2r_reported_posts';

export const isUserReported = (userId: string | number): boolean => {
  if (!userId) return false;
  try {
    const raw = localStorage.getItem(REPORTED_USERS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return arr.includes(String(userId));
  } catch {
    return false;
  }
};

export const markUserReported = (userId: string | number): void => {
  if (!userId) return;
  try {
    const raw = localStorage.getItem(REPORTED_USERS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(String(userId))) {
      arr.push(String(userId));
      localStorage.setItem(REPORTED_USERS_KEY, JSON.stringify(arr));
    }
  } catch {}
};

export const clearUserReported = (userId: string | number): void => {
  if (!userId) return;
  try {
    const raw = localStorage.getItem(REPORTED_USERS_KEY);
    let arr: string[] = raw ? JSON.parse(raw) : [];
    arr = arr.filter((id) => id !== String(userId));
    localStorage.setItem(REPORTED_USERS_KEY, JSON.stringify(arr));
  } catch {}
};

export const isPostReported = (postId: string | number): boolean => {
  if (!postId) return false;
  try {
    const raw = localStorage.getItem(REPORTED_POSTS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return arr.includes(String(postId));
  } catch {
    return false;
  }
};

export const markPostReported = (postId: string | number): void => {
  if (!postId) return;
  try {
    const raw = localStorage.getItem(REPORTED_POSTS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(String(postId))) {
      arr.push(String(postId));
      localStorage.setItem(REPORTED_POSTS_KEY, JSON.stringify(arr));
    }
  } catch {}
};

