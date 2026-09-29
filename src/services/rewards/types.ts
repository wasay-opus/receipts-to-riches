export interface RewardToastPayload {
  type: 'success' | 'error' | 'info';
  text1: string;
  text2?: string;
  visibilityTime?: number;
  autoHide?: boolean;
}

export interface RewardExecutionOptions {
  rewardKey?: string;
  toastTitle: string;
  toastMessage?: string;
  toastVisibilityTime?: number;
  refreshWallet?: boolean;
  refreshUserProfile?: boolean;
  refreshUnlockedMiniGames?: boolean;
  analyticsEventName?: string;
  analyticsPayload?: Record<string, unknown>;
}

export interface RewardManagerDependencies {
  showToast: (payload: RewardToastPayload) => void;
  refreshWallet?: () => Promise<unknown> | unknown;
  refreshUserProfile?: () => Promise<unknown> | unknown;
  refreshUnlockedMiniGames?: () => Promise<unknown> | unknown;
  logAnalytics?: (eventName: string, payload: Record<string, unknown>) => void;
}

export interface RewardExecutionResult {
  executed: boolean;
  reason?: 'duplicate' | 'queued' | 'unconfigured';
  rewardKey?: string;
}
