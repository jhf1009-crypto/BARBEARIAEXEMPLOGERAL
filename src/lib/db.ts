import { PrismaClient } from '../generated/prisma/index.js';
import { copyFileSync, constants } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
function createClient() {
  if (process.env.VERCEL_SQLITE_PREVIEW !== 'true') return new PrismaClient();
  const file = path.join(tmpdir(), 'geral-preview.db');
  try {
    copyFileSync(path.join(process.cwd(), 'prisma/preview.db'), file, constants.COPYFILE_EXCL);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  return new PrismaClient({ datasourceUrl: `file:${file.replaceAll('\\', '/')}` });
}
export const db = globalDb.prisma ?? createClient();
if (process.env.NODE_ENV !== 'production') globalDb.prisma = db;
