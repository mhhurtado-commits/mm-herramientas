import {
  normalizeEditorialPackage,
  packageFromPlate,
} from '../shared/editorial-package.mjs';

const uniqueStrings = values => [...new Set((Array.isArray(values) ? values : [values])
  .flatMap(value => Array.isArray(value) ? value : [value])
  .map(value => String(value || '').trim())
  .filter(Boolean))];

export const EDITORIAL_OUTPUTS = ['placa', 'carrusel', 'reel'];

export function normalizeRequestedOutputs(outputs) {
  const requested = Array.isArray(outputs) ? outputs : [];
  const normalized = [...new Set(requested.filter(output => EDITORIAL_OUTPUTS.includes(output)))];
  return normalized.length ? normalized : ['placa'];
}

export function buildEditorialPackage(note = {}, plate = {}, outputs = ['placa']) {
  const requestedOutputs = normalizeRequestedOutputs(outputs);
  const packageDraft = packageFromPlate(plate);
  const noteImages = uniqueStrings([note.image || note.imagen, note.images || note.imagenes]);
  const notePrimaryImage = noteImages[0] || '';
  packageDraft.salidas = {
    placas: requestedOutputs.includes('placa') ? [plate] : [],
    carrusel: requestedOutputs.includes('carrusel') ? null : null,
    reel: requestedOutputs.includes('reel') ? null : null,
  };
  packageDraft.fuente = {
    ...packageDraft.fuente,
    url: packageDraft.fuente.url || String(note.url || '').trim(),
    titulo_original: packageDraft.fuente.titulo_original || String(note.title || note.titulo || '').trim(),
    categoria: packageDraft.fuente.categoria || String(note.category || note.categoria || '').trim(),
    cuerpo: packageDraft.fuente.cuerpo || String(note.body || note.texto || note.contenido || '').replace(/\s+/g, ' ').trim(),
    imagen: notePrimaryImage || packageDraft.fuente.imagen || '',
    imagenes: noteImages.length ? noteImages : packageDraft.fuente.imagenes,
  };
  const normalized = normalizeEditorialPackage(packageDraft);
  return { ...normalized, requestedOutputs };
}
