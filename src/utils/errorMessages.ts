const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'The request is invalid. Please review your input and try again.',
  401: 'Your session expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'Requested data was not found.',
  408: 'The request timed out. Please try again.',
  409: 'This action conflicts with existing data. Please try again.',
  413: 'Image is too large. Please upload a smaller image and try again.',
  422: 'Some required fields are invalid. Please review and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error occurred. Please try again in a moment.',
  502: 'Service is temporarily unavailable. Please try again shortly.',
  503: 'Service is currently unavailable. Please try again shortly.',
  504: 'The server took too long to respond. Please try again.',
};

const isMeaningfulString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isRawStatusMessage = (message: string): boolean =>
  /status code\s*\d{3}/i.test(message) ||
  /^request failed$/i.test(message.trim()) ||
  /^\d{3}$/.test(message.trim());

const extractMessageFromPayload = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const data = payload as Record<string, unknown>;
  const message = data.message;
  if (Array.isArray(message) && isMeaningfulString(message[0])) {
    return message[0].trim();
  }
  if (isMeaningfulString(message)) {
    return message.trim();
  }

  const nestedError = data.error;
  if (Array.isArray(nestedError) && isMeaningfulString(nestedError[0])) {
    return nestedError[0].trim();
  }
  if (isMeaningfulString(nestedError)) {
    return nestedError.trim();
  }

  const friendly = data.user_friendly_message;
  if (isMeaningfulString(friendly)) {
    return friendly.trim();
  }

  return '';
};

export const getStatusFriendlyMessage = (status?: number): string => {
  if (!status) {
    return '';
  }
  return HTTP_STATUS_MESSAGES[status] || '';
};

export const getUserFriendlyErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (isMeaningfulString(error)) {
    const errMessage = error.trim();
    if (!isRawStatusMessage(errMessage)) {
      if (errMessage.toLowerCase().includes('network request failed') || errMessage.toLowerCase().includes('network error')) {
        return 'Network request failed. Please check your connection.';
      }
      return errMessage;
    }
  }

  const axiosLikeError = error as {
    message?: string;
    response?: { status?: number; data?: unknown };
    data?: unknown;
    status?: number;
    userMessage?: string;
    error?: string;
  };

  if (isMeaningfulString(axiosLikeError?.userMessage)) {
    return axiosLikeError.userMessage.trim();
  }

  const status = axiosLikeError?.response?.status ?? axiosLikeError?.status;
  const statusMessage = getStatusFriendlyMessage(status);

  const responseMessage = extractMessageFromPayload(
    axiosLikeError?.response?.data ?? axiosLikeError?.data,
  );
  if (isMeaningfulString(responseMessage) && !isRawStatusMessage(responseMessage)) {
    return responseMessage;
  }

  if (isMeaningfulString(axiosLikeError?.message)) {
    const message = axiosLikeError.message.trim();
    if (!isRawStatusMessage(message)) {
      return message;
    }
  }

  if (isMeaningfulString(axiosLikeError?.error)) {
    const errMessage = axiosLikeError.error.trim();
    if (!isRawStatusMessage(errMessage)) {
      // Sometimes it returns "TypeError: Network request failed"
      if (errMessage.toLowerCase().includes('network request failed')) {
        return 'Network request failed. Please check your connection.';
      }
      return errMessage;
    }
  }

  return statusMessage || fallback;
};

