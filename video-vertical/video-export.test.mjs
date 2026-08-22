import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExportCommand } from './video-export.mjs';

test('builds a complete vertical MP4 with original audio', () => {
  const command = buildExportCommand({ inputName: 'source.mp4', overlayName: 'overlay.png', audioMode: 'original' });
  const joined = command.join(' ');
  assert.match(joined, /scale=1080:1920/);
  assert.match(joined, /boxblur/);
  assert.match(joined, /overlay=\(W-w\)\/2:\(H-h\)\/2/);
  assert.match(joined, /-map 0:a\?/);
  assert.match(joined, /-c:v libx264/);
  assert.match(joined, /output.mp4/);
});

test('builds a 4:5 MP4 at 1080 by 1350 when requested', () => {
  const joined = buildExportCommand({ width: 1080, height: 1350 }).join(' ');
  assert.match(joined, /scale=1080:1350/);
  assert.match(joined, /crop=1080:1350/);
});

test('exports a 720p Reel with a scaled editorial overlay in fast mode', () => {
  const joined = buildExportCommand({ quality: 'rapido' }).join(' ');
  assert.match(joined, /color=c=#111a15:s=720x1280\[bg\]/);
  assert.match(joined, /\[fgsrc\]scale=720:-2\[fg\]/);
  assert.match(joined, /\[1:v\]scale=720:1280\[layer0\]/);
  assert.match(joined, /-preset veryfast/);
  assert.match(joined, /-crf 22/);
});

test('exports 4:5 fast mode at 720 by 900', () => {
  const joined = buildExportCommand({ width: 1080, height: 1350, quality: 'rapido' }).join(' ');
  assert.match(joined, /color=c=#111a15:s=720x900\[bg\]/);
  assert.match(joined, /\[1:v\]scale=720:900\[layer0\]/);
});

test('applies each editorial layer only during its assigned interval', () => {
  const joined = buildExportCommand({
    layers: [
      { name: 'fixed.png' },
      { name: 'title.png', start: 0, duration: 4 },
      { name: 'speaker.png', start: 12.5, duration: 4 },
    ],
  }).join(' ');
  assert.match(joined, /\[1:v\]scale=1080:1920\[layer0\]/);
  assert.match(joined, /overlay=0:0:eof_action=repeat\[video0\]/);
  assert.match(joined, /between\(t\\,0\\,4\)/);
  assert.match(joined, /between\(t\\,12\.5\\,16\.5\)/);
  assert.match(joined, /-i fixed\.png -i title\.png -i speaker\.png/);
});

test('uses the current FFmpeg file and progress API', async () => {
  const stages = [];
  const writes = [];
  const progressListeners = [];
  const ffmpeg = { writeFile: async name => writes.push(name), exec: async () => {}, readFile: async () => new Uint8Array([1]), on: (event, listener) => progressListeners.push([event, listener]) };
  await (await import('./video-export.mjs')).exportEditorialVideo({ ffmpeg, source: new Blob(['x']), overlay: new Blob(['x']), onStage: stage => stages.push(stage) });
  assert.deepEqual(stages, ['copiando', 'componiendo', 'finalizando']);
  assert.deepEqual(writes, ['source.mp4', 'overlay.png']);
  assert.equal(progressListeners[0][0], 'progress');
});

test('writes every scheduled overlay image before rendering', async () => {
  const writes = [];
  const ffmpeg = { writeFile: async name => writes.push(name), exec: async () => {}, readFile: async () => new Uint8Array([1]), on: () => {} };
  await (await import('./video-export.mjs')).exportEditorialVideo({
    ffmpeg,
    source: new Blob(['x']),
    layers: [{ id: 'fixed', blob: new Blob(['x']) }, { id: 'speaker-1', start: 4, duration: 4, blob: new Blob(['x']) }],
  });
  assert.deepEqual(writes, ['source.mp4', 'overlay-fixed.png', 'overlay-speaker-1.png']);
});

test('maps music or a mix instead of the source audio when selected', () => {
  const music = buildExportCommand({ inputName: 'source.mp4', overlayName: 'overlay.png', musicName: 'music.mp3', audioMode: 'musica' }).join(' ');
  const mix = buildExportCommand({ inputName: 'source.mp4', overlayName: 'overlay.png', musicName: 'music.mp3', audioMode: 'mezcla' }).join(' ');
  assert.match(music, /-map 2:a\?/);
  assert.match(mix, /amix=inputs=2/);
  assert.match(mix, /-map \[outa\]/);
});

test('rejects an invalid audio mode before rendering', () => {
  assert.throws(() => buildExportCommand({ audioMode: 'silencio' }), /audio inválido/i);
});
