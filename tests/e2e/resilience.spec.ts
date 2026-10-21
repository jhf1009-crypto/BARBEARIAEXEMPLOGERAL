import { test, expect } from './fixtures';
test('slow mobile connection keeps primary action usable', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 256000,
    uploadThroughput: 64000,
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible();
  await page.getByRole('link', { name: 'Agendar meu horário' }).click();
  // Before hydration the normal link opens the same flow as a standalone full-screen page.
  await expect(page.getByRole('heading', { name: 'O que vamos fazer?' })).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByRole('button', { name: /Corte masculino/ })).toBeVisible({
    timeout: 20000,
  });
});
test('public content and scheduling link survive JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Agendar meu horário' })).toHaveAttribute(
    'href',
    '/agendar',
  );
  await context.close();
});
