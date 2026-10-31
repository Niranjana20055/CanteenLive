// Is the stall open right now?  Uses Indian Standard Time regardless of where the server runs.
export function isOpenNow(hours, now = new Date()) {
  if (!hours) return false;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  const today = hours[get('weekday').toLowerCase()]; // e.g. hours.monday = {open:"08:00", close:"20:00"}
  if (!today) return false;
  const time = `${get('hour')}:${get('minute')}`; // "13:05"
  return time >= today.open && time < today.close; // "HH:MM" strings compare correctly
}
