const AUDIO_MODES = new Set(['original', 'musica', 'mezcla']);

export function buildExportCommand({ inputName = 'source.mp4', overlayName = 'overlay.png', layers, musicName = 'music.mp3', audioMode = 'original', outputName = 'output.mp4', width = 1080, height = 1920, quality = 'alta', trim = null } = {}) {
  if (!AUDIO_MODES.has(audioMode)) throw new Error('Modo de audio inválido.');
  const fast = quality === 'rapido';
  const outputWidth = fast ? 720 : width;
  const outputHeight = fast ? Math.round((height / width) * outputWidth) : height;
  const layerPlan = normalizeLayers(layers, overlayName);
  const graphics = layerPlan.flatMap((layer, index) => {
    const input = `[${index + 1}:v]scale=${outputWidth}:${outputHeight}[layer${index}]`;
    const output = index === layerPlan.length - 1 ? 'outv' : `video${index}`;
    const previous = index === 0 ? 'base' : `video${index - 1}`;
    const timing = Number.isFinite(layer.start) && Number.isFinite(layer.duration)
      ? `:enable='between(t\\,${formatSeconds(layer.start)}\\,${formatSeconds(layer.start + layer.duration)})'`
      : '';
    return [input, `[${previous}][layer${index}]overlay=0:0:eof_action=repeat${timing}[${output}]`];
  });
  const musicInputIndex = layerPlan.length + 1;
  const trimArgs = [];
  const trimStart = Number(trim?.start);
  const trimEnd = Number(trim?.end);
  if (Number.isFinite(trimStart) && Number.isFinite(trimEnd) && trimEnd > trimStart) {
    trimArgs.push('-ss', formatSeconds(trimStart), '-to', formatSeconds(trimEnd));
  }
  const graph = [
    ...(fast ? [`color=c=#111a15:s=${outputWidth}x${outputHeight}[bg]`, '[0:v]null[fgsrc]'] : ['[0:v]split=2[bgsrc][fgsrc]', `[bgsrc]scale=${outputWidth}:${outputHeight}:force_original_aspect_ratio=increase,crop=${outputWidth}:${outputHeight},boxblur=20:1[bg]`]),
    `[fgsrc]scale=${outputWidth}:-2[fg]`,
    '[bg][fg]overlay=(W-w)/2:(H-h)/2[base]',
    ...graphics,
    ...(audioMode === 'mezcla' ? [`[0:a][${musicInputIndex}:a]amix=inputs=2:duration=first[outa]`] : []),
  ].join(';');
  const inputs = [...trimArgs, '-i', inputName, ...layerPlan.flatMap(layer => ['-i', layer.name])];
  if (audioMode !== 'original') inputs.push('-i', musicName);
  const audioMap = audioMode === 'original' ? ['-map', '0:a?'] : audioMode === 'musica' ? ['-map', `${musicInputIndex}:a?`] : ['-map', '[outa]'];
  return [...inputs, '-filter_complex', graph, '-map', '[outv]', ...audioMap, '-r', '30', '-c:v', 'libx264', '-preset', fast ? 'veryfast' : 'medium', '-crf', fast ? '22' : '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName];
}

export async function exportEditorialVideo({ ffmpeg, source, overlay, layers, music, audioMode = 'original', width = 1080, height = 1920, quality = 'alta', trim = null, onProgress = () => {}, onStage = () => {} } = {}) {
  if (typeof ffmpeg?.writeFile !== 'function' || typeof ffmpeg.exec !== 'function' || typeof ffmpeg.readFile !== 'function') throw new Error('FFmpeg no está disponible en este navegador.');
  const layerPlan = normalizeLayers(layers, 'overlay.png', overlay);
  if (!source || !layerPlan.every(layer => layer.blob)) throw new Error('Faltan el video fuente o las capas editoriales.');
  if (audioMode !== 'original' && !music) throw new Error('Elegí una pista de música para este modo de audio.');
  const sourceName = `source.${extension(source.name, 'mp4')}`;
  const musicName = `music.${extension(music?.name, 'mp3')}`;
  if (typeof ffmpeg.on === 'function') ffmpeg.on('progress', ({ progress = 0 }) => onProgress(Math.max(0, Math.min(1, progress))));
  onStage('copiando');
  await ffmpeg.writeFile(sourceName, await fileData(source));
  for (const layer of layerPlan) await ffmpeg.writeFile(layer.name, await fileData(layer.blob));
  if (audioMode !== 'original') await ffmpeg.writeFile(musicName, await fileData(music));
  onStage('componiendo');
  await ffmpeg.exec(buildExportCommand({ inputName: sourceName, layers: layerPlan, musicName, audioMode, width, height, quality, trim }));
  onStage('finalizando');
  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}

function extension(name, fallback) { return String(name || '').split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || fallback; }
async function fileData(file) { return new Uint8Array(await file.arrayBuffer()); }
function normalizeLayers(layers, fallbackName, fallbackBlob) {
  const raw = Array.isArray(layers) && layers.length ? layers : fallbackBlob ? [{ id: 'fixed', name: fallbackName, blob: fallbackBlob }] : [{ name: fallbackName }];
  return raw.map((layer, index) => ({
    ...layer,
    name: String(layer.name || `overlay-${safeLayerId(layer.id || index)}.png`),
    start: Number(layer.start),
    duration: Number(layer.duration),
  }));
}
function safeLayerId(value) { return String(value).replace(/[^a-z0-9_-]/gi, '-') || 'layer'; }
function formatSeconds(value) { return String(Math.round(Number(value) * 1000) / 1000); }
