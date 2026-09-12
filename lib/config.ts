/**
 * NAMORA — Type-Safe Configuration & Secrets Gateway
 * Ensures secrets are never leaked to client bundles.
 */

export const PUBLIC_CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pjswdwezptydkbvplxzn.supabase.co',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_K7JPFSjak1F1O7KnykERPA_jkfo9HPq',
  RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_namora_demo',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  WHATSAPP_PHONE: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '919305654028',
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'namora.frames@gmail.com',

  // Official Commercial Pricing Rules
  PRICING: {
    FRAME_BASE_PRICE: 499,
    DEPOSIT_PER_FRAME: 49,
    COD_BALANCE: 450,
    GIFT_PACKAGING_PRICE: 69,
  },
} as const;

/**
 * Server-only secrets accessor.
 * Throws immediately if accessed in browser context.
 */
export function getServerSecrets() {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: Attempted to access server secrets from client browser environment.');
  }

  return {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  };
}
