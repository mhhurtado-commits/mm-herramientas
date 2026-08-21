import test from 'node:test';
import assert from 'node:assert/strict';
import { FFMPEG_CORE_PATH, createFfmpegRuntime } from './ffmpeg-runtime.mjs';

test('pins the compatible FFmpeg core through corePath', () => {
  let options;
  const runtime = createFfmpegRuntime({ createFFmpeg: value => { options = value; return { load() {} }; } });
  assert.equal(options.corePath, FFMPEG_CORE_PATH);
  assert.equal(options.log, false);
  assert.ok(runtime);
});
