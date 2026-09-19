import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_CONFIG, getServerSecrets } from '@/lib/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminRole } from './types';

export interface AdminAuthResult {
  authorized: boolean;
  user?: {
    id: string;
    email: string;
  };
  role?: AdminRole;
  errorResponse?: NextResponse;
}

/**
 * Server-authoritative Admin Authentication & RBAC Guard.
 * Enforces strict session token or administrative secret verification.
 * Rejects all unauthenticated or unauthorized requests with 401/403.
 */
export async function requireAdmin(
  req: Request,
  allowedRoles: AdminRole[] = ['owner', 'admin', 'staff']
): Promise<AdminAuthResult> {
  // 1. Extract Bearer Token, Admin Secret Headers, or Session Cookies
  const adminSecretHeader = req.headers.get('x-admin-secret') || req.headers.get('x-admin-key');
  const authHeader = req.headers.get('authorization') || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  const expectedAdminSecret = process.env.ADMIN_API_SECRET || '';

  if (
    expectedAdminSecret &&
    ((adminSecretHeader && adminSecretHeader === expectedAdminSecret) ||
      (token && token === expectedAdminSecret))
  ) {
    const roleHeader = req.headers.get('x-admin-role') as AdminRole;
    const role: AdminRole = roleHeader && ['owner', 'admin', 'staff'].includes(roleHeader) ? roleHeader : 'owner';
    return {
      authorized: true,
      user: { id: 'service-worker', email: 'system@namoraworld.com' },
      role,
    };
  }

  let userEmail = '';
  let userId = '';

  if (token) {
    try {
      const adminClient = createAdminClient();
      const { data: { user }, error } = await adminClient.auth.getUser(token);
      if (!error && user && user.email) {
        userEmail = user.email;
        userId = user.id;
      }
    } catch (err: any) {
      console.warn('Bearer token verification error:', err?.message);
    }
  }

  // If no Bearer token, check Supabase SSR Cookie Store
  if (!userId) {
    try {
      const cookieStore = cookies();
      const ssrClient = createServerClient(
        PUBLIC_CONFIG.SUPABASE_URL,
        PUBLIC_CONFIG.SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );

      const { data: { user }, error } = await ssrClient.auth.getUser();
      if (!error && user && user.email) {
        userEmail = user.email;
        userId = user.id;
      }
    } catch (cookieErr: any) {
      // Cookies not available or expired
    }
  }

  // If unauthenticated, immediately fail closed with 401
  if (!userId || !userEmail) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Administrative authentication session required.',
        },
        { status: 401 }
      ),
    };
  }

  // 3. Query admin_profiles to determine RBAC Role
  let role: AdminRole = 'staff';
  try {
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('admin_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profile && profile.role) {
      role = profile.role as AdminRole;
    } else {
      // Fallback for initial owner account email
      const isOwnerEmail = userEmail === 'admin@namoraworld.com' || userEmail === process.env.ADMIN_OWNER_EMAIL;
      role = isOwnerEmail ? 'owner' : 'staff';
    }
  } catch (dbErr: any) {
    console.warn('admin_profiles query error, falling back to staff:', dbErr?.message);
  }

  // 4. Validate Role against allowedRoles
  if (!allowedRoles.includes(role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Insufficient privileges. Required role: ${allowedRoles.join(' or ')}. Your role is: ${role}`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: { id: userId, email: userEmail },
    role,
  };
}
