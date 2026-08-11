import { packageToCarouselArticle } from '../shared/editorial-package.mjs';
import { normalizeCarouselPlan } from '../carousel/parser.js';
import { buildCarouselPrompt } from '../carousel/prompts.js';
import { createReelOutputFromCarouselPlan } from '../reels/reel-package-adapter.mjs';

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

  if ((requestedOutputs.includes('carrusel') || requestedOutputs.includes('reel')) && !carouselPlan) {
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

  if (requestedOutputs.includes('reel') && carouselPlan) {
    packageCopy.salidas.reel = createReelOutputFromCarouselPlan(carouselPlan, article);
  }

  return { package: packageCopy, warnings };
}
