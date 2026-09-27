/** Years are signed integers: negative = BCE, positive = CE. */
export function formatYear(year: number, { circa = true } = {}): string {
  const label = year < 0 ? `${-year} BCE` : `${year} CE`;
  return circa && year < -664 ? `c. ${label}` : label;
}

export function formatRange(start: number, end: number): string {
  const circa = start < -664 ? 'c. ' : '';
  if (start < 0 && end < 0) return `${circa}${-start}–${-end} BCE`;
  return `${formatYear(start)} – ${formatYear(end, { circa: false })}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Turns an ISO 8601 duration (PT1H2M3S) into "1 h 2 min". */
export function formatDuration(iso?: string): string | undefined {
  const m = iso?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return undefined;
  const [, h, min] = m;
  return [h && `${h} h`, min && `${min} min`].filter(Boolean).join(' ') || '< 1 min';
}
