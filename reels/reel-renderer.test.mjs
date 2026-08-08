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
});
