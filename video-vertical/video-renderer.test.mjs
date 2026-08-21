import test from 'node:test';
import assert from 'node:assert/strict';
import { drawEditorialOverlay, fitVideoText } from './video-renderer.mjs';

test('fits lower-third wording without producing blank lines', () => {
  const fitted = fitVideoText('Una noticia importante para la audiencia', 18, value => value.length * 9);
  assert.ok(fitted.lines.length >= 2);
  assert.ok(fitted.lines.every(Boolean));
});

test('draws an exportable transparent editorial overlay without a video frame', () => {
  const calls = [];
  const ctx = { canvas: { width: 1080, height: 1920 }, save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {}, fillRect() {}, fillText() { calls.push('text'); }, measureText: value => ({ width: value.length * 12 }), set fillStyle(_) {}, set font(_) {}, set textAlign(_) {} };
  drawEditorialOverlay(ctx, { lowerThird: { title: 'Titulo', section: 'Actualidad', source: 'Fuente', accent: '#a6ce39' } });
  assert.ok(calls.length > 0);
});
