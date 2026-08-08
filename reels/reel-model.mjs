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

const DEFAULT_FOCUS = { x: 0.5, y: 0.5 };

export function createReelProject(editorialPackage = {}) {
  const source = editorialPackage.fuente || {};
  const editorial = editorialPackage.editorial || {};
  const images = uniqueStrings([source.imagen, source.imagenes]);
  const image = images[0] || '';
  const section = clean(editorial.seccion || source.categoria || 'general').toLowerCase();
  const accent = SECTION_COLORS[section] || SECTION_COLORS.general;
  const title = clean(editorial.titulo || source.titulo_original || '');
  const summary = clean(editorial.bajada);
  const context = clean(editorial.contexto || editorial.datos_clave?.[0]);
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
  });

  return normalizeReelProject({
    version: 1,
    format: '9:16',
    sourceUrl: clean(source.url),
    section,
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
    accent: clean(source.accent) || SECTION_COLORS.general,
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
