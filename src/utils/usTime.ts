const DEFAULT_US_TIME_ZONE = 'America/New_York';

const pad = (value: number | string) => String(value).padStart(2, '0');

export const getUSDateParts = (date = new Date(), timeZone = DEFAULT_US_TIME_ZONE) => {
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
  const sign = offsetMatch?.[1] ?? '-';
  const hours = pad(offsetMatch?.[2] ?? '05');
  const minutes = pad(offsetMatch?.[3] ?? '00');

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
    offset: `${sign}${hours}:${minutes}`,
  };
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

