const MAX_SOURCE_BYTES = 100 * 1024 * 1024;

export async function exportCloudinaryVideo({ workerUrl, source, overlay, format = '9:16', fetcher = fetch, wait = delay => new Promise(resolve => setTimeout(resolve, delay)), onStage = () => {} } = {}) {
  if (!source || !overlay) throw new Error('Faltan el video fuente o el zócalo.');
  if (Number(source.size) > MAX_SOURCE_BYTES) throw new Error('La exportación rápida admite videos de hasta 100 MB.');
  const root = String(workerUrl || '').replace(/\/$/, '');
  if (!root) throw new Error('No está disponible el servicio de exportación rápida.');

  onStage('preparando');
  const created = await requestJson(fetcher, `${root}/video-vertical/cloudinary/crear`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ format, source: { name: source.name || 'video.mp4', size: source.size || 0, type: source.type || '' } }),
  });
  if (!created?.videoUpload || !created?.overlayUpload || !created?.jobId) throw new Error('El servicio de exportación no devolvió las credenciales de carga.');

  onStage('subiendo-video');
  await upload(fetcher, source, created.videoUpload);
  onStage('subiendo-zocalo');
  await upload(fetcher, overlay, created.overlayUpload);
  onStage('renderizando');
  await requestJson(fetcher, `${root}/video-vertical/cloudinary/render/${encodeURIComponent(created.jobId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });

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
