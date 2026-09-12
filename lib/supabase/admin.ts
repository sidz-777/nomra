import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_CONFIG, getServerSecrets } from '@/lib/config';

/**
 * STRICTLY SERVER-ONLY
 * Service-role client that bypasses Row Level Security.
 * NEVER import or invoke this in client components or browser code.
 */
export function createAdminClient() {
  const secrets = getServerSecrets();

  return createSupabaseClient(
    PUBLIC_CONFIG.SUPABASE_URL,
    secrets.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
