import test from 'node:test';
import assert from 'node:assert/strict';
import { FFMPEG_CORE_URL, FFMPEG_WASM_URL, createFfmpegRuntime, loadFfmpegRuntime } from './ffmpeg-runtime.mjs';

test('loads the current FFmpeg runtime with same-origin core assets', async () => {
  let options;
  class FFmpeg {
    async load(value) { options = value; }
  }
  const runtime = createFfmpegRuntime({ FFmpeg });
  await loadFfmpegRuntime(runtime);
  assert.equal(options.coreURL, FFMPEG_CORE_URL);
  assert.equal(options.wasmURL, FFMPEG_WASM_URL);
  assert.ok(runtime instanceof FFmpeg);
});
