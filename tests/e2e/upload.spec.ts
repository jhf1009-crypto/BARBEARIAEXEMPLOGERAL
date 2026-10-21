import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
const password = readFileSync('.env', 'utf8').match(/SEED_PASSWORD="([^"]+)"/)?.[1] ?? '';
test('image upload is reprocessed and served; executable uploads rejected', async ({ request }) => {
  const headers = { Origin: 'http://localhost:3000' };
  const login = await request.post('/api/auth/login', {
    headers,
    data: { email: 'admin@example.com', password },
  });
  expect(login.ok()).toBeTruthy();
  if ((await login.json()).mustChangePassword)
    await request.post('/api/auth/password', { headers, data: { current: password, password } });
  let r = await request.post('/api/upload', {
    headers,
    multipart: {
      file: {
        name: 'portrait.png',
        mimeType: 'image/png',
        buffer: readFileSync('public/icon-192.png'),
      },
    },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  const { url } = await r.json();
  r = await request.get(url);
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toContain('image/webp');
  r = await request.post('/api/upload', {
    headers,
    multipart: {
      file: { name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') },
    },
  });
  expect(r.status()).toBe(400);
});
