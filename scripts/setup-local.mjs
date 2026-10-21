import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
if (!existsSync('.env')) {
  const password = randomBytes(18).toString('base64url');
  writeFileSync(
    '.env',
    `DATABASE_URL="file:./dev.db"\nAPP_URL="http://localhost:3000"\nSESSION_COOKIE_SECURE="false"\nSEED_PASSWORD="${password}"\nSEED_EMAIL_DOMAIN="example.com"\n`,
  );
  console.log('Ambiente local criado; senha inicial em .env (não versionado).');
}
let env = readFileSync('.env', 'utf8');
for (const [key, size, encoding] of [
  ['SEED_PASSWORD', 18, 'base64url'],
  ['TOTP_ENCRYPTION_KEY', 32, 'hex'],
]) {
  const line = env.split(/\r?\n/).find((v) => v.startsWith(`${key}=`));
  const value = line
    ?.slice(key.length + 1)
    .trim()
    .replace(/^["']|["']$/g, '');
  if (!value) {
    const replacement = `${key}="${randomBytes(size).toString(encoding)}"`;
    env = line ? env.replace(line, replacement) : env + replacement + '\n';
  }
}
writeFileSync('.env', env);
// Pre-create SQLite files: Prisma's createDatabase call can fail on Windows paths with accents.
const declared = env
  .split(/\r?\n/)
  .find((line) => line.startsWith('DATABASE_URL='))
  ?.slice(13)
  .trim()
  .replace(/^["']|["']$/g, '');
const databaseUrl = process.env.DATABASE_URL || declared;
if (databaseUrl?.startsWith('file:')) {
  const target = path.resolve('prisma', decodeURIComponent(databaseUrl.slice(5).split('?')[0]));
  mkdirSync(path.dirname(target), { recursive: true });
  if (!existsSync(target)) writeFileSync(target, '', { flag: 'wx' });
}
