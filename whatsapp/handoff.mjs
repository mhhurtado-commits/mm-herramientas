export const HANDOFF_KEY = 'mm-editorial-handoff';

export function parseHandoff(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed?.package || !['carrusel', 'reel', 'video', 'whatsapp', 'placas'].includes(parsed.output)) return null;
    return { output: parsed.output, package: parsed.package, origen: parsed.origen === 'publicar' ? 'publicar' : 'app' };
  } catch {
    return null;
  }
}

export function esHandoffWhatsappActivo(parsed) {
  return !!parsed && parsed.output === 'whatsapp' && parsed.origen === 'publicar' && !!(parsed.package?.fuente?.url);
}

export function extraerDatosNota(parsed) {
  if (!esHandoffWhatsappActivo(parsed)) return null;
  const f = parsed.package.fuente;
  return { url: f.url, titulo: f.titulo_original, categoria: f.categoria };
}
