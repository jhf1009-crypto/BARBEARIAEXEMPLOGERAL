export const TZ = 'America/Bahia';
export const dayKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
export const localDate = (day: string, minute = 0) =>
  new Date(
    `${day}T${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00-03:00`,
  );
export function overlaps(a: Date, b: Date, c: Date, d: Date) {
  return a < d && b > c;
}
export function candidates(day: string, duration: number, schedule: string, step = 15) {
  const weekday = new Date(`${day}T12:00:00-03:00`).getUTCDay();
  const ranges = (JSON.parse(schedule) as Record<string, number[][]>)[weekday] ?? [];
  return ranges.flatMap(([start, end]) =>
    Array.from({ length: Math.max(0, Math.floor((end - start - duration) / step) + 1) }, (_, i) =>
      localDate(day, start + i * step),
    ),
  );
}
export function reservedMinutes(start: Date, end: Date) {
  const result: Date[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += 60000) result.push(new Date(t));
  return result;
}
