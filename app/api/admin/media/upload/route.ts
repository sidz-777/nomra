import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/cms/audit';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

function recordLocalMedia(record: Record<string, any>) {
  try {
    const mediaPath = path.join(process.cwd(), 'media_records.json');
    let list: any[] = [];
    if (fs.existsSync(mediaPath)) {
      list = JSON.parse(fs.readFileSync(mediaPath, 'utf8'));
    }
    list.unshift(record);
    fs.writeFileSync(mediaPath, JSON.stringify(list.slice(0, 200), null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to record local media entry:', err);
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';
    const altText = (formData.get('alt_text') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file format (${mimeType}). Allowed: JPEG, PNG, WebP, MP4`,
        },
        { status: 400 }
      );
    }

    const isVideo = mimeType === 'video/mp4';
    const maxAllowed = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `File exceeds maximum allowed size of ${isVideo ? '50MB' : '5MB'}`,
        },
        { status: 400 }
      );
    }

    // Generate safe storage path
    const timestamp = Date.now();
    const cleanFileName = file.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9._-]/g, '');
    const storagePath = `${folder}/${timestamp}_${cleanFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = createAdminClient();

    // 1. Upload to Supabase Storage bucket 'namora-media'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('namora-media')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError.message);
      return NextResponse.json(
        { success: false, error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
      .from('namora-media')
      .getPublicUrl(storagePath);

    const publicUrl = urlData?.publicUrl || '';

    const mediaRecord = {
      filename: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      file_type: mimeType,
      file_size: file.size,
      folder,
      alt_text: altText,
      created_at: new Date().toISOString(),
    };

    // 3. Try insert into DB table
    let dbPersisted = false;
    try {
      const { error: dbErr } = await supabase.from('media').insert([mediaRecord]);
      if (!dbErr) {
        dbPersisted = true;
      } else {
        console.warn('Media DB insert warning:', dbErr.message);
      }
    } catch (e: any) {
      console.warn('Media table error:', e?.message);
    }

    // 4. Save to local media records fallback
    recordLocalMedia(mediaRecord);

    // 5. Audit log
    await recordAdminAudit(auth.user.email, 'UPLOAD_MEDIA', 'media', storagePath, {
      filename: file.name,
      size: file.size,
      publicUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      media: mediaRecord,
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    console.error('Error in media upload API:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
