import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
const password = readFileSync('.env', 'utf8').match(/SEED_PASSWORD="([^"]+)"/)?.[1] ?? '';
const headers = { Origin: 'http://localhost:3000' };
test('database CRUD for all management entities, settings and CSV', async ({ request }, info) => {
  const login = await request.post('/api/auth/login', {
    headers,
    data: { email: 'admin@example.com', password },
  });
  expect(login.ok()).toBeTruthy();
  if ((await login.json()).mustChangePassword) {
    expect(
      (
        await request.post('/api/auth/password', { headers, data: { current: password, password } })
      ).ok(),
    ).toBeTruthy();
  }
  const name = `QA ${info.project.name} ${Date.now()}`;
  const modules: { module: string; data: Record<string, unknown> }[] = [
    {
      module: 'services',
      data: {
        name,
        price: 4500,
        duration: 30,
        image: '/images/service-1.webp',
        category: 'Cabelo',
        barberIds: '[]',
      },
    },
    {
      module: 'barbers',
      data: {
        name,
        specialty: 'Corte clássico',
        image: '/images/barber-1.webp',
        commission: 40,
        schedule: '{"1":[[540,720],[780,1200]]}',
      },
    },
    {
      module: 'customers',
      data: {
        name,
        phone: `719${String(Date.now()).slice(-8)}`,
        tags: 'VIP',
        notes: 'Cliente de teste',
      },
    },
    {
      module: 'blocks',
      data: {
        name,
        barberId: null,
        startsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        endsAt: new Date(Date.now() + 31 * 86400000).toISOString(),
      },
    },
    { module: 'gallery', data: { caption: name, image: '/images/gallery-1.webp', order: 99 } },
    { module: 'reviews', data: { name, text: 'Atendimento excelente e pontual.', rating: 5 } },
    {
      module: 'users',
      data: {
        name,
        email: `qa-${Date.now()}-${info.project.name}@example.com`,
        password,
        role: 'MANAGER',
        barberId: null,
      },
    },
  ];
  for (const { module, data } of modules) {
    let r = await request.post(`/api/admin/${module}`, {
      headers,
      data: { action: 'create', data },
    });
    expect(r.ok(), `${module}: ${await r.text()}`).toBeTruthy();
    const list = await (
      await request.get(`/api/admin/${module}?search=${encodeURIComponent(name)}`)
    ).json();
    const row = list.rows.find(
      (v: { name?: string; caption?: string }) => v.name === name || v.caption === name,
    );
    expect(row, `${module} created`).toBeTruthy();
    r = await request.post(`/api/admin/${module}`, {
      headers,
      data: {
        action: 'update',
        id: row.id,
        data: {
          ...row,
          ...data,
          ...(module === 'gallery' ? { caption: `${name} editado` } : { name: `${name} editado` }),
        },
      },
    });
    expect(r.ok(), `${module} update`).toBeTruthy();
    r = await request.post(`/api/admin/${module}`, {
      headers,
      data: { action: 'delete', id: row.id },
    });
    expect(r.ok(), `${module} delete: ${await r.text()}`).toBeTruthy();
  }
  const cfg = await (await request.get('/api/admin/settings')).json();
  expect(
    (
      await request.post('/api/admin/settings', {
        headers,
        data: { action: 'update', data: cfg.settings },
      })
    ).ok(),
  ).toBeTruthy();
  const csv = await request.get('/api/admin/finance?export=csv');
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect(await csv.text()).toContain('cliente');
});
