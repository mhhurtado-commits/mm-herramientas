import { packageToCarouselArticle } from '../shared/editorial-package.mjs';
import { normalizeCategoryOptions } from '../shared/editorial-taxonomy.mjs';

// Adaptador propio de Reel. Lee el mismo paquete de Placas V2 que Carrusel,
// pero proyecta sus bloques a escenas verticales sin importar módulos de Carrusel.
export function fromEditorialPackage(editorialPackage = {}) {
  const source = editorialPackage.fuente || {};
  const rawEditorial = editorialPackage.editorial || {};
  const plan = editorialPackage.salidas?.carrusel || {};
  const article = packageToCarouselArticle(editorialPackage);
  const categoryOptions = normalizeCategoryOptions(rawEditorial.category_options);
  const storyBlocks = buildStoryBlocks(plan, rawEditorial);
  const cover = plan.cover || {};
  const facts = storyBlocks.flatMap(block => [block.body, ...block.items.map(item => item.text)]).filter(Boolean);
  const context = storyBlocks.find(block => block.role === 'context')?.body || '';

  return {
    article,
    categoryOptions,
    storyBlocks,
    editorial: {
      ...rawEditorial,
      titulo: clean(rawEditorial.titulo || cover.title || article.title),
      bajada: clean(rawEditorial.bajada || cover.subtitle || article.summary),
      contexto: context || clean(rawEditorial.contexto),
      datos_clave: uniqueStrings(facts),
    },
  };
}

function buildStoryBlocks(plan, editorial) {
  const slides = Array.isArray(plan?.slides) ? plan.slides : [];
  const blocks = slides
    .map(slideToBlock)
    .filter(Boolean);

  if (blocks.length) return dedupeBlocks(blocks);

  const fallback = [];
  const context = cleanNarrative(editorial?.contexto);
  if (context) fallback.push({ role: 'context', title: 'Qué pasó', body: context, items: [] });
  const facts = uniqueStrings(editorial?.datos_clave)
    .map(text => ({ label: 'Dato clave', text: cleanNarrative(text) }))
    .filter(item => item.text);
  if (facts.length) fallback.push({ role: 'fact', title: 'Dato clave', body: '', items: facts });
  return fallback;
}

function slideToBlock(slide = {}) {
  const type = clean(slide.type).toLowerCase();
  if (!type || ['cover', 'end', 'imagen', 'image'].includes(type)) return null;
  const items = normalizeItems(slide.items);
  const body = cleanNarrative(slide.text || slide.body || slide.description);
  if (!body && !items.length) return null;
  return {
    role: isContextType(type) ? 'context' : 'fact',
    title: cleanNarrative(slide.title) || (isContextType(type) ? 'Qué pasó' : 'Dato clave'),
    body,
    items,
  };
}

function isContextType(type) {
  return ['contexto', 'context', 'que-paso', 'resumen', 'summary'].includes(type);
}

function normalizeItems(values) {
  const seen = [];
  return (Array.isArray(values) ? values : []).map(value => {
    const source = value && typeof value === 'object' ? value : { text: value };
    return { label: cleanNarrative(source.label || source.title || source.name), text: cleanNarrative(source.text || source.value || source.body) };
  }).filter(item => {
    if (!item.text || seen.some(previous => sameText(item.text, previous))) return false;
    seen.push(item.text);
    return true;
  });
}

function dedupeBlocks(blocks) {
  const seen = [];
  return blocks.map(block => {
    const body = seen.some(previous => sameText(block.body, previous)) ? '' : block.body;
    if (body) seen.push(body);
    const items = block.items.filter(item => {
      if (seen.some(previous => sameText(item.text, previous))) return false;
      seen.push(item.text);
      return true;
    });
    return { ...block, body, items };
  }).filter(block => block.body || block.items.length);
}

function sameText(left, right) {
  const a = clean(left).toLowerCase();
  const b = clean(right).toLowerCase();
  return Boolean(a && b) && (a === b || (a.length > 24 && b.length > 24 && (a.includes(b) || b.includes(a))));
}

function cleanNarrative(value) {
  const text = clean(value);
  if (!text || /(?:^[a-z]:[\\/]|^file:|\\cachefiles\\|\.(?:jpg|jpeg|png|webp|json)(?:\s|$))/i.test(text)) return '';
  return text;
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [values]).flatMap(value => Array.isArray(value) ? value : [value]).map(cleanNarrative).filter(Boolean))];
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
