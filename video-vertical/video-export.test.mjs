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
