import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { requireUser, audit } from '@/lib/auth';
import { AppError } from '@/lib/booking';
import { fail, rate } from '@/lib/http';
import { isTrustedOrigin } from '@/lib/app-url';
import { uploadDirectory } from '@/lib/storage';
export async function POST(req: NextRequest) {
  try {
    const u = await requireUser(['ADMIN', 'MANAGER']);
    if (!isTrustedOrigin(req.headers.get('origin'))) throw new AppError('Origem inválida.', 403);
    await rate(req, 'upload', 30);
    if (Number(req.headers.get('content-length') ?? 0) > 6 * 1024 * 1024)
      throw new AppError('Limite de 5 MB.');
    const form = await req.formData();
    const file = form.get('file');
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) ||
      !/\.(jpe?g|png|webp|avif)$/i.test(file.name)
    )
      throw new AppError('Envie JPG, PNG, WebP ou AVIF de até 5 MB.');
    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(buffer, { limitInputPixels: 25000000 }).metadata();
    if (!['jpeg', 'png', 'webp', 'avif', 'heif'].includes(meta.format ?? ''))
      throw new AppError('Imagem inválida.');
    const out = await sharp(buffer)
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const name = `${randomUUID()}.webp`;
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, name), out);
    await audit(u.id, 'UPLOAD', name);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (e) {
    return fail(e);
  }
}
