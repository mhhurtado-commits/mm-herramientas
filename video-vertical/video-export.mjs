const AUDIO_MODES = new Set(['original', 'musica', 'mezcla']);

export function buildExportCommand({ inputName = 'source.mp4', overlayName = 'overlay.png', musicName = 'music.mp3', audioMode = 'original', outputName = 'output.mp4', width = 1080, height = 1920, quality = 'alta' } = {}) {
  if (!AUDIO_MODES.has(audioMode)) throw new Error('Modo de audio inválido.');
  const fast = quality === 'rapido';
  const outputWidth = fast ? 720 : width;
  const outputHeight = fast ? Math.round((height / width) * outputWidth) : height;
  const graph = [
    ...(fast ? [`color=c=#111a15:s=${outputWidth}x${outputHeight}[bg]`, '[0:v]null[fgsrc]'] : ['[0:v]split=2[bgsrc][fgsrc]', `[bgsrc]scale=${outputWidth}:${outputHeight}:force_original_aspect_ratio=increase,crop=${outputWidth}:${outputHeight},boxblur=20:1[bg]`]),
    `[fgsrc]scale=${outputWidth}:-2[fg]`,
    '[bg][fg]overlay=(W-w)/2:(H-h)/2[base]',
    `[1:v]scale=${outputWidth}:${outputHeight}[graphics]`,
    '[base][graphics]overlay=0:0[outv]',
    ...(audioMode === 'mezcla' ? ['[0:a][2:a]amix=inputs=2:duration=first[outa]'] : []),
  ].join(';');
  const inputs = ['-i', inputName, '-i', overlayName];
  if (audioMode !== 'original') inputs.push('-i', musicName);
  const audioMap = audioMode === 'original' ? ['-map', '0:a?'] : audioMode === 'musica' ? ['-map', '2:a?'] : ['-map', '[outa]'];
  return [...inputs, '-filter_complex', graph, '-map', '[outv]', ...audioMap, '-r', '30', '-c:v', 'libx264', '-preset', fast ? 'veryfast' : 'medium', '-crf', fast ? '22' : '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName];
}

export async function exportEditorialVideo({ ffmpeg, source, overlay, music, audioMode = 'original', width = 1080, height = 1920, quality = 'alta', onProgress = () => {}, onStage = () => {} } = {}) {
  if (typeof ffmpeg?.writeFile !== 'function' || typeof ffmpeg.exec !== 'function' || typeof ffmpeg.readFile !== 'function') throw new Error('FFmpeg no está disponible en este navegador.');
  if (!source || !overlay) throw new Error('Faltan el video fuente o el zócalo.');
  if (audioMode !== 'original' && !music) throw new Error('Elegí una pista de música para este modo de audio.');
  const sourceName = `source.${extension(source.name, 'mp4')}`;
  const musicName = `music.${extension(music?.name, 'mp3')}`;
  if (typeof ffmpeg.on === 'function') ffmpeg.on('progress', ({ progress = 0 }) => onProgress(Math.max(0, Math.min(1, progress))));
  onStage('copiando');
  await ffmpeg.writeFile(sourceName, await fileData(source));
  await ffmpeg.writeFile('overlay.png', await fileData(overlay));
  if (audioMode !== 'original') await ffmpeg.writeFile(musicName, await fileData(music));
  onStage('componiendo');
  await ffmpeg.exec(buildExportCommand({ inputName: sourceName, overlayName: 'overlay.png', musicName, audioMode, width, height, quality }));
  onStage('finalizando');
  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}

function extension(name, fallback) { return String(name || '').split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || fallback; }
async function fileData(file) { return new Uint8Array(await file.arrayBuffer()); }
