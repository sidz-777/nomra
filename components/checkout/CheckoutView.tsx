'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/cart';
import { CheckoutFormData } from '@/lib/checkout/checkout-types';
import {
  validateCheckoutForm,
  generateIdempotencyKey,
} from '@/lib/checkout/checkout-validation';
import { CustomerDetailsForm } from './CustomerDetailsForm';
import { OrderReviewSummary } from './OrderReviewSummary';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui';

export function CheckoutView() {
  const router = useRouter();
  const { items, gift, totals, isHydrated } = useCart();

  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Client idempotency key: persists across re-renders for this checkout session
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  const handleFormChange = (updates: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear relevant error when user types
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(updates).forEach((key) => delete next[key]);
      return next;
    });
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    // 1. Client validation
    const validation = validateCheckoutForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setSubmitError('Please complete all required shipping fields highlighted below.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (items.length === 0) {
      setSubmitError('Your cart is empty. Please customize a frame before placing an order.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
        },
        address: {
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || undefined,
          landmark: formData.landmark.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        items,
        gift,
        idempotencyKey: idempotencyKeyRef.current,
      };

      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create order on server.');
      }

      // Store created order details in sessionStorage for confirmation display
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'namora_last_order',
          JSON.stringify({
            ...data,
            customerName: formData.name.trim(),
            customerPhone: formData.phone.trim(),
            address: payload.address,
            itemsSnapshot: items,
            giftSnapshot: gift,
          })
        );
      }

      // Route to order confirmation page
      router.push(
        `/checkout/confirmation?orderId=${encodeURIComponent(data.orderId)}&orderNumber=${encodeURIComponent(
          data.orderNumber
        )}`
      );
    } catch (err: any) {
      console.error('Checkout error:', err);
      setSubmitError(
        err?.message || 'Network communication error. Please check your connection and try again.'
      );
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <Container width="wide" className="py-16 text-center">
        <div className="w-8 h-8 border-2 border-namora-gold border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-namora-muted mt-3">Loading your cart...</p>
      </Container>
    );
  }

  // Empty cart guard
  if (items.length === 0) {
    return (
      <Container width="default" className="py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-namora-soft border border-namora-line flex items-center justify-center text-3xl mx-auto">
          🖼️
        </div>
        <h2 className="font-hero text-xl sm:text-2xl font-bold text-namora-ink">
          Your Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-namora-muted max-w-sm mx-auto leading-relaxed">
          You haven&apos;t customized any frames yet. Design an authentic Persian calligraphy frame or select a ready-stock edition to get started.
        </p>
        <Link href="/#create" className="inline-block mt-4">
          <Button variant="primary" size="md" className="shadow-luxury">
            Customize a Frame Now &rarr;
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container width="wide" className="py-8 sm:py-12">
      {/* Checkout Step Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-namora-gold uppercase tracking-wider mb-1">
          <Link href="/" className="hover:underline text-namora-muted">
            Home
          </Link>
          <span>&rsaquo;</span>
          <span>Secure Checkout</span>
        </div>
        <h1 className="font-hero text-2xl sm:text-3xl font-bold text-namora-ink">
          Finalize Your Handcrafted Order
        </h1>
        <p className="text-xs sm:text-sm text-namora-muted mt-1">
          Enter your delivery details below. Lock your order with ₹49/frame deposit today; pay the balance on COD upon safe doorstep delivery.
        </p>
      </div>

      {/* Global Submit Error Banner */}
      {submitError && (
        <div className="mb-6 p-4 rounded-xl border border-red-800/50 bg-red-950/40 text-red-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
          <span className="text-base leading-none">⚠️</span>
          <div className="flex-1">
            <strong>Order Submission Note:</strong> {submitError}
          </div>
        </div>
      )}

      {/* Two Column Layout: Form vs Sticky Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customer Details (7 cols) */}
        <div className="lg:col-span-7">
          <CustomerDetailsForm
            formData={formData}
            errors={errors}
            onChange={handleFormChange}
            disabled={isSubmitting}
          />
        </div>

        {/* Right Column: Order Review Summary (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <OrderReviewSummary
            items={items}
            gift={gift}
            totals={totals}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </Container>
  );
}
