import { randomBytes, createHash } from 'node:crypto';
import { Prisma } from '../generated/prisma/index.js';
import { db } from './db';
import { candidates, dayKey, overlaps, reservedMinutes } from './schedule';
import { settings } from './settings';
import type { BookingInput } from './validation';
export const hash = (v: string) => createHash('sha256').update(v).digest('hex');
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function availability(
  day: string,
  serviceIds: string[],
  barberId?: string,
  excludeId?: string,
  immediate = false,
) {
  const cfg = await settings();
  const services = await db.service.findMany({ where: { id: { in: serviceIds }, active: true } });
  if (!services.length || services.length !== new Set(serviceIds).size)
    throw new AppError('Escolha serviços disponíveis.');
  const duration = services.reduce((s, v) => s + v.duration, 0);
  const total = services.reduce((s, v) => s + v.price, 0);
  const barbers = await db.barber.findMany({
    where: { active: true, ...(barberId ? { id: barberId } : {}) },
  });
  const from = new Date(`${day}T00:00:00-03:00`);
  const to = new Date(from.getTime() + 86400000);
  const busy = await db.appointment.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'] },
      startsAt: { lt: to },
      endsAt: { gt: from },
    },
  });
  const blocks = await db.block.findMany({ where: { startsAt: { lt: to }, endsAt: { gt: from } } });
  const slots = barbers
    .flatMap((b) => {
      if (
        services.some((s) => {
          const ids = JSON.parse(s.barberIds) as string[];
          return ids.length && !ids.includes(b.id);
        })
      )
        return [];
      return candidates(day, duration + cfg.bufferMinutes, b.schedule, cfg.slotStep)
        .filter((start) => {
          const end = new Date(start.getTime() + (duration + cfg.bufferMinutes) * 60000);
          return (
            start.getTime() >= Date.now() + (immediate ? 0 : cfg.minBookingMinutes) * 60000 &&
            start.getTime() <= Date.now() + cfg.maxAdvanceDays * 86400000 &&
            !busy.some(
              (v) =>
                v.barberId === b.id &&
                overlaps(
                  start,
                  end,
                  v.startsAt,
                  new Date(v.endsAt.getTime() + cfg.bufferMinutes * 60000),
                ),
            ) &&
            !blocks.some(
              (v) =>
                (!v.barberId || v.barberId === b.id) && overlaps(start, end, v.startsAt, v.endsAt),
            )
          );
        })
        .map((start) => ({ startsAt: start.toISOString(), barberId: b.id, barberName: b.name }));
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { slots, duration, total };
}
export async function createBooking(input: BookingInput, oldId?: string, actor = 'PUBLIC') {
  const start = new Date(input.startsAt);
  if (start.getSeconds() || start.getMilliseconds()) throw new AppError('Horário inválido.');
  const available = await availability(
    dayKey(start),
    input.serviceIds,
    input.barberId,
    oldId,
    actor !== 'PUBLIC',
  );
  const slot = available.slots.find((s) => s.startsAt === input.startsAt);
  if (!slot) throw new AppError('Esse horário acabou de ser ocupado. Escolha outro horário.', 409);
  const cfg = await settings();
  const token = randomBytes(32).toString('base64url');
  const end = new Date(start.getTime() + available.duration * 60000);
  const services = await db.service.findMany({ where: { id: { in: input.serviceIds } } });
  try {
    return await db.$transaction(
      async (tx) => {
        const customer = await tx.customer.upsert({
          where: { phone: input.phone },
          create: { phone: input.phone, name: input.name },
          update: { name: input.name },
        });
        const count = await tx.appointment.count({
          where: {
            customerId: customer.id,
            startsAt: { gte: new Date() },
            status: { in: ['PENDING', 'CONFIRMED'] },
            id: oldId ? { not: oldId } : undefined,
          },
        });
        if (count >= cfg.maxFutureBookings)
          throw new AppError('Você já atingiu o limite de agendamentos futuros.');
        if (oldId) {
          const changed = await tx.appointment.updateMany({
            where: { id: oldId, status: { in: ['CONFIRMED', 'PENDING'] } },
            data: { status: 'CANCELLED' },
          });
          if (changed.count !== 1)
            throw new AppError('Este agendamento já foi alterado. Atualize a página.', 409);
          await tx.reservation.deleteMany({ where: { appointmentId: oldId } });
        }
        const booking = await tx.appointment.create({
          data: {
            tokenHash: hash(token),
            tokenExpiresAt: new Date(end.getTime() + 30 * 86400000),
            customerId: customer.id,
            barberId: slot.barberId,
            serviceIds: JSON.stringify(input.serviceIds),
            serviceNames: services.map((s) => s.name).join(' + '),
            startsAt: start,
            endsAt: end,
            duration: available.duration,
            total: available.total,
            notes: input.notes,
          },
        });
        await tx.reservation.createMany({
          data: reservedMinutes(start, new Date(end.getTime() + cfg.bufferMinutes * 60000)).map(
            (minute) => ({ barberId: slot.barberId, minute, appointmentId: booking.id }),
          ),
        });
        await tx.audit.create({
          data: { userId: actor, action: oldId ? 'RESCHEDULE' : 'BOOK', target: booking.id },
        });
        return { id: booking.id, token, startsAt: booking.startsAt, total: booking.total };
      },
      { timeout: 10000 },
    );
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2002', 'P2034', 'P2028'].includes(e.code)
    )
      throw new AppError('Esse horário acabou de ser ocupado. Escolha outro horário.', 409);
    throw e;
  }
}
export async function byToken(token: string) {
  if (!/^[\w-]{43}$/.test(token)) throw new AppError('Link inválido.', 404);
  const a = await db.appointment.findUnique({
    where: { tokenHash: hash(token) },
    include: { customer: true },
  });
  if (!a || a.tokenExpiresAt < new Date()) throw new AppError('Link inválido ou expirado.', 404);
  return a;
}
export async function checkCancellation(a: { startsAt: Date; status: string }) {
  const cfg = await settings();
  if (!['PENDING', 'CONFIRMED'].includes(a.status))
    throw new AppError('Este agendamento não pode mais ser alterado.');
  if (a.startsAt.getTime() < Date.now() + cfg.minCancelMinutes * 60000)
    throw new AppError(
      `Alterações exigem ${cfg.minCancelMinutes} minutos de antecedência. Entre em contato pelo WhatsApp.`,
    );
}
