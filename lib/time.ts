export function formatRelativeTime(dateIso: string, nowMs: number): string {
  const thenMs = new Date(dateIso).getTime();
  const diffMinutes = Math.max(0, Math.round((nowMs - thenMs) / 60000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  return diffHours === 1 ? '1 hr ago' : `${diffHours} hrs ago`;
}
