// src/components/courses/EbookFileInput.jsx
// Picker for the downloadable ebook file. The file itself is uploaded by the
// parent on save (see uploadEbookFile in api/services).
import React, { useRef } from 'react';
import { toast } from '../../context';

export const EBOOK_ACCEPT   = '.pdf,.epub,.mobi,.azw3,.zip';
export const EBOOK_MAX_SIZE = 50 * 1024 * 1024; // Supabase free plan per-file limit

const fmtSize = b => b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

/**
 * file:        newly chosen File (or null)
 * currentPath: storage path of the file already saved on the product (when editing)
 * progress:    upload percentage while saving, or null
 */
export default function EbookFileInput({ file, currentPath, onChange, error, progress = null }) {
  const ref = useRef();

  function pick(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!EBOOK_ACCEPT.split(',').includes(`.${ext}`)) { toast.error('Upload a PDF, ePub, MOBI, AZW3 or ZIP file.'); return; }
    if (f.size > EBOOK_MAX_SIZE) { toast.error('The file must be under 50 MB.'); return; }
    onChange(f);
  }

  const label = file ? `${file.name} · ${fmtSize(file.size)}` : currentPath ? `Current file: ${currentPath.split('/').pop()}` : null;

  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>eBook File *</p>
      <div onClick={() => ref.current?.click()}
        style={{ border: `2px dashed ${error ? 'var(--danger)' : label ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 12, padding: '18px 16px', cursor: 'pointer', background: label ? 'var(--accent-bg)' : 'var(--bg)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📄</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label ?? 'Click to upload the file buyers will download'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>
            {label ? 'Click to choose a different file' : 'PDF, ePub, MOBI, AZW3 or ZIP · Max 50 MB · Only buyers can download it'}
          </p>
        </div>
        <input ref={ref} type="file" accept={EBOOK_ACCEPT} onChange={pick} style={{ display: 'none' }} />
      </div>
      {progress !== null && (
        <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 6, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: 6, background: 'var(--accent)', transition: 'width .2s' }} />
        </div>
      )}
      {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{error}</p>}
    </div>
  );
}
