import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { db } from './db';
import { AppError, hash } from './booking';
export function fail(e: unknown) {
  if (e instanceof ZodError)
    return NextResponse.json(
      { error: e.issues.map((v) => `${v.path.join('.')}: ${v.message}`).join(' · ') },
      { status: 400 },
    );
  if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error('Request failed', e instanceof Error ? e.name : 'Unknown');
  return NextResponse.json(
    { error: 'Não foi possível concluir. Tente novamente.' },
    { status: 500 },
  );
}
export function sameOrigin(req: NextRequest) {
  const expected = new URL(process.env.APP_URL ?? 'http://localhost:3000').origin;
  const origin = req.headers.get('origin');
  if (origin !== expected) throw new AppError('Origem da solicitação inválida.', 403);
  if (!req.headers.get('content-type')?.includes('application/json'))
    throw new AppError('Formato inválido.', 415);
}
export async function body(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 20000) throw new AppError('Solicitação muito grande.', 413);
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new AppError('JSON inválido.');
  }
}
export async function rate(req: NextRequest, scope: string, limit = 15, seconds = 900) {
  // Configure a trusted reverse proxy to replace x-real-ip in production.
  const ip = req.headers.get('x-real-ip') ?? 'local';
  return rateKey(`${scope}:${hash(ip)}`, limit, seconds);
}
export async function rateKey(key: string, limit: number, seconds: number) {
  const now = new Date();
  await db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
  const r = await db.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date(Date.now() + seconds * 1000) },
    update: { count: { increment: 1 } },
  });
  if (r.count > limit) throw new AppError('Muitas tentativas. Aguarde alguns minutos.', 429);
}
