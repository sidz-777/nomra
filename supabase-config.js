/**
 * NAMORA — CLIENT CONFIGURATION & PUBLIC PARAMETERS
 * Production-ready configuration.
 * NOTE: Never place secrets (service-role keys, Razorpay secret) in this file!
 */
window.NAMORA_CONFIG = {
  // Production setting: reject localStorage demo bypass in production
  DEMO_ADMIN_MODE: false,

  // Supabase Connection
  SUPABASE_URL: "https://pjswdwezptydkbvplxzn.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_K7JPFSjak1F1O7KnykERPA_jkfo9HPq",

  // Razorpay Public Key ID (Safe for frontend)
  RAZORPAY_KEY_ID: "rzp_test_namora_demo",

  // Official Commercial Pricing Rules
  PRICING: {
    FRAME_BASE_PRICE: 499,
    DEPOSIT_PER_FRAME: 49,
    COD_BALANCE: 450,
    GIFT_PACKAGING_PRICE: 69,
    PREPAID_DISCOUNT: 50
  },

  // Official Channels
  SUPPORT: {
    WHATSAPP_PHONE: "919305654028",
    EMAIL: "namora.frames@gmail.com",
    UPI_ID: "namoraworld@upi"
  }
};

// Backward compatibility alias for legacy scripts
window.NAMORA_SUPABASE_CONFIG = window.NAMORA_CONFIG;
