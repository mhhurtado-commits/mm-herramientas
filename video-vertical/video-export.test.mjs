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

test('uses a lower-resolution background and veryfast encoder in fast mode', () => {
  const joined = buildExportCommand({ quality: 'rapido' }).join(' ');
  assert.match(joined, /color=c=#111a15:s=1080x1920\[bg\]/);
  assert.match(joined, /-preset veryfast/);
  assert.match(joined, /-crf 22/);
});

test('reports file-copy and composition stages to the interface', async () => {
  const stages = [];
  const writes = [];
  const ffmpeg = { FS: (action, name) => action === 'readFile' ? new Uint8Array([1]) : writes.push(name), run: async () => {}, setProgress() {} };
  await (await import('./video-export.mjs')).exportEditorialVideo({ ffmpeg, fetchFile: async () => new Uint8Array([1]), source: new Blob(['x']), overlay: new Blob(['x']), onStage: stage => stages.push(stage) });
  assert.deepEqual(stages, ['copiando', 'componiendo', 'finalizando']);
  assert.deepEqual(writes, ['source.mp4', 'overlay.png']);
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
