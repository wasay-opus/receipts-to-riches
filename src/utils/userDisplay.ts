const toFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getUserRewardPoints = (user: any): number => {
  const wallet = user?.wallet ?? user?.wallet_data ?? user?.walletData ?? {};
  const candidates = [
    wallet?.total_points,
    wallet?.points,
    wallet?.reward_points,
    wallet?.total_reward_points,
    wallet?.wallet_points,
    wallet?.balance,
    wallet?.wallet_balance,
    wallet?.total,
    wallet?.current_points,
    user?.total_points,
    user?.points,
    user?.reward_points,
    user?.total_reward_points,
    user?.wallet_points,
    user?.balance,
    user?.wallet_balance,
  ];

  for (const candidate of candidates) {
    const points = toFiniteNumber(candidate);
    if (points !== null) return points;
  }

  return 0;
};

export const getUserFullName = (user: any): string => {
  const combined = [user?.first_name, user?.last_name]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .trim();
  if (combined) {
    return combined;
  }

  const directName = user?.name ?? user?.full_name ?? user?.fullName ?? user?.username;
  if (typeof directName === 'string' && directName.trim()) {
    return directName.trim();
  }

  return '';
};

export const splitFullName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');

  return {
    firstName,
    lastName,
  };
};

export const DEFAULT_COVER_URL =
  'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=1200&auto=format&fit=crop&q=80';

export const getApiOrigin = (): string => {
  const envUrl =
    (import.meta as any).env?.VITE_BASE_URL ||
    (import.meta as any).env?.BASE_URL ||
    'https://api.receiptstoriches.net';
  try {
    const parsed = new URL(envUrl);
    return parsed.origin;
  } catch {
    return 'https://api.receiptstoriches.net';
  }
};

export const resolveImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === '[object Object]'
  ) {
    return '';
  }
  // Base64 data URLs are always self-contained
  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }
  // Full web URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  // Blobs are only valid in memory; if they fail or expire, caller can fall back
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const origin = getApiOrigin();
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${cleanPath}`;
};

export const getUserAvatarUrl = (user: any): string => {
  const userId = user?.id || user?._id;
  const cached =
    (userId ? localStorage.getItem(`user_avatar_${userId}`) : null) ||
    localStorage.getItem('user_avatar') ||
    localStorage.getItem('user_avatar_me');

  const direct =
    user?.image_url ||
    user?.image ||
    user?.profile_image_url ||
    user?.profile_image ||
    user?.avatar_url ||
    user?.avatar;

  if (direct && typeof direct === 'string') {
    const resolved = resolveImageUrl(direct);
    if (resolved && !resolved.startsWith('blob:')) return resolved;
  }

  if (cached && typeof cached === 'string' && !cached.startsWith('blob:')) {
    const resolved = resolveImageUrl(cached);
    if (resolved) return resolved;
  }

  if (direct && typeof direct === 'string') {
    const resolved = resolveImageUrl(direct);
    if (resolved) return resolved;
  }

  return '';
};

export const getUserCoverUrl = (user: any): string => {
  const userId = user?.id || user?._id;
  const cached =
    (userId ? localStorage.getItem(`user_cover_${userId}`) : null) ||
    localStorage.getItem('user_cover') ||
    localStorage.getItem('user_cover_me');

  const direct =
    user?.cover_image_url ||
    user?.cover_image ||
    user?.cover_photo ||
    user?.cover ||
    user?.banner ||
    user?.banner_url;

  if (direct && typeof direct === 'string') {
    const resolved = resolveImageUrl(direct);
    if (resolved && !resolved.startsWith('blob:')) return resolved;
  }

  if (cached && typeof cached === 'string' && !cached.startsWith('blob:')) {
    const resolved = resolveImageUrl(cached);
    if (resolved) return resolved;
  }

  if (direct && typeof direct === 'string') {
    const resolved = resolveImageUrl(direct);
    if (resolved) return resolved;
  }

  return DEFAULT_COVER_URL;
};

