export const extractPlayableSlots = (slots: any[] | undefined): number => {
  if (!Array.isArray(slots) || slots.length === 0) {
    return 3;
  }
  return slots.filter((slot) => {
    if (Number(slot?.is_open) === 1 || String(slot?.is_open).toLowerCase() === 'true') {
      return true;
    }
    if (slot?.blocked_until) {
      const blockedDate = new Date(slot.blocked_until).getTime();
      return !isNaN(blockedDate) && blockedDate <= Date.now();
    }
    return false;
  }).length;
};

export const getNextUnlockText = (slots: any[] | undefined): string => {
  if (!Array.isArray(slots) || slots.length === 0) return '';
  const futureDates = slots
    .map((s) => (s?.blocked_until ? new Date(s.blocked_until).getTime() : 0))
    .filter((time) => time > Date.now())
    .sort((a, b) => a - b);

  if (futureDates.length === 0) return '';
  const diffMs = futureDates[0] - Date.now();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `Next play in ${hours}h ${mins}m`;
  return `Next play in ${mins}m`;
};

export const parseWonPoints = (payload: any, fallback = 0): number => {
  const candidates = [
    payload?.points,
    payload?.won_points,
    payload?.reward_points,
    payload?.data?.points,
    payload?.data?.won_points,
    payload?.data?.reward_points,
    payload?.data?.wallet?.points,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  const message = String(payload?.message ?? payload?.data?.message ?? '');
  const matchedPoints = message.match(/(\d+)\s*(pts?|points?)/i);
  if (matchedPoints) {
    const parsed = Number(matchedPoints[1]);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return fallback;
};
