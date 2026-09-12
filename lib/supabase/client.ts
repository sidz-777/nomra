import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_CONFIG } from '@/lib/config';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    PUBLIC_CONFIG.SUPABASE_URL,
    PUBLIC_CONFIG.SUPABASE_ANON_KEY
  );

  return client;
}
