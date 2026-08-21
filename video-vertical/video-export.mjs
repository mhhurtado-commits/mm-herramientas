const AUDIO_MODES = new Set(['original', 'musica', 'mezcla']);

export function buildExportCommand({ inputName = 'source.mp4', overlayName = 'overlay.png', musicName = 'music.mp3', audioMode = 'original', outputName = 'output.mp4', width = 1080, height = 1920, quality = 'alta' } = {}) {
  if (!AUDIO_MODES.has(audioMode)) throw new Error('Modo de audio inválido.');
  const fast = quality === 'rapido'; const backgroundWidth = fast ? Math.round(width / 2) : width; const backgroundHeight = fast ? Math.round(height / 2) : height;
  const graph = [
    '[0:v]split=2[bgsrc][fgsrc]',
    `[bgsrc]scale=${backgroundWidth}:${backgroundHeight}:force_original_aspect_ratio=increase,crop=${backgroundWidth}:${backgroundHeight},boxblur=${fast ? 10 : 20}:1${fast ? `,scale=${width}:${height}` : ''}[bg]`,
    `[fgsrc]scale=${width}:-2[fg]`,
    '[bg][fg]overlay=(W-w)/2:(H-h)/2[base]',
    '[base][1:v]overlay=0:0[outv]',
    ...(audioMode === 'mezcla' ? ['[0:a][2:a]amix=inputs=2:duration=first[outa]'] : []),
  ].join(';');
  const inputs = ['-i', inputName, '-i', overlayName];
  if (audioMode !== 'original') inputs.push('-i', musicName);
  const audioMap = audioMode === 'original' ? ['-map', '0:a?'] : audioMode === 'musica' ? ['-map', '2:a?'] : ['-map', '[outa]'];
  return [...inputs, '-filter_complex', graph, '-map', '[outv]', ...audioMap, '-r', '30', '-c:v', 'libx264', '-preset', fast ? 'veryfast' : 'medium', '-crf', fast ? '22' : '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName];
}

export async function exportEditorialVideo({ ffmpeg, fetchFile, source, overlay, music, audioMode = 'original', width = 1080, height = 1920, quality = 'alta', onProgress = () => {} } = {}) {
  if (!ffmpeg?.FS || typeof ffmpeg.run !== 'function' || typeof fetchFile !== 'function') throw new Error('FFmpeg no está disponible en este navegador.');
  if (!source || !overlay) throw new Error('Faltan el video fuente o el zócalo.');
  if (audioMode !== 'original' && !music) throw new Error('Elegí una pista de música para este modo de audio.');
  const sourceName = `source.${extension(source.name, 'mp4')}`;
  const musicName = `music.${extension(music?.name, 'mp3')}`;
  if (typeof ffmpeg.setProgress === 'function') ffmpeg.setProgress(({ ratio = 0 }) => onProgress(Math.max(0, Math.min(1, ratio))));
  ffmpeg.FS('writeFile', sourceName, await fetchFile(source));
  ffmpeg.FS('writeFile', 'overlay.png', await fetchFile(overlay));
  if (audioMode !== 'original') ffmpeg.FS('writeFile', musicName, await fetchFile(music));
  await ffmpeg.run(...buildExportCommand({ inputName: sourceName, overlayName: 'overlay.png', musicName, audioMode, width, height, quality }));
  const data = ffmpeg.FS('readFile', 'output.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}

function extension(name, fallback) { return String(name || '').split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || fallback; }
