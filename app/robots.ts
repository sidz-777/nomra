import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://namora.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/customize'],
        disallow: [
          '/admin/',
          '/checkout',
          '/checkout/',
          '/track-order',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
