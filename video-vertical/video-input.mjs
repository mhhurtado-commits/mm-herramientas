const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']);

export function validateVideoFile(file) {
  if (!file) return { ok: false, error: 'Elegí un video local para comenzar.' };
  if (!VIDEO_TYPES.has(file.type)) return { ok: false, error: 'Usá un archivo MP4, MOV, WebM o M4V.' };
  return { ok: true };
}

export function parseVideoHandoff(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed?.package && typeof parsed.package === 'object' ? parsed : null;
  } catch { return null; }
}
