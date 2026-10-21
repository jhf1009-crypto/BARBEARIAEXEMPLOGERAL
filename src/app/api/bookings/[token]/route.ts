import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { byToken, checkCancellation, createBooking } from '@/lib/booking';
import { bookingSchema } from '@/lib/validation';
import { db } from '@/lib/db';
import { body, fail, rate, sameOrigin } from '@/lib/http';
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await rate(req, 'token-read', 120);
    const { token } = await params;
    const a = await byToken(token);
    const barber = await db.barber.findUnique({ where: { id: a.barberId } });
    return NextResponse.json(
      {
        id: a.id,
        name: a.customer.name,
        phone: a.customer.phone,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        serviceNames: a.serviceNames,
        serviceIds: JSON.parse(a.serviceIds),
        barberId: a.barberId,
        barberName: barber?.name,
        total: a.total,
        status: a.status,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    sameOrigin(req);
    await rate(req, 'token-action', 20);
    const { token } = await params;
    const a = await byToken(token);
    await checkCancellation(a);
    const v = z
      .object({
        action: z.enum(['cancel', 'reschedule']),
        startsAt: z.iso.datetime().optional(),
        barberId: z.string().optional(),
      })
      .parse(await body(req));
    if (v.action === 'cancel') {
      await db.$transaction([
        db.appointment.update({ where: { id: a.id }, data: { status: 'CANCELLED' } }),
        db.reservation.deleteMany({ where: { appointmentId: a.id } }),
        db.audit.create({ data: { userId: 'CUSTOMER', action: 'CANCEL', target: a.id } }),
      ]);
      return NextResponse.json({ ok: true });
    }
    const input = bookingSchema.parse({
      serviceIds: JSON.parse(a.serviceIds),
      barberId: v.barberId ?? a.barberId,
      startsAt: v.startsAt,
      name: a.customer.name,
      phone: a.customer.phone,
      notes: a.notes,
      consent: true,
    });
    return NextResponse.json(await createBooking(input, a.id));
  } catch (e) {
    return fail(e);
  }
}
