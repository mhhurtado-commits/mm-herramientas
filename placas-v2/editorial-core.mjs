export const FORMATS = {
  landscape: { w: 2400, h: 1350, label: 'Horizontal 16:9' },
  square: { w: 1600, h: 1600, label: 'Cuadrado 1:1' },
  portrait: { w: 1350, h: 1688, label: 'Vertical 4:5' },
  story: { w: 1080, h: 1920, label: 'Historia 9:16' },
};

export const FAMILIES = {
  general: { id: 'general', label: 'Actualidad', color: '#a6ce39', secondary: '#16201b', soft: '#eaf3de', symbol: 'MM' },
  clima: { id: 'clima', label: 'Clima', color: '#367d9c', secondary: '#16303b', soft: '#dcedf3', symbol: '☼' },
  policiales: { id: 'policiales', label: 'Policiales', color: '#ba3f42', secondary: '#421c1e', soft: '#f8dddd', symbol: '!' },
  sociales: { id: 'sociales', label: 'Sociedad', color: '#b36b27', secondary: '#422715', soft: '#f8ead7', symbol: '+' },
  politica: { id: 'politica', label: 'Política', color: '#5b4c91', secondary: '#251e42', soft: '#e9e4f7', symbol: '◈' },
  economia: { id: 'economia', label: 'Economía', color: '#507118', secondary: '#213009', soft: '#eaf3de', symbol: '$' },
  deportes: { id: 'deportes', label: 'Deportes', color: '#16806a', secondary: '#103c33', soft: '#d9f1eb', symbol: '↗' },
};

const FAMILY_ALIASES = new Map([
  ['clima', 'clima'], ['meteorologia', 'clima'], ['pronostico', 'clima'],
  ['policiales', 'policiales'], ['policial', 'policiales'], ['seguridad', 'policiales'],
  ['sociedad', 'sociales'], ['sociales', 'sociales'], ['comunidad', 'sociales'],
  ['politica', 'politica'], ['política', 'politica'], ['gobierno', 'politica'],
  ['economia', 'economia'], ['economía', 'economia'], ['negocios', 'economia'],
  ['deportes', 'deportes'], ['deporte', 'deportes'],
]);

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

export function normalizeFocus(focus = {}) {
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0.5));
  return { x: clamp(focus.x), y: clamp(focus.y) };
}

export function classifyNewsFamily(category = '') {
  const normalized = clean(category).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const id = FAMILY_ALIASES.get(normalized) || 'general';
  return FAMILIES[id];
}

function uniqueImages(input) {
  const values = [input.image, ...(Array.isArray(input.images) ? input.images : [])]
    .map(clean)
    .filter(Boolean);
  return [...new Set(values)].slice(0, 6);
}

function firstSentence(text) {
  const value = clean(text);
  if (!value) return '';
  const sentence = value.match(/^(.{1,220}?[.!?])(?:\s|$)/)?.[1];
  return clean(sentence || value.slice(0, 220));
}

function buildBlocks(data, family, image) {
  return [
    { tipo: 'marca', id: 'marca' },
    { tipo: 'imagen', id: 'imagen', src: image || '', foco: { x: 0.5, y: 0.5 } },
    { tipo: 'etiqueta', id: 'etiqueta', texto: family.label },
    { tipo: 'titular', id: 'titular', texto: data.titulo },
    { tipo: 'bajada', id: 'bajada', texto: data.bajada },
    { tipo: 'contexto', id: 'contexto', texto: data.contexto },
    { tipo: 'fuente', id: 'fuente', texto: data.fuente.url || 'Media Mendoza' },
  ].filter(block => block.tipo === 'imagen' ? Boolean(block.src) : block.tipo !== 'contexto' || Boolean(block.texto));
}

export function normalizeNewsPlate(input = {}) {
  const source = input.fuente && typeof input.fuente === 'object' ? input.fuente : input;
  const family = classifyNewsFamily(input.template_sugerido || input.category || source.category || source.categoria || input.etiqueta);
  const images = uniqueImages({ image: source.image || source.imagen, images: source.images || source.imagenes });
  const title = clean(input.titulo || input.title || source.title || source.titulo || 'Noticia');
  const description = clean(input.bajada || input.description || source.description || source.descripcion);
  const body = clean(input.contexto || source.body || source.texto || source.contenido);
  const url = clean(input.url || source.url);
  const normalized = {
    tipo: 'placa_noticia',
    version: 1,
    fuente: {
      url,
      titulo_original: clean(source.title || source.titulo || title),
      categoria: clean(source.category || source.categoria || ''),
      descripcion: clean(source.description || source.descripcion || description),
      texto: body,
      imagen: images[0] || '',
      imagenes: images,
    },
    titulo: title,
    bajada: description || firstSentence(body),
    etiqueta: family.label,
    contexto: clean(input.contexto || input.context || '') || firstSentence(body),
    template_sugerido: family.id,
    color_principal: family.color,
    color_secundario: family.secondary,
    bloques: [],
  };
  normalized.bloques = buildBlocks(normalized, family, images[0]);
  return normalized;
}

function cloneWithTemplate(plate, id, template, recommended = false) {
  const family = FAMILIES[template] || FAMILIES.general;
  const blocks = plate.bloques.map(block => ({ ...block }));
  return {
    ...plate,
    template_sugerido: family.id,
    color_principal: family.color,
    color_secundario: family.secondary,
    etiqueta: family.label,
    bloques: blocks.map(block => block.tipo === 'etiqueta' ? { ...block, texto: family.label } : block),
    id,
    recommended,
  };
}

export function buildEditorialVariants(plate) {
  const family = FAMILIES[plate.template_sugerido] ? plate.template_sugerido : 'general';
  const alternative = family === 'general' ? 'sociales' : 'general';
  return [
    cloneWithTemplate(plate, `${family}-principal`, family, true),
    cloneWithTemplate(plate, `${family}-datos`, family, false),
    cloneWithTemplate(plate, `${alternative}-editorial`, alternative, false),
  ];
}

export function fitTextToLines(text, maxCharsPerLine, maxLines) {
  const words = clean(text).split(' ').filter(Boolean);
  const lines = [];
  let current = '';
  let truncated = false;
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine || !current) current = next;
    else { lines.push(current); current = word; }
    if (lines.length === maxLines) { truncated = true; break; }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (truncated || lines.length > maxLines) {
    const last = lines.slice(0, maxLines).at(-1) || '';
    lines[maxLines - 1] = `${last.replace(/[.…]+$/, '').slice(0, Math.max(1, maxCharsPerLine - 1)).trim()}…`;
    return { lines: lines.slice(0, maxLines), truncated: true };
  }
  return { lines, truncated: false };
}

export function calculatePlateLayout(format, plate = {}) {
  const canvas = FORMATS[format] || FORMATS.square;
  const margin = canvas.w * 0.055;
  const headerH = canvas.h * (canvas.w / canvas.h > 1.2 ? 0.14 : 0.15);
  const footerH = canvas.h * 0.07;
  const headerGap = canvas.h * 0.018;
  const imageY = headerH + headerGap;
  const imageH = canvas.h * (plate.template_sugerido === 'general' ? 0.37 : 0.32);
  const contentY = imageY + imageH + canvas.h * 0.035;
  const contentH = canvas.h - contentY - footerH - margin;
  return {
    canvas,
    header: { x: 0, y: 0, w: canvas.w, h: headerH },
    image: { x: 0, y: imageY, w: canvas.w, h: imageH },
    label: { x: margin, y: contentY, w: canvas.w - margin * 2, h: canvas.h * 0.045 },
    title: { x: margin, y: contentY + canvas.h * 0.045, w: canvas.w - margin * 2, h: contentH * 0.42 },
    dek: { x: margin, y: contentY + contentH * 0.48, w: canvas.w - margin * 2, h: contentH * 0.26 },
    context: { x: margin, y: contentY + contentH * 0.78, w: canvas.w - margin * 2, h: contentH * 0.13 },
    footer: { x: margin, y: canvas.h - footerH, w: canvas.w - margin * 2, h: footerH - margin * 0.4 },
  };
}
