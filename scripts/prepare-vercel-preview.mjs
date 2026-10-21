import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

// This disposable staging copy uses per-instance SQLite, exclusively for visual previews.
// It does not upload .env, local uploads, sessions, or customer data from the working database.
const root = process.cwd();
const staging = resolve('output/vercel-preview');
mkdirSync(staging, { recursive: true });
const archive = resolve('output/vercel-source.tar');
for (const [command, args] of [
  ['git', ['archive', '--format=tar', '-o', archive, 'HEAD']],
  ['tar.exe', ['-xf', archive, '-C', staging]],
]) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed`);
}
const password = randomBytes(20).toString('base64url');
const key = randomBytes(32).toString('hex');
// Build a clean seed in a separate file: never copy the working database.
const seedDb = resolve('prisma/vercel-preview.db');
writeFileSync(seedDb, '');
const env = {
  ...process.env,
  DATABASE_URL: `file:${seedDb.replaceAll('\\', '/')}`,
  SEED_PASSWORD: password,
};
for (const args of [
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  ['--import', 'tsx', 'prisma/seed.ts'],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Preview seed failed');
}
copyFileSync(seedDb, join(staging, 'prisma/preview.db'));
const db = join(staging, 'src/lib/db.ts');
writeFileSync(
  db,
  `import { copyFileSync, constants } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '../generated/prisma/index.js';
const previewFile = '/tmp/geral-preview.db';
try {
  copyFileSync(path.join(process.cwd(), 'prisma/preview.db'), previewFile, constants.COPYFILE_EXCL);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
}
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalDb.prisma ?? new PrismaClient({ datasourceUrl: 'file:' + previewFile });
globalDb.prisma = db;
`,
);
const origin =
  "(process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'))";
for (const file of ['src/lib/http.ts', 'src/app/layout.tsx', 'src/app/api/upload/route.ts']) {
  const target = join(staging, file);
  writeFileSync(
    target,
    readFileSync(target, 'utf8').replaceAll(
      "process.env.APP_URL ?? 'http://localhost:3000'",
      origin,
    ),
  );
}
for (const file of ['src/app/api/upload/route.ts', 'src/app/uploads/[file]/route.ts']) {
  const target = join(staging, file);
  writeFileSync(
    target,
    readFileSync(target, 'utf8').replaceAll(
      "path.join(process.cwd(), 'var/uploads'",
      "path.join('/tmp/geral-uploads'",
    ),
  );
}
const config = join(staging, 'next.config.ts');
writeFileSync(
  config,
  readFileSync(config, 'utf8').replace(
    'poweredByHeader: false,',
    "poweredByHeader: false,\n  outputFileTracingIncludes: { '/*': ['./prisma/preview.db', './src/generated/prisma/**'] },",
  ),
);
writeFileSync(
  join(staging, 'vercel.json'),
  JSON.stringify(
    {
      framework: 'nextjs',
      env: { SESSION_COOKIE_SECURE: 'true', TOTP_ENCRYPTION_KEY: key },
    },
    null,
    2,
  ),
);
writeFileSync(
  'output/vercel-preview-access.json',
  JSON.stringify({ admin: 'admin@example.com', password }, null, 2),
);
const packagePath = resolve('output/vercel-preview.tgz');
const result = spawnSync('tar.exe', ['-czf', packagePath, '-C', staging, '.'], {
  stdio: 'inherit',
});
if (result.status !== 0) throw new Error('Packaging failed');
console.log('Preview package ready: output/vercel-preview.tgz');
