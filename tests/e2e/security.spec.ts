import { test, expect, db } from './fixtures';
import { readFileSync } from 'node:fs';
import { loadAllImages } from './helpers';
const password = readFileSync('.env', 'utf8').match(/SEED_PASSWORD="([^"]+)"/)?.[1] ?? '';
test('concurrent booking only creates one reservation', async ({ request }) => {
  const catalog = await (await request.get('/api/catalog')).json();
  const day = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const r = await request.get(`/api/availability?day=${day}&services=${catalog.services[0].id}`);
  const available = await r.json();
  test.skip(!available.slots.length, 'Escolha um dia aberto.');
  const slot = available.slots[0];
  const data = {
    serviceIds: [catalog.services[0].id],
    barberId: slot.barberId,
    startsAt: slot.startsAt,
    name: 'Teste Concorrência',
    phone: `719${String(Date.now()).slice(-8)}`,
    consent: true,
  };
  const results = await Promise.all([
    request.post('/api/bookings', { data, headers: { Origin: 'http://localhost:3000' } }),
    request.post('/api/bookings', { data, headers: { Origin: 'http://localhost:3000' } }),
  ]);
  expect(results.map((r) => r.status()).sort()).toEqual([201, 409]);
});
test('unauthenticated admin denied and cross origin rejected', async ({ request }) => {
  expect((await request.get('/api/admin/customers')).status()).toBe(401);
  expect(
    (
      await request.post('/api/bookings', {
        data: {},
        headers: { Origin: 'https://untrusted.example' },
      })
    ).status(),
  ).toBe(403);
});
test('barber cannot access customer records or another agenda', async ({ request }) => {
  let r = await request.post('/api/auth/login', {
    data: { email: 'barbeiro@example.com', password },
    headers: { Origin: 'http://localhost:3000' },
  });
  expect(r.ok()).toBeTruthy();
  const login = await r.json();
  if (login.mustChangePassword) {
    r = await request.post('/api/auth/password', {
      data: { current: password, password },
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(r.ok()).toBeTruthy();
  }
  expect((await request.get('/api/admin/customers')).status()).toBe(403);
  expect((await request.get('/api/admin/users')).status()).toBe(403);
  const mine = await (await request.get('/api/admin/appointments')).json();
  const ids = new Set(mine.rows.map((r: { barberId: string }) => r.barberId));
  expect(ids.size).toBeLessThanOrEqual(1);
  const own = mine.rows[0]?.barberId;
  const other = await db.appointment.findFirst({ where: { barberId: { not: own } } });
  expect(other).toBeTruthy();
  expect(
    (
      await request.post('/api/admin/appointments', {
        data: { action: 'update', id: other!.id, data: { internalNotes: 'tentativa indevida' } },
        headers: { Origin: 'http://localhost:3000' },
      })
    ).status(),
  ).toBe(403);
});
test('reduced motion, touch, images and no overflow', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await loadAllImages(page);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('cursor', 'auto');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  expect(
    await page
      .locator('img')
      .evaluateAll(
        (images) =>
          images.filter(
            (i) => !(i as HTMLImageElement).complete || !(i as HTMLImageElement).naturalWidth,
          ).length,
      ),
  ).toBe(0);
  await page.screenshot({ path: `output/playwright/${info.project.name}-reduced-motion.png` });
});
