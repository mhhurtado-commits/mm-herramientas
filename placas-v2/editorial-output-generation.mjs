import { packageToCarouselArticle } from '../shared/editorial-package.mjs';
import { normalizeCarouselPlan } from '../carousel/parser.js';
import { buildCarouselPrompt, buildReelPrompt } from '../carousel/prompts.js';
import { ensureReelClosure } from '../carousel/reel-package-adapter.js';

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

  if (requestedOutputs.includes('reel') && !packageCopy.salidas.reel) {
    try {
      const rawReel = await dependencies.generateJson(
        buildReelPrompt(article, carouselPlan?.diagnosis || {}),
        'Genera el ReelPlan para esta noticia.'
      );
      packageCopy.salidas.reel = ensureReelClosure(rawReel, article);
    } catch {
      warnings.push('reel_no_disponible');
    }
  }

  return { package: packageCopy, warnings };
}
