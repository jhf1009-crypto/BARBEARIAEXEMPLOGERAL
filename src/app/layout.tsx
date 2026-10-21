import type { Metadata, Viewport } from 'next';
import { site } from '@/site.config';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: site.seo.title,
  description: site.seo.description,
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  openGraph: {
    title: site.seo.title,
    description: site.seo.description,
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: site.hero, width: 1600, height: 1067 }],
  },
  twitter: { card: 'summary_large_image', title: site.seo.title, images: [site.hero] },
};
export const dynamic = 'force-dynamic';
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#111310' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        style={
          {
            '--bg': site.colors.background,
            '--surface': site.colors.surface,
            '--accent': site.colors.accent,
            '--text': site.colors.text,
          } as React.CSSProperties
        }
      >
        <link
          rel="preload"
          href="/fonts/barlow-condensed-bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <a href="#main" className="skip">
          Pular para conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
