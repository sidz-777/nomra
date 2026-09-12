/**
 * NAMORA — Storefront Content & Data Module
 * Pure typed data contracts extracted from the verified baseline for Next.js components.
 * Reuses Phase 3 canonical assets and Phase 4 design tokens.
 */

export interface PersianDesignItem {
  id: string;
  category: 'crimson' | 'blue' | 'pastel' | 'amber' | 'vintage';
  categoryLabel: string;
  title: string;
  image: string; // Legacy filename
  assetPath: string; // Phase 3 canonical path
  overlay: {
    posX: number;
    posY: number;
    maxWidth: number;
    fontSizeEn: number;
    fontSizeAr: number;
    fontEn: string;
    fontAr: string;
    textColor: string;
    textShadow: string;
  };
}

export interface ReadyStockItem {
  id: string;
  category: 'cars' | 'sports' | 'names' | 'pop';
  categoryLabel: string;
  title: string;
  subtitle: string;
  image: string;
  assetPath: string;
  tag: string;
  tagClass?: string;
  price: number;
  depositPrice: number;
  codPrice: number;
}

export interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  avatar: string;
  stars: number;
  verified: boolean;
  text: string;
  productTag: string;
  deliveredDate: string;
  photoThumb: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export interface TrustBadgeItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface LookbookItem {
  id: string;
  image: string;
  title: string;
  caption: string;
}

// 1. Announcement Ribbon
export const ANNOUNCEMENT_DATA = {
  badge: 'FESTIVE GIFTING',
  text: '✨ Handcrafted in India • Free Express Air Delivery • Reserve with ₹49, Pay Balance ₹450 on COD',
  cta: 'Customize Yours →',
  href: '#create',
};

// 2. Navigation Links
export const NAV_LINKS = [
  { label: 'Collection', href: '#designs' },
  { label: 'Customize', href: '#create' },
  { label: 'Ready Stock ⚡', href: '#ready-to-ship' },
  { label: 'Real Works', href: '#gallery' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Reviews', href: '#testimonials' },
  { label: 'Story', href: '#about' },
  { label: 'FAQ', href: '#faq' },
];

// 3. Hero Section
export const HERO_DATA = {
  eyebrow: 'Real Handmade Wall Frames',
  title: 'Because some names deserve to be framed.',
  titleHighlight: 'names',
  description:
    'Personalized A4 framed calligraphy crafted on authentic Persian & oriental aesthetic backgrounds — hand-finished, delivered to your door.',
  primaryCta: { label: 'Customize Yours', href: '#create' },
  secondaryCta: { label: 'See Real Works', href: '#gallery' },
  trustLine: 'Handmade in India · Dispatches in 24–48 hrs · Free remake if not happy',
  meta: [
    {
      icon: '🎁',
      title: 'Thoughtful Gifting',
      subtitle: 'Loved for birthdays & weddings',
    },
    {
      icon: '✒️',
      title: 'Master Calligraphy',
      subtitle: 'Persian & Arabic artistry',
    },
    {
      icon: '✨',
      title: 'Museum Quality',
      subtitle: 'A4 satin finish with crystal acrylic',
    },
  ],
  videoAsset: '/assets/hero/hero-video.mp4',
  posterAsset: '/assets/designs/design1.jpg',
};

// 4. Trust Strip
export const TRUST_ITEMS: TrustBadgeItem[] = [
  {
    id: 'handcrafted',
    icon: '✦',
    title: 'Handcrafted in India',
    description: 'Solid wood frame with crystal clear shatterproof acrylic',
  },
  {
    id: 'deposit',
    icon: '₹',
    title: '₹49 Booking Deposit',
    description: 'Lock your bespoke frame now, pay balance ₹450 on COD',
  },
  {
    id: 'dispatch',
    icon: '⚡',
    title: 'Express 24–48h Dispatch',
    description: 'Pan-India air courier with live SMS & WhatsApp tracking',
  },
  {
    id: 'happiness',
    icon: '🛡️',
    title: '100% Happiness Remake',
    description: 'If you are not deeply delighted, we remake it for free',
  },
];

// 5. All 21 Persian & Oriental Designs
export const PERSIAN_DESIGNS: PersianDesignItem[] = [
  {
    id: 'persian_red',
    category: 'crimson',
    categoryLabel: 'Crimson & Ruby',
    title: 'Red Persian Carpet Frame',
    image: 'design1.jpg',
    assetPath: '/assets/designs/design1.jpg',
    overlay: {
      posX: 50, posY: 46, maxWidth: 68,
      fontSizeEn: 28, fontSizeAr: 34,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#3b0a16',
      textShadow: '0 1px 2px rgba(255,255,255,0.6)'
    }
  },
  {
    id: 'blue_floral',
    category: 'blue',
    categoryLabel: 'Royal Blue & Indigo',
    title: 'Blue Oriental & Floral Frame',
    image: 'design2.jpg',
    assetPath: '/assets/designs/design2.jpg',
    overlay: {
      posX: 50, posY: 38, maxWidth: 62,
      fontSizeEn: 26, fontSizeAr: 32,
      fontEn: "'Playfair Display', serif", fontAr: "'Reem Kufi', sans-serif",
      textColor: '#0f2744',
      textShadow: '0 1px 3px rgba(255,255,255,0.8)'
    }
  },
  {
    id: 'purple_butterfly',
    category: 'pastel',
    categoryLabel: 'Pastel & Garden',
    title: 'Purple Floral Butterfly Frame',
    image: 'design3.jpg',
    assetPath: '/assets/designs/design3.jpg',
    overlay: {
      posX: 50, posY: 48, maxWidth: 70,
      fontSizeEn: 27, fontSizeAr: 35,
      fontEn: "'Playfair Display', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 8px rgba(30,10,40,0.85)'
    }
  },
  {
    id: 'purple_pattern',
    category: 'pastel',
    categoryLabel: 'Pastel & Garden',
    title: 'Purple Tile Collage Frame',
    image: 'design4.jpg',
    assetPath: '/assets/designs/design4.jpg',
    overlay: {
      posX: 50, posY: 47, maxWidth: 65,
      fontSizeEn: 25, fontSizeAr: 32,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 6px rgba(0,0,0,0.7)'
    }
  },
  {
    id: 'blue_carpet_books',
    category: 'blue',
    categoryLabel: 'Royal Blue & Indigo',
    title: 'Blue Rug & Book Stack Frame',
    image: 'design5.jpg',
    assetPath: '/assets/designs/design5.jpg',
    overlay: {
      posX: 50, posY: 42, maxWidth: 60,
      fontSizeEn: 25, fontSizeAr: 33,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#1a3050',
      textShadow: '0 1px 3px rgba(255,255,255,0.9)'
    }
  },
  {
    id: 'antique_books_flower',
    category: 'vintage',
    categoryLabel: 'Vintage & Classical',
    title: 'Vintage Botanical Study Frame',
    image: 'design6.jpg',
    assetPath: '/assets/designs/design6.jpg',
    overlay: {
      posX: 50, posY: 44, maxWidth: 64,
      fontSizeEn: 26, fontSizeAr: 34,
      fontEn: "'Playfair Display', serif", fontAr: "'Amiri', serif",
      textColor: '#2e1c0c',
      textShadow: '0 1px 2px rgba(255,255,255,0.7)'
    }
  },
  {
    id: 'dark_oriental_carpet',
    category: 'crimson',
    categoryLabel: 'Crimson & Ruby',
    title: 'Heritage Crimson Medallion Frame',
    image: 'design7.jpg',
    assetPath: '/assets/designs/design7.jpg',
    overlay: {
      posX: 50, posY: 45, maxWidth: 66,
      fontSizeEn: 28, fontSizeAr: 36,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.9)'
    }
  },
  {
    id: 'blue_tile_carpet',
    category: 'blue',
    categoryLabel: 'Royal Blue & Indigo',
    title: 'Cobalt Persian Court Frame',
    image: 'design8.jpg',
    assetPath: '/assets/designs/design8.jpg',
    overlay: {
      posX: 50, posY: 46, maxWidth: 66,
      fontSizeEn: 27, fontSizeAr: 35,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 6px rgba(0,0,0,0.85)'
    }
  },
  {
    id: 'pink_floral_butterfly',
    category: 'pastel',
    categoryLabel: 'Pastel & Garden',
    title: 'Rose Petal & Gold Leaf Frame',
    image: 'design9.jpg',
    assetPath: '/assets/designs/design9.jpg',
    overlay: {
      posX: 50, posY: 46, maxWidth: 68,
      fontSizeEn: 27, fontSizeAr: 34,
      fontEn: "'Playfair Display', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 6px rgba(40,10,20,0.85)'
    }
  },
  {
    id: 'blue_floral_vase',
    category: 'blue',
    categoryLabel: 'Royal Blue & Indigo',
    title: 'Azure Damask Heritage Frame',
    image: 'design10.jpg',
    assetPath: '/assets/designs/design10.jpg',
    overlay: {
      posX: 50, posY: 40, maxWidth: 60,
      fontSizeEn: 26, fontSizeAr: 33,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#102844',
      textShadow: '0 1px 3px rgba(255,255,255,0.85)'
    }
  },
  {
    id: 'teal_floral_arch',
    category: 'blue',
    categoryLabel: 'Royal Blue & Indigo',
    title: 'Teal Silk Mihrab Frame',
    image: 'design11.jpg',
    assetPath: '/assets/designs/design11.jpg',
    overlay: {
      posX: 50, posY: 42, maxWidth: 62,
      fontSizeEn: 26, fontSizeAr: 33,
      fontEn: "'Cinzel', serif", fontAr: "'Reem Kufi', sans-serif",
      textColor: '#0c2828',
      textShadow: '0 1px 3px rgba(255,255,255,0.8)'
    }
  },
  {
    id: 'orange_floral_bird',
    category: 'amber',
    categoryLabel: 'Amber & Heritage',
    title: 'Amber Orchard Blossom Frame',
    image: 'design12.jpg',
    assetPath: '/assets/designs/design12.jpg',
    overlay: {
      posX: 50, posY: 44, maxWidth: 64,
      fontSizeEn: 27, fontSizeAr: 34,
      fontEn: "'Playfair Display', serif", fontAr: "'Amiri', serif",
      textColor: '#3a1804',
      textShadow: '0 1px 2px rgba(255,255,255,0.7)'
    }
  },
  {
    id: 'persian_gold_medallion',
    category: 'amber',
    categoryLabel: 'Amber & Heritage',
    title: 'Antique Gold Medallion Frame',
    image: 'design13.jpg',
    assetPath: '/assets/designs/design13.jpg',
    overlay: {
      posX: 50, posY: 47, maxWidth: 65,
      fontSizeEn: 28, fontSizeAr: 35,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#2a1a06',
      textShadow: '0 1px 3px rgba(255,255,255,0.8)'
    }
  },
  {
    id: 'persian_emerald_palace',
    category: 'blue',
    categoryLabel: 'Royal Blue & Indigo',
    title: 'Emerald Palace Brocade Frame',
    image: 'design14.jpg',
    assetPath: '/assets/designs/design14.jpg',
    overlay: {
      posX: 50, posY: 45, maxWidth: 66,
      fontSizeEn: 27, fontSizeAr: 34,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#0a2a18',
      textShadow: '0 1px 3px rgba(255,255,255,0.85)'
    }
  },
  {
    id: 'persian_maroon_crest',
    category: 'crimson',
    categoryLabel: 'Crimson & Ruby',
    title: 'Maroon Imperial Crest Frame',
    image: 'design15.jpg',
    assetPath: '/assets/designs/design15.jpg',
    overlay: {
      posX: 50, posY: 46, maxWidth: 66,
      fontSizeEn: 28, fontSizeAr: 35,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 7px rgba(0,0,0,0.85)'
    }
  },
  {
    id: 'persian_sapphire_crest',
    category: 'blue',
    categoryLabel: 'Royal Blue & Indigo',
    title: 'Sapphire Royal Crest Frame',
    image: 'design16.jpg',
    assetPath: '/assets/designs/design16.jpg',
    overlay: {
      posX: 50, posY: 46, maxWidth: 66,
      fontSizeEn: 28, fontSizeAr: 35,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 7px rgba(0,0,0,0.85)'
    }
  },
  {
    id: 'persian_midnight_mosaic',
    category: 'vintage',
    categoryLabel: 'Vintage & Classical',
    title: 'Midnight Onyx Mosaic Frame',
    image: 'design17.jpg',
    assetPath: '/assets/designs/design17.jpg',
    overlay: {
      posX: 50, posY: 47, maxWidth: 66,
      fontSizeEn: 28, fontSizeAr: 36,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.9)'
    }
  },
  {
    id: 'persian_burgundy_velvet',
    category: 'crimson',
    categoryLabel: 'Crimson & Ruby',
    title: 'Burgundy Velvet Damask Frame',
    image: 'design18.jpg',
    assetPath: '/assets/designs/design18.jpg',
    overlay: {
      posX: 50, posY: 45, maxWidth: 65,
      fontSizeEn: 27, fontSizeAr: 34,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 6px rgba(0,0,0,0.8)'
    }
  },
  {
    id: 'persian_turquoise_silk',
    category: 'blue',
    categoryLabel: 'Royal Blue & Indigo',
    title: 'Turquoise Silk Arabesque Frame',
    image: 'design19.jpg',
    assetPath: '/assets/designs/design19.jpg',
    overlay: {
      posX: 50, posY: 45, maxWidth: 65,
      fontSizeEn: 27, fontSizeAr: 34,
      fontEn: "'Cinzel', serif", fontAr: "'Reem Kufi', sans-serif",
      textColor: '#0e2c34',
      textShadow: '0 1px 3px rgba(255,255,255,0.8)'
    }
  },
  {
    id: 'persian_ivory_bloom',
    category: 'pastel',
    categoryLabel: 'Pastel & Garden',
    title: 'Ivory Bloom Filigree Frame',
    image: 'design20.jpg',
    assetPath: '/assets/designs/design20.jpg',
    overlay: {
      posX: 50, posY: 46, maxWidth: 66,
      fontSizeEn: 27, fontSizeAr: 34,
      fontEn: "'Playfair Display', serif", fontAr: "'Amiri', serif",
      textColor: '#241a10',
      textShadow: '0 1px 3px rgba(255,255,255,0.9)'
    }
  },
  {
    id: 'persian_scarlet_crown',
    category: 'crimson',
    categoryLabel: 'Crimson & Ruby',
    title: 'Scarlet Royal Crown Frame',
    image: 'design21.jpg',
    assetPath: '/assets/designs/design21.jpg',
    overlay: {
      posX: 50, posY: 46, maxWidth: 66,
      fontSizeEn: 28, fontSizeAr: 35,
      fontEn: "'Cinzel', serif", fontAr: "'Amiri', serif",
      textColor: '#ffffff',
      textShadow: '0 2px 7px rgba(0,0,0,0.85)'
    }
  },
];

// 6. 37 Ready-to-Ship Products
export const READY_STOCK_PRODUCTS: ReadyStockItem[] = [
  // Supercars (10)
  {
    id: 'car-1',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'Porsche 911 GT3 RS',
    subtitle: 'Signature White & Red Track Edition · Physical Frame',
    image: 'car1.jpg',
    assetPath: '/assets/products/cars/car1.jpg',
    tag: '⚡ Bestseller',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-2',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'BMW M5 F90 Black Edition',
    subtitle: 'V8 Twin-Turbo Specs · Satin Matte Black Frame',
    image: 'car2.jpg',
    assetPath: '/assets/products/cars/car2.jpg',
    tag: '⚡ 635 HP Spec',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-3',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'Porsche 911 GT3 Silver',
    subtitle: 'Classic Silver with Porsche Crest & Telemetry',
    image: 'car3.jpg',
    assetPath: '/assets/products/cars/car3.jpg',
    tag: 'Studio Edition',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-4',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'BMW M8 Competition Coupé',
    subtitle: 'Handheld Photo · German Flag Engineering Edition',
    image: 'car4.jpg',
    assetPath: '/assets/products/cars/car4.jpg',
    tag: 'German M-Power',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-5',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'Porsche 911 GT3 Rear Wing',
    subtitle: 'Stealth Black Rear-Profile in Bedside Frame',
    image: 'car5.jpg',
    assetPath: '/assets/products/cars/car5.jpg',
    tag: 'Minimalist',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-6',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'Porsche GT3 RS White Frame',
    subtitle: 'Clean Modern Styling · 525 PS Aerodynamics',
    image: 'car6.jpg',
    assetPath: '/assets/products/cars/car6.jpg',
    tag: 'Air Aero Edition',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-7',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'Porsche 911 GT3 RS Track Spec',
    subtitle: 'Full Body Telemetry & Lap Specs Matte Frame',
    image: 'car7.jpg',
    assetPath: '/assets/products/cars/car7.jpg',
    tag: '⚡ 3.2s 0-100',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-8',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'BMW M4 Competition Coupé',
    subtitle: 'Isle of Man Green Spec · TwinPower Turbo Poster',
    image: 'car8.jpg',
    assetPath: '/assets/products/cars/car8.jpg',
    tag: '510 HP Beast',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-9',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'Porsche GT3 RS Yellow Accent',
    subtitle: 'Racing Yellow Details · Nürburgring Heritage Edition',
    image: 'car9.jpg',
    assetPath: '/assets/products/cars/car9.jpg',
    tag: 'Track Beast',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'car-11',
    category: 'cars',
    categoryLabel: 'Supercars',
    title: 'BMW M5 CS Frozen Deep Green',
    subtitle: 'Bronze Accents & Carbon Bonnet · Exclusive 1-of-Few Spec',
    image: 'car11.jpg',
    assetPath: '/assets/products/cars/car11.jpg',
    tag: '⚡ Ultra Rare',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },

  // Sports Champions (14)
  {
    id: 'sport-1',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Cristiano Ronaldo — Real Madrid Legend',
    subtitle: 'Iconic UCL celebration · Golden Ballon d’Or details',
    image: 'sport1.jpg',
    assetPath: '/assets/products/sports/sport1.jpg',
    tag: '👑 CR7 Edition',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-2',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Lionel Messi — World Cup Champion',
    subtitle: 'Kissing the FIFA World Cup · Argentina 3rd Star',
    image: 'sport2.jpg',
    assetPath: '/assets/products/sports/sport2.jpg',
    tag: '⭐ World Cup GOAT',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-3',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Cristiano Ronaldo — Al Nassr Era',
    subtitle: 'Yellow & Blue Riyadh night · Siiiuuu celebration',
    image: 'sport3.jpg',
    assetPath: '/assets/products/sports/sport3.jpg',
    tag: '⚡ 900+ Goals',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-4',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Lionel Messi — Inter Miami Pink',
    subtitle: 'MLS Champion · Pink & Black South Beach Edition',
    image: 'sport4.jpg',
    assetPath: '/assets/products/sports/sport4.jpg',
    tag: 'La Pulga Miami',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-5',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Neymar Jr — Santos & Brazil Magic',
    subtitle: 'Joga Bonito flair · Samba skills tribute frame',
    image: 'sport5.jpg',
    assetPath: '/assets/products/sports/sport5.jpg',
    tag: 'Joga Bonito',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-6',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Kylian Mbappé — Real Madrid Galáctico',
    subtitle: 'White shirt Bernabéu debut · Speed of sound artwork',
    image: 'sport6.jpg',
    assetPath: '/assets/products/sports/sport6.jpg',
    tag: '⚡ Bernabéu #9',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-7',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Erling Haaland — Treble Winner',
    subtitle: 'Manchester City goal machine · Meditating pose',
    image: 'sport7.jpg',
    assetPath: '/assets/products/sports/sport7.jpg',
    tag: 'The Viking',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-8',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Jude Bellingham — Hey Jude Celebration',
    subtitle: 'Arms wide open in Madrid · Golden Boy of Europe',
    image: 'sport8.jpg',
    assetPath: '/assets/products/sports/sport8.jpg',
    tag: 'Belligol Belligol',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-9',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Zinedine Zidane — 2002 Glasgow Volley',
    subtitle: 'The greatest volley in UCL history · Pure elegance',
    image: 'sport9.jpg',
    assetPath: '/assets/products/sports/sport9.jpg',
    tag: 'Masterclass',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-10',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Ronaldinho Gaucho — Bernabéu Ovation',
    subtitle: 'Pure smile, pure football · Legendary El Clásico moment',
    image: 'sport10.jpg',
    assetPath: '/assets/products/sports/sport10.jpg',
    tag: 'O Bruxo',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-11',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Virat Kohli — King Kohli Century Roar',
    subtitle: 'India blue · Chasing masterclass roar tribute',
    image: 'sport11.jpg',
    assetPath: '/assets/products/sports/sport11.jpg',
    tag: '👑 King of Chase',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-12',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'MS Dhoni — 2011 World Cup Winning Six',
    subtitle: 'Dhoni finishes off in style · Wankhede golden memory',
    image: 'sport12.jpg',
    assetPath: '/assets/products/sports/sport12.jpg',
    tag: 'Captain Cool #7',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-13',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Rohit Sharma — Hitman World Cup T20',
    subtitle: 'Barbados trophy lift · Indian captain glory',
    image: 'sport13.jpg',
    assetPath: '/assets/products/sports/sport13.jpg',
    tag: 'Hitman Champion',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-14',
    category: 'sports',
    categoryLabel: 'Sports Legends',
    title: 'Michael Jordan — 1988 Slam Dunk Flight',
    subtitle: 'Free throw line Jumpman flight · Chicago Bulls #23',
    image: 'sport14.jpg',
    assetPath: '/assets/products/sports/sport14.jpg',
    tag: 'Air Jordan #23',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },

  // Ready Names & Faith (11)
  {
    id: 'name-1',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Bismillah Calligraphy — Classic Gold',
    subtitle: 'In the name of Allah · Thuluth Script on Silk Canvas',
    image: 'name1.jpg',
    assetPath: '/assets/products/names/name1.jpg',
    tag: '✦ Sacred Faith',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-2',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Ayat al-Kursi — Royal Medallion',
    subtitle: 'The Throne Verse · Museum archival gold leaf print',
    image: 'name2.jpg',
    assetPath: '/assets/products/names/name2.jpg',
    tag: '👑 Bestseller',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-3',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Muhammad (PBUH) Calligraphy',
    subtitle: 'The Seal of Prophets · Elegant Diwani calligraphy circle',
    image: 'name3.jpg',
    assetPath: '/assets/products/names/name3.jpg',
    tag: '✦ Sacred Faith',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-4',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Allah — Divine Majesty Gold',
    subtitle: 'The Greatest Name · Deep emerald and pure gold leaf',
    image: 'name4.jpg',
    assetPath: '/assets/products/names/name4.jpg',
    tag: '✦ Sacred Faith',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-5',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Inna Ma’al Usri Yusra — Solace Verse',
    subtitle: 'Verily with hardship comes ease · Minimalist Kufic',
    image: 'name5.jpg',
    assetPath: '/assets/products/names/name5.jpg',
    tag: 'Daily Peace',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-6',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'SubhanAllah, Alhamdulillah, Allahu Akbar',
    subtitle: 'The Three Glorifications · Triptych layout on parchment',
    image: 'name6.jpg',
    assetPath: '/assets/products/names/name6.jpg',
    tag: 'Tasbeeh Set',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-7',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Hasbunallahu Wa Ni’mal Wakeel',
    subtitle: 'Allah is sufficient for us · Classical gold Thuluth',
    image: 'name7.jpg',
    assetPath: '/assets/products/names/name7.jpg',
    tag: 'Trust & Faith',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-8',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Surah Al-Ikhlas Medallion',
    subtitle: 'The Purity of Faith · Concentric Ottoman calligraphy',
    image: 'name8.jpg',
    assetPath: '/assets/products/names/name8.jpg',
    tag: 'Ottoman Art',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-9',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Al-Rahman — The Most Merciful',
    subtitle: 'Divine Name on Persian Damask Blue Archival Mat',
    image: 'name9.png',
    assetPath: '/assets/products/names/name9.png',
    tag: 'Divine Mercy',
    tagClass: 'classic',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-10',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Sabr & Shukr — Patience & Gratitude',
    subtitle: 'Dual Virtue Frame · Modern Arabic Typography on Black',
    image: 'name10.jpg',
    assetPath: '/assets/products/names/name10.jpg',
    tag: 'Daily Reminders',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'name-11',
    category: 'names',
    categoryLabel: 'Faith & Names',
    title: 'Kun Faya Kun — Be, and it is',
    subtitle: 'Sacred Creation Command · Radiant gold calligraphy',
    image: 'name11.jpg',
    assetPath: '/assets/products/names/name11.jpg',
    tag: '✦ Sacred Faith',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },

  // Pop Culture (2)
  {
    id: 'sport-16',
    category: 'pop',
    categoryLabel: 'Pop Culture',
    title: 'Spider-Man Across the Spider-Verse',
    subtitle: 'Miles Morales leap in Brooklyn · Comic art frame',
    image: 'sport16.jpg',
    assetPath: '/assets/products/pop-culture/sport16.jpg',
    tag: 'Marvel Edition',
    tagClass: 'popular',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
  {
    id: 'sport-18',
    category: 'pop',
    categoryLabel: 'Pop Culture',
    title: 'Lewis Hamilton — 7X F1 World Champion',
    subtitle: 'Still We Rise tribute · Mercedes Petronas silver & teal',
    image: 'sport18.jpg',
    assetPath: '/assets/products/pop-culture/sport18.jpg',
    tag: 'F1 King #44',
    tagClass: 'gold',
    price: 499,
    depositPrice: 49,
    codPrice: 450,
  },
];

// 7. Curated Lookbook Real Works
export const LOOKBOOK_ITEMS: LookbookItem[] = [
  {
    id: 'lookbook-1',
    image: '/assets/frames/frame1.jpg',
    title: 'Fatima — Red Persian Frame',
    caption: 'Bedside tabletop placement with natural morning light',
  },
  {
    id: 'lookbook-2',
    image: '/assets/gallery/frame1.jpg',
    title: 'Omar — Blue Oriental Frame',
    caption: 'Living room wall art paired with minimalist aesthetic',
  },
  {
    id: 'lookbook-3',
    image: '/assets/designs/design1.jpg',
    title: 'Aisha — Royal Crimson Frame',
    caption: 'Wedding anniversary gift presented in luxury packaging',
  },
  {
    id: 'lookbook-4',
    image: '/assets/designs/design2.jpg',
    title: 'Zayd — Emerald Court Frame',
    caption: 'Study library desk frame with solid matte black moulding',
  },
];

// 8. How It Works Steps
export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: 1,
    title: 'Pick Your Design',
    description:
      'Browse our collection of authentic Persian and oriental frame designs. Every piece is hand-finished with premium detail.',
    icon: '🎨',
  },
  {
    number: 2,
    title: 'Add Your Name',
    description:
      'Type the name in English or Arabic. Our live preview shows you exactly how it will look on your chosen art background.',
    icon: '✒️',
  },
  {
    number: 3,
    title: 'Handcrafted & Delivered',
    description:
      'Pay ₹49 booking deposit now. We custom-make your A4 frame, dispatch via express air courier, and you pay ₹450 COD on delivery.',
    icon: '📦',
  },
];

// 9. Customer Testimonials & Reviews
export const REVIEWS_SUMMARY = {
  score: 4.9,
  stars: 5,
  totalBuyers: '540+ Verified Buyers',
  fiveStarPercent: 94,
  fourStarPercent: 6,
  features: [
    '✦ 100% Handcrafted: Archival 300 GSM Art',
    '🛡️ Transit Safe: Shatterproof Acrylic Glass',
    '🎁 Gift Delight: 98.6% Would Gift Again',
  ],
};

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'rev-1',
    name: 'Ayesha K.',
    location: 'Hyderabad, Telangana',
    avatar: 'A',
    stars: 5,
    verified: true,
    text: '"The frame arrived beautifully wrapped and the calligraphy is even sharper in person. My mom cried when she saw her name in Arabic. Absolute perfection!"',
    productTag: 'Red Persian Carpet Frame',
    deliveredDate: 'Delivered 3 days ago · Hyderabad',
    photoThumb: '/assets/frames/frame1.jpg',
  },
  {
    id: 'rev-2',
    name: 'Omar R.',
    location: 'Bangalore, Karnataka',
    avatar: 'O',
    stars: 5,
    verified: true,
    text: '"Ordered this for my brother\'s wedding gift. The matte black frame has real physical weight, the crystal glass is super clear, and the rug colors are rich."',
    productTag: 'Blue Oriental & Floral Frame',
    deliveredDate: 'Delivered 5 days ago · Bangalore',
    photoThumb: '/assets/gallery/frame1.jpg',
  },
  {
    id: 'rev-3',
    name: 'Aisha M.',
    location: 'Mumbai, Maharashtra',
    avatar: 'A',
    stars: 5,
    verified: true,
    text: '"I was nervous ordering online, but the live customizer preview matched the delivered frame 100%. Free remake guarantee made me order with total peace of mind."',
    productTag: 'Purple Floral Butterfly Frame',
    deliveredDate: 'Delivered Yesterday · Mumbai',
    photoThumb: '/assets/designs/design1.jpg',
  },
  {
    id: 'rev-4',
    name: 'Zayd F.',
    location: 'Srinagar, Jammu & Kashmir',
    avatar: 'Z',
    stars: 5,
    verified: true,
    text: '"The transit packaging was impenetrable — 4 layers of bubble and rigid cardboard. The gold foil ink glints under desk lamp light so elegantly."',
    productTag: 'Antique Gold Medallion Frame',
    deliveredDate: 'Delivered 1 week ago · Kashmir',
    photoThumb: '/assets/designs/design2.jpg',
  },
];

// 10. Brand Story
export const STORY_DATA = {
  eyebrow: 'Our Story',
  title: 'Crafted with intention, framed with love.',
  paragraphs: [
    'NAMORA began with a simple belief — that a name is more than a word. It carries identity, memory, and meaning. Every frame we create is a small tribute to the people who matter most.',
    'Each piece is hand-finished on authentic Persian and oriental aesthetic backgrounds, carefully selected for their warmth and texture. From the first sketch to the final wrap, everything is done with intention.',
    'Whether it\'s a gift for a newborn, a milestone, or a home you\'re building — we\'re honored to be a small part of your story.',
  ],
  specs: [
    {
      icon: '🪵',
      name: 'Matte Black Frame',
      detail: 'Solid engineered wood with satin luxury finish',
    },
    {
      icon: '✦',
      name: 'Crystal Acrylic',
      detail: 'Shatterproof, ultra-clear & safe in transit',
    },
    {
      icon: '⚙',
      name: 'Dual Display',
      detail: 'Wall hook + desktop easel stand included',
    },
    {
      icon: '✒',
      name: '300 GSM Archival',
      detail: 'Heavyweight textured paper & rich fade-proof ink',
    },
  ],
  imageAsset: '/assets/frames/frame1.jpg',
};

// 11. Frequently Asked Questions
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'What size is the frame?',
    answer:
      'Every NAMORA frame is a standard A4 size (21 × 29.7 cm), ready to hang on any wall or display on a shelf. It\'s the perfect size for gifting and fits standard A4 photo frames if you ever want to swap it.',
  },
  {
    id: 'faq-2',
    question: 'Can I write the name in Arabic?',
    answer:
      'Yes! We support both English and Arabic calligraphy. When you select Arabic, we auto-suggest the spelling from a built-in dictionary — you can then edit it freely to match your exact preferred spelling before ordering.',
  },
  {
    id: 'faq-3',
    question: 'How does the ₹49 payment work?',
    answer:
      'Pay just ₹49 today to confirm your order and start production. The remaining ₹450 is paid as Cash on Delivery (COD) when the frame reaches your doorstep. Total: ₹499 with free Pan-India delivery.',
  },
  {
    id: 'faq-4',
    question: 'How long does delivery take?',
    answer:
      'Since each frame is custom-made with your name, production takes 2–3 business days. Delivery across India usually takes another 3–6 business days depending on your PIN code. You\'ll receive live tracking details via SMS and WhatsApp once shipped.',
  },
  {
    id: 'faq-5',
    question: 'Can I change my order after placing it?',
    answer:
      'Yes — as long as production hasn\'t started. Contact us via WhatsApp or email within 24 hours of ordering with your order name and mobile number, and we\'ll update the name, spelling, or design for you immediately.',
  },
  {
    id: 'faq-6',
    question: 'Is the frame handmade?',
    answer:
      'Absolutely. Each frame is hand-finished on authentic Persian and oriental aesthetic backgrounds. Small variations in texture and color are part of what makes every piece unique — no two frames are ever exactly the same.',
  },
];

// 12. Contact & Concierge Information
export const CONTACT_DATA = {
  title: "Questions? We're Here.",
  subtitle: 'Ask us anything about your order, custom requests, or bulk gifting — we usually reply within a few hours.',
  whatsappPhone: '+91 9305654028',
  whatsappUrl: 'https://wa.me/919305654028?text=Hi%20NAMORA%2C%20I%20have%20a%20question',
  instagramHandle: '@namoraworld',
  instagramUrl: 'https://www.instagram.com/namoraworld/',
  email: 'hello@namora.in',
};

// 13. Footer Links
export const FOOTER_DATA = {
  shopLinks: [
    { label: 'Collection', href: '#designs' },
    { label: 'Customize', href: '#create' },
    { label: 'Ready Stock ⚡', href: '#ready-to-ship' },
    { label: 'Real Works', href: '#gallery' },
    { label: 'How It Works', href: '#how-it-works' },
  ],
  supportLinks: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Our Story', href: '#about' },
    { label: 'Contact Us', href: '#contact' },
    { label: 'Track Order', href: '/track-order' },
  ],
  legalLinks: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Shipping & Remake Policy', href: '#' },
  ],
};
