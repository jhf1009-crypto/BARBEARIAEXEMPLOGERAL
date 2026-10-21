import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidates, overlaps, reservedMinutes, localDate } from '../src/lib/schedule';
test('duration and lunch break exclude invalid starts', () => {
  const slots = candidates(
    '2026-10-26',
    45,
    JSON.stringify({
      1: [
        [540, 720],
        [780, 1020],
      ],
    }),
    15,
  );
  assert.equal(slots[0].toISOString(), '2026-10-26T12:00:00.000Z');
  assert.ok(!slots.some((d) => d.getUTCHours() === 15));
  assert.equal(slots.at(-1)?.toISOString(), '2026-10-26T19:15:00.000Z');
});
test('closed weekday returns no slots', () =>
  assert.equal(candidates('2026-10-25', 30, '{"1":[[540,720]]}').length, 0));
test('overlap uses half-open intervals', () => {
  const a = localDate('2026-10-26', 540),
    b = localDate('2026-10-26', 570),
    c = localDate('2026-10-26', 600);
  assert.equal(overlaps(a, b, b, c), false);
  assert.equal(overlaps(a, c, b, c), true);
});
test('reservations cover every minute and exclude exact end', () => {
  const a = localDate('2026-10-26', 540),
    b = localDate('2026-10-26', 580);
  const r = reservedMinutes(a, b);
  assert.equal(r.length, 40);
  assert.equal(r.at(-1)?.getTime(), b.getTime() - 60000);
});
