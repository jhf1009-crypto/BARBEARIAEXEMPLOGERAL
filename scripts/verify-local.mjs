import { spawn } from 'node:child_process';
import { openSync, closeSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
if (existsSync('.env')) process.loadEnvFile('.env');
const log = path.join(root, 'output/final-validation.log');
const stateFile = path.join(root, 'output/validation-state.json');
const environment = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
delete environment.NO_COLOR;
delete environment.FORCE_COLOR;
let server;
function state(stage, extra = {}) {
  const data = { stage, updatedAt: new Date().toISOString(), runnerPid: process.pid, ...extra };
  writeFileSync(stateFile, JSON.stringify(data, null, 2));
  appendFileSync(log, `\n[${data.updatedAt}] ${stage}\n`);
}
function run(stage, args) {
  state(stage);
  return new Promise((resolve, reject) => {
    const fd = openSync(log, 'a');
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: environment,
      windowsHide: true,
      stdio: ['ignore', fd, fd],
    });
    child.on('error', reject);
    child.on('close', (code) => {
      closeSync(fd);
      if (code === 0) resolve();
      else reject(new Error(`${stage}: exit ${code}`));
    });
  });
}
try {
  await run('lint', [path.join(root, 'node_modules/eslint/bin/eslint.js'), '.']);
  await run('unit', [
    path.join(root, 'node_modules/tsx/dist/cli.mjs'),
    '--test',
    'tests/schedule.test.ts',
  ]);
  await run('build', [path.join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack']);
  const fd = openSync(path.join(root, 'output/final-server.log'), 'a');
  server = spawn(
    process.execPath,
    [
      path.join(root, 'node_modules/next/dist/bin/next'),
      'start',
      '--hostname',
      '127.0.0.1',
      '--port',
      '3000',
    ],
    { cwd: root, env: environment, windowsHide: true, stdio: ['ignore', fd, fd] },
  );
  server.unref();
  writeFileSync('output/server.pid', String(server.pid));
  state('server-smoke', { serverPid: server.pid });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch('http://localhost:3000/api/catalog');
      const data = await r.json();
      if (r.ok && Array.isArray(data.services) && data.services.length) {
        ready = true;
        break;
      }
    } catch {
      /* Wait until the local production server is ready. */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error('O catálogo não respondeu como JSON válido.');
  for (const [action, data, expected] of [
    ['login', { email: 'nonexistent-smoke@example.com', password: 'invalid-password' }, 401],
    ['forgot', { email: 'admin@example.com' }, 503],
  ]) {
    if (action === 'forgot' && environment.SMTP_HOST) continue;
    const r = await fetch(`http://localhost:3000/api/auth/${action}`, {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await r.text();
    appendFileSync(log, `${action}: ${r.status} ${body.slice(0, 250)}\n`);
    if (r.status !== expected || !body.startsWith('{'))
      throw new Error(`Resposta inesperada em ${action}: ${r.status}`);
  }
  await run('playwright', [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test']);
  await run('offline', ['scripts/offline-check.mjs']);
  state('lighthouse');
  if (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe'))
    environment.CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  await run('lighthouse', [
    path.join(root, 'node_modules/lighthouse/cli/index.js'),
    'http://localhost:3000',
    '--output=html',
    '--output=json',
    '--output-path=output/lighthouse-final',
    '--chrome-flags=--headless=new --no-sandbox',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--quiet',
  ]);
  await run('lighthouse-summary', ['scripts/summarize-lighthouse.mjs']);
  state('passed', { serverPid: server.pid });
} catch (error) {
  state('failed', { error: error.message, serverPid: server?.pid });
  process.exitCode = 1;
}
