import React from 'react';

export function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://namora.in';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NAMORA',
    url: siteUrl,
    logo: `${siteUrl}/favicon-32x32.png`,
    description:
      'Handmade A4 wall frames with authentic Persian and oriental artwork backgrounds, inscribed with bespoke English and Arabic calligraphy.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9305654028',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi', 'Urdu'],
    },
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'NAMORA Personalized A4 Calligraphy Wall Frame',
    image: `${siteUrl}/design1.jpg`,
    description:
      'Personalized A4 handmade wall frame with authentic Persian and oriental artwork backgrounds, bespoke English & Arabic calligraphy.',
    brand: {
      '@type': 'Brand',
      name: 'NAMORA',
    },
    offers: {
      '@type': 'Offer',
      price: '499.00',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: siteUrl,
      priceValidUntil: '2026-12-31',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </>
  );
}
