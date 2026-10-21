import { existsSync, writeFileSync, readFileSync } from 'node:fs';
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
