import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { db } from './db';
import { AppError, hash } from './booking';
export async function currentUser() {
  const token = (await cookies()).get('session')?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hash(token) },
    include: { user: true },
  });
  return session && session.expiresAt > new Date()
    ? { ...session.user, sessionId: session.id }
    : null;
}
export async function requireUser(
  roles = ['ADMIN', 'MANAGER', 'BARBER'],
  allowPasswordChange = false,
) {
  const user = await currentUser();
  if (!user) throw new AppError('Entre para continuar.', 401);
  if (!roles.includes(user.role)) throw new AppError('Você não tem permissão para esta ação.', 403);
  if (user.mustChangePassword && !allowPasswordChange)
    throw new AppError('Troque sua senha inicial para continuar.', 428);
  return user;
}
export async function newSession(userId: string, agent: string) {
  const token = randomBytes(32).toString('base64url');
  await db.session.create({
    data: {
      id: hash(token),
      userId,
      expiresAt: new Date(Date.now() + 12 * 3600000),
      agent: agent.slice(0, 200),
    },
  });
  (await cookies()).set('session', token, {
    httpOnly: true,
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 3600,
  });
}
export async function audit(userId: string, action: string, target: string) {
  await db.audit.create({ data: { userId, action, target } });
}
