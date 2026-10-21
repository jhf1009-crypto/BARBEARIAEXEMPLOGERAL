import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/app-url';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/agendamento/', '/agendar'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
