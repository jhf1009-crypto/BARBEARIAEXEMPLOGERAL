import path from 'node:path';
import { tmpdir } from 'node:os';
export const uploadDirectory =
  process.env.VERCEL_SQLITE_PREVIEW === 'true'
    ? path.join(tmpdir(), 'geral-uploads')
    : path.join(process.cwd(), 'var/uploads');
