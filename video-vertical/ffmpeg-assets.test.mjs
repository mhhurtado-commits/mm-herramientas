import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('loads the current FFmpeg wrapper from this site', async () => {
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  assert.match(html, /src="vendor\/ffmpeg\/ffmpeg\.js"/);
  assert.doesNotMatch(html, /@ffmpeg\/ffmpeg@0\.11/);
});
