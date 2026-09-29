import { WebSound, soundAssets } from '../../utils/soundLoader';

class SoundManagerClass {
  private rewardSound: WebSound | null = null;
  private isLoaded = false;
  private isLoading = false;
  private readyPromise: Promise<boolean> | null = null;

  preloadRewardSound = async (): Promise<boolean> => {
    if (this.isLoaded && this.rewardSound) {
      return true;
    }

    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise<boolean>((resolve) => {
      this.isLoading = true;
      const sound = new WebSound(
        soundAssets.pointsIncreased || 'pointsIncreased',
        (loadedSound) => {
          this.rewardSound = loadedSound;
          this.isLoaded = true;
          this.isLoading = false;
          this.readyPromise = null;
          resolve(true);
        },
        () => {
          this.rewardSound = null;
          this.isLoaded = false;
          this.isLoading = false;
          this.readyPromise = null;
          resolve(false);
        }
      );
    });

    return this.readyPromise;
  };

  playRewardSound = async (): Promise<boolean> => {
    const isReady = await this.preloadRewardSound();
    const sound = this.rewardSound;
    if (!isReady || !sound) {
      return false;
    }

    sound.play();
    return true;
  };

  release = (): void => {
    this.rewardSound?.release();
    this.rewardSound = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.readyPromise = null;
  };
}

export const SoundManager = new SoundManagerClass();
export default SoundManager;
