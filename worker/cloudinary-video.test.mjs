import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCloudinaryEagerTransform,
  canonicalizeCloudinaryParams,
  parseCloudinaryVideoJobId,
  signCloudinaryParams,
  verifyCloudinaryWebhook,
} from './worker.js';

test('genera una transformación vertical con capas fijas y temporizadas', () => {
  assert.equal(
    buildCloudinaryEagerTransform({ inputPublicId: 'mm-video-vertical/input-job_123', layers: [{ publicId: 'mm-video-vertical/overlay-job_123-fixed', kind: 'fixed' }, { publicId: 'mm-video-vertical/overlay-job_123-speaker', kind: 'speaker', start: 4, duration: 4 }], width: 720, height: 1280 }),
    'c_fill,g_center,h_1280,w_720/e_blur:1000/e_brightness:-42/l_video:mm-video-vertical:input-job_123/c_fit,h_1280,w_720/fl_layer_apply,g_center/l_mm-video-vertical:overlay-job_123-fixed/c_scale,h_1280,w_720/fl_layer_apply,g_center/l_mm-video-vertical:overlay-job_123-speaker/c_scale,h_1280,w_720/fl_layer_apply,g_center,so_4,du_4/ac_aac,f_mp4,q_auto:good,vc_h264/fl_attachment',
  );
});

test('mantiene la capa fija y recrea el fondo borroso en encuadre contener', () => {
  const transform = buildCloudinaryEagerTransform({
    inputPublicId: 'mm-video-vertical/input-job_123',
    layers: [{ publicId: 'mm-video-vertical/overlay-job_123-fixed', kind: 'fixed', start: 0, duration: null }],
    width: 720,
    height: 1280,
    framingMode: 'contain',
  });
  assert.match(transform, /c_fill,g_center,h_1280,w_720\/e_blur:1000\/e_brightness:-42/);
  assert.match(transform, /l_video:mm-video-vertical:input-job_123\/c_fit,h_1280,w_720\/fl_layer_apply,g_center/);
  assert.match(transform, /overlay-job_123-fixed\/c_scale,h_1280,w_720\/fl_layer_apply,g_center\/ac_aac/);
  assert.doesNotMatch(transform, /overlay-job_123-fixed[^/]*\/c_scale[^/]*\/fl_layer_apply,g_center,so_/);
});

test('genera un recorte vertical centrado cuando se elige ese encuadre', () => {
  assert.equal(
    buildCloudinaryEagerTransform({ layers: [{ publicId: 'mm-video-vertical/overlay-job_123-fixed', kind: 'fixed' }], width: 720, height: 1280, framingMode: 'cover' }),
    'c_fill,g_center,h_1280,w_720/l_mm-video-vertical:overlay-job_123-fixed/c_scale,h_1280,w_720/fl_layer_apply,g_center/ac_aac,f_mp4,q_auto:good,vc_h264/fl_attachment',
  );
});

test('firma parámetros de Cloudinary sin incluir api_key', async () => {
  const params = { timestamp: 1315060510, public_id: 'sample', api_key: 'public-key' };
  assert.equal(canonicalizeCloudinaryParams(params), 'public_id=sample&timestamp=1315060510');
  assert.equal(await signCloudinaryParams(params, 'abcd'), 'c3470533147774275dd37996cc4d0e68fd03cd4f');
});

test('valida firma de webhook y rechaza timestamps vencidos', async () => {
  const body = '{"public_id":"mm-video-vertical/input-job_123"}';
  const timestamp = 1710000000;
  const signature = await signCloudinaryParams({ body, timestamp }, 'abcd', { raw: true });
  assert.equal(await verifyCloudinaryWebhook({ body, timestamp, signature, apiSecret: 'abcd', now: timestamp * 1000 }), true);
  assert.equal(await verifyCloudinaryWebhook({ body, timestamp, signature, apiSecret: 'abcd', now: (timestamp + 7201) * 1000 }), false);
});

test('solo asocia webhooks a ids de trabajos propios', () => {
  assert.equal(parseCloudinaryVideoJobId('mm-video-vertical/input-job_123'), 'job_123');
  assert.equal(parseCloudinaryVideoJobId('otro/input-job_123'), null);
});
