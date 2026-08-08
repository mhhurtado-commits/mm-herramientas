import { normalizeEditorialPackage } from '../shared/editorial-package.mjs';
import { createReelProject } from './reel-model.mjs';

export function createReelSession({ url = '' } = {}) {
  return { url: String(url || '').trim(), note: null, package: null, project: null, warnings: [] };
}

export async function loadReelSession(url, dependencies = {}) {
  if (typeof dependencies.extract !== 'function' || typeof dependencies.generate !== 'function') {
    throw new Error('La sesión de reel requiere funciones de extracción y generación.');
  }
  const session = createReelSession({ url });
  session.note = await dependencies.extract(session.url);
  const response = await dependencies.generate(session.note, ['reel']);
  const normalized = normalizeEditorialPackage(response?.paquete || response?.package);
  if (!normalized.ok) throw new Error(normalized.errors.join('. '));
  session.package = normalized.package;
  session.project = createReelProject(session.package);
  session.warnings = Array.isArray(response?.warnings) ? response.warnings : [];
  return session;
}
