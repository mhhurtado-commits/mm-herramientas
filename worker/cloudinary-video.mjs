const JOB_PREFIX = 'mm-video-vertical';
const SIGNATURE_EXCLUSIONS = new Set(['api_key', 'cloud_name', 'file', 'resource_type', 'signature']);

export function canonicalizeCloudinaryParams(params = {}) {
  return Object.entries(params)
    .filter(([key, value]) => !SIGNATURE_EXCLUSIONS.has(key) && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, Array.isArray(value) ? value.join('|') : String(value)])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export async function sha1(value) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function signCloudinaryParams(params, apiSecret, { raw = false } = {}) {
  const content = raw ? `${params.body ?? ''}${params.timestamp ?? ''}` : canonicalizeCloudinaryParams(params);
  return sha1(`${content}${apiSecret}`);
}

export function buildCloudinaryEagerTransform({ overlayPublicId, width, height }) {
  const overlay = String(overlayPublicId || '').replaceAll('/', ':');
  if (!overlay || !Number.isInteger(width) || !Number.isInteger(height)) throw new Error('Transformación Cloudinary inválida.');
  return `b_rgb:111a15,c_pad,h_${height},w_${width}/l_${overlay}/c_scale,h_${height},w_${width}/fl_layer_apply,g_center/ac_aac,f_mp4,q_auto:good,vc_h264/fl_attachment`;
}

export function parseCloudinaryVideoJobId(publicId) {
  const match = String(publicId || '').match(new RegExp(`^${JOB_PREFIX}/input-([A-Za-z0-9_-]+)$`));
  return match?.[1] || null;
}

export async function verifyCloudinaryWebhook({ body, timestamp, signature, apiSecret, now = Date.now(), maxAgeSeconds = 7200 } = {}) {
  const issuedAt = Number(timestamp);
  if (!body || !signature || !apiSecret || !Number.isFinite(issuedAt) || Math.abs(now / 1000 - issuedAt) > maxAgeSeconds) return false;
  const expected = await signCloudinaryParams({ body, timestamp: issuedAt }, apiSecret, { raw: true });
  if (expected.length !== String(signature).length) return false;
  let different = 0;
  for (let index = 0; index < expected.length; index += 1) different |= expected.charCodeAt(index) ^ String(signature).charCodeAt(index);
  return different === 0;
}

export function createCloudinaryVideoJob({ id, format, origin }) {
  if (!/^[A-Za-z0-9_-]+$/.test(String(id || ''))) throw new Error('Id de exportación inválido.');
  const dimensions = format === '4:5' ? { width: 720, height: 900 } : { width: 720, height: 1280 };
  const inputPublicId = `${JOB_PREFIX}/input-${id}`;
  return {
    id,
    status: 'esperando_subidas',
    format: format === '4:5' ? '4:5' : '9:16',
    ...dimensions,
    inputPublicId,
    overlayPublicId: `${JOB_PREFIX}/overlay-${id}`,
    webhookUrl: `${origin}/video-vertical/cloudinary/webhook`,
    createdAt: Date.now(),
  };
}
