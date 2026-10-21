import { expect, type Page } from '@playwright/test';
export async function loadAllImages(page: Page) {
  for (const image of await page.locator('img').all()) {
    if (!(await image.isVisible())) continue;
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
    await expect(image).not.toHaveJSProperty('naturalWidth', 0);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}
