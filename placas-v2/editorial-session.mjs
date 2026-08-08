import { normalizeEditorialPackage, packageToPlateInput } from '../shared/editorial-package.mjs';
import { buildEditorialVariants, normalizeNewsPlate } from './editorial-core.mjs';

export function createEditorialSession({ url = '', outputs = ['placa'] } = {}) {
  return {
    url: String(url || '').trim(),
    outputs: Array.isArray(outputs) ? [...outputs] : ['placa'],
    note: null,
    package: null,
    plate: null,
    variants: [],
    warnings: [],
  };
}

export async function loadEditorialSession(url, outputs = ['placa'], dependencies = {}) {
  const extract = dependencies.extract;
  const generate = dependencies.generate;
  if (typeof extract !== 'function' || typeof generate !== 'function') {
    throw new Error('La sesión editorial requiere funciones de extracción y generación.');
  }

  const session = createEditorialSession({ url, outputs });
  session.note = await extract(session.url);
  const response = await generate(session.note, session.outputs);
  const normalized = normalizeEditorialPackage(response?.paquete || response?.package);
  if (!normalized.ok) throw new Error(normalized.errors.join('. '));

  session.package = normalized.package;
  session.plate = normalizeNewsPlate(packageToPlateInput(session.package));
  session.variants = buildEditorialVariants(session.plate);
  session.warnings = Array.isArray(response?.warnings) ? response.warnings : [];
  return session;
}

export function getOutputAvailability(editorialPackage = {}) {
  const requested = Array.isArray(editorialPackage.requestedOutputs) ? editorialPackage.requestedOutputs : [];
  return {
    placas: requested.includes('placa'),
    carrusel: requested.includes('carrusel'),
    reel: requested.includes('reel'),
  };
}
