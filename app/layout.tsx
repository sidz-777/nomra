import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Cinzel, Amiri, Reem_Kufi } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

const reemKufi = Reem_Kufi({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-reem-kufi',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://namora.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NAMORA — Personalized A4 Wall Frame',
    template: '%s | NAMORA',
  },
  description:
    'NAMORA — Personalized A4 handmade wall frames with authentic Persian & oriental calligraphy.',
  keywords: [
    'NAMORA',
    'Personalized Frames',
    'Persian Calligraphy',
    'Arabic Calligraphy',
    'Luxury Wall Decor',
    'A4 Frames',
  ],
  authors: [{ name: 'NAMORA Luxury Decor' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'NAMORA — Personalized A4 Wall Frame',
    description:
      'NAMORA — Personalized A4 handmade wall frames with authentic Persian & oriental calligraphy.',
    url: siteUrl,
    siteName: 'NAMORA',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/preview-1.jpg',
        width: 1200,
        height: 630,
        alt: 'NAMORA Luxury Personalized Wall Frames',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NAMORA — Personalized A4 Wall Frame',
    description:
      'NAMORA — Personalized A4 handmade wall frames with authentic Persian & oriental calligraphy.',
    images: ['/preview-1.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#141210',
};

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ScrollReveal } from '@/components/layout/ScrollReveal';
import { AttributionTracker } from '@/components/storefront/AttributionTracker';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cinzel.variable} ${amiri.variable} ${reemKufi.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="bg-namora-bg text-namora-ink antialiased min-h-screen">
        <ThemeProvider>
          <AttributionTracker />
          <ScrollReveal />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
