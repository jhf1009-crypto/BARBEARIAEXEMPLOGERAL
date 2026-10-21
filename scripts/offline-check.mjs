import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
for (const viewport of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:3000/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const heading = await page.locator('h1').innerText();
    if (!heading.includes('Um bom corte'))
      throw new Error('A página inicial não foi recuperada do cache.');
    await page.screenshot({ path: `output/playwright/offline-${viewport.width}.png` });
    results.push({ viewport, ok: true, heading });
  } catch (e) {
    results.push({ viewport, ok: false, error: e.message });
  } finally {
    await context.close();
  }
}
await browser.close();
writeFileSync('output/offline-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exitCode = 1;
