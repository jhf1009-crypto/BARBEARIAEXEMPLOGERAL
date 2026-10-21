import { test, expect, db } from './fixtures';
import { readFileSync } from 'node:fs';
import * as OTPAuth from 'otpauth';
import { randomBytes, createHash } from 'node:crypto';
const password = readFileSync('.env', 'utf8').match(/SEED_PASSWORD="([^"]+)"/)?.[1] ?? '';
const headers = { Origin: 'http://localhost:3000' };
test('password recovery does not expose accounts and tokens are single-use', async ({
  request,
}) => {
  if (!process.env.SMTP_HOST) {
    const known = await request.post('/api/auth/forgot', {
      headers,
      data: { email: 'admin@example.com' },
    });
    const unknown = await request.post('/api/auth/forgot', {
      headers,
      data: { email: 'unknown-person@example.com' },
    });
    expect(known.status()).toBe(503);
    expect(unknown.status()).toBe(503);
    expect(await known.json()).toEqual(await unknown.json());
  }
  const original = await db.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } });
  const email = `reset-${Date.now()}@example.com`;
  const u = await db.user.create({
    data: { name: 'QA Reset', email, password: original.password, role: 'MANAGER' },
  });
  const token = randomBytes(32).toString('base64url');
  await db.resetToken.create({
    data: {
      id: createHash('sha256').update(token).digest('hex'),
      userId: u.id,
      expiresAt: new Date(Date.now() + 600000),
    },
  });
  const replacement = `${password}-new`;
  expect(
    (
      await request.post('/api/auth/reset', { headers, data: { token, password: replacement } })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.post('/api/auth/reset', { headers, data: { token, password: replacement } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post('/api/auth/login', { headers, data: { email, password: replacement } })
    ).ok(),
  ).toBeTruthy();
  await db.user.delete({ where: { id: u.id } });
});
test('admin two-factor setup stores encrypted secret and requires valid code', async ({
  request,
  playwright,
}) => {
  let r = await request.post('/api/auth/login', {
    headers,
    data: { email: 'admin@example.com', password },
  });
  expect(r.ok()).toBeTruthy();
  if ((await r.json()).mustChangePassword)
    await request.post('/api/auth/password', { headers, data: { current: password, password } });
  const email = `totp-${Date.now()}@example.com`;
  r = await request.post('/api/admin/users', {
    headers,
    data: {
      action: 'create',
      data: { name: 'QA Autenticador', email, password, role: 'ADMIN', barberId: null },
    },
  });
  expect(r.ok()).toBeTruthy();
  const { id } = await r.json();
  const user = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
  r = await user.post('/api/auth/login', { headers, data: { email, password } });
  expect(r.ok()).toBeTruthy();
  expect(
    (
      await user.post('/api/auth/password', { headers, data: { current: password, password } })
    ).ok(),
  ).toBeTruthy();
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({ secret });
  r = await user.post('/api/auth/totp', {
    headers,
    data: { secret: secret.base32, code: totp.generate() },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  const stored = await db.user.findUniqueOrThrow({ where: { id } });
  expect(stored.totpSecret).toMatch(/^[a-f0-9]+\.[a-f0-9]+\.[a-f0-9]+$/);
  await user.post('/api/auth/logout', { headers, data: {} });
  expect(
    (await user.post('/api/auth/login', { headers, data: { email, password } })).status(),
  ).toBe(401);
  expect(
    (
      await user.post('/api/auth/login', {
        headers,
        data: { email, password, code: totp.generate() },
      })
    ).ok(),
  ).toBeTruthy();
  await user.dispose();
  expect(
    (await request.post('/api/admin/users', { headers, data: { action: 'delete', id } })).ok(),
  ).toBeTruthy();
});
test('login rate limit temporarily blocks repeated failures', async ({ request }) => {
  for (let i = 0; i < 8; i++) {
    const r = await request.post('/api/auth/login', {
      headers,
      data: { email: 'limit-check@example.com', password: 'senha-incorreta' },
    });
    expect(r.status()).toBe(401);
  }
  expect(
    (
      await request.post('/api/auth/login', {
        headers,
        data: { email: 'limit-check@example.com', password: 'senha-incorreta' },
      })
    ).status(),
  ).toBe(429);
});
