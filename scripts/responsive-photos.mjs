import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
for (const name of await readdir('public/images')) {
  if (!name.endsWith('.webp') || name.endsWith('-sm.webp')) continue;
  const base = name.slice(0, -5);
  await sharp(`public/images/${name}`)
    .resize({ width: 480, withoutEnlargement: true })
    .avif({ quality: 42 })
    .toFile(`public/images/${base}-sm.avif`);
}
