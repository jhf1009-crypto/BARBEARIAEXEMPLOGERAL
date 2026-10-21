import { db } from './db';
import { dayKey, localDate, overlaps } from './schedule';
export async function dashboardStats(barberId?: string) {
  const today = dayKey(new Date()),
    now = localDate(today),
    tomorrow = new Date(now.getTime() + 86400000);
  const weekday = new Date(`${today}T12:00:00-03:00`).getUTCDay();
  const week = new Date(now.getTime() - ((weekday + 6) % 7) * 86400000);
  const month = localDate(today.slice(0, 7) + '-01');
  const scope = barberId ? { barberId } : {};
  const sums = await Promise.all(
    [now, week, month].map((start) =>
      db.appointment.aggregate({
        where: { ...scope, status: 'COMPLETED', startsAt: { gte: start, lt: tomorrow } },
        _sum: { total: true },
      }),
    ),
  );
  const [barbers, appointments, blocks] = await Promise.all([
    db.barber.findMany({ where: { active: true, ...(barberId ? { id: barberId } : {}) } }),
    db.appointment.findMany({ where: { ...scope, startsAt: { gte: now, lt: tomorrow } } }),
    db.block.findMany({ where: { startsAt: { lt: tomorrow }, endsAt: { gt: now } } }),
  ]);
  let working = 0;
  for (const b of barbers) {
    const ranges = (JSON.parse(b.schedule) as Record<string, number[][]>)[weekday] ?? [];
    for (const [start, end] of ranges) {
      for (let minute = start; minute < end; minute++) {
        const a = localDate(today, minute),
          z = new Date(a.getTime() + 60000);
        if (
          !blocks.some(
            (v) => (!v.barberId || v.barberId === b.id) && overlaps(a, z, v.startsAt, v.endsAt),
          )
        )
          working++;
      }
    }
  }
  const occupied = appointments
    .filter((a) => ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'].includes(a.status))
    .reduce((sum, a) => sum + a.duration, 0);
  return {
    todayRevenue: sums[0]._sum.total ?? 0,
    weekRevenue: sums[1]._sum.total ?? 0,
    monthRevenue: sums[2]._sum.total ?? 0,
    todayCount: appointments.filter((a) => a.status !== 'CANCELLED').length,
    occupancy: working ? Math.min(100, Math.round((occupied / working) * 100)) : 0,
  };
}
