import test from 'node:test';
import assert from 'node:assert/strict';
import { drawEditorialLayer, drawEditorialOverlay, fitVideoText } from './video-renderer.mjs';

test('fits lower-third wording without producing blank lines', () => {
  const fitted = fitVideoText('Una noticia importante para la audiencia', 18, value => value.length * 9);
  assert.ok(fitted.lines.length >= 2);
  assert.ok(fitted.lines.every(Boolean));
});

test('draws an exportable transparent editorial overlay without a video frame', () => {
  const calls = [];
  const ctx = { canvas: { width: 1080, height: 1920 }, save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {}, fillRect() {}, fillText() { calls.push('text'); }, drawImage() { calls.push('logo'); }, measureText: value => ({ width: value.length * 12 }), set fillStyle(_) {}, set font(_) {}, set textAlign(_) {} };
  drawEditorialOverlay(ctx, { lowerThird: { title: 'Titulo', section: 'Actualidad', source: 'Fuente', accent: '#a6ce39' } }, { logo: { width: 500, height: 100 } });
  assert.ok(calls.length > 0);
  assert.ok(calls.includes('logo'));
});

test('renders a speaker layer without the title lower third', () => {
  const calls = [];
  const ctx = createContext(calls);
  const project = { lowerThird: { title: 'Titulo editorial', accent: '#a6ce39' } };
  drawEditorialLayer(ctx, project, { kind: 'speaker', speaker: { name: 'Ana Pérez', role: 'Especialista' } });
  assert.ok(calls.includes('ANA PÉREZ'));
  assert.ok(calls.includes('Especialista'));
  assert.ok(!calls.includes('Titulo editorial'));
});

test('preview keeps fixed branding and limits the title to 0 <= t < 4', () => {
  const project = {
    lowerThird: { title: 'Titulo editorial', section: 'Actualidad', accent: '#a6ce39' },
    speakers: [{ id: 'ana', start: 4, duration: 4, name: 'Ana Pérez', role: 'Especialista' }],
  };
  const before = []; drawEditorialOverlay(createContext(before), project, { time: -1, logo: { width: 500, height: 100 } });
  const opening = []; drawEditorialOverlay(createContext(opening), project, { time: 3.999, logo: { width: 500, height: 100 } });
  const speaker = []; drawEditorialOverlay(createContext(speaker), project, { time: 4, logo: { width: 500, height: 100 } });
  for (const calls of [before, opening, speaker]) assert.ok(calls.includes('logo'));
  assert.ok(!before.includes('Titulo editorial'));
  assert.ok(opening.includes('Titulo editorial'));
  assert.ok(!speaker.includes('Titulo editorial'));
  assert.ok(speaker.includes('ANA PÉREZ'));
});

function createContext(calls) {
  return { canvas: { width: 1080, height: 1920 }, save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {}, fillRect() {}, fillText(value) { calls.push(value); }, drawImage() { calls.push('logo'); }, measureText: value => ({ width: value.length * 12 }), set fillStyle(_) {}, set font(_) {}, set textAlign(_) {} };
}
