const DEFAULT_US_TIME_ZONE = 'America/New_York';

const pad = (value: number | string) => String(value).padStart(2, '0');

const getUSEasternOffsetHours = (d = new Date()) => {
  const year = d.getUTCFullYear();
  const marchFirst = new Date(Date.UTC(year, 2, 1));
  const secondSundayMarch = 1 + ((7 - marchFirst.getUTCDay()) % 7) + 7;
  const dstStart = new Date(Date.UTC(year, 2, secondSundayMarch, 7)); // 2am EST = 7am UTC

  const novFirst = new Date(Date.UTC(year, 10, 1));
  const firstSundayNov = 1 + ((7 - novFirst.getUTCDay()) % 7);
  const dstEnd = new Date(Date.UTC(year, 10, firstSundayNov, 6)); // 2am EDT = 6am UTC

  return d >= dstStart && d < dstEnd ? 4 : 5;
};

export const getUSDateParts = (date = new Date(), timeZone = DEFAULT_US_TIME_ZONE) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'shortOffset',
    });

    const parts = formatter.formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';

    const offsetName = value('timeZoneName');
    const offsetMatch = offsetName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
    let sign = offsetMatch?.[1] ?? '-';
    let hours = pad(offsetMatch?.[2] ?? '04');
    let minutes = pad(offsetMatch?.[3] ?? '00');

    // US timezones are strictly negative (e.g. UTC-4 to UTC-10).
    // If a mobile browser leaks positive sign (+) from local device (like Pakistan GMT+5),
    // force valid US Eastern offset and UTC-computed parts.
    if (sign === '+' || !value('year')) {
      const offsetH = getUSEasternOffsetHours(date);
      const usEpoch = new Date(date.getTime() - offsetH * 60 * 60 * 1000);
      return {
        year: String(usEpoch.getUTCFullYear()),
        month: pad(usEpoch.getUTCMonth() + 1),
        day: pad(usEpoch.getUTCDate()),
        hour: pad(usEpoch.getUTCHours()),
        minute: pad(usEpoch.getUTCMinutes()),
        second: pad(usEpoch.getUTCSeconds()),
        offset: `-${pad(offsetH)}:00`,
      };
    }

    return {
      year: value('year'),
      month: value('month'),
      day: value('day'),
      hour: value('hour'),
      minute: value('minute'),
      second: value('second'),
      offset: `${sign}${hours}:${minutes}`,
    };
  } catch {
    const offsetH = getUSEasternOffsetHours(date);
    const usEpoch = new Date(date.getTime() - offsetH * 60 * 60 * 1000);
    return {
      year: String(usEpoch.getUTCFullYear()),
      month: pad(usEpoch.getUTCMonth() + 1),
      day: pad(usEpoch.getUTCDate()),
      hour: pad(usEpoch.getUTCHours()),
      minute: pad(usEpoch.getUTCMinutes()),
      second: pad(usEpoch.getUTCSeconds()),
      offset: `-${pad(offsetH)}:00`,
    };
  }
};

export const getLocalTimeWithOffset = (date = new Date()) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const offsetMins = pad(Math.abs(offsetMinutes) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
};

export const getUSTimeWithOffset = (date = new Date()) => {
  const usDate = getUSDateParts(date);
  return `${usDate.year}-${usDate.month}-${usDate.day}T${usDate.hour}:${usDate.minute}:${usDate.second}${usDate.offset}`;
};


export const getUSTimeHHMM = (date = new Date()) => {
  const usDate = getUSDateParts(date);
  return `${usDate.hour}:${usDate.minute}`;
};

export const getUSDateYYYYMMDD = (date = new Date()) => {
  const usDate = getUSDateParts(date);
  return `${usDate.year}-${usDate.month}-${usDate.day}`;
};

export const isMiddayOpenInUSTime = (timeStr?: string): boolean => {
  if (timeStr) {
    const match = String(timeStr).match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const hour = parseInt(match[1], 10);
      const min = parseInt(match[2], 10);
      return hour < 12 || (hour === 12 && min === 0);
    }
  }
  const usDate = getUSDateParts();
  const hour = parseInt(usDate.hour, 10);
  const min = parseInt(usDate.minute, 10);
  return hour < 12 || (hour === 12 && min === 0);
};

export const UNSUPPORTED_TIMEZONE_MESSAGE =
  "Your device's timezone is not supported. Please set it to a valid US timezone to play.";

export const isDeviceInUSTimezone = (): boolean => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const offset = new Date().getTimezoneOffset();
    // US offsets in JS: UTC-4 is 240, UTC-10 is 600, UTC-11 is 660.
    const isUSOffset = offset >= 240 && offset <= 660;
    const isUSName =
      tz.startsWith('America/') ||
      tz.startsWith('US/') ||
      tz === 'Pacific/Honolulu' ||
      tz === 'Pacific/Pago_Pago';

    return isUSOffset && isUSName;
  } catch {
    return false;
  }
};

