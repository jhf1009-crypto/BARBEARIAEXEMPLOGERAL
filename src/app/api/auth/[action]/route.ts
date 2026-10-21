import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { encryptSecret, decryptSecret } from '@/lib/secrets';
import { requireUser, newSession, audit } from '@/lib/auth';
import { AppError, hash } from '@/lib/booking';
import { body, fail, rate, rateKey, sameOrigin } from '@/lib/http';
export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  try {
    sameOrigin(req);
    const { action } = await params;
    await rate(req, `auth:${action}`, 30);
    const input = await body(req);
    if (action === 'login') {
      const v = z
        .object({
          email: z.email().max(200),
          password: z.string().max(128),
          code: z.string().max(8).optional(),
        })
        .parse(input);
      await rateKey(`login:${hash(v.email.toLowerCase())}`, 8, 900);
      const user = await db.user.findUnique({ where: { email: v.email.toLowerCase() } });
      const valid = await bcrypt.compare(
        v.password,
        user?.password ?? '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      );
      if (!user || !valid) throw new AppError('E-mail ou senha incorretos.', 401);
      if (user.totpSecret) {
        const totp = new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(decryptSecret(user.totpSecret)),
        });
        if (totp.validate({ token: v.code ?? '', window: 1 }) === null)
          throw new AppError('Informe o código do autenticador.', 401);
      }
      await newSession(user.id, req.headers.get('user-agent') ?? '');
      await audit(user.id, 'LOGIN', user.id);
      return NextResponse.json({ mustChangePassword: user.mustChangePassword });
    }
    if (action === 'logout') {
      const u = await requireUser(undefined, true);
      await db.session.delete({ where: { id: u.sessionId } });
      (await cookies()).delete('session');
      return NextResponse.json({ ok: true });
    }
    if (action === 'password') {
      const u = await requireUser(undefined, true);
      const v = z
        .object({ current: z.string().max(128), password: z.string().min(12).max(128) })
        .parse(input);
      if (!(await bcrypt.compare(v.current, u.password)))
        throw new AppError('Senha atual incorreta.');
      await db.$transaction([
        db.user.update({
          where: { id: u.id },
          data: { password: await bcrypt.hash(v.password, 12), mustChangePassword: false },
        }),
        db.session.deleteMany({ where: { userId: u.id, id: { not: u.sessionId } } }),
      ]);
      await audit(u.id, 'PASSWORD_CHANGE', u.id);
      return NextResponse.json({ ok: true });
    }
    if (action === 'forgot') {
      const v = z.object({ email: z.email() }).parse(input);
      await rateKey(`reset:${hash(v.email)}`, 3, 3600);
      const user = await db.user.findUnique({ where: { email: v.email.toLowerCase() } });
      if (user) {
        const token = randomBytes(32).toString('base64url');
        await db.resetToken.create({
          data: { id: hash(token), userId: user.id, expiresAt: new Date(Date.now() + 1800000) },
        });
        const link = `${process.env.APP_URL}/admin/login?reset=${token}`;
        if (process.env.SMTP_HOST) {
          await nodemailer
            .createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT ?? 587),
              secure: process.env.SMTP_PORT === '465',
              auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
            })
            .sendMail({
              from: process.env.SMTP_FROM,
              to: user.email,
              subject: 'Redefina sua senha',
              text: `Use este link em até 30 minutos: ${link}`,
            });
        } else if (process.env.NODE_ENV === 'development')
          console.info('Password reset (development only):', link);
        else throw new AppError('Canal de e-mail indisponível. Contate o administrador.', 503);
      }
      return NextResponse.json({
        ok: true,
        message: 'Se o e-mail estiver cadastrado, enviaremos as instruções.',
      });
    }
    if (action === 'reset') {
      const v = z
        .object({ token: z.string().length(43), password: z.string().min(12).max(128) })
        .parse(input);
      const hashed = hash(v.token);
      const password = await bcrypt.hash(v.password, 12);
      await db.$transaction(async (tx) => {
        const r = await tx.resetToken.findUnique({ where: { id: hashed } });
        if (!r || r.expiresAt < new Date()) throw new AppError('Link expirado. Solicite outro.');
        await tx.resetToken.delete({ where: { id: hashed } });
        await tx.user.update({
          where: { id: r.userId },
          data: { password, mustChangePassword: false },
        });
        await tx.session.deleteMany({ where: { userId: r.userId } });
      });
      return NextResponse.json({ ok: true });
    }
    if (action === 'totp') {
      const u = await requireUser(['ADMIN']);
      const v = z
        .object({ secret: z.string().regex(/^[A-Z2-7]{32}$/), code: z.string().length(6) })
        .parse(input);
      const t = new OTPAuth.TOTP({
        issuer: 'Barbearia',
        label: u.email,
        secret: OTPAuth.Secret.fromBase32(v.secret),
      });
      if (t.validate({ token: v.code, window: 1 }) === null) throw new AppError('Código inválido.');
      await db.user.update({ where: { id: u.id }, data: { totpSecret: encryptSecret(v.secret) } });
      await audit(u.id, 'ENABLE_2FA', u.id);
      return NextResponse.json({ ok: true });
    }
    if (action === 'revoke') {
      const u = await requireUser(undefined, true);
      const v = z.object({ sessionId: z.string().max(100) }).parse(input);
      await db.session.deleteMany({ where: { id: v.sessionId, userId: u.id } });
      return NextResponse.json({ ok: true });
    }
    throw new AppError('Ação não encontrada.', 404);
  } catch (e) {
    return fail(e);
  }
}
