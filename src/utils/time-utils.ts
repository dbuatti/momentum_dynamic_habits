import { format } from 'date-fns';

export const commonTimezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
];

export const timeOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

export const formatTimeDisplay = (totalSeconds: number) => {
  const roundedTotalSeconds = Math.round(totalSeconds); 
  const mins = Math.floor(roundedTotalSeconds / 60);
  const secs = roundedTotalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Returns the current date as a YYYY-MM-DD string, respecting the provided timezone.
 * Falls back to the browser's local timezone if none is provided.
 */
export const getTodayDateString = (timezone?: string | null) => {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch (e) {
    // Fallback to local time if timezone is invalid
    return format(new Date(), 'yyyy-MM-dd');
  }
};