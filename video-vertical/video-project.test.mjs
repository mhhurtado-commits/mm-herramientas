import test from 'node:test';
import assert from 'node:assert/strict';
import { createVideoProject, normalizeVideoProject } from './video-project.mjs';

test('creates a vertical project with editable defaults from the package', () => {
  const project = createVideoProject({ editorial: { titulo: 'Una noticia', seccion: 'Política' }, fuente: { url: 'https://mediamendoza.com/nota' } });
  assert.equal(project.format, '9:16');
  assert.equal(project.profile, 'hablado');
  assert.equal(project.audioMode, 'original');
  assert.equal(project.lowerThird.title, 'Una noticia');
  assert.equal(project.framing.mode, 'contain');
});

test('normalizes invalid profile, audio mode and focus', () => {
  const project = normalizeVideoProject({ profile: 'otra-cosa', audioMode: 'silencio', framing: { mode: 'cover', focus: { x: 3, y: -1 } } });
  assert.equal(project.profile, 'hablado');
  assert.equal(project.audioMode, 'original');
  assert.deepEqual(project.framing.focus, { x: 1, y: 0 });
});

test('preserves the 4:5 editorial format', () => {
  assert.equal(normalizeVideoProject({ format: '4:5' }).format, '4:5');
});

test('defaults to fast export and preserves high-quality selection', () => {
  assert.equal(normalizeVideoProject({}).exportQuality, 'rapido');
  assert.equal(normalizeVideoProject({ exportQuality: 'rapido' }).exportQuality, 'rapido');
  assert.equal(normalizeVideoProject({ exportQuality: 'alta' }).exportQuality, 'alta');
});
