import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Persists an administrative activity log entry to the database.
 */
export async function logAdminActivity(
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, any> = {},
  adminUserId = 'admin'
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('admin_activity_logs').insert([
      {
        admin_user_id: adminUserId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err: any) {
    console.warn('Admin audit log persistence note:', err?.message);
  }
}
