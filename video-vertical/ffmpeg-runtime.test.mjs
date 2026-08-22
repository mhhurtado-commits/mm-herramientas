import test from 'node:test';
import assert from 'node:assert/strict';
import { FFMPEG_CORE_URL, FFMPEG_WASM_URL, createFfmpegRuntime, loadFfmpegRuntime } from './ffmpeg-runtime.mjs';

test('loads the current FFmpeg runtime with its pinned CDN core assets', async () => {
  let options;
  class FFmpeg {
    async load(value) { options = value; }
  }
  const runtime = createFfmpegRuntime({ FFmpeg });
  await loadFfmpegRuntime(runtime);
  assert.equal(options.coreURL, FFMPEG_CORE_URL);
  assert.equal(options.wasmURL, FFMPEG_WASM_URL);
  assert.match(options.coreURL, /@ffmpeg\/core@0\.12\.10\/dist\/umd\/ffmpeg-core\.js$/);
  assert.match(options.wasmURL, /@ffmpeg\/core@0\.12\.10\/dist\/umd\/ffmpeg-core\.wasm$/);
  assert.ok(runtime instanceof FFmpeg);
});
