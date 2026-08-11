import { packageToCarouselArticle } from '../shared/editorial-package.mjs';
import { normalizeCategoryOptions } from '../shared/editorial-taxonomy.mjs';

// Adaptador propio de Reel. Replica el mapeo editorial del carrusel sin compartir su módulo ni su estado.
export function fromEditorialPackage(editorialPackage = {}) {
  const source = editorialPackage.fuente || {};
  const editorial = editorialPackage.editorial || {};
  const plan = editorialPackage.salidas?.carrusel || {};
  const article = packageToCarouselArticle(editorialPackage);
  const slides = Array.isArray(plan.slides) ? plan.slides : [];
  const cover = plan.cover || {};
  const categoryOptions = normalizeCategoryOptions(editorial.category_options);
  const facts = slides.flatMap(slide => {
    const type = clean(slide?.type).toLowerCase();
    if (['cover', 'end', 'imagen'].includes(type)) return [];
    return [slide?.text, ...(Array.isArray(slide?.items) ? slide.items.map(item => item?.text || item?.value || item) : [])];
  });

  return {
    article,
    categoryOptions,
    editorial: {
      ...editorial,
      titulo: clean(editorial.titulo || cover.title || article.title),
      bajada: clean(editorial.bajada || cover.subtitle || article.summary),
      contexto: clean(editorial.contexto || findSlideText(slides, ['contexto', 'context'])),
      datos_clave: uniqueStrings([editorial.datos_clave, facts]),
    },
  };
}

function findSlideText(slides, types) {
  return slides.find(slide => types.includes(clean(slide?.type).toLowerCase()) && clean(slide?.text))?.text || '';
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [values]).flatMap(value => Array.isArray(value) ? value : [value]).map(clean).filter(Boolean))];
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
