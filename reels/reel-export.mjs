import { normalizeReelProject } from './reel-model.mjs';
import { renderReelProject } from './reel-renderer.mjs';

export function validateReelProject(project = {}) {
  const normalized = normalizeReelProject(project);
  const errors = [];
  if (project.format !== '9:16') errors.push('formato inválido');
  if (!normalized.sourceUrl) errors.push('fuente faltante');
  if (normalized.scenes.length < 3 || normalized.scenes.length > 6) errors.push('cantidad de escenas inválida');
  normalized.scenes.forEach((scene, index) => {
    if (!scene.title && !scene.body) errors.push(`escena ${index + 1} vacía`);
    if (scene.type === 'closure' && !scene.cta) errors.push('cierre sin CTA');
  });
  return { ok: errors.length === 0, errors, project: normalized };
}

export function buildReelPackage(project = {}) {
  const normalized = normalizeReelProject(project);
  return {
    tipo: 'noticia_editorial',
    version: 2,
    fuente: { url: normalized.sourceUrl, categoria: normalized.section },
    editorial: { seccion: normalized.section, familia: 'reel-editorial' },
    salidas: { placas: [], carrusel: null, reel: normalized },
    redes: { instagram: '', facebook: '' },
  };
}

export function exportReelScene(canvas, project, assets, sceneIndex = 0) {
  if (!canvas || typeof canvas.toDataURL !== 'function') throw new Error('Canvas inválido.');
  renderReelProject(canvas, project, assets, sceneIndex);
  return canvas.toDataURL('image/png');
}
