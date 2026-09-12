'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  Button,
  IconButton,
  Badge,
  Pill,
  Card,
  SectionHeading,
  Divider,
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Modal,
  Drawer,
  Toast,
  ToastType,
  Skeleton,
  EmptyState,
  ErrorState,
  PriceDisplay,
  QuantityControl,
} from '@/components/ui';

export default function DesignSystemPage() {
  // Interactive state demos
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<ToastType>('success');
  const [quantity, setQuantity] = useState(1);
  const [selectedPill, setSelectedPill] = useState('gold');
  const [radioValue, setRadioValue] = useState('cod');
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [arabicInput, setArabicInput] = useState('نَمُورَة');

  const frameOptions = [
    { value: 'compact', label: 'Compact 6x8 inches (Tabletop)' },
    { value: 'medium', label: 'Gallery 8x10 inches (Wall & Desk)' },
    { value: 'grand', label: 'Grand Royale 12x16 inches (Statement Piece)' },
  ];

  return (
    <div className="min-h-screen bg-namora-bg text-namora-ink transition-colors duration-300">
      {/* Top Bar / Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-namora-line bg-namora-bg/85 backdrop-blur-md">
        <Container width="wide" className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-luxury text-xl font-bold tracking-[0.25em] text-namora-gold hover:text-namora-gold-hover transition"
            >
              NAMORA
            </Link>
            <span className="text-namora-line">/</span>
            <span className="text-xs uppercase tracking-widest font-mono text-namora-muted">
              Design System
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="gold">Phase 4 Specification</Badge>
            <ThemeToggle />
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="py-12 space-y-16">
        {/* Intro Section */}
        <Container width="wide">
          <div className="border border-namora-line bg-namora-card/60 p-8 sm:p-12 rounded-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <span className="text-xs font-mono tracking-widest uppercase text-namora-gold font-semibold">
                Foundation Architecture & Living Showcase
              </span>
              <h1 className="text-3xl sm:text-5xl font-hero font-medium tracking-tight text-namora-ink mt-2 mb-4">
                NAMORA Luxury Design System
              </h1>
              <p className="text-namora-muted text-sm sm:text-base leading-relaxed font-light">
                A centralized, accessible, token-driven component library engineered for high-ticket artisanal
                custom Arabic calligraphy frames. Built with Tailwind CSS, CSS Custom Properties, and React 18
                primitives with seamless dark/light luxury modes.
              </p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-namora-gold/10 to-transparent pointer-events-none" />
          </div>
        </Container>

        {/* Section 1: Color Palette */}
        <Section width="wide">
          <SectionHeading
            align="left"
            eyebrow="Tokens"
            title="1. Color Tokens & Theme Architecture"
            subtitle="Dynamic CSS variables supporting zero-layout-shift dark and light themes"
          />
          <div className="space-y-8">
            {/* Backgrounds & Surfaces */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Surfaces & Backgrounds
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ColorSwatch name="namora-bg" bgClass="bg-namora-bg" label="Page Canvas" />
                <ColorSwatch name="namora-soft" bgClass="bg-namora-soft" label="Soft / Secondary" />
                <ColorSwatch name="namora-card" bgClass="bg-namora-card" label="Card / Panel" />
                <ColorSwatch name="namora-card-muted" bgClass="bg-namora-card-muted" label="Subtle Inset" />
              </div>
            </div>

            {/* Typography / Ink */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Typography / Ink Shades
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <ColorSwatch name="namora-ink" bgClass="bg-namora-ink" label="Primary Heading / Ink" lightText />
                <ColorSwatch name="namora-ink-soft" bgClass="bg-namora-ink-soft" label="Secondary Ink" lightText />
                <ColorSwatch name="namora-muted" bgClass="bg-namora-muted" label="Muted / Metadata" lightText />
              </div>
            </div>

            {/* Accents & Brand Gold */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Brand Luxury Gold & Accents
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <ColorSwatch name="namora-gold" bgClass="bg-namora-gold" label="Primary Gold Accent" lightText />
                <ColorSwatch name="namora-gold-hover" bgClass="bg-namora-gold-hover" label="Gold Hover" lightText />
                <ColorSwatch name="namora-gold-soft" bgClass="bg-namora-gold-soft" label="Gold Tint / Glow" />
              </div>
            </div>

            {/* Borders & Lines */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Structure & Borders
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <ColorSwatch name="namora-line" bgClass="bg-namora-line" label="Structural Divider" />
                <ColorSwatch name="namora-line-soft" bgClass="bg-namora-line-soft" label="Subtle Border" />
              </div>
            </div>

            {/* Semantic Feedback */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Feedback & Status Tokens
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ColorSwatch name="namora-success" bgClass="bg-namora-success" label="Success (#10B981)" lightText />
                <ColorSwatch name="namora-warning" bgClass="bg-namora-warning" label="Warning (#F59E0B)" lightText />
                <ColorSwatch name="namora-error" bgClass="bg-namora-error" label="Error (#EF4444)" lightText />
              </div>
            </div>
          </div>
        </Section>

        {/* Section 2: Typography Scale */}
        <Section width="wide">
          <SectionHeading
            align="left"
            eyebrow="Typography"
            title="2. Typography System & Hierarchy"
            subtitle="Pairing classic Serif authority with modern Swiss clarity and authentic Arabic calligraphy"
          />
          <div className="space-y-6">
            <div className="p-6 border border-namora-line rounded-xl bg-namora-card space-y-6">
              <div>
                <span className="text-[11px] font-mono text-namora-gold uppercase tracking-widest">
                  Hero Serif &mdash; Playfair Display (font-hero)
                </span>
                <p className="text-3xl sm:text-4xl font-hero font-medium text-namora-ink mt-1">
                  Artisanal Arabic Calligraphy, Crafted for Eternity
                </p>
              </div>

              <Divider />

              <div>
                <span className="text-[11px] font-mono text-namora-gold uppercase tracking-widest">
                  Luxury Display &mdash; Cinzel (font-luxury)
                </span>
                <p className="text-xl sm:text-2xl font-luxury tracking-[0.2em] uppercase text-namora-ink mt-1">
                  THE ROYAL COUTURE COLLECTION
                </p>
              </div>

              <Divider />

              <div>
                <span className="text-[11px] font-mono text-namora-gold uppercase tracking-widest">
                  Functional Sans &mdash; System UI Sans (font-sans)
                </span>
                <p className="text-sm sm:text-base font-sans text-namora-muted leading-relaxed mt-1 font-light">
                  Every stroke is handcrafted by master calligraphers and embedded in museum-grade acrylic glass,
                  ensuring a lifetime of radiant elegance in your sacred space.
                </p>
              </div>

              <Divider />

              <div>
                <span className="text-[11px] font-mono text-namora-gold uppercase tracking-widest">
                  Tabular & Financial &mdash; Monospace (font-mono)
                </span>
                <p className="text-sm font-mono text-namora-ink mt-1">
                  SKU: NMR-GLD-049 &bull; TOKEN: 0x7F4A...8B &bull; PRICE: ₹499.00 INR
                </p>
              </div>
            </div>

            {/* Arabic Showcase */}
            <div className="p-6 border border-namora-gold/30 bg-namora-gold-soft/30 rounded-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-namora-gold uppercase tracking-widest font-semibold">
                    Arabic Typography Engine (RTL Native)
                  </span>
                  <p className="text-xs text-namora-muted mt-0.5">
                    Rendered with Amiri (classical Naskh) and Reem Kufi (modern architectural Kufic)
                  </p>
                </div>
                <Badge variant="gold">RTL Ready</Badge>
              </div>

              <div dir="rtl" className="space-y-4 text-right">
                <div>
                  <span className="text-[11px] font-mono text-namora-muted block mb-1">
                    Amiri (Body & Calligraphy preview &mdash; .font-arabic)
                  </span>
                  <p className="font-arabic text-3xl sm:text-4xl text-namora-ink leading-loose">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </p>
                  <p className="font-arabic text-xl sm:text-2xl text-namora-gold mt-2">
                    نَمُورَة &mdash; هدايا فنية فاخرة منقوشة يدويًا بالذهب الخالص
                  </p>
                </div>

                <div className="pt-4 border-t border-namora-line-soft">
                  <span className="text-[11px] font-mono text-namora-muted block mb-1">
                    Reem Kufi (Geometric Display & Headings &mdash; .font-arabic-display)
                  </span>
                  <p className="font-arabic-display text-2xl sm:text-3xl text-namora-ink font-medium tracking-wide">
                    إِنَّ مَعَ الْعُسْرِ يُسْرًا
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Section 3: Buttons & Interactive Action Primitives */}
        <Section width="wide">
          <SectionHeading
            align="left"
            eyebrow="Actions"
            title="3. Buttons & Action Controls"
            subtitle="Tactile micro-interactions with loading states, sizes, and icon pairings"
          />
          <div className="p-6 border border-namora-line rounded-xl bg-namora-card space-y-6">
            {/* Variants */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Variants
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary (Gold)</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Destructive</Button>
                <Button variant="success">Success Action</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Sizes
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">Small (sm)</Button>
                <Button variant="primary" size="md">Medium (md)</Button>
                <Button variant="primary" size="lg">Large Hero (lg)</Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                States & Icons
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" isLoading>Processing Order</Button>
                <Button variant="outline" disabled>Disabled State</Button>
                <Button
                  variant="primary"
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  }
                >
                  Add to Cart
                </Button>
                <IconButton label="Bookmark" variant="outline" size="md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </IconButton>
              </div>
            </div>
          </div>
        </Section>

        {/* Section 4: Badges & Pills */}
        <Section width="wide">
          <SectionHeading
            align="left"
            eyebrow="Indicators"
            title="4. Badges & Filter Pills"
            subtitle="Metadata indicators, stock statuses, and interactive filter controls"
          />
          <div className="p-6 border border-namora-line rounded-xl bg-namora-card space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Badges
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Default Neutral</Badge>
                <Badge variant="gold">Artisanal 24K Gold</Badge>
                <Badge variant="success">In Stock &bull; Ready</Badge>
                <Badge variant="warning">Limited 3 Left</Badge>
                <Badge variant="error">Sold Out</Badge>
                <Badge variant="neutral">Acrylic Glass 8x10</Badge>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted mb-3">
                Interactive Selectable Pills
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {['gold', 'silver', 'rose-gold', 'obsidian'].map((pill) => (
                  <Pill
                    key={pill}
                    active={selectedPill === pill}
                    onClick={() => setSelectedPill(pill)}
                  >
                    {pill.replace('-', ' ').toUpperCase()}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Section 5: Form Controls & Inputs */}
        <Section width="wide">
          <SectionHeading
            align="left"
            eyebrow="Forms"
            title="5. Form Controls & Precision Fields"
            subtitle="Designed for luxury customizer input, bilingual validation, and checkout fields"
          />
          <div className="p-6 border border-namora-line rounded-xl bg-namora-card space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Customer Full Name" helperText="As it will appear on shipping bill">
                <Input placeholder="e.g. Zaid Mansoori" defaultValue="Mohammad Zaid" />
              </Field>

              <Field label="Arabic Calligraphy Inscription" helperText="Previewed live on acrylic plate" required>
                <Input
                  dir="rtl"
                  className="font-arabic text-lg"
                  value={arabicInput}
                  onChange={(e) => setArabicInput(e.target.value)}
                  placeholder="اكتب الاسم هنا"
                />
              </Field>

              <Field label="Phone / WhatsApp Number" error="Please enter a valid 10-digit Indian phone number">
                <Input placeholder="98765 43210" defaultValue="9876" error />
              </Field>

              <Field label="Frame Size Option">
                <Select options={frameOptions} defaultValue="medium" />
              </Field>
            </div>

            <Field label="Special Gifting Note (Handwritten Card)">
              <Textarea placeholder="Write your heartfelt message here for the recipient..." rows={3} />
            </Field>

            <div className="pt-4 border-t border-namora-line-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <Checkbox
                  id="demo-checkbox"
                  label="Include complimentary luxury gift velvet box"
                  checked={checkboxChecked}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                />
              </div>

              <div className="flex items-center gap-4">
                <Radio
                  id="radio-cod"
                  name="payment"
                  label="Cash on Delivery (₹49 advance)"
                  checked={radioValue === 'cod'}
                  onChange={() => setRadioValue('cod')}
                />
                <Radio
                  id="radio-prepaid"
                  name="payment"
                  label="Full Prepaid (Razorpay)"
                  checked={radioValue === 'prepaid'}
                  onChange={() => setRadioValue('prepaid')}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Section 6: Cards & Surfaces */}
        <Section width="wide">
          <SectionHeading
            align="left"
            eyebrow="Surfaces"
            title="6. Cards & Structural Containers"
            subtitle="Varied visual weights for products, reviews, and editorial features"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="standard" className="p-6">
              <Badge variant="default" className="mb-2">Standard Card</Badge>
              <h4 className="font-hero text-lg font-medium text-namora-ink mb-1">Standard Surface</h4>
              <p className="text-xs text-namora-muted font-light leading-relaxed">
                Used for structural sidebars, secondary content panels, and subtle grouping containers.
              </p>
            </Card>

            <Card variant="elevated" className="p-6">
              <Badge variant="gold" className="mb-2">Elevated Card</Badge>
              <h4 className="font-hero text-lg font-medium text-namora-ink mb-1">Elevated Surface</h4>
              <p className="text-xs text-namora-muted font-light leading-relaxed">
                Higher depth with custom luxury drop-shadow, perfect for active checkout steps and modals.
              </p>
            </Card>

            <Card variant="glass" className="p-6">
              <Badge variant="neutral" className="mb-2">Glass Surface</Badge>
              <h4 className="font-hero text-lg font-medium text-namora-ink mb-1">Glassmorphism</h4>
              <p className="text-xs text-namora-muted font-light leading-relaxed">
                Backdrop-filter blur with subtle gold perimeter highlight mimicking polished acrylic glass.
              </p>
            </Card>
          </div>
        </Section>

        {/* Section 7: E-Commerce Specific Primitives */}
        <Section width="wide">
          <SectionHeading
            align="left"
            eyebrow="Commerce"
            title="7. E-Commerce Display & Cart Primitives"
            subtitle="Precision price formatting, COD deposit breakdown, and quantity management"
          />
          <div className="p-6 border border-namora-line rounded-xl bg-namora-card space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-[11px] font-mono text-namora-muted block mb-1">Standard Price</span>
                <PriceDisplay price={499} size="md" />
              </div>

              <div>
                <span className="text-[11px] font-mono text-namora-muted block mb-1">Discounted Price</span>
                <PriceDisplay price={499} originalPrice={999} size="lg" />
              </div>

              <div>
                <span className="text-[11px] font-mono text-namora-muted block mb-1">COD Advance Split</span>
                <PriceDisplay price={499} depositAmount={49} showDepositBadge size="lg" />
              </div>
            </div>

            <Divider />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-namora-ink">Interactive Quantity Selector</h4>
                <p className="text-xs text-namora-muted">Ensures min 1, max 10 constraints with keyboard navigation</p>
              </div>
              <QuantityControl
                quantity={quantity}
                onIncrement={() => setQuantity((q) => Math.min(10, q + 1))}
                onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
              />
            </div>
          </div>
        </Section>

        {/* Section 8: Loading, Empty & Error States */}
        <Section width="wide">
          <SectionHeading
            align="left"
            eyebrow="States"
            title="8. States & Feedback Systems"
            subtitle="Graceful fallbacks, loading skeletons, and interactive modal/drawer triggers"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-namora-line rounded-xl bg-namora-card space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted">
                Skeleton Placeholders
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton shape="circle" className="w-10 h-10" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-28 w-full" />
              </div>
            </div>

            <div className="p-6 border border-namora-line rounded-xl bg-namora-card flex flex-col justify-center">
              <EmptyState
                title="Your Cart is Empty"
                description="Explore our artisanal collection and customize your bespoke calligraphy masterpiece."
                actionLabel="Explore Catalog"
                onAction={() => alert('Navigate to products')}
              />
            </div>

            <div className="p-6 border border-namora-line rounded-xl bg-namora-card flex flex-col justify-center">
              <ErrorState
                title="Payment Synchronization Error"
                message="Unable to verify signature with Razorpay gateway. Please retry or choose Cash on Delivery."
                onRetry={() => alert('Retry clicked')}
              />
            </div>

            <div className="p-6 border border-namora-line rounded-xl bg-namora-card space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-mono text-namora-muted">
                Interactive Overlays & Notifications
              </h4>
              <p className="text-xs text-namora-muted font-light leading-relaxed">
                Test modal dialogues, slide-over cart drawers, and toast notifications.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                  Open Modal Demo
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
                  Open Drawer Demo
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setToastVariant('success');
                    setToastOpen(true);
                  }}
                >
                  Show Success Toast
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </main>

      {/* Interactive Modal Demo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Customization Details"
        description="Verify the calligraphy plate specifications before proceeding"
      >
        <div className="space-y-4">
          <div className="p-4 bg-namora-soft rounded-lg border border-namora-line-soft">
            <p className="text-xs font-mono text-namora-gold mb-1">SELECTED INSCRIPTION</p>
            <p className="text-2xl font-arabic text-namora-ink text-right" dir="rtl">{arabicInput}</p>
          </div>
          <p className="text-xs text-namora-muted leading-relaxed">
            All handcrafted orders include our hallmark certificate of authenticity and 1-year anti-fading acrylic guarantee.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
              Confirm & Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Interactive Drawer Demo */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Shopping Cart"
        badge="1 Item"
        footer={
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-namora-muted">Subtotal</span>
              <span className="font-semibold text-namora-ink">₹499</span>
            </div>
            <div className="flex items-center justify-between text-xs text-namora-gold font-mono">
              <span>Advance to Pay Now</span>
              <span>₹49</span>
            </div>
            <Button variant="primary" size="md" className="w-full">
              Proceed to Checkout
            </Button>
          </div>
        }
      >
        <div className="p-4 border border-namora-line rounded-lg bg-namora-soft flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-namora-ink">Royal Gold Calligraphy Frame</h5>
            <span className="text-xs text-namora-muted font-mono">8x10 &bull; 24K Leaf</span>
            <div className="mt-2">
              <PriceDisplay price={499} size="sm" />
            </div>
          </div>
          <QuantityControl
            quantity={quantity}
            onIncrement={() => setQuantity((q) => Math.min(10, q + 1))}
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
          />
        </div>
      </Drawer>

      {/* Interactive Toast Demo */}
      <Toast
        isVisible={toastOpen}
        onDismiss={() => setToastOpen(false)}
        type={toastVariant}
        message="Bespoke Gold Calligraphy frame was successfully added to your order."
      />

      {/* Footer */}
      <footer className="border-t border-namora-line py-8 mt-16 bg-namora-card/40">
        <Container width="wide" className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-namora-muted">
          <p>&copy; {new Date().getFullYear()} NAMORA. All rights reserved.</p>
          <div className="flex items-center gap-4 font-mono">
            <span>Next.js 14 App Router</span>
            <span>&bull;</span>
            <span>Tailwind CSS</span>
            <span>&bull;</span>
            <span>TypeScript 5.6</span>
          </div>
        </Container>
      </footer>
    </div>
  );
}

function ColorSwatch({
  name,
  bgClass,
  label,
  lightText = false,
}: {
  name: string;
  bgClass: string;
  label: string;
  lightText?: boolean;
}) {
  return (
    <div className="border border-namora-line rounded-lg overflow-hidden bg-namora-card">
      <div className={`h-16 w-full ${bgClass} border-b border-namora-line/50 flex items-center justify-center`}>
        <span className={`text-[10px] font-mono font-bold ${lightText ? 'text-black/80' : 'text-namora-ink'}`}>
          {name}
        </span>
      </div>
      <div className="p-3">
        <p className="text-xs font-mono font-semibold text-namora-ink truncate">{name}</p>
        <p className="text-[11px] text-namora-muted truncate">{label}</p>
      </div>
    </div>
  );
}
