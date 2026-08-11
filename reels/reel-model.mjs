/* Legacy values kept temporarily for compatibility with serialized projects. */
const SECTION_COLORS = {
  actualidad: '#a8d432',
  policiales: '#c7474f',
  sociales: '#bd7125',
  sociedad: '#bd7125',
  politica: '#6650a4',
  política: '#6650a4',
  economia: '#187f72',
  economía: '#187f72',
  deportes: '#148a78',
  clima: '#4d8fb8',
  general: '#a8d432',
};

import { getRecommendedCategory, normalizeCategoryOptions, resolveCategoryAccent } from '../shared/editorial-taxonomy.mjs';

const DEFAULT_FOCUS = { x: 0.5, y: 0.5 };

export function createReelProject(editorialPackage = {}) {
  const source = editorialPackage.fuente || {};
  const editorial = editorialPackage.editorial || {};
  const images = uniqueStrings([source.imagen, source.imagenes]);
  const image = images[0] || '';
  const categoryOptions = normalizeCategoryOptions(editorial.category_options);
  const selectedCategory = getRecommendedCategory(categoryOptions);
  const sectionLabel = clean(selectedCategory?.label || editorial.seccion || source.categoria || 'general');
  const section = sectionLabel.toLowerCase();
  const accent = resolveCategoryAccent(selectedCategory);
  const title = clean(editorial.titulo || source.titulo_original || '');
  const summary = clean(editorial.bajada);
  const context = clean(editorial.contexto || editorial.datos_clave?.[0]);
  const storedScenes = editorialPackage.salidas?.reel?.scenes;
  if (Array.isArray(storedScenes) && storedScenes.length) {
    return normalizeReelProject({
      version: 1,
      format: '9:16',
      sourceUrl: clean(source.url),
      section,
      sectionLabel,
      categoryOptions,
      selectedCategoryId: selectedCategory?.id || '',
      accent,
      images,
       scenes: storedScenes.map((stored, index) => mapStoredScene(stored, index, source, images, editorial, sectionLabel, accent)),
    });
  }
  const scenes = [
    scene('cover', title, summary, image, accent, 'contain-blur'),
    scene('que-paso', 'Qué pasó', summary || title, image, accent, image ? 'contain-blur' : 'text'),
  ];

  if (context) scenes.push(scene('dato-clave', 'El dato clave', context, images[1] || image, accent, images[1] || image ? 'contain-blur' : 'text'));

  scenes.push({
    id: 'cierre',
    type: 'closure',
    title: 'Seguí informado',
    body: context || summary || title,
    image: '',
    imageMode: 'text',
    focus: { ...DEFAULT_FOCUS },
    accent,
    cta: 'Leé la nota completa en mediamendoza.com',
    section: sectionLabel,
  });
  scenes.forEach(item => { item.section = sectionLabel; });

  return normalizeReelProject({
    version: 1,
    format: '9:16',
    sourceUrl: clean(source.url),
    section,
    sectionLabel,
    categoryOptions,
    selectedCategoryId: selectedCategory?.id || '',
    accent,
    images,
    scenes,
  });
}

export function normalizeReelProject(project = {}) {
  const source = project && typeof project === 'object' ? project : {};
  const scenes = Array.isArray(source.scenes)
    ? source.scenes.filter(Boolean).slice(0, 6).map((item, index) => normalizeScene(item, index))
    : [];
  return {
    version: 1,
    format: '9:16',
    sourceUrl: clean(source.sourceUrl),
    section: clean(source.section || 'general').toLowerCase(),
    sectionLabel: clean(source.sectionLabel || source.section || 'general'),
    categoryOptions: normalizeCategoryOptions(source.categoryOptions),
    selectedCategoryId: clean(source.selectedCategoryId),
    accent: clean(source.accent) || '#a6ce39',
    images: uniqueStrings([source.images]),
    scenes,
  };
}


function scene(type, title, body, image, accent, imageMode) {
  return {
    id: type,
    type,
    title: clean(title),
    body: clean(body),
    image: clean(image),
    imageMode,
    focus: { ...DEFAULT_FOCUS },
    accent,
    cta: '',
  };
}

function mapStoredScene(source, index, articleSource, images, editorial, sectionLabel, accent) {
  const role = clean(source?.visual_role).toLowerCase();
  const type = role === 'hook' || role === 'cover' ? 'cover' : role === 'cta' || source?.layout === 'cta' ? 'closure' : role === 'key_fact' ? 'dato-clave' : role === 'context' ? 'que-paso' : 'text';
  const image = type !== 'closure' ? resolveStoredImage(source?.visual_source, articleSource, images) : '';
  const sourceText = clean(source?.text);
  const sourceTitle = clean(source?.title);
  const items = Array.isArray(source?.items) ? source.items.map(item => clean(item?.text || item?.value)).filter(Boolean) : [];
  const contractFallback = type === 'que-paso'
    ? clean(editorial?.contexto)
    : type === 'dato-clave'
      ? (Array.isArray(editorial?.datos_clave) ? editorial.datos_clave.map(clean).filter(Boolean).join(' ') : clean(editorial?.datos_clave))
      : '';
  const body = [sourceTitle && sourceText !== sourceTitle ? sourceText : '', clean(source?.subtitle), ...items].filter(Boolean).join(' ') || contractFallback;
  const closureBody = [clean(editorial?.titulo), clean(editorial?.bajada || editorial?.contexto), clean(source?.subtitle)].filter(Boolean).join(' ');
  return {
    id: clean(source?.id) || `scene-${index + 1}`,
    type,
    title: clean(source?.text || source?.title || (type === 'closure' ? 'SeguÃ­ informado' : '')),
    body: type === 'closure' ? closureBody : body,
    image,
    imageMode: image ? 'contain-blur' : 'text',
    focus: { ...DEFAULT_FOCUS },
    accent,
    cta: type === 'closure' ? clean(source?.text || source?.cta) : '',
    section: sectionLabel,
  };
}

function resolveStoredImage(reference, articleSource, images) {
  const value = clean(reference);
  if (!value || value === 'generated' || value === 'none') return '';
  if (value === 'article.image') return clean(articleSource?.imagen || images[0]);
  const match = value.match(/^article\.images\[(\d+)\]$/);
  if (match) return images[Number(match[1])] || '';
  return images.includes(value) ? value : '';
}

function normalizeScene(sceneSource, index) {
  const source = sceneSource && typeof sceneSource === 'object' ? sceneSource : {};
  const mode = ['cover', 'contain-blur', 'text'].includes(source.imageMode) ? source.imageMode : 'text';
  const focus = clampFocus(source.focus);
  return {
    id: clean(source.id) || `scene-${index + 1}`,
    type: clean(source.type) || 'text',
    title: clean(source.title),
    body: clean(source.body),
    image: clean(source.image),
    imageMode: mode,
    focus,
    accent: clean(source.accent),
    cta: clean(source.cta),
    section: clean(source.section),
  };
}

function clampFocus(value) {
  const focus = value && typeof value === 'object' ? value : DEFAULT_FOCUS;
  return { x: clamp(Number(focus.x), DEFAULT_FOCUS.x), y: clamp(Number(focus.y), DEFAULT_FOCUS.y) };
}

function clamp(value, fallback) {
  const numeric = Number.isFinite(value) ? value : fallback;
  return Math.min(1, Math.max(0, numeric));
}

function uniqueStrings(groups) {
  return [...new Set(groups.flatMap(group => Array.isArray(group) ? group : [group]).map(clean).filter(Boolean))];
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
