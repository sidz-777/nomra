'use client';

import React from 'react';
import { CheckoutFormData } from '@/lib/checkout/checkout-types';
import { Field, Input } from '@/components/ui';

interface CustomerDetailsFormProps {
  formData: CheckoutFormData;
  errors: Record<string, string>;
  onChange: (updates: Partial<CheckoutFormData>) => void;
  disabled?: boolean;
}

export function CustomerDetailsForm({
  formData,
  errors,
  onChange,
  disabled = false,
}: CustomerDetailsFormProps) {
  return (
    <div className="space-y-6">
      {/* 1. Contact Information */}
      <div className="p-5 sm:p-6 rounded-2xl border border-namora-line bg-namora-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-namora-line-soft">
          <span className="w-6 h-6 rounded-full bg-namora-gold/20 text-namora-gold text-xs font-mono font-bold flex items-center justify-center">
            1
          </span>
          <h3 className="font-hero text-base sm:text-lg font-medium text-namora-ink">
            Customer &amp; Contact Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *" error={errors.name}>
            <Input
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Tariq Mansoor"
              disabled={disabled}
              required
            />
          </Field>

          <Field label="Mobile Number (for Courier Tracking & Delivery) *" error={errors.phone}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-namora-muted select-none">
                +91
              </span>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => onChange({ phone: e.target.value.replace(/\D/g, '') })}
                placeholder="9876543210"
                className="pl-11 font-mono"
                disabled={disabled}
                required
              />
            </div>
          </Field>
        </div>

        <Field label="Email Address (Optional, for Invoice & Receipts)" error={errors.email}>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="e.g. yourname@example.com"
            disabled={disabled}
          />
        </Field>
      </div>

      {/* 2. Delivery Address */}
      <div className="p-5 sm:p-6 rounded-2xl border border-namora-line bg-namora-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-namora-line-soft">
          <span className="w-6 h-6 rounded-full bg-namora-gold/20 text-namora-gold text-xs font-mono font-bold flex items-center justify-center">
            2
          </span>
          <h3 className="font-hero text-base sm:text-lg font-medium text-namora-ink">
            Delivery &amp; Shipping Address
          </h3>
        </div>

        <Field label="Complete Street Address (Flat / House No., Building, Street) *" error={errors.addressLine1}>
          <Input
            value={formData.addressLine1}
            onChange={(e) => onChange({ addressLine1: e.target.value })}
            placeholder="e.g. House No. 42, Gulshan Colony, Ring Road"
            disabled={disabled}
            required
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Apartment, Suite, Unit (Optional)">
            <Input
              value={formData.addressLine2}
              onChange={(e) => onChange({ addressLine2: e.target.value })}
              placeholder="e.g. Block C, Flat 302"
              disabled={disabled}
            />
          </Field>

          <Field label="Nearby Landmark (Optional)">
            <Input
              value={formData.landmark}
              onChange={(e) => onChange({ landmark: e.target.value })}
              placeholder="e.g. Near Grand Mosque"
              disabled={disabled}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="PIN Code *" error={errors.pincode}>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => onChange({ pincode: e.target.value.replace(/\D/g, '') })}
              placeholder="e.g. 110001"
              className="font-mono text-center tracking-widest"
              disabled={disabled}
              required
            />
          </Field>

          <Field label="City *" error={errors.city}>
            <Input
              value={formData.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="e.g. Lucknow"
              disabled={disabled}
              required
            />
          </Field>

          <Field label="State / UT *" error={errors.state}>
            <Input
              value={formData.state}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="e.g. Uttar Pradesh"
              disabled={disabled}
              required
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
