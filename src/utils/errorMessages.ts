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

export const extractMessageFromPayload = (payload: unknown): string => {
  if (!payload) {
    return '';
  }

  if (typeof payload === 'string' && isMeaningfulString(payload)) {
    return payload.trim();
  }

  if (typeof payload !== 'object') {
    return '';
  }

  const data = payload as Record<string, unknown>;

  // Check validation errors first (e.g. { errors: { email: ["The selected email is invalid."] } })
  const errors = data.errors || (data.data as any)?.errors;
  if (errors && typeof errors === 'object') {
    const errorEntries = Object.values(errors);
    const flattened = errorEntries.flat().filter(isMeaningfulString);
    if (flattened.length > 0) {
      return flattened.join(' ');
    }
  }

  const friendly =
    data.user_friendly_message || (data.data as any)?.user_friendly_message;
  if (isMeaningfulString(friendly)) {
    return friendly.trim();
  }

  const message = data.message || (data.data as any)?.message;
  if (Array.isArray(message) && isMeaningfulString(message[0])) {
    return message[0].trim();
  }
  if (
    isMeaningfulString(message) &&
    !/^the given data was invalid\.?$/i.test(message.trim())
  ) {
    return message.trim();
  }

  const nestedError = data.error || (data.data as any)?.error;
  if (Array.isArray(nestedError) && isMeaningfulString(nestedError[0])) {
    return nestedError[0].trim();
  }
  if (isMeaningfulString(nestedError)) {
    return nestedError.trim();
  }

  if (isMeaningfulString(message)) {
    return message.trim();
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
  if (!error) {
    return fallback;
  }

  if (isMeaningfulString(error)) {
    const errMessage = error.trim();
    if (!isRawStatusMessage(errMessage)) {
      if (
        errMessage.toLowerCase().includes('network request failed') ||
        errMessage.toLowerCase().includes('network error')
      ) {
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
    errors?: Record<string, unknown>;
  };

  if (isMeaningfulString(axiosLikeError?.userMessage)) {
    return axiosLikeError.userMessage.trim();
  }

  // 1. Try extracting from response.data, data, or error object itself
  const payloadToInspect =
    axiosLikeError?.response?.data ??
    axiosLikeError?.data ??
    axiosLikeError;
  const responseMessage = extractMessageFromPayload(payloadToInspect);
  if (isMeaningfulString(responseMessage) && !isRawStatusMessage(responseMessage)) {
    return responseMessage;
  }

  // 2. Check direct message if not raw status code
  if (isMeaningfulString(axiosLikeError?.message)) {
    const message = axiosLikeError.message.trim();
    if (!isRawStatusMessage(message)) {
      return message;
    }
  }

  // 3. Check error field
  if (isMeaningfulString(axiosLikeError?.error)) {
    const errMessage = axiosLikeError.error.trim();
    if (!isRawStatusMessage(errMessage)) {
      if (errMessage.toLowerCase().includes('network request failed')) {
        return 'Network request failed. Please check your connection.';
      }
      return errMessage;
    }
  }

  const status = axiosLikeError?.response?.status ?? axiosLikeError?.status;
  const statusMessage = getStatusFriendlyMessage(status);

  return statusMessage || fallback;
};

