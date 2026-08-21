export const FFMPEG_CORE_PATH = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js';

export function createFfmpegRuntime({ createFFmpeg } = {}) {
  if (typeof createFFmpeg !== 'function') throw new Error('No se pudo cargar FFmpeg. Revisá tu conexión e intentá de nuevo.');
  return createFFmpeg({ log: false, corePath: FFMPEG_CORE_PATH });
}
