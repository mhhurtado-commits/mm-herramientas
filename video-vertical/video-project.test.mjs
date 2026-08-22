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

test('normalizes and persists speaker markers', () => {
  const project = normalizeVideoProject({ duration: 30, speakers: [{ id: 'ana', start: 1, name: 'Ana Pérez' }] });
  assert.deepEqual(project.speakers, [{ id: 'ana', start: 4, duration: 4, name: 'Ana Pérez', role: '' }]);
});

test('passes speaker markers from project creation options', () => {
  const project = createVideoProject({}, { speakers: [{ id: 'ana', start: 8, name: 'Ana Pérez' }] });
  assert.equal(project.speakers[0].id, 'ana');
  assert.equal(project.speakers[0].start, 8);
});
