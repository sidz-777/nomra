import { createAdminClient } from '@/lib/supabase/admin';

export async function recordAdminAudit(
  adminEmail: string,
  action: string,
  entityType: 'product' | 'design' | 'media' | 'collection' | 'settings',
  entityId: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('admin_audit_logs').insert([
      {
        admin_email: adminEmail,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
      },
    ]);
  } catch (err: any) {
    // Non-blocking: log to console if table doesn't exist yet or connection fails
    console.warn(`[CMS Audit] Failed to record audit log: ${err?.message}`);
  }
}
