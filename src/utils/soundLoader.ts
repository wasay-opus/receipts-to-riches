import spinWheelAudio from '../assets/sounds/spinWheelSound.wav';
import scratchAudio from '../assets/sounds/scratching.mp3';
import spinWinAudio from '../assets/sounds/spinWin.mp3';
import coinsAudio from '../assets/sounds/coins.mp3';
import doneAudio from '../assets/sounds/Done.wav';
import failAudio from '../assets/sounds/failSound.mp3';
import pointsAudio from '../assets/sounds/pointsIncreased.wav';

export const soundAssets: Record<string, string> = {
  spinWheelSound: spinWheelAudio,
  spin_wheel_tick: spinWheelAudio,
  scratching: scratchAudio,
  scratch_sound: scratchAudio,
  spinWin: spinWinAudio,
  spin_win: spinWinAudio,
  coins: coinsAudio,
  Done: doneAudio,
  failSound: failAudio,
  pointsIncreased: pointsAudio,
};

export class WebSound {
  private audio: HTMLAudioElement | null = null;
  public duration: number = 0;

  constructor(src: string, onLoaded?: (sound: WebSound) => void, onFailed?: () => void) {
    const resolvedSrc = soundAssets[src] || soundAssets[src.replace(/\.(mp3|wav)$/i, '')] || src;
    try {
      this.audio = new Audio(resolvedSrc);
      this.audio.addEventListener('loadedmetadata', () => {
        this.duration = this.audio?.duration || 0;
        if (onLoaded) onLoaded(this);
      }, { once: true });
      this.audio.addEventListener('error', () => {
        if (onFailed) onFailed();
      }, { once: true });
      // In case metadata is cached immediately
      if (this.audio.readyState >= 1) {
        this.duration = this.audio.duration;
        if (onLoaded) onLoaded(this);
      }
    } catch {
      if (onFailed) onFailed();
    }
  }

  play(callback?: (success: boolean) => void) {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play()
        .then(() => { if (callback) callback(true); })
        .catch((e) => {
          console.warn('Audio play restricted or failed:', e);
          if (callback) callback(false);
        });
    } else {
      if (callback) callback(false);
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  release() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }

  setVolume(vol: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  setNumberOfLoops(loops: number) {
    if (this.audio) {
      this.audio.loop = loops === -1;
    }
  }
}

export const loadSoundFromCandidates = (
  candidates: string[],
  onLoaded: (sound: WebSound) => void,
  onFailed: () => void,
) => {
  if (!candidates || candidates.length === 0) {
    onFailed();
    return;
  }
  const soundName = candidates[0];
  const resolved = soundAssets[soundName] || soundAssets[soundName.replace(/\.(mp3|wav)$/i, '')] || soundName;
  const sound = new WebSound(resolved, onLoaded, onFailed);
};

export const loadSoundWithAssetFallback = (
  assetUri: string | undefined,
  candidates: string[],
  onLoaded: (sound: WebSound) => void,
  onFailed: () => void,
) => {
  const target = assetUri || candidates[0];
  const sound = new WebSound(target, onLoaded, onFailed);
};

export default WebSound;
