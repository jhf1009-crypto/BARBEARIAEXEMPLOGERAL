import { NextRequest, NextResponse } from 'next/server';
import { bookingSchema } from '@/lib/validation';
import { createBooking, AppError } from '@/lib/booking';
import { body, fail, rate, sameOrigin } from '@/lib/http';
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    await rate(req, 'booking', 15);
    const input = bookingSchema.parse(await body(req));
    if (process.env.TURNSTILE_SECRET) {
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET,
          response: input.turnstile ?? '',
        }),
      });
      const result = await r.json();
      if (!result.success) throw new AppError('Verificação de segurança necessária.');
    }
    return NextResponse.json(await createBooking(input), { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
