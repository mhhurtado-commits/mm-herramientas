export const EDITORIAL_HANDOFF_KEY = 'mm-editorial-handoff';

export function createEditorialHandoff(editorialPackage, output = 'carrusel', origen = 'app') {
  return JSON.stringify({
    output: ['reel', 'video', 'whatsapp', 'placas'].includes(output) ? output : 'carrusel',
    package: editorialPackage || null,
    origen: ['app', 'publicar'].includes(origen) ? origen : 'app',
  });
}

export function createReelHandoff(editorialPackage) {
  return createEditorialHandoff(editorialPackage, 'reel');
}

export function parseEditorialHandoff(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed?.package || !['carrusel', 'reel', 'video', 'whatsapp', 'placas'].includes(parsed.output)) return null;
    return { output: parsed.output, package: parsed.package, origen: ['app', 'publicar'].includes(parsed.origen) ? parsed.origen : 'app' };
  } catch {
    return null;
  }
}
