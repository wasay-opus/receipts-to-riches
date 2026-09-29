import { getUserFriendlyErrorMessage } from '../../../utils/errorMessages';

export const extractMessage = (responseData: any): string => {
  const message = responseData?.message;

  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  return 'No win this turn';
};

export const extractErrorMessage = (error: any): string => {
  return getUserFriendlyErrorMessage(
    error,
    'Unable to prepare Scratch 2 Win right now.',
  );
};

export const parseWonPoints = (payload: any): number | null => {
  const directPoints = Number(payload?.data?.points ?? payload?.points);
  if (Number.isFinite(directPoints) && directPoints >= 0) {
    return Math.floor(directPoints);
  }

  const message = extractMessage(payload);
  const matchedPoints = message.match(/(-?\d+)\s*points?/i);
  if (matchedPoints?.[1]) {
    const parsed = Number(matchedPoints[1]);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed);
    }
  }

  return null;
};

export const isWinningOutcome = (payload: any, message: string): boolean => {
  const parsedPoints = parseWonPoints(payload);
  if (parsedPoints !== null) {
    return parsedPoints > 0;
  }

  const normalized = message.trim().toLowerCase();
  if (normalized.includes('no win') || normalized.includes('better luck')) {
    return false;
  }

  return normalized.includes('won');
};
