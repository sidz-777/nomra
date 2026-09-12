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

export const metadata: Metadata = {
  title: 'NAMORA — Your Name. Your Space. | Luxury Personalized Wall Frames',
  description:
    'Handmade A4 wall frames with authentic Persian and oriental artwork backgrounds, inscribed with bespoke English and Arabic calligraphy.',
  keywords: [
    'NAMORA',
    'Personalized Frames',
    'Persian Calligraphy',
    'Arabic Calligraphy',
    'Luxury Wall Decor',
    'A4 Frames',
  ],
  authors: [{ name: 'NAMORA Luxury Decor' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#141210',
};

import { ThemeProvider } from '@/components/theme/ThemeProvider';

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
