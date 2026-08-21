export const EDITORIAL_HANDOFF_KEY = 'mm-editorial-handoff';

export function createEditorialHandoff(editorialPackage, output = 'carrusel') {
  return JSON.stringify({
    output: ['reel', 'video'].includes(output) ? output : 'carrusel',
    package: editorialPackage || null,
  });
}

export function createReelHandoff(editorialPackage) {
  return createEditorialHandoff(editorialPackage, 'reel');
}

export function parseEditorialHandoff(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed?.package || !['carrusel', 'reel', 'video'].includes(parsed.output)) return null;
    return parsed;
  } catch {
    return null;
  }
}
