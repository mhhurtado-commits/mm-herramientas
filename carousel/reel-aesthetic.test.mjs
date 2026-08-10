import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdaptiveReelCardBounds } from './reel-canvas-renderer.js';

test('adapta la tarjeta del reel al contenido sin ocupar toda la escena', () => {
  assert.deepEqual(getAdaptiveReelCardBounds(234, 1304, 260), { y: 676, height: 420 });
  assert.deepEqual(getAdaptiveReelCardBounds(234, 1304, 760), { y: 566, height: 640 });
});
