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