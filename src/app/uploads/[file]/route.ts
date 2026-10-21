import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { uploadDirectory } from '@/lib/storage';
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-f0-9-]{36}\.webp$/.test(file))
    return new NextResponse('Não encontrado', { status: 404 });
  try {
    const data = await readFile(path.join(uploadDirectory, file));
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'image/webp',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(data.length),
      },
    });
  } catch {
    return new NextResponse('Não encontrado', { status: 404 });
  }
}
