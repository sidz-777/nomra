import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/cms/audit';

export const dynamic = 'force-dynamic';

function getLocalMedia(): any[] {
  try {
    const mediaPath = path.join(process.cwd(), 'media_records.json');
    if (fs.existsSync(mediaPath)) {
      return JSON.parse(fs.readFileSync(mediaPath, 'utf8'));
    }
  } catch {}
  return [];
}

function removeLocalMedia(storagePath: string) {
  try {
    const mediaPath = path.join(process.cwd(), 'media_records.json');
    if (fs.existsSync(mediaPath)) {
      let list = JSON.parse(fs.readFileSync(mediaPath, 'utf8'));
      list = list.filter((m: any) => m.storage_path !== storagePath);
      fs.writeFileSync(mediaPath, JSON.stringify(list, null, 2), 'utf8');
    }
  } catch {}
}

/**
 * GET /api/admin/media — List media files
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const folder = url.searchParams.get('folder');

    const supabase = createAdminClient();
    let mediaList: any[] = [];

    // 1. Try querying media table
    try {
      let query = supabase.from('media').select('*').order('created_at', { ascending: false });
      if (folder && folder !== 'all') {
        query = query.eq('folder', folder);
      }
      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        mediaList = data;
      }
    } catch (e: any) {
      console.warn('Supabase media table query warning:', e?.message);
    }

    // 2. Merge local records
    const local = getLocalMedia();
    const map = new Map<string, any>();
    mediaList.forEach((m) => map.set(m.storage_path, m));
    local.forEach((m) => {
      if (!map.has(m.storage_path)) {
        if (!folder || folder === 'all' || m.folder === folder) {
          map.set(m.storage_path, m);
        }
      }
    });

    // 3. If still empty, check bucket directory
    if (map.size === 0) {
      const searchFolder = folder && folder !== 'all' ? folder : '';
      const { data: bucketFiles } = await supabase.storage.from('namora-media').list(searchFolder, {
        limit: 50,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (bucketFiles && Array.isArray(bucketFiles)) {
        bucketFiles.forEach((file) => {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            const storagePath = searchFolder ? `${searchFolder}/${file.name}` : file.name;
            const { data: urlData } = supabase.storage.from('namora-media').getPublicUrl(storagePath);
            map.set(storagePath, {
              id: file.id || storagePath,
              filename: file.name,
              storage_path: storagePath,
              public_url: urlData?.publicUrl || '',
              file_type: file.metadata?.mimetype || 'image/jpeg',
              file_size: file.metadata?.size || 0,
              folder: searchFolder || 'general',
              created_at: file.created_at || new Date().toISOString(),
            });
          }
        });
      }
    }

    const finalResults = Array.from(map.values());

    return NextResponse.json({
      success: true,
      media: finalResults,
      total: finalResults.length,
    });
  } catch (error: any) {
    console.error('Error fetching media list:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/media — Delete media file
 */
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { storage_path } = body;

    if (!storage_path) {
      return NextResponse.json({ success: false, error: 'storage_path is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Remove from bucket
    const { error: storageErr } = await supabase.storage.from('namora-media').remove([storage_path]);
    if (storageErr) {
      console.warn('Storage deletion warning:', storageErr.message);
    }

    // 2. Remove from DB table
    try {
      await supabase.from('media').delete().eq('storage_path', storage_path);
    } catch {}

    // 3. Remove from local file
    removeLocalMedia(storage_path);

    // 4. Log audit event
    await recordAdminAudit(auth.user.email, 'DELETE_MEDIA', 'media', storage_path);

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully',
      storage_path,
    });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
