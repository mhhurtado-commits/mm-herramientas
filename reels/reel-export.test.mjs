import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReelProject, buildReelPackage } from './reel-export.mjs';

test('validates a complete reel and keeps the reel output in the package', () => {
  const project = { format: '9:16', sourceUrl: 'https://example.com', section: 'policiales', scenes: [
    { type: 'cover', title: 'Título', body: 'Bajada', imageMode: 'contain-blur' },
    { type: 'que-paso', title: 'Qué pasó', body: 'Contexto', imageMode: 'text' },
    { type: 'closure', title: 'Seguí informado', body: 'Más información', cta: 'Leé la nota completa' },
  ] };
  assert.equal(validateReelProject(project).ok, true);
  assert.equal(buildReelPackage(project).salidas.reel.scenes.length, 3);
});

test('rejects reels with invalid format or empty scenes', () => {
  const result = validateReelProject({ format: '1:1', scenes: [{ type: 'cover', title: '' }] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 2);
});
