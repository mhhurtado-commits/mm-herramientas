import assert from 'node:assert/strict';
import test from 'node:test';
import { exportCloudinaryVideo } from './cloudinary-export.mjs';

test('sube video y zócalo firmados, inicia render y espera descarga', async () => {
  const calls = [];
  const json = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
  const fetcher = async (url, options = {}) => {
    calls.push([url, options]);
    if (url.endsWith('/crear')) return json({ ok: true, jobId: 'job_123', videoUpload: { endpoint: 'https://upload/video', apiKey: 'key', timestamp: 1, signature: 'sig', publicId: 'mm-video-vertical/input-job_123' }, overlayUpload: { endpoint: 'https://upload/image', apiKey: 'key', timestamp: 1, signature: 'sig', publicId: 'mm-video-vertical/overlay-job_123' } });
    if (url === 'https://upload/video' || url === 'https://upload/image') return json({ public_id: url.endsWith('video') ? 'mm-video-vertical/input-job_123' : 'mm-video-vertical/overlay-job_123' });
    if (url.endsWith('/render/job_123')) return json({ ok: true, status: 'renderizando' });
    if (url.endsWith('/estado/job_123')) return json({ ok: true, status: 'listo', downloadUrl: 'https://res.cloudinary.com/demo/video/upload/result.mp4' });
    throw new Error(`URL inesperada: ${url}`);
  };
  const file = new Blob(['video'], { type: 'video/mp4' }); file.name = 'fuente.mp4';
  const overlay = new Blob(['overlay'], { type: 'image/png' });
  const result = await exportCloudinaryVideo({ workerUrl: 'https://worker.test', source: file, overlay, format: '9:16', framingMode: 'cover', fetcher, wait: async () => {} });
  assert.equal(result.downloadUrl, 'https://res.cloudinary.com/demo/video/upload/result.mp4');
  assert.equal(JSON.parse(calls[0][1].body).framingMode, 'cover');
  assert.equal(calls.filter(([url]) => url.includes('/upload/')).length, 2);
  assert.equal(calls.at(-1)[0], 'https://worker.test/video-vertical/cloudinary/estado/job_123');
});

test('no intenta la subida remota si el archivo excede el límite del plan', async () => {
  const source = { size: 100 * 1024 * 1024 + 1, name: 'grande.mp4', type: 'video/mp4' };
  await assert.rejects(() => exportCloudinaryVideo({ workerUrl: 'https://worker.test', source, overlay: new Blob(['overlay']), fetcher: async () => { throw new Error('No debería llamar fetch'); } }), /100 MB/);
});
