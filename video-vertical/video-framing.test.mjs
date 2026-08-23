import test from 'node:test';
import assert from 'node:assert/strict';
import { getOverlayLayout, getVideoFramePlan } from './video-framing.mjs';

test('keeps a horizontal source complete in the vertical default frame', () => {
  const plan = getVideoFramePlan({ sourceWidth: 1920, sourceHeight: 1080, width: 1080, height: 1920, mode: 'contain' });
  assert.equal(plan.foreground.x, 0);
  assert.equal(Math.round(plan.foreground.width), 1080);
  assert.equal(Math.round(plan.foreground.height), 608);
  assert.equal(plan.foreground.crop, false);
  assert.ok(plan.background.width >= 1080 && plan.background.height >= 1920);
});

test('clamps the manual focus for vertical crop', () => {
  const plan = getVideoFramePlan({ sourceWidth: 1920, sourceHeight: 1080, width: 1080, height: 1920, mode: 'cover', focus: { x: 5, y: -1 } });
  assert.deepEqual(plan.focus, { x: 1, y: 0 });
  assert.equal(plan.foreground.crop, true);
});

test('reserves separate safe spaces for caption and lower third', () => {
  const layout = getOverlayLayout({ width: 1080, height: 1920 });
  assert.ok(layout.caption.y + layout.caption.height < layout.lowerThird.y);
  assert.ok(layout.lowerThird.y + layout.lowerThird.height <= layout.safe.bottom);
});

test('alinea la categoría superior con el logo de marca', () => {
  const layout = getOverlayLayout({ width: 1080, height: 1920 });
  assert.equal(layout.hook.y, 1920 * 0.035);
});

test('baja la tarjeta editorial y reserva un footer fijo debajo', () => {
  const layout = getOverlayLayout({ width: 1080, height: 1920 });
  assert.equal(layout.lowerThird.y, 1920 * 0.74);
  assert.ok(layout.lowerThird.y + layout.lowerThird.height < layout.footer.y);
});
