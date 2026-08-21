import { getRecommendedCategory, normalizeCategoryOptions, resolveCategoryAccent } from '../shared/editorial-taxonomy.mjs';

export function adaptVideoPackage(editorialPackage = {}) {
  const source = object(editorialPackage.fuente);
  const editorial = object(editorialPackage.editorial);
  const category = getRecommendedCategory(normalizeCategoryOptions(editorial.category_options));
  const fact = Array.isArray(editorial.datos_clave) ? editorial.datos_clave[0] : null;
  return {
    title: clean(editorial.titulo || source.titulo_original),
    summary: clean(editorial.bajada),
    section: clean(category?.label || editorial.seccion || source.categoria) || 'Actualidad',
    accent: resolveCategoryAccent(category),
    source: hostname(source.url) || 'mediamendoza',
    sourceUrl: clean(source.url),
    fact: formatFact(fact),
    image: clean(source.imagen || source.imagenes?.[0]),
  };
}

function formatFact(fact) {
  if (!fact) return '';
  if (typeof fact === 'string') return clean(fact);
  const label = clean(fact.label || fact.titulo || fact.nombre);
  const value = clean(fact.value || fact.valor || fact.text || fact.texto);
  return [label, value].filter(Boolean).join(': ');
}

function hostname(value) {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
