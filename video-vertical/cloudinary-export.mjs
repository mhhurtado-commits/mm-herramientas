const MAX_SOURCE_BYTES = 100 * 1024 * 1024;

export async function exportCloudinaryVideo({ workerUrl, source, layers, format = '9:16', framingMode = 'contain', trim = null, fetcher = fetch, wait = delay => new Promise(resolve => setTimeout(resolve, delay)), onStage = () => {} } = {}) {
  const layerPlan = normalizeLayers(layers);
  if (!source || !layerPlan.length || !layerPlan.every(layer => layer.blob)) throw new Error('Faltan el video fuente o las capas editoriales.');
  if (Number(source.size) > MAX_SOURCE_BYTES) throw new Error('La exportación rápida admite videos de hasta 100 MB.');
  const root = String(workerUrl || '').replace(/\/$/, '');
  if (!root) throw new Error('No está disponible el servicio de exportación rápida.');
  const trimPayload = trim && Number.isFinite(Number(trim.start)) && Number.isFinite(Number(trim.end)) && Number(trim.end) > Number(trim.start) ? { start: Number(trim.start), end: Number(trim.end) } : null;

  onStage('preparando');
  const created = await requestJson(fetcher, `${root}/video-vertical/cloudinary/crear`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ format, framingMode, trim: trimPayload, source: { name: source.name || 'video.mp4', size: source.size || 0, type: source.type || '' }, layers: layerPlan.map(({ id, kind, start, duration }) => ({ id, kind, start, duration })) }),
  });
  if (!created?.videoUpload || !Array.isArray(created?.layerUploads) || created.layerUploads.length !== layerPlan.length || !created?.jobId) throw new Error('El servicio de exportación no devolvió las credenciales de carga.');

  onStage('subiendo-video');
  await upload(fetcher, source, created.videoUpload);
  onStage('subiendo-capas');
  for (let index = 0; index < layerPlan.length; index += 1) await upload(fetcher, layerPlan[index].blob, created.layerUploads[index]);
  onStage('renderizando');
  await requestJson(fetcher, `${root}/video-vertical/cloudinary/render/${encodeURIComponent(created.jobId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trimPayload ? { trim: trimPayload } : {}) });

  for (let attempts = 0; attempts < 80; attempts += 1) {
    const status = await requestJson(fetcher, `${root}/video-vertical/cloudinary/estado/${encodeURIComponent(created.jobId)}`);
    if (status?.status === 'listo' && status.downloadUrl) return { jobId: created.jobId, downloadUrl: status.downloadUrl };
    if (status?.status === 'error') throw new Error(status.error || 'Cloudinary no pudo generar el MP4.');
    onStage('esperando');
    await wait(1500);
  }
  throw new Error('La exportación sigue en proceso. Volvé a intentarlo en unos segundos.');
}

async function upload(fetcher, file, config) {
  const form = new FormData();
  form.append('file', file, file.name || 'overlay.png');
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(config.timestamp));
  form.append('signature', config.signature);
  form.append('public_id', config.publicId);
  const result = await requestJson(fetcher, config.endpoint, { method: 'POST', body: form });
  if (result?.public_id !== config.publicId) throw new Error('Cloudinary no confirmó la carga del archivo.');
}

async function requestJson(fetcher, url, options) {
  const response = await fetcher(url, options);
  let body;
  try { body = await response.json(); } catch { throw new Error('Respuesta inválida del servicio de exportación.'); }
  if (!response.ok || body?.ok === false) throw new Error(body?.error?.message || body?.error || `No se pudo completar la exportación (${response.status}).`);
  return body;
}

function normalizeLayers(layers) {
  if (!Array.isArray(layers)) return [];
  return layers.map((layer, index) => ({
    id: String(layer?.id || `layer-${index}`),
    kind: String(layer?.kind || 'speaker'),
    start: layer?.kind === 'fixed' ? 0 : Number(layer?.start),
    duration: layer?.kind === 'fixed' ? null : Number(layer?.duration),
    blob: layer?.blob,
  }));
}
