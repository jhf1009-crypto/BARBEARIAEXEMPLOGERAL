export const appUrl =
  process.env.APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export function isTrustedOrigin(origin: string | null) {
  if (!origin) return false;
  const allowed = [new URL(appUrl).origin];
  if (process.env.VERCEL === '1' && process.env.VERCEL_URL)
    allowed.push(new URL(`https://${process.env.VERCEL_URL}`).origin);
  return allowed.includes(origin);
}
