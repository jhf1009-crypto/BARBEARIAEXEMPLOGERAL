import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// vercel.json env values apply at runtime; make the build mode explicit as well.
if (process.env.VERCEL === '1' && process.env.VERCEL_SQLITE_PREVIEW !== 'false')
  process.env.VERCEL_SQLITE_PREVIEW = 'true';

function run(args, env = process.env, quiet = false) {
  const result = spawnSync(process.execPath, args, {
    env,
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    if (quiet) process.stderr.write(result.stderr ?? 'Seed failed');
    process.exit(result.status ?? 1);
  }
}
run(['node_modules/prisma/build/index.js', 'generate']);
if (process.env.VERCEL_SQLITE_PREVIEW === 'true') {
  if (!process.env.SEED_PASSWORD) throw new Error('Configure SEED_PASSWORD na Vercel.');
  const file = resolve('prisma/preview.db');
  writeFileSync(file, '');
  const env = {
    ...process.env,
    VERCEL_SQLITE_PREVIEW: 'false',
    DATABASE_URL: `file:${file.replaceAll('\\', '/')}`,
  };
  run(['node_modules/prisma/build/index.js', 'migrate', 'deploy'], env);
  run(['--import', 'tsx', 'prisma/seed.ts'], env, true);
  console.log('Banco inicial de prévia criado; dados locais não foram enviados.');
}
run(['node_modules/next/dist/bin/next', 'build', '--webpack']);
