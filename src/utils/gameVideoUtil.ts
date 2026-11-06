import {
  cashGamesVideos,
  picPickGameVideos,
  statePickGameVideos,
  winPointsGameVideos,
} from '../config';

/**
 * Returns the relevant game guide / demo video URL based on the game's slug or name,
 * matching the videos from `/profile/rules`.
 * Default fallback is the generic English video if no specific video matches.
 */
export const getGameGuideVideoUrl = (
  gameSlugOrTitle?: string,
  isSpanish: boolean = false,
): string => {
  const normalized = String(gameSlugOrTitle || '').toLowerCase().trim();

  // 1. Mini Games (Win Points Games)
  if (normalized.includes('spin')) {
    const v = winPointsGameVideos.find((item) => item.id === 1);
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }
  if (normalized.includes('lucky') || normalized.includes('777')) {
    const v = winPointsGameVideos.find((item) => item.id === 2);
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }
  if (normalized.includes('scratch')) {
    const v = winPointsGameVideos.find((item) => item.id === 3);
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }

  // 2. Cash Games
  if (normalized.includes('zdt') || normalized.includes('zip')) {
    const v = cashGamesVideos.find((item) => item.id === 4);
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }
  if (normalized.includes('pick-3') || normalized === 'pick3' || normalized.includes('pick 3')) {
    const v = cashGamesVideos.find((item) => item.id === 2);
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }
  if (normalized.includes('pick-4') || normalized === 'pick4' || normalized.includes('pick 4')) {
    const v = cashGamesVideos.find((item) => item.id === 3);
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }
  if (normalized.includes('pick-5') || normalized === 'pick5' || normalized.includes('pick 5')) {
    const v = cashGamesVideos.find((item) => item.id === 1);
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }

  // 3. State Games
  if (normalized.includes('state')) {
    let index = 0;
    if (normalized.includes('4')) index = 1;
    else if (normalized.includes('5')) index = 2;
    const v = statePickGameVideos[index] || statePickGameVideos[0];
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }

  // 4. Pic-Pick Games
  if (normalized.includes('pic-pick') || normalized.includes('picpick') || normalized.includes('pic pick')) {
    let index = 0;
    if (normalized.includes('4')) index = 1;
    else if (normalized.includes('5')) index = 2;
    const v = picPickGameVideos[index] || picPickGameVideos[0];
    if (v) return isSpanish && v.videoUrl_es ? v.videoUrl_es : v.videoUrl;
  }

  // Fallback default English MP4 ad
  return 'https://api.receiptstoriches.net/images/game-guide/video-folder/IMG_6536.mp4';
};

