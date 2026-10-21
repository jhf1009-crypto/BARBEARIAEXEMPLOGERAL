import sharp from 'sharp';
import { readdir, writeFile, mkdir, readFile } from 'node:fs/promises';
const manifest = {};
for (const file of await readdir('public/images')) {
  if (!file.endsWith('.webp') || file.endsWith('-sm.webp')) continue;
  const src = `public/images/${file}`;
  const meta = await sharp(src).metadata();
  const blur = await sharp(src).resize(12).webp({ quality: 30 }).toBuffer();
  manifest[`/images/${file}`] = {
    width: meta.width,
    height: meta.height,
    blur: `data:image/webp;base64,${blur.toString('base64')}`,
  };
}
await mkdir('src/data', { recursive: true });
await writeFile('src/data/photos.json', JSON.stringify(manifest, null, 2));
const path = 'docs/PHOTO-SOURCES.json';
let records = JSON.parse(await readFile(path, 'utf8'));
records = records.filter((r) => !r.error);
await writeFile(path, JSON.stringify(records, null, 2));
