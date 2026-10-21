import { test as base, expect } from '@playwright/test';
import { db } from '../../src/lib/db';
export const test = base.extend({});
test.beforeEach(async () => {
  await db.rateLimit.deleteMany();
});
test.afterAll(async () => {
  await db.$disconnect();
});
export { expect, db };
