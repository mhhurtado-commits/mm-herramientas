import { packageToCarouselArticle } from '../shared/editorial-package.mjs';
import { normalizeCarouselPlan } from '../carousel/parser.js';
import { buildCarouselPrompt } from '../carousel/prompts.js';
import { createReelOutputFromEditorialPackage } from '../reels/reel-package-adapter.mjs';

export async function generateEditorialOutputs(editorialPackage = {}, requestedOutputs = [], dependencies = {}) {
  if (typeof dependencies.generateJson !== 'function') {
    throw new Error('La generaciÃ³n editorial requiere generateJson.');
  }

  const packageCopy = {
    ...editorialPackage,
    salidas: { ...(editorialPackage.salidas || {}) },
  };
  const article = packageToCarouselArticle(packageCopy);
  const warnings = [];
  let carouselPlan = packageCopy.salidas.carrusel;

  if (requestedOutputs.includes('carrusel') && !carouselPlan) {
    try {
      const rawPlan = await dependencies.generateJson(
        buildCarouselPrompt(article),
        'Genera el plan editorial para el carrusel.'
      );
      const normalized = normalizeCarouselPlan(rawPlan, article);
      if (!normalized.ok) warnings.push('carrusel_plan_invalido');
      else {
        carouselPlan = normalized.plan;
        packageCopy.salidas.carrusel = carouselPlan;
      }
    } catch {
      warnings.push('carrusel_no_disponible');
    }
  }

  if (requestedOutputs.includes('reel')) {
    packageCopy.editorial = enrichCanonicalEditorial(packageCopy.editorial, packageCopy.salidas.carrusel);
    packageCopy.salidas.reel = createReelOutputFromEditorialPackage(packageCopy);
  }

  return { package: packageCopy, warnings };
}

function enrichCanonicalEditorial(editorial = {}, carouselPlan = null) {
  const plan = carouselPlan && typeof carouselPlan === 'object' ? carouselPlan : {};
  const slides = Array.isArray(plan.slides) ? plan.slides : [];
  const context = slides.find(slide => ['contexto', 'context', 'clave'].includes(clean(slide?.type).toLowerCase()) && clean(slide?.text))?.text;
  const facts = slides.flatMap(slide => {
    const type = clean(slide?.type).toLowerCase();
    if (['end', 'cover', 'imagen'].includes(type)) return [];
    return [slide?.text, ...(Array.isArray(slide?.items) ? slide.items.map(item => item?.text || item?.value || item) : [])];
  }).map(clean).filter(Boolean);
  return {
    ...editorial,
    contexto: clean(editorial.contexto) || clean(context),
    datos_clave: uniqueStrings([editorial.datos_clave, facts]),
  };
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [values]).flatMap(value => Array.isArray(value) ? value : [value]).map(clean).filter(Boolean))];
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
