'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { CMSMedia } from '@/lib/cms/types';

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<CMSMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  // Upload modal / drawer
  const [uploadFolder, setUploadFolder] = useState<CMSMedia['folder']>('general');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const url = selectedFolder === 'all' ? '/api/admin/media' : `/api/admin/media?folder=${selectedFolder}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.media)) {
          setMediaList(json.media);
        } else {
          setLoadError('Failed to load media assets');
        }
      } else {
        setLoadError(`Server error HTTP ${res.status}`);
      }
    } catch (err: any) {
      setLoadError('Network error loading media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [selectedFolder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyUrl = (url: string, path: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPath(path);
    showToast('📋 CDN URL copied to clipboard');
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const handleDelete = async (storagePath: string) => {
    if (!confirm(`Are you sure you want to delete this media file?\n${storagePath}`)) {
      return;
    }
    setDeletingPath(storagePath);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: storagePath }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMediaList((prev) => prev.filter((m) => m.storage_path !== storagePath));
        showToast('🗑️ Media file deleted from storage');
      } else {
        throw new Error(data?.error || 'Deletion failed');
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setDeletingPath(null);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', uploadFolder);

      try {
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          successCount++;
        } else {
          failCount++;
          console.error('File upload error:', data?.error);
        }
      } catch (err) {
        failCount++;
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (successCount > 0) {
      showToast(`✅ Successfully uploaded ${successCount} file(s)`);
      await loadMedia();
    }
    if (failCount > 0) {
      showToast(`⚠️ ${failCount} file(s) failed upload`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredMedia = mediaList.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.filename.toLowerCase().includes(q) || m.storage_path.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AdminGuard>
      <AdminLayoutClient title="Media Assets &amp; Storage">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            {toastMessage}
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-serif font-medium text-[#F5EFE6]">
              Cloud Media Library ({mediaList.length})
            </h3>
            <p className="text-xs text-[#A39684] mt-0.5 font-mono">
              Upload product photos, frame artwork, and videos directly to the secure Supabase CDN bucket.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value as any)}
              className="bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
            >
              <option value="general">Upload to: General</option>
              <option value="products">Upload to: Products</option>
              <option value="designs">Upload to: Designs</option>
              <option value="collections">Upload to: Collections</option>
              <option value="banners">Upload to: Banners</option>
            </select>

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#D4AF6A] text-[#141210] hover:bg-[#E0C082] rounded-lg text-xs font-mono font-semibold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>{uploading ? '⏳' : '⬆️'}</span>
              <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Drag & Drop Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-6 ${
            dragOver
              ? 'border-[#D4AF6A] bg-[#D4AF6A]/5'
              : 'border-[#2D2722] hover:border-[#D4AF6A]/40 bg-[#141210]'
          }`}
        >
          <div className="text-2xl mb-2">📸</div>
          <div className="text-xs font-mono text-[#F5EFE6] font-medium">
            Drag and drop images or videos here, or click to browse
          </div>
          <div className="text-[11px] font-mono text-[#736B5E] mt-1">
            Supports JPEG, PNG, WebP (up to 5MB) and MP4 video (up to 50MB)
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'products', 'designs', 'collections', 'banners', 'general'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFolder(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium capitalize transition ${
                  selectedFolder === f
                    ? 'bg-[#D4AF6A] text-[#141210]'
                    : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-[#F5EFE6] placeholder-[#736B5E] focus:border-[#D4AF6A] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#736B5E] hover:text-[#F5EFE6] text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 text-center text-[#A39684] text-sm font-mono border border-[#2D2722] rounded-xl bg-[#1A1816]/40">
            <span className="animate-pulse">Loading media assets...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMedia.length === 0 && (
          <div className="p-12 text-center text-[#A39684] text-xs font-mono border border-[#2D2722] rounded-xl bg-[#141210]">
            No media files found in this category. Upload files above to get started.
          </div>
        )}

        {/* Media Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((m) => {
            const isVideo = m.file_type === 'video/mp4' || m.filename.endsWith('.mp4');
            const isCopied = copiedPath === m.storage_path;
            const isDeleting = deletingPath === m.storage_path;

            return (
              <div
                key={m.storage_path}
                className="bg-[#1A1816] border border-[#2D2722] hover:border-[#D4AF6A]/40 rounded-xl overflow-hidden transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-[#141210] overflow-hidden flex items-center justify-center">
                    {isVideo ? (
                      <div className="flex flex-col items-center justify-center text-[#D4AF6A]">
                        <span className="text-3xl">🎬</span>
                        <span className="text-[10px] font-mono mt-1 uppercase">MP4 Video</span>
                      </div>
                    ) : (
                      <img
                        src={m.public_url}
                        alt={m.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute top-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-[#A39684]">
                      {m.folder}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3">
                    <h5 className="text-xs font-mono text-[#F5EFE6] truncate" title={m.filename}>
                      {m.filename}
                    </h5>
                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-[#736B5E]">
                      <span>{formatFileSize(m.file_size)}</span>
                      <span className="truncate max-w-[80px]">{m.file_type.replace('image/', '')}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-2.5 bg-[#141210] border-t border-[#2D2722] flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(m.public_url, m.storage_path)}
                    className="flex-1 py-1 px-2 bg-[#2D2722] hover:bg-[#3D352E] text-[#F5EFE6] rounded text-[10px] font-mono transition text-center truncate"
                  >
                    {isCopied ? '✓ Copied' : '🔗 Copy URL'}
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(m.storage_path)}
                    className="p-1 text-[#736B5E] hover:text-red-400 text-xs transition"
                    title="Delete file"
                  >
                    {isDeleting ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
