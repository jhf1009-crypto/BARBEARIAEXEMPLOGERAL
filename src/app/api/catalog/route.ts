import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  const [services, barbers] = await Promise.all([
    db.service.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    db.barber.findMany({ where: { active: true } }),
  ]);
  return NextResponse.json({
    services,
    barbers: barbers.map(({ id, name, image, specialty }) => ({ id, name, image, specialty })),
  });
}
