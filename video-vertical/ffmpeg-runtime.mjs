export const FFMPEG_CORE_URL = './vendor/ffmpeg/ffmpeg-core.js';
export const FFMPEG_WASM_URL = './vendor/ffmpeg/ffmpeg-core.wasm';

export function createFfmpegRuntime({ FFmpeg } = {}) {
  if (typeof FFmpeg !== 'function') throw new Error('No se pudo cargar FFmpeg. Revisá tu conexión e intentá de nuevo.');
  return new FFmpeg();
}

export async function loadFfmpegRuntime(runtime) {
  if (!runtime || typeof runtime.load !== 'function') throw new Error('No se pudo iniciar FFmpeg.');
  await runtime.load({ coreURL: FFMPEG_CORE_URL, wasmURL: FFMPEG_WASM_URL });
  return runtime;
}
