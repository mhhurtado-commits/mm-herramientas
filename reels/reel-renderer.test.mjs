import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneLayout } from './reel-renderer.mjs';

test('reserves safe zones and closure space in the 9:16 layout', () => {
  const layout = sceneLayout({ width: 1080, height: 1920, type: 'closure' });
  assert.ok(layout.safe.top > 0);
  assert.ok(layout.safe.bottom > 0);
  assert.ok(layout.cta.y < layout.safe.bottom);
  assert.ok(layout.accentBar.height <= 6);
  assert.ok(layout.logo.y + layout.logo.height < layout.accentBar.y);
  const internal = sceneLayout({ width: 1080, height: 1920, type: 'que-paso' });
  assert.ok(internal.imageArea.y > internal.content.y);
  assert.ok(internal.imageArea.height > 0);
  assert.ok(internal.textCard.height > internal.height * 0.5);
});

test('baja la tarjeta del cover y la mantiene dentro del area segura', () => {
  const cover = sceneLayout({ width: 1080, height: 1920, type: 'cover' });

  assert.ok(cover.coverCard.y > cover.imageArea.y + cover.imageArea.height - 40);
  assert.ok(cover.coverCard.y + cover.coverCard.height <= cover.safe.bottom);
});
