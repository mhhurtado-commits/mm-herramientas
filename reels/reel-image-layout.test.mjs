import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseImageMode, getImageDrawPlan } from './reel-image-layout.mjs';

test('uses complete-image mode for horizontal photos in vertical reels', () => {
  assert.equal(chooseImageMode({ width: 1600, height: 900, hasText: true }), 'contain-blur');
  const plan = getImageDrawPlan({
    sourceWidth: 1600,
    sourceHeight: 900,
    canvasWidth: 1080,
    canvasHeight: 1920,
    mode: 'contain-blur',
    focus: { x: 0.5, y: 0.5 },
  });
  assert.equal(plan.foreground.width, 1080);
  assert.ok(plan.background.scale > 1);
  assert.equal(plan.foreground.crop, false);
});

test('keeps manual focus bounded for crop mode', () => {
  const plan = getImageDrawPlan({
    sourceWidth: 900,
    sourceHeight: 1600,
    canvasWidth: 1080,
    canvasHeight: 1920,
    mode: 'cover',
    focus: { x: 4, y: -2 },
  });
  assert.equal(plan.focus.x, 1);
  assert.equal(plan.focus.y, 0);
});
