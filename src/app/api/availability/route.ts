import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { date, id } from '@/lib/validation';
import { availability } from '@/lib/booking';
import { fail, rate } from '@/lib/http';
import { requireUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  try {
    await rate(req, 'availability', 300, 60);
    const q = z
      .object({
        day: date,
        services: z.string().min(1).max(1000),
        barber: id.optional(),
        manual: z.enum(['1']).optional(),
      })
      .parse(Object.fromEntries(req.nextUrl.searchParams));
    const user = q.manual ? await requireUser() : null;
    return NextResponse.json(
      await availability(
        q.day,
        q.services.split(','),
        user?.role === 'BARBER' ? (user.barberId ?? 'NONE') : q.barber,
        undefined,
        !!user,
      ),
    );
  } catch (e) {
    return fail(e);
  }
}
