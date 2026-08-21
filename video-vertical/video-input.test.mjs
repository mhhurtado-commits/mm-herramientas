import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoHandoff, validateVideoFile } from './video-input.mjs';

test('accepts MP4 and rejects an unsupported local source', () => {
  assert.equal(validateVideoFile({ type: 'video/mp4', size: 10 }).ok, true);
  assert.equal(validateVideoFile({ type: 'text/plain', size: 10 }).ok, false);
});

test('reads the current editorial handoff without changing it', () => {
  const handoff = parseVideoHandoff(JSON.stringify({ output: 'reel', package: { editorial: { titulo: 'Nota' } } }));
  assert.equal(handoff.package.editorial.titulo, 'Nota');
  assert.equal(parseVideoHandoff('{bad'), null);
});
