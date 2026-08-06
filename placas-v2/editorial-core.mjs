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

export const PLATE_TYPES = {
  noticia: { id: 'noticia', label: 'Noticia' },
  textual: { id: 'textual', label: 'Textual' },
  'retrato-circular': { id: 'retrato-circular', label: 'Retrato circular' },
  'editorial-split': { id: 'editorial-split', label: 'Editorial split' },
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

function hasLiteral(body, quote) {
  const source = clean(body);
  const value = clean(quote);
  if (!source || !value) return false;
  const pattern = value.split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  return new RegExp(pattern, 'i').test(source);
}

function normalizeTextual(input, body) {
  const source = input.textual && typeof input.textual === 'object' ? input.textual : input;
  const cita = clean(source.cita || source.cita_textual || source.quote);
  const verified = Boolean(cita && hasLiteral(body, cita));
  return {
    cita: verified ? cita : '',
    autor: verified ? clean(source.autor || source.persona || source.author) : '',
    cargo: verified ? clean(source.cargo || source.rol || source.role) : '',
    verificada: verified,
  };
}

function normalizePeople(input) {
  const people = Array.isArray(input.personas) ? input.personas : [];
  return people.map((person, index) => ({
    id: clean(person.id) || `persona-${index + 1}`,
    nombre: clean(person.nombre || person.name) || `Persona ${index + 1}`,
    rol: clean(person.rol || person.cargo || person.role),
    imagen: clean(person.imagen || person.image || person.src),
    origen: person.origen === 'subida' ? 'subida' : 'nota',
    foco: normalizeFocus(person.foco),
  })).filter(person => person.imagen);
}

function normalizeSupportImages(input) {
  const values = Array.isArray(input.imagenes_apoyo) ? input.imagenes_apoyo : Array.isArray(input.imagenesApoyo) ? input.imagenesApoyo : [];
  return values.map((item, index) => {
    const value = typeof item === 'string' ? { src: item } : item || {};
    return { id: clean(value.id) || `imagen-apoyo-${index + 1}`, src: clean(value.src || value.imagen || value.image), origen: value.origen === 'subida' ? 'subida' : 'nota', foco: normalizeFocus(value.foco) };
  }).filter(item => item.src).slice(0, 4);
}

function socialText(value) {
  if (value && typeof value === 'object') return clean(value.texto || value.text || value.copy || value.contenido);
  return clean(value);
}

function cleanArticleUrl(value) {
  const raw = clean(value);
  if (!raw) return 'https://mediamendoza.com';
  try {
    const url = new URL(raw);
    const path = url.pathname.match(/^\/([^/]+\/\d+)/)?.[1];
    return `https://mediamendoza.com/${path || url.pathname.replace(/^\/+/, '')}`.replace(/\/$/, '');
  } catch {
    return raw.split(/[?#]/)[0].replace(/\/$/, '') || 'https://mediamendoza.com';
  }
}

function normalizeInstagramCopy(value, data, category) {
  let copy = socialText(value) || `📰 ${data.titulo}\n\n${data.bajada}\n\n📲 Leé la nota completa en mediamendoza.com\n\n#MediaMendoza #${category}`;
  copy = copy.replace(/\[(?:enlace|link|url)\]/gi, cleanArticleUrl(data.fuente.url));
  if (!/[¿?]|coment/i.test(copy)) copy += '\n\n💬 ¿Qué opinás?';
  const tags = [...copy.matchAll(/#[\p{L}\d_]+/gu)].map(match => match[0]);
  copy = copy.replace(/#[\p{L}\d_]+/gu, '').replace(/[ \t]+\n/g, '\n').trim();
  const normalizedTags = [...new Set([...tags, '#MediaMendoza', `#${category}`, '#Noticias'])].slice(0, 5);
  copy += `\n\n${normalizedTags.join(' ')}`;
  if (!/\p{Extended_Pictographic}/u.test(copy)) copy = `📰 ${copy}`;
  return copy;
}

function normalizeFacebookCopy(value, data) {
  const url = cleanArticleUrl(data.fuente.url);
  let copy = socialText(value) || `📰 ${data.titulo}\n\n${data.bajada}${data.contexto ? `\n\n${data.contexto}` : ''}`;
  copy = copy.replace(/(?:🔗\s*)?(?:leé|lee) la nota completa:?[^\n]*(?:\n|$)/gi, '').replace(/\[(?:enlace|link|url)\]/gi, '').replace(/https?:\/\/[^\s]+/gi, '');
  copy = copy.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!/coment(?:á|a|arios)/i.test(copy)) copy += '\n\n💬 ¿Qué opinás? Te leemos en los comentarios.';
  copy += `\n\n🔗 Leé la nota completa: ${url}`;
  if (!/\p{Extended_Pictographic}/u.test(copy)) copy = `📰 ${copy}`;
  return copy;
}

function buildSocialCopies(data, input = {}) {
  const source = input.redes || input.redes_sociales || input.social || {};
  const category = String(data.etiqueta || 'Actualidad').replace(/\s+/g, '').replace(/[íì]/gi, 'i').toUpperCase();
  const url = cleanArticleUrl(data.fuente.url);
  const instagram = normalizeInstagramCopy(source.instagram, data, category);
  const facebook = normalizeFacebookCopy(source.facebook, data);
  return { instagram, facebook };
}

function buildBlocks(data, family, image) {
  const blocks = [
    { tipo: 'marca', id: 'marca' },
    { tipo: 'imagen', id: 'imagen', src: image || '', foco: { x: 0.5, y: 0.32 } },
    { tipo: 'etiqueta', id: 'etiqueta', texto: family.label },
    { tipo: 'titular', id: 'titular', texto: data.titulo },
    { tipo: 'bajada', id: 'bajada', texto: data.bajada },
    { tipo: 'contexto', id: 'contexto', texto: data.contexto },
    { tipo: 'fuente', id: 'fuente', texto: data.fuente.url || 'Media Mendoza' },
  ];
  if (data.textual?.verificada) blocks.push({ tipo: 'cita', id: 'cita', texto: data.textual.cita, autor: data.textual.autor, cargo: data.textual.cargo, verificada: true });
  data.personas.forEach(person => blocks.push({ tipo: 'retrato', id: person.id, ...person }));
  data.imagenes_apoyo.forEach(image => blocks.push({ tipo: 'imagen-apoyo', id: image.id, ...image }));
  if (data.contexto) blocks.push({ tipo: 'dato-clave', id: 'dato-clave', texto: data.contexto });
  return blocks.filter(block => block.tipo === 'imagen' ? Boolean(block.src) : block.tipo !== 'contexto' || Boolean(block.texto));
}

export function normalizeNewsPlate(input = {}) {
  const source = input.fuente && typeof input.fuente === 'object' ? input.fuente : input;
  const family = classifyNewsFamily(input.template_sugerido || input.category || source.category || source.categoria || input.etiqueta);
  const images = uniqueImages({ image: source.image || source.imagen, images: source.images || source.imagenes });
  const title = clean(input.titulo || input.title || source.title || source.titulo || 'Noticia');
  const description = clean(input.bajada || input.description || source.description || source.descripcion);
  const body = clean(input.cuerpo || input.body || input.texto || input.contenido || input.content || input.articleBody || source.body || source.texto || source.contenido || source.content || source.articleBody || source.text);
  const url = clean(input.url || source.url);
  const textual = normalizeTextual(input, body);
  const personas = normalizePeople(input);
  const imagenes_apoyo = normalizeSupportImages(input);
  const requestedType = clean(input.tipo_placa || input.type || '').toLowerCase();
  const type = textual.verificada ? 'textual' : requestedType === 'editorial-split' ? requestedType : requestedType === 'retrato-circular' && personas.length ? requestedType : personas.length ? 'retrato-circular' : 'noticia';
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
    contexto: clean(input.contexto || input.context || source.contexto || source.contextual) || firstSentence(body) || firstSentence(description),
    template_sugerido: family.id,
    tipo_placa: type,
    textual,
    personas,
    imagenes_apoyo,
    color_principal: family.color,
    color_secundario: family.secondary,
    bloques: [],
  };
  normalized.redes = buildSocialCopies(normalized, input);
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
  if (plate.textual?.verificada || plate.personas?.length || plate.tipo_placa === 'editorial-split') {
    const firstType = plate.textual?.verificada ? 'textual' : plate.tipo_placa === 'editorial-split' ? 'editorial-split' : 'noticia';
    const family = FAMILIES[plate.template_sugerido] ? plate.template_sugerido : 'general';
    const alternativeFamilies = family === 'general' ? ['sociales', 'politica'] : ['general', 'sociales'];
    const variants = [
      { type: firstType, family },
      { type: 'noticia', family: alternativeFamilies[0] },
      { type: 'noticia', family: alternativeFamilies[1] },
    ].map(({ type, family: variantFamily }, index) => cloneWithTemplate(
      { ...plate, tipo_placa: type },
      `${variantFamily}-${type}`,
      variantFamily,
      index === 0,
    ));
    return variants.map(variant => ({
      ...variant,
      bloques: [...variant.bloques, ...(variant.tipo_placa === 'editorial-split' ? [{ tipo: 'dato-clave', id: 'dato-clave', texto: variant.contexto }] : [])],
    }));
  }
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
  const isStory = format === 'story';
  const isHeaderless = true;
  const headerH = isHeaderless ? 0 : canvas.h * (isStory ? 0.12 : canvas.w / canvas.h > 1.2 ? 0.14 : 0.15);
  const footerH = canvas.h * (isStory ? 0.055 : 0.07);
  const headerGap = isHeaderless ? 0 : canvas.h * (isStory ? 0.004 : 0.006);
  const imageY = headerH + headerGap;
  const imageH = canvas.h * (format === 'landscape' ? 0.43 : format === 'square' ? 0.44 : isStory ? 0.40 : 0.46);
  const contentY = imageY + imageH + canvas.h * (isStory ? 0.02 : 0.022);
  const contentH = canvas.h - contentY - footerH - margin;
  const labelH = canvas.h * (isStory ? 0.038 : 0.045);
  const titleH = contentH * (isStory ? 0.40 : 0.42);
  const dekY = contentY + contentH * (isStory ? 0.34 : 0.48);
  const dekH = contentH * (isStory ? 0.22 : 0.26);
  const contextY = contentY + contentH * (isStory ? 0.64 : 0.78);
  const baseLayout = {
    canvas,
    header: { x: 0, y: 0, w: canvas.w, h: headerH },
    image: { x: 0, y: imageY, w: canvas.w, h: imageH },
    label: { x: margin, y: contentY, w: canvas.w - margin * 2, h: labelH },
    title: { x: margin, y: contentY + labelH, w: canvas.w - margin * 2, h: titleH },
    dek: { x: margin, y: dekY, w: canvas.w - margin * 2, h: dekH },
    context: { x: margin, y: contextY, w: canvas.w - margin * 2, h: contentH * (isStory ? 0.16 : 0.13) },
    footer: { x: margin, y: canvas.h - footerH, w: canvas.w - margin * 2, h: footerH - margin * 0.4 },
  };
  const splitCardY = contentY - canvas.h * 0.018;
  const splitCardH = canvas.h - splitCardY - footerH - canvas.h * 0.018;
  const specialArea = {
    quote: { x: margin, y: contentY + labelH, w: canvas.w - margin * 2, h: Math.max(0, contentH * 0.62) },
    portraits: { x: margin, y: imageY + imageH * 0.58, w: canvas.w - margin * 2, h: Math.max(0, imageH * 0.34) },
    split: { x: margin, y: contentY, w: canvas.w - margin * 2, h: Math.max(0, contentH) },
    splitPanel: { x: canvas.w * 0.025, y: splitCardY + canvas.h * 0.025, w: canvas.w * 0.34, h: Math.max(0, splitCardH - canvas.h * 0.05) },
  };
  specialArea.splitImage = {
    x: specialArea.splitPanel.x + (specialArea.splitPanel.w - canvas.w * 0.27) / 2,
    y: specialArea.splitPanel.y,
    w: canvas.w * 0.27,
    h: specialArea.splitPanel.h,
  };
  return { ...baseLayout, ...specialArea };
}
