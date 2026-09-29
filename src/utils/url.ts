const URL_SCHEME_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;

export const normalizeWebUrl = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = URL_SCHEME_PATTERN.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue.replace(/^\/+/, '')}`;

  try {
    return new URL(normalizedValue).toString();
  } catch {
    return null;
  }
};

