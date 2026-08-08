import test from 'node:test';
import assert from 'node:assert/strict';
import { createReelHandoff, parseReelHandoff } from './output-handoff.mjs';

test('creates and parses the shared reel handoff', () => {
  const value = createReelHandoff({ tipo: 'noticia_editorial', version: 2 });
  const parsed = parseReelHandoff(value);
  assert.equal(parsed.output, 'reel');
  assert.equal(parsed.package.version, 2);
  assert.equal(parseReelHandoff('{bad'), null);
});
