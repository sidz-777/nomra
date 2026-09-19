/**
 * Privacy-preserving masking utilities for customer PII in notifications and public APIs.
 */

export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '***';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  const last4 = digits.slice(-4);
  const first2 = digits.slice(0, 2);
  return `+91 ${first2}*** **${last4.slice(2)}`;
}

export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '***@***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user.charAt(0)}***@${domain}`;
  }
  return `${user.charAt(0)}***${user.charAt(user.length - 1)}@${domain}`;
}

export function maskCustomerName(name?: string | null): string {
  if (!name) return 'Customer';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 1 ? `${p[0]}***` : p))
    .join(' ');
}
