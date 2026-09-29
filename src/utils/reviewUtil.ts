import localStoreUtil from './localStoreUtil';

const REVIEW_COUNT_KEY = 'gamePlayCountForReview';
const HAS_REVIEWED_KEY = 'hasReviewedApp';

export const handleGamePlayedForReview = async (): Promise<boolean> => {
  return false;
};

export const submitAppReview = async (): Promise<{ success: boolean; message?: string } | false> => {
  try {
    await localStoreUtil.storeData(HAS_REVIEWED_KEY, true);
    return {
      success: true,
      message: 'Thank you for your review!',
    };
  } catch {
    return false;
  }
};

export const markAppAsReviewed = async (): Promise<void> => {
  await localStoreUtil.storeData(HAS_REVIEWED_KEY, true);
};

export const resetReviewState = async (): Promise<void> => {
  await localStoreUtil.storeData(REVIEW_COUNT_KEY, 0);
  await localStoreUtil.storeData(HAS_REVIEWED_KEY, false);
};