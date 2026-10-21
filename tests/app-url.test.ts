import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appUrl, isTrustedOrigin } from '../src/lib/app-url';

test('accepts the configured origin and rejects missing or foreign origins', () => {
  assert.equal(isTrustedOrigin(new URL(appUrl).origin), true);
  assert.equal(isTrustedOrigin(null), false);
  assert.equal(isTrustedOrigin('https://untrusted.invalid'), false);
});

test('accepts only the exact deployment hostname in the Vercel environment', () => {
  const oldVercel = process.env.VERCEL;
  const oldUrl = process.env.VERCEL_URL;
  try {
    process.env.VERCEL = '1';
    process.env.VERCEL_URL = 'exact-deployment.vercel.app';
    assert.equal(isTrustedOrigin('https://exact-deployment.vercel.app'), true);
    assert.equal(isTrustedOrigin('https://another-deployment.vercel.app'), false);
    process.env.VERCEL = '0';
    assert.equal(isTrustedOrigin('https://exact-deployment.vercel.app'), false);
  } finally {
    if (oldVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = oldVercel;
    if (oldUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = oldUrl;
  }
});
