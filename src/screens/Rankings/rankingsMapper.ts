import { LeaderboardDataset, LeaderboardItemData, PodiumUserData } from './types';

export interface ApiStreakLeaderboardUser {
  id: number | string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image?: string | null;
  image_url?: string | null;
  play_streak_count?: number | null;
  cover_image_url?: string | null;
  description?: string | null;
  [key: string]: any;
}

export const mapApiStreakLeaderboardToDataset = (
  rawUsers?: ApiStreakLeaderboardUser[],
): LeaderboardDataset => {
  if (!Array.isArray(rawUsers) || rawUsers.length === 0) {
    return {
      topThree: [],
      rankings: [],
    };
  }

  // 1. Sort by streak descending (highest streak first)
  const sorted = [...rawUsers].sort(
    (a, b) =>
      Number(
        b.play_streak_count ??
          b.streak_count ??
          b.current_streak ??
          b.streak ??
          b.points ??
          b.total_points ??
          0,
      ) -
      Number(
        a.play_streak_count ??
          a.streak_count ??
          a.current_streak ??
          a.streak ??
          a.points ??
          a.total_points ??
          0,
      ),
  );

  const topThree: PodiumUserData[] = [];
  const rankings: LeaderboardItemData[] = [];

  sorted.forEach((user, index) => {
    const rank = index + 1;
    const firstName = user.first_name?.trim?.() ?? '';
    const lastName = user.last_name?.trim?.() ?? '';
    const name =
      `${firstName} ${lastName}`.trim() ||
      user.username ||
      user.name ||
      'Player';
    const streakCount = Number(
      user.play_streak_count ??
        user.streak_count ??
        user.current_streak ??
        user.streak ??
        user.points ??
        user.total_points ??
        0,
    );
    const label =
      user.points !== undefined || user.total_points !== undefined
        ? `${streakCount.toLocaleString()} PTS`
        : `${streakCount} ${streakCount === 1 ? 'Day' : 'Days'}`;
    const streak = label;
    const avatar =
      user.image_url || user.profile_image_url || user.avatar || user.image || '';

    if (rank === 1) {
      topThree.push({
        id: String(user.id),
        rank: 1,
        name,
        avatar,
        streak,
        ringColor: 'var(--text-main)',
        badgeColor: 'var(--text-main)',
      });
    } else if (rank === 2) {
      topThree.push({
        id: String(user.id),
        rank: 2,
        name,
        avatar,
        streak,
        ringColor: 'var(--text-muted)',
        badgeColor: 'var(--text-muted)',
      });
    } else if (rank === 3) {
      topThree.push({
        id: String(user.id),
        rank: 3,
        name,
        avatar,
        streak,
        ringColor: 'var(--border-color)',
        badgeColor: 'var(--border-color)',
      });
    } else {
      rankings.push({
        id: String(user.id),
        rank,
        name,
        avatar,
        streak,
      });
    }
  });

  return {
    topThree,
    rankings,
  };
};
