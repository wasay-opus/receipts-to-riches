export type LeaderboardTab = 'regional' | 'national' | 'global';

export type RankTrend = 'up' | 'down' | 'same';

export type RatingColorVariant = 'pink' | 'blue';

export interface LeaderboardItemData {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  streak: number | string;
}

export interface PodiumUserData {
  id: string;
  rank: 1 | 2 | 3;
  name: string;
  avatar: string;
  streak: number | string;
  ringColor?: string;
  badgeColor?: string;
}

export interface LeaderboardDataset {
  topThree: PodiumUserData[];
  rankings: LeaderboardItemData[];
}
