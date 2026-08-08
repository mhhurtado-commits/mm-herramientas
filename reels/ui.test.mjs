import test from 'node:test';
import assert from 'node:assert/strict';
import { updateSceneFocus } from './ui.mjs';

test('dragging updates only the image focus', () => {
  const scene = { title: 'Título', focus: { x: 0.5, y: 0.5 } };
  updateSceneFocus(scene, { x: 20, y: -10 }, 100);
  assert.equal(scene.title, 'Título');
  assert.deepEqual(scene.focus, { x: 0.3, y: 0.6 });
});
