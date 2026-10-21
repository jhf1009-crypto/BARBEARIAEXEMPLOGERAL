import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/privacidade', '/termos'].map((path) => ({
    url: `${process.env.APP_URL ?? 'http://localhost:3000'}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: path ? 0.3 : 1,
  }));
}
