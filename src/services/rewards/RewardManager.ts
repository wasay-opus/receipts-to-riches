import { CoinRainController } from './CoinRainController';
import { SoundManager } from './SoundManager';
import {
  RewardExecutionOptions,
  RewardExecutionResult,
  RewardManagerDependencies,
  RewardToastPayload,
} from './types';

const DEFAULT_TOAST_DURATION_MS = 2200;

class RewardManagerClass {
  private dependencies: RewardManagerDependencies | null = null;
  private activeRewardKeys = new Set<string>();

  configure = (dependencies: RewardManagerDependencies): void => {
    this.dependencies = dependencies;
  };

  reset = (): void => {
    this.dependencies = null;
    this.activeRewardKeys.clear();
  };

  showRewardToast = (payload: RewardToastPayload): void => {
    if (!this.dependencies) {
      console.warn('[RewardManager] Dependencies not configured');
      return;
    }

    this.dependencies.showToast({
      type: 'success',
      text1: payload.text1 || 'Reward Earned!',
      text2: payload.text2,
      visibilityTime: payload.visibilityTime ?? DEFAULT_TOAST_DURATION_MS,
    });
  };

  triggerCoinRain = (): void => {
    CoinRainController.start();
  };

  playRewardSound = async (): Promise<boolean> => {
    return SoundManager.playRewardSound();
  };

  executeReward = async (
    options: RewardExecutionOptions,
  ): Promise<RewardExecutionResult> => {
    const {
      rewardKey,
      toastTitle,
      toastMessage,
      toastVisibilityTime,
      refreshWallet = true,
      refreshUserProfile = false,
      refreshUnlockedMiniGames = false,
    } = options;

    if (rewardKey && this.activeRewardKeys.has(rewardKey)) {
      return { executed: false, reason: 'duplicate', rewardKey };
    }

    if (rewardKey) {
      this.activeRewardKeys.add(rewardKey);
    }

    this.triggerCoinRain();
    this.playRewardSound().catch(() => {});

    if (toastTitle) {
      this.showRewardToast({
        type: 'success',
        text1: toastTitle,
        text2: toastMessage,
        visibilityTime: toastVisibilityTime,
      });
    }

    const syncTasks: Promise<unknown>[] = [];

    if (refreshWallet && this.dependencies?.refreshWallet) {
      syncTasks.push(Promise.resolve(this.dependencies.refreshWallet()));
    }

    if (refreshUserProfile && this.dependencies?.refreshUserProfile) {
      syncTasks.push(Promise.resolve(this.dependencies.refreshUserProfile()));
    }

    if (refreshUnlockedMiniGames && this.dependencies?.refreshUnlockedMiniGames) {
      syncTasks.push(
        Promise.resolve(this.dependencies.refreshUnlockedMiniGames()),
      );
    }

    await Promise.allSettled(syncTasks);

    return {
      executed: true,
      rewardKey,
    };
  };
}

export const RewardManager = new RewardManagerClass();
export default RewardManager;
