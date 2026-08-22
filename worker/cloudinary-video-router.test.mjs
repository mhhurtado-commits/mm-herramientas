import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.js';
import { signCloudinaryParams } from './cloudinary-video.mjs';

class MemoryKV {
  data = new Map();
  async get(key, type) { const value = this.data.get(key); return type === 'json' && value ? JSON.parse(value) : value || null; }
  async put(key, value) { this.data.set(key, value); }
}

test('el Worker firma una carga y publica el MP4 solo luego del webhook válido', async () => {
  const env = { CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'secret', KV: new MemoryKV() };
  const response = await worker.fetch(new Request('https://worker.test/video-vertical/cloudinary/crear', { method: 'POST', body: JSON.stringify({ format: '9:16', source: { size: 100 } }) }), env);
  const created = await response.json();
  assert.equal(response.status, 200);
  assert.match(created.videoUpload.publicId, /^mm-video-vertical\/input-/);
  const publicId = created.videoUpload.publicId;
  const payload = JSON.stringify({ public_id: publicId, eager: [{ secure_url: 'https://res.cloudinary.com/demo/video/upload/result.mp4' }] });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await signCloudinaryParams({ body: payload, timestamp }, env.CLOUDINARY_API_SECRET, { raw: true });
  const webhook = await worker.fetch(new Request('https://worker.test/video-vertical/cloudinary/webhook', { method: 'POST', headers: { 'X-Cld-Timestamp': String(timestamp), 'X-Cld-Signature': signature }, body: payload }), env);
  assert.equal(webhook.status, 200);
  const status = await worker.fetch(new Request(`https://worker.test/video-vertical/cloudinary/estado/${created.jobId}`), env);
  assert.deepEqual(await status.json(), { ok: true, status: 'listo', downloadUrl: 'https://res.cloudinary.com/demo/video/upload/result.mp4', error: null });
});
