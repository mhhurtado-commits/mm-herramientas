import test from 'node:test';
import assert from 'node:assert/strict';
import { fitTextToBox, sceneLayout } from './reel-renderer.mjs';

test('reserves safe zones and closure space in the 9:16 layout', () => {
  const layout = sceneLayout({ width: 1080, height: 1920, type: 'closure' });
  assert.ok(layout.safe.top > 0);
  assert.ok(layout.safe.bottom > 0);
  assert.ok(layout.cta.y < layout.safe.bottom);
  assert.ok(layout.accentBar.height <= 6);
  assert.ok(layout.logo.y + layout.logo.height < layout.accentBar.y);
  const internal = sceneLayout({ width: 1080, height: 1920, type: 'que-paso', hasImage: false });
  assert.equal(internal.imageArea, null);
  assert.ok(internal.textFrame.height > internal.height * 0.5);
});

test('baja la tarjeta del cover y la mantiene dentro del area segura', () => {
  const cover = sceneLayout({ width: 1080, height: 1920, type: 'cover' });

  assert.ok(cover.coverCard.y > cover.imageArea.y + cover.imageArea.height - 40);
  assert.ok(cover.coverCard.y + cover.coverCard.height <= cover.safe.bottom);

  const closure = sceneLayout({ width: 1080, height: 1920, type: 'closure' });
  assert.deepEqual(closure.closureSurface, { x: 0, y: 0, width: 1080, height: 1920 });
});

test('uses most of the vertical canvas for text-only editorial scenes', () => {
  const textOnly = sceneLayout({ width: 1080, height: 1920, type: 'dato-clave', hasImage: false });
  const withImage = sceneLayout({ width: 1080, height: 1920, type: 'dato-clave', hasImage: true });

  assert.equal(textOnly.imageArea, null);
  assert.ok(textOnly.textFrame.height >= 1920 * 0.68);
  assert.ok(withImage.imageArea.height <= 1920 * 0.42);
  assert.ok(withImage.textFrame.y > withImage.imageArea.y + withImage.imageArea.height - 1);
});

test('fits complete text into a bounded box instead of slicing lines', () => {
  const ctx = { font: '', measureText: text => ({ width: String(text).length * 18 }) };
  const fitted = fitTextToBox(ctx, 'La primera medida completa debe conservarse sin puntos suspensivos ni cortes artificiales.', 760, 360, { startSize: 44, minSize: 24, weight: 600 });

  assert.match(fitted.lines.join(' '), /sin puntos suspensivos ni cortes artificiales/);
  assert.ok(fitted.fontSize >= 24);
  assert.ok(fitted.height <= 360);
});
