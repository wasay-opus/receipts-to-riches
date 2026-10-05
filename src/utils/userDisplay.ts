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

export const getUserAvatarUrl = (user: any): string => {
  return (
    user?.image_url ||
    user?.image ||
    user?.profile_image_url ||
    user?.profile_image ||
    user?.avatar_url ||
    user?.avatar ||
    ''
  );
};

