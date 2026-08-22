import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCloudinaryEagerTransform,
  canonicalizeCloudinaryParams,
  parseCloudinaryVideoJobId,
  signCloudinaryParams,
  verifyCloudinaryWebhook,
} from './worker.js';

test('genera una transformación vertical con padding y zócalo', () => {
  assert.equal(
    buildCloudinaryEagerTransform({ overlayPublicId: 'mm-video-vertical/overlay-job_123', width: 720, height: 1280 }),
    'b_rgb:111a15,c_pad,h_1280,w_720/l_mm-video-vertical:overlay-job_123/c_scale,h_1280,w_720/fl_layer_apply,g_center/ac_aac,f_mp4,q_auto:good,vc_h264/fl_attachment',
  );
});

test('genera un recorte vertical centrado cuando se elige ese encuadre', () => {
  assert.equal(
    buildCloudinaryEagerTransform({ overlayPublicId: 'mm-video-vertical/overlay-job_123', width: 720, height: 1280, framingMode: 'cover' }),
    'c_fill,g_center,h_1280,w_720/l_mm-video-vertical:overlay-job_123/c_scale,h_1280,w_720/fl_layer_apply,g_center/ac_aac,f_mp4,q_auto:good,vc_h264/fl_attachment',
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
