import { supabase } from './supabase';

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = 'nbsc-dms';

// A stored URL is either:
//   { provider: 'cloudinary', url: 'https://res.cloudinary.com/...' }
//   { provider: 'supabase', path: 'folderName/timestamp_file.pdf' }
// We JSON-stringify these and store them in file_urls array.

export function encodeFileRef(provider, data) {
  return JSON.stringify({ provider, ...data });
}

export function decodeFileRef(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.provider) return parsed;
  } catch {}
  // legacy: plain supabase path string
  return { provider: 'supabase', path: raw };
}

export function getFileName(raw) {
  const ref = decodeFileRef(raw);
  if (ref.provider === 'cloudinary') {
    // extract filename from URL
    const parts = ref.url.split('/');
    return parts[parts.length - 1].split('?')[0];
  }
  return ref.path.split('/').pop();
}

// Upload a single file — Cloudinary first, fallback to Supabase
// Returns { ref, provider } where provider is 'cloudinary' or 'supabase'
export async function uploadFile(file, folderName) {
  // Try Cloudinary
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('folder', `${CLOUDINARY_FOLDER}/${folderName}`);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
      { method: 'POST', body: formData }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        const ref = encodeFileRef('cloudinary', { url: data.secure_url, public_id: data.public_id });
        return { ref, provider: 'cloudinary' };
      }
    }
  } catch {}

  // Fallback: Supabase Storage
  const timestamp = Date.now();
  const filePath = `${folderName}/${timestamp}_${file.name}`;
  const { error } = await supabase.storage
    .from('office-forms')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const ref = encodeFileRef('supabase', { path: filePath });
  return { ref, provider: 'supabase' };
}

// Get a viewable/downloadable URL for a file ref
export async function getFileUrl(raw) {
  const ref = decodeFileRef(raw);
  if (ref.provider === 'cloudinary') {
    return { url: ref.url, isBlob: false };
  }
  // Supabase — download as blob
  const { data, error } = await supabase.storage.from('office-forms').download(ref.path);
  if (error) throw error;
  const mime = getMimeType(ref.path.split('/').pop());
  const blob = new Blob([data], { type: mime });
  return { url: URL.createObjectURL(blob), isBlob: true };
}

// Delete a file from its provider
export async function deleteFileFromStorage(raw) {
  const ref = decodeFileRef(raw);
  if (ref.provider === 'cloudinary') {
    // Cloudinary unsigned delete not supported from frontend — skip storage delete
    // The DB record will be removed; file stays in Cloudinary (acceptable for free tier)
    return;
  }
  await supabase.storage.from('office-forms').remove([ref.path]);
}

function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  return 'application/pdf';
}
