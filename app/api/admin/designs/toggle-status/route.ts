import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/cms/audit';

export const dynamic = 'force-dynamic';

function updateLocalDesign(designId: string, data: Record<string, any>) {
  try {
    const overridesPath = path.join(process.cwd(), 'design_overrides.json');
    let overrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
    }
    overrides[designId] = {
      ...(overrides[designId] || {}),
      ...data,
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to update local design override:', err);
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { design_id, is_active } = body;

    if (!design_id) {
      return NextResponse.json({ success: false, error: 'design_id is required' }, { status: 400 });
    }

    const activeState = Boolean(is_active);

    let dbPersisted = false;
    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('designs')
        .update({ is_active: activeState, updated_at: new Date().toISOString() })
        .eq('id', design_id);

      if (!error) {
        dbPersisted = true;
      }
    } catch (err: any) {
      console.warn('Supabase toggle status error:', err?.message);
    }

    updateLocalDesign(design_id, { is_active: activeState });

    await recordAdminAudit(auth.user.email, 'TOGGLE_DESIGN_STATUS', 'design', design_id, {
      is_active: activeState,
      db_persisted: dbPersisted,
    });

    return NextResponse.json({
      success: true,
      message: `Design ${activeState ? 'activated' : 'deactivated'} successfully`,
      design_id,
      is_active: activeState,
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    console.error('Error toggling design status:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
