const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const delta = Math.max(0, now - then);

  if (delta < MINUTE) return "Just now";
  if (delta < HOUR) {
    const minutes = Math.floor(delta / MINUTE);
    return `${minutes}m ago`;
  }
  if (delta < DAY) {
    const hours = Math.floor(delta / HOUR);
    return `${hours}h ago`;
  }
  if (delta < 7 * DAY) {
    const days = Math.floor(delta / DAY);
    return days === 1 ? "Yesterday" : `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(then);
}

export function formatLockedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}
