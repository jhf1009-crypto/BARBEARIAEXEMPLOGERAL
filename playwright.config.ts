import { defineConfig } from '@playwright/test';
process.loadEnvFile('.env');
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 180000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
  },
  projects: [
    {
      name: 'mobile-360',
      use: { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'mobile-390',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'output/e2e-results.json' }],
  ],
});
