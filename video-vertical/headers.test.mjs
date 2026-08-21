import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('enables cross-origin isolation for the FFmpeg video vertical route', () => {
  const headers = readFileSync(new URL('../_headers', import.meta.url), 'utf8');
  assert.match(headers, /\/video-vertical\/\*[\s\S]*Cross-Origin-Opener-Policy: same-origin[\s\S]*Cross-Origin-Embedder-Policy: require-corp/);
});
