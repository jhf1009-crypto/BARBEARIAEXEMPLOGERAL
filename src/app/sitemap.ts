import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/app-url';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/privacidade', '/termos'].map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: path ? 0.3 : 1,
  }));
}
