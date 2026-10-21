import sharp from 'sharp';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
let sources = JSON.parse(await readFile('docs/PHOTO-SOURCES.json', 'utf8'));
await sharp('public/images/hero.webp')
  .resize(900)
  .webp({ quality: 80 })
  .toFile('public/images/service-3.webp');
await sharp('public/images/hero.webp')
  .resize(400)
  .webp({ quality: 70 })
  .toFile('public/images/service-3-sm.webp');
await sharp('public/images/hero.webp')
  .resize(900)
  .avif({ quality: 52 })
  .toFile('public/images/service-3.avif');
sources = sources.filter((r) => r.file !== 'service-3');
sources.push({ ...sources.find((r) => r.file === 'hero'), file: 'service-3' });
for (let i = 1; i <= 6; i++) {
  const service = i === 6 ? 'service-3' : `service-${i + 4}`;
  for (const suffix of ['.webp', '-sm.webp', '.avif'])
    await copyFile(`public/images/${service}${suffix}`, `public/images/gallery-${i}${suffix}`);
  sources = sources.filter((r) => r.file !== `gallery-${i}`);
  sources.push({ ...sources.find((r) => r.file === service), file: `gallery-${i}` });
}
await writeFile('docs/PHOTO-SOURCES.json', JSON.stringify(sources, null, 2));
