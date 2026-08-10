import { packageToCarouselArticle } from '../shared/editorial-package.mjs';
import { createCarouselProject } from './models.js';
import { normalizeCategoryOptions } from '../shared/editorial-taxonomy.mjs';

const NEWS_TYPES = new Set(['breaking', 'service', 'institutional', 'analysis', 'data', 'evergreen']);
const COMPLEXITIES = new Set(['brief', 'medium', 'deep']);
const TONES = new Set(['informative', 'explainer', 'chronological', 'impact', 'utility']);
const CAROUSEL_TYPES = new Set(['summary', 'explainer', 'timeline', 'data_points', 'service']);
const TEMPLATES = new Set(['mm_classic', 'mm_briefing', 'mm_impact']);

export function fromEditorialPackage(editorialPackage = {}) {
  const editorial = editorialPackage.editorial || {};
  const article = packageToCarouselArticle(editorialPackage);
  article.title = clean(editorial.titulo) || article.title;
  article.summary = clean(editorial.bajada) || article.summary;
  article.category = clean(editorial.seccion) || article.category;

  const existingPlan = editorialPackage.salidas?.carrusel;
  const diagnosis = existingPlan?.diagnosis || {};
  return {
    article,
    categoryOptions: normalizeCategoryOptions(editorial.category_options),
    diagnosis: {
      news_type: allowed(editorial.tipo_noticia, NEWS_TYPES, 'evergreen'),
      vertical: mapVertical(editorial.seccion),
      complexity: allowed(editorial.complejidad, COMPLEXITIES, 'medium'),
      tone: allowed(editorial.tono, TONES, 'informative'),
      carousel_type: allowed(diagnosis.carousel_type, CAROUSEL_TYPES, inferCarouselType(editorial)),
      template: allowed(diagnosis.template, TEMPLATES, inferTemplate(editorial)),
      slide_count: Number(diagnosis.slide_count || 0) || 0,
      reason: clean(diagnosis.reason),
    },
  };
}

export function attachEditorialPackage(project = {}, editorialPackage = {}) {
  const adapted = fromEditorialPackage(editorialPackage);
  const next = {
    ...project,
    article: adapted.article,
    categoryOptions: adapted.categoryOptions,
    selectedCategoryId: adapted.categoryOptions.find(option => option.recommended)?.id || adapted.categoryOptions[0]?.id || "",
    editorialPackage,
    editorialDiagnosis: adapted.diagnosis,
  };
  const storedPlan = editorialPackage.salidas?.carrusel;
  if (storedPlan && storedPlan.cover && Array.isArray(storedPlan.slides)) {
    next.editorialPlan = storedPlan;
  }
  return next;
}

export function openCarouselFromEditorialPackage(editorialPackage = {}) {
  return attachEditorialPackage(createCarouselProject(), editorialPackage);
}

function mapVertical(value) {
  const normalized = clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('policial')) return 'policiales';
  if (normalized.includes('clima') || normalized.includes('meteor')) return 'clima';
  if (normalized.includes('servicio')) return 'servicios';
  if (normalized.includes('espect') || normalized.includes('tiempo libre')) return 'espectaculos';
  if (normalized.includes('social') || normalized.includes('sociedad')) return 'sociales';
  if (normalized.includes('deport')) return 'deportes';
  if (normalized.includes('polit')) return 'politica';
  if (normalized.includes('econom')) return 'economia';
  return 'general';
}

function inferCarouselType(editorial) {
  const vertical = mapVertical(editorial.seccion);
  const newsType = clean(editorial.tipo_noticia);
  if (vertical === 'clima' || vertical === 'servicios' || newsType === 'service') return 'service';
  if (vertical === 'policiales') return 'timeline';
  if (vertical === 'politica' || newsType === 'analysis') return 'explainer';
  if (vertical === 'economia' || newsType === 'data') return 'data_points';
  return 'summary';
}

function inferTemplate(editorial) {
  const vertical = mapVertical(editorial.seccion);
  const type = inferCarouselType(editorial);
  if (vertical === 'policiales' || type === 'timeline') return 'mm_impact';
  if (vertical === 'clima' || vertical === 'servicios' || type === 'service' || type === 'data_points') return 'mm_briefing';
  return 'mm_classic';
}

function allowed(value, values, fallback) {
  return values.has(value) ? value : fallback;
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
