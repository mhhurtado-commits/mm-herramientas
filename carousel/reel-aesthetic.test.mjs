import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdaptiveReelCardBounds, resolveReelSceneFamily } from './reel-canvas-renderer.js';

test('adapta la tarjeta del reel al contenido sin ocupar toda la escena', () => {
  assert.deepEqual(getAdaptiveReelCardBounds(234, 1304, 260), { y: 676, height: 420 });
  assert.deepEqual(getAdaptiveReelCardBounds(234, 1304, 760), { y: 566, height: 640 });
});

test('trata una imagen manual interna como apoyo de una escena de texto', () => {
  assert.equal(resolveReelSceneFamily({ visual_type: 'support_image', visual_source: 'data:image/png;base64,manual' }, { article: {} }), 'text');
});
