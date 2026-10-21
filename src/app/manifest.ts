import type { MetadataRoute } from 'next';
import { site } from '@/site.config';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.fullName,
    short_name: site.name,
    start_url: '/',
    display: 'standalone',
    background_color: site.colors.background,
    theme_color: site.colors.background,
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
