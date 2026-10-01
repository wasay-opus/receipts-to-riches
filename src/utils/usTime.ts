const DEFAULT_US_TIME_ZONE = 'America/New_York';

const pad = (value: number | string) => String(value).padStart(2, '0');

const getUSDateParts = (date = new Date(), timeZone = DEFAULT_US_TIME_ZONE) => {
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

