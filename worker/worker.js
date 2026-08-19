// Media Mendoza Worker ? archivo ?nico para pegar en el dashboard de Cloudflare.
// Incluye solo los helpers de f?tbol usados por el Worker y el n?cleo editorial de Placas V2.
// @ts-nocheck

const TIME_ZONE = 'America/Argentina/Buenos_Aires';

function partesFecha(iso) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return formatter.format(new Date(iso));
}

function horaArgentina(iso) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
}

function normalizarFixtureAPIFootball(raw, fechaSolicitada) {
  const fixture = raw?.fixture;
  const teams = raw?.teams || {};
  const league = raw?.league || {};
  if (!fixture?.id || !fixture.date) return null;
  const fecha = partesFecha(fixture.date);
  if (fechaSolicitada && fecha !== fechaSolicitada) return null;
  return {
    id: fixture.id, local: teams.home?.name || '?', visitante: teams.away?.name || '?',
    hora: horaArgentina(fixture.date), horaUTC: fixture.date, fecha,
    estado: fixture.status?.short || 'NS', estadio: fixture.venue?.name || '',
    ciudad: fixture.venue?.city || '', competicion: league.name || '', jornada: league.round || null,
    golesLocal: raw.goals?.home ?? null, golesVisitante: raw.goals?.away ?? null,
    badgeLocal: teams.home?.logo || null, badgeVisitante: teams.away?.logo || null,
  };
}

function deduplicarYOrdenarPartidos(partidos = []) {
  const vistos = new Set();
  return partidos.filter(partido => {
    const id = String(partido?.id ?? '');
    if (!id || vistos.has(id)) return false;
    vistos.add(id);
    return true;
  }).sort((a, b) => String(a.horaUTC || '').localeCompare(String(b.horaUTC || '')));
}

const FORMATS = {
  landscape: { w: 2400, h: 1350, label: 'Horizontal 16:9' },
  square: { w: 1600, h: 1600, label: 'Cuadrado 1:1' },
  portrait: { w: 1350, h: 1688, label: 'Vertical 4:5' },
  story: { w: 1080, h: 1920, label: 'Historia 9:16' },
};

const FAMILIES = {
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

function normalizeFocus(focus = {}) {
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0.5));
  return { x: clamp(focus.x), y: clamp(focus.y) };
}

function classifyNewsFamily(category = '') {
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
  return { cita: verified ? cita : '', autor: verified ? clean(source.autor || source.persona || source.author) : '', cargo: verified ? clean(source.cargo || source.rol || source.role) : '', verificada: verified };
}

function normalizePeople(input) {
  const people = Array.isArray(input.personas) ? input.personas : [];
  return people.map((person, index) => ({ id: clean(person.id) || `persona-${index + 1}`, nombre: clean(person.nombre || person.name) || `Persona ${index + 1}`, rol: clean(person.rol || person.cargo || person.role), imagen: clean(person.imagen || person.image || person.src), origen: person.origen === 'subida' ? 'subida' : 'nota', foco: normalizeFocus(person.foco) })).filter(person => person.imagen);
}

function normalizeSupportImages(input) {
  const values = Array.isArray(input.imagenes_apoyo) ? input.imagenes_apoyo : Array.isArray(input.imagenesApoyo) ? input.imagenesApoyo : [];
  return values.map((item, index) => { const value = typeof item === 'string' ? { src: item } : item || {}; return { id: clean(value.id) || `imagen-apoyo-${index + 1}`, src: clean(value.src || value.imagen || value.image), origen: value.origen === 'subida' ? 'subida' : 'nota', foco: normalizeFocus(value.foco) }; }).filter(item => item.src).slice(0, 4);
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
  return {
    instagram: normalizeInstagramCopy(source.instagram, data, category),
    facebook: normalizeFacebookCopy(source.facebook, data),
  };
}

function buildBlocks(data, family, image) {
  const blocks = [
    { tipo: 'marca', id: 'marca' },
    { tipo: 'imagen', id: 'imagen', src: image || '', foco: { x: 0.5, y: 0.5 } },
    { tipo: 'etiqueta', id: 'etiqueta', texto: family.label },
    { tipo: 'titular', id: 'titular', texto: data.titulo },
    { tipo: 'bajada', id: 'bajada', texto: data.bajada },
    { tipo: 'contexto', id: 'contexto', texto: data.contexto },
    { tipo: 'fuente', id: 'fuente', texto: data.fuente.url || 'Media Mendoza' },
  ];
  if (data.textual?.verificada) blocks.push({ tipo: 'cita', id: 'cita', texto: data.textual.cita, autor: data.textual.autor, cargo: data.textual.cargo, verificada: true });
  if (data.pregunta_social) blocks.push({ tipo: 'pregunta-social', id: 'pregunta-social', texto: data.pregunta_social });
  data.impactos.forEach((item, index) => blocks.push({ tipo: 'impacto', id: `impacto-${index + 1}`, ...item }));
  data.personas.forEach(person => blocks.push({ tipo: 'retrato', id: person.id, ...person }));
  data.imagenes_apoyo.forEach(image => blocks.push({ tipo: 'imagen-apoyo', id: image.id, ...image }));
  if (data.contexto) blocks.push({ tipo: 'dato-clave', id: 'dato-clave', texto: data.contexto });
  return blocks.filter(block => block.tipo === 'imagen' ? Boolean(block.src) : block.tipo !== 'contexto' || Boolean(block.texto));
}

function normalizeKeyFacts(value, fallback = '') {
  const items = Array.isArray(value) ? value : [];
  const normalized = items.map(item => {
    if (typeof item === 'string') return { label: '', value: clean(item), detail: '' };
    if (!item || typeof item !== 'object') return null;
    return { label: clean(item.label || item.nombre || item.titulo), value: clean(item.value || item.valor || item.texto), detail: clean(item.detail || item.detalle || item.subtitulo) };
  }).filter(item => item?.value).slice(0, 3);
  return normalized.length || !clean(fallback) ? normalized : [{ label: '', value: clean(fallback), detail: '' }];
}

function normalizeComparison(value, fallbackSource = '', fallbackDate = '') {
  if (!value || typeof value !== 'object') return null;
  const side = (input = {}) => ({
    etiqueta: clean(input.etiqueta || input.label || input.nombre || input.titulo),
    valor: clean(input.valor || input.value || input.texto),
    detalle: clean(input.detalle || input.detail || input.subtitulo),
  });
  const izquierda = side(value.izquierda || value.left || value.antes);
  const derecha = side(value.derecha || value.right || value.ahora);
  if (!izquierda.valor || !derecha.valor) return null;
  const origen = ['nota', 'manual', 'externo'].includes(clean(value.origen).toLowerCase()) ? clean(value.origen).toLowerCase() : 'manual';
  return { izquierda, derecha, fuente: clean(value.fuente || fallbackSource), fecha: clean(value.fecha || fallbackDate), origen };
}

function normalizeNewsPlate(input = {}) {
  const source = input.fuente && typeof input.fuente === 'object' ? input.fuente : input;
  const family = classifyNewsFamily(input.template_sugerido || input.category || source.category || source.categoria || input.etiqueta);
  const images = uniqueImages({ image: source.image || source.imagen, images: source.images || source.imagenes });
  const title = clean(input.titulo || input.title || source.title || source.titulo || 'Noticia');
  const description = clean(input.bajada || input.description || source.description || source.descripcion);
  const body = clean(input.cuerpo || input.body || input.texto || input.contenido || source.body || source.texto || source.contenido);
  const url = clean(input.url || source.url);
  const textual = normalizeTextual(input, [body, title, description].filter(Boolean).join(' '));
  const personas = normalizePeople(input);
  const imagenes_apoyo = normalizeSupportImages(input);
  const rawRequestedType = clean(input.tipo_placa || input.type || '').toLowerCase();
  const requestedType = rawRequestedType === 'claves' ? 'actualizacion' : rawRequestedType === 'pulso' ? 'foto-completa' : rawRequestedType;
  const syntheticTitle = clean(input.titulo_sintetico || source.titulo_sintetico);
  const comparison = normalizeComparison(input.comparativa || source.comparativa, input.fuente_nombre || source.fuente_nombre, input.fecha || input.date || source.fecha || source.date);
  const type = textual.verificada ? 'textual' : ['titular-arriba', 'titular-abajo', 'foto-completa', 'dato-clave', 'comparativa', 'editorial-split', 'conversacion', 'actualizacion', 'que-cambia'].includes(requestedType) && (requestedType !== 'comparativa' || comparison) ? requestedType : requestedType === 'retrato-circular' && personas.length ? requestedType : personas.length ? 'retrato-circular' : 'noticia';
  const context = clean(input.contexto || input.context || '') || firstSentence(body);
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
    titulo_sintetico: normalizeSyntheticTitle(syntheticTitle),
    bajada: description || firstSentence(body),
    etiqueta: family.label,
    contexto: context,
    pregunta_social: clean(input.pregunta_social || source.pregunta_social) || '¿Qué opinás?',
    datos_clave: normalizeKeyFacts(input.datos_clave || source.datos_clave, context),
    impactos: normalizeKeyFacts(input.impactos || source.impactos),
    comparativa: comparison,
    fecha: clean(input.fecha || input.date || source.fecha || source.date),
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

function buildEditorialVariants(plate) {
  if (plate.textual?.verificada || plate.personas?.length || plate.tipo_placa === 'editorial-split') {
    const firstType = plate.textual?.verificada ? 'textual' : plate.tipo_placa === 'editorial-split' ? 'editorial-split' : 'noticia';
    const family = FAMILIES[plate.template_sugerido] ? plate.template_sugerido : 'general';
    const alternativeFamilies = family === 'general' ? ['sociales', 'politica', 'economia'] : ['general', 'sociales', 'economia'];
    const alternativeTypes = firstType === 'textual' || firstType === 'editorial-split'
      ? ['titular-arriba', 'foto-completa', 'dato-clave']
      : ['titular-abajo', 'foto-completa', 'dato-clave'];
    return [
      { type: firstType, family },
      ...alternativeTypes.map((type, index) => ({ type, family: alternativeFamilies[index] })),
    ].map(({ type, family: variantFamily }, index) => {
      const variant = cloneWithTemplate(
        { ...plate, tipo_placa: type },
        `${variantFamily}-${type}`,
        variantFamily,
        index === 0,
      );
      return type === 'editorial-split'
        ? { ...variant, bloques: [...variant.bloques, { tipo: 'dato-clave', id: 'dato-clave', texto: variant.contexto }] }
        : variant;
    });
  }
  const family = FAMILIES[plate.template_sugerido] ? plate.template_sugerido : 'general';
  const alternative = family === 'general' ? 'sociales' : 'general';
  const variants = [
    cloneWithTemplate({ ...plate, tipo_placa: 'titular-arriba' }, `${family}-titular-arriba`, family, true),
    cloneWithTemplate({ ...plate, tipo_placa: 'titular-abajo' }, `${family}-titular-abajo`, family, false),
    cloneWithTemplate({ ...plate, tipo_placa: 'foto-completa' }, `${alternative}-foto-completa`, alternative, false),
  ];
  if (plate.comparativa) variants.push(cloneWithTemplate({ ...plate, tipo_placa: 'comparativa' }, `${family}-comparativa`, family, false));
  return variants;
}

function fitTextToLines(text, maxCharsPerLine, maxLines) {
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

function calculatePlateLayout(format, plate = {}) {
  const canvas = FORMATS[format] || FORMATS.square;
  const margin = canvas.w * 0.055;
  const headerH = canvas.h * 0.13;
  const footerH = canvas.h * 0.045;
  const imageH = canvas.h * (plate.template_sugerido === 'general' ? 0.39 : 0.34);
  const contentY = headerH + imageH + canvas.h * 0.035;
  const contentH = canvas.h - contentY - footerH - margin;
  return {
    canvas,
    header: { x: margin, y: margin, w: canvas.w - margin * 2, h: headerH - margin },
    image: { x: 0, y: headerH, w: canvas.w, h: imageH },
    label: { x: margin, y: contentY, w: canvas.w - margin * 2, h: canvas.h * 0.045 },
    title: { x: margin, y: contentY + canvas.h * 0.045, w: canvas.w - margin * 2, h: contentH * 0.42 },
    dek: { x: margin, y: contentY + contentH * 0.48, w: canvas.w - margin * 2, h: contentH * 0.26 },
    context: { x: margin, y: contentY + contentH * 0.78, w: canvas.w - margin * 2, h: contentH * 0.13 },
    footer: { x: margin, y: canvas.h - footerH, w: canvas.w - margin * 2, h: footerH - margin * 0.4 },
  };
}



const text = value => String(value || '').replace(/\s+/g, ' ').trim();

function normalizeSyntheticTitle(value) {
  const title = text(value);
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length <= 10) return title;
  const queIndex = words.findIndex(word => word.toLowerCase() === 'que');
  if (queIndex > 2) {
    const prefix = words.slice(0, queIndex);
    const suffix = words.slice(queIndex + 1).filter(word => !/^(a|al|la|el|en|de|del|los|las|y|para|por|con)$/i.test(word)).slice(-2);
    const compact = text([...prefix, ...suffix].join(' ')).replace(/\bsalarios docentes\b/gi, 'salarial docente');
    if (compact.split(/\s+/).length <= 10) return compact;
  }
  return words.slice(0, 10).join(' ').replace(/[,:;.!?]+$/, '');
}

function buildPlateEditorialPrompt(note = {}) {
  const title = text(note.title || note.titulo);
  const category = text(note.category || note.categoria);
  const description = text(note.description || note.descripcion);
  const body = text(note.body || note.texto || note.contenido).slice(0, 12000);
  return `Sos editor de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Comparativa: si la nota presenta contrastes temporales, dos momentos (por ejemplo, viernes y domingo), escenarios o valores verificables, elegi comparativa y devolve esos dos lados respaldados por la nota. No inventes cifras ni relaciones y deja el campo vacio si no hay dos lados claros.
Convertí una noticia en una propuesta editorial para una placa de redes.

NOTICIA:
Título original: ${title}
Categoría: ${category}
Descripción: ${description}
Cuerpo:
${body}

REGLAS:
- Si la nota contiene contrastes temporales, dos momentos, escenarios o valores comparables explicitos, elegi comparativa y completa sus dos lados con datos de la nota.
- Leé todo el cuerpo antes de sintetizar.
- NO inventes datos, cifras, citas, nombres ni contexto que no aparezca en la noticia.
- Generá un titular breve, claro y atractivo, sin perder precisión.
- Generá una bajada de una o dos frases y un contexto clave breve sólo si aporta información verificable.
- Generá dos copys para acompañar la placa con foco en engagement: Instagram debe tener 1 o 2 párrafos breves, 2 o 3 emojis pertinentes, una pregunta o invitación a participar y 3 a 5 hashtags relevantes; Facebook debe tener 2 o 3 párrafos breves, 1 o 2 emojis, una pregunta concreta para incentivar comentarios y el enlace editorial al final.
- No inventes datos, citas ni preguntas que atribuyan hechos no presentes en la noticia. No uses [enlace], links completos ni llamados a la acción repetidos: el sistema normaliza el enlace y el CTA.
- Elegí una familia entre: general, clima, policiales, sociales, politica, economia, deportes.
- Usá español rioplatense informativo, sin clickbait ni exageraciones.
- No devuelvas markdown ni texto fuera del JSON.
- Genera tambien un titular sintetico idealmente de 6 a 10 palabras para el modelo titular-arriba. Debe conservar sujeto, hecho principal y precision; no agregues contexto secundario ni inventes informacion.
- Para el modelo dato-clave, generá hasta tres datos verificables en el campo datos_clave, con un valor principal y detalles opcionales.
- En datos_clave, usá etiquetas específicas como Zona afectada, Calles afectadas, Causa, Estado o Plazo cuando la noticia lo permita; evitá etiquetas genéricas como Lugar o Contexto.
- Generá pregunta_social como una invitación breve a conversar, basada sólo en la nota y sin atribuir hechos nuevos.
- Para qué cambia, generá hasta tres impactos verificables directamente respaldados por la nota; no infieras consecuencias.
- Usa titular-arriba como propuesta recomendada cuando la noticia pueda resumirse en una sola idea visual; titular-abajo y foto-completa son alternativas sintéticas válidas; conserva noticia para la alternativa con bajada.
- Las citas textuales deben copiarse literalmente del cuerpo y verificarse; si no existe una cita literal, devolvé una cadena vacía. Detectá personas sólo con atribución clara y devolvé una imagen de la nota si está disponible; la interfaz permite subir otra imagen.
- Elegí también un tipo de placa entre noticia, titular-arriba, titular-abajo, foto-completa, dato-clave, comparativa, textual, retrato-circular, editorial-split, conversacion, actualizacion y que-cambia. Usá foto-completa como alternativa de foto a sangre con titular superpuesto; textual sólo con cita verificable, retrato-circular sólo con personas identificables y qué cambia sólo con impactos verificables.

Respondé SOLO con este JSON:
{
  "tipo": "placa_noticia",
  "version": 1,
  "titulo": "titular para la placa",
  "titulo_sintetico": "titular sintetico de maximo 10 palabras",
  "bajada": "bajada breve",
  "contexto": "dato o contexto clave, o cadena vacía",
  "pregunta_social": "pregunta breve basada en la nota",
  "redes": { "instagram": "copy para Instagram", "facebook": "copy para Facebook" },
  "etiqueta": "nombre de la sección",
  "tipo_placa": "noticia|titular-arriba|titular-abajo|foto-completa|dato-clave|comparativa|textual|retrato-circular|editorial-split|conversacion|actualizacion|que-cambia",
  "comparativa": { "izquierda": { "etiqueta": "lado A", "valor": "dato verificable", "detalle": "detalle opcional" }, "derecha": { "etiqueta": "lado B", "valor": "dato verificable", "detalle": "detalle opcional" }, "fuente": "fuente si corresponde", "fecha": "fecha del dato", "origen": "nota|manual|externo" },
  "datos_clave": [{ "label": "etiqueta breve", "value": "dato verificable", "detail": "detalle opcional" }],
  "impactos": [{ "label": "a quién o desde cuándo", "value": "consecuencia verificable", "detail": "detalle opcional" }],
  "textual": { "cita": "cita literal o cadena vacía", "autor": "persona", "cargo": "cargo", "verificada": false },
  "personas": [{ "nombre": "persona", "rol": "cargo", "imagen": "URL de imagen o cadena vacía", "origen": "nota", "foco": { "x": 0.5, "y": 0.5 } }],
  "imagenes_apoyo": [{ "src": "URL de imagen o cadena vacía", "origen": "nota", "foco": { "x": 0.5, "y": 0.5 } }],
  "template_sugerido": "general|clima|policiales|sociales|politica|economia|deportes",
  "bloques": []
}`;
}

function normalizeEditorialResponse(response = {}, note = {}) {
  const base = normalizeNewsPlate(note);
  const result = normalizeNewsPlate({
    ...base,
    ...response,
    fuente: base.fuente,
    titulo: text(response.titulo || response.title || base.titulo),
    titulo_sintetico: normalizeSyntheticTitle(response.titulo_sintetico || base.titulo_sintetico),
    bajada: text(response.bajada || response.descripcion || base.bajada),
    contexto: text(response.contexto || base.contexto),
    category: response.template_sugerido || base.fuente.categoria,
  });
  if (response.etiqueta) result.etiqueta = text(response.etiqueta);
  return result;
}

function deterministicEditorialResponse(note = {}) {
  const result = normalizeNewsPlate(note);
  return { ...result, warnings: ['ia_no_disponible'] };
}


// ============================================================
// Media Mendoza — Worker v18 (FINAL CON TODAS LAS FUNCIONALIDADES)
// ============================================================
// @ts-nocheck



const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, cache-control",
};

const GEMINI_MODEL     = "gemini-3.1-flash-lite";
const GEMINI_URL       = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const EDITORIAL_KV_KEY = "config:editorial";
const WA_PROMPT_KV_KEY = "config:wa_prompt";
const WA_LINKS_KV_KEY  = "config:wa_links";
const REEL_PROMPT_KEY  = "config:reel:prompt";
const REEL_VOCES_KEY   = "config:reel:voces";
const IMG_PROMPTS_KV_KEY = "config:img_prompts";
const MAX_PROXY_IMAGE_BYTES = 8 * 1024 * 1024;
const IMGTEMP_PREFIX = "imgtemp:";      // imágenes generadas/editadas temporales (para edición con Kontext)
const IMGTEMP_TTL    = 1800;            // 30 minutos
const PUBLIC_WORKER_URL = "https://mm-herramientas-worker.mhhurtado.workers.dev";
const WHATSAPP_PREFIX  = "whatsapp:programado:";
const AGENDA_EV_PREFIX = "agenda:evento:";
const AGENDA_EF_PREFIX = "agenda:efemeride:";
const ANGULOS_PREFIX   = "agenda:angulos:";
const ANGULOS_TTL      = 60 * 60 * 24 * 30;
const STUDIO_PROYECTOS_PREFIX = "studio:proyecto:";

const VOCES_DEFAULT = [
  { id: "es-AR-TomasNeural", nombre: "Tomás (Hombre AR)", keyAlias: "AZURE_TTS_KEY_1", region: "AZURE_TTS_REGION_1" },
  { id: "es-AR-ElenaNeural", nombre: "Elena (Mujer AR)",  keyAlias: "AZURE_TTS_KEY_1", region: "AZURE_TTS_REGION_1" }
];

const REEL_PROMPT_DEFAULT = `Sos locutor de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Escribí un guion para un reel de Instagram/Facebook de máximo 30 segundos (unas 60-80 palabras).
Tono: directo, urgente, informativo. Español rioplatense.
El guion debe ir al dato central desde la primera oración, sin introducción.
No uses signos como guiones, paréntesis ni hashtags. Solo texto fluido para leer en voz alta.
Respondé SOLO con JSON sin backticks:
{"titulo":"título corto para mostrar en el video, máximo 8 palabras","guion":"texto completo para leer en voz alta"}`;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

// ============================================================
// SMN - Servicio Meteorológico Nacional
// ============================================================

const SMN_KV_TOKEN_KEY = "smn:jwt_token";
const SMN_API_BASE = "https://ws1.smn.gob.ar/v1";
const SMN_TOKEN_TTL = 3000; // 50 minutos

// Mapeo de ciudades a IDs de ubicación SMN
const SMN_LOCATION_IDS = {
  "San Rafael": "9553",
  "General Alvear": "9560",
  "Malargüe": "9296",
  "Mendoza": "9378",
  "San Juan": "1425",
  "San Luis": "1712",
  "Neuquén": "9903"
};

// Mapeo de ciudades a áreas de alertas meteorológicas
const SMN_WARNING_AREAS = {
  "San Rafael": "3365",
  "General Alvear": "3365",
  "Malargüe": "3365"
};

// ── Helpers ──
function esXMLvalido(t){return t.includes("<rss")||t.includes("<feed")||t.includes("<channel")||t.includes("<item")||t.includes("<entry")||(t.trimStart().startsWith("<?xml")&&t.includes("<title"))}
function decodeHtml(t=""){return t.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'")}
function limpiarEspacios(t=""){return decodeHtml(t).replace(/\s+/g," ").trim()}
function extractMeta(html,...patterns){for(const p of patterns){const m=html.match(p);const v=limpiarEspacios(m?.[1]||"");if(v)return v}return ""}
function normalizarTituloSitio(t=""){return t.replace(/\s+[|\-–—]\s+(Media Mendoza|mediamendoza\.com).*$/i,"").replace(/\s+/g," ").trim()}
function inferirCategoriaDesdeUrl(url){try{const u=new URL(url);const f=u.pathname.split("/").filter(Boolean)[0]||"";return limpiarEspacios(f.replace(/[-_]+/g," "))}catch{return""}}
function generarId(p){return `${p}${Date.now()}_${Math.random().toString(36).slice(2,8)}`}
function acortarUrlNota(url){try{const u=new URL(url);const p=u.pathname.split("/").filter(Boolean);if(p.length>=2){const n=p[1].match(/^(\d+)/);if(n)return `${u.origin}/${p[0]}/${n[1]}`}return `${u.origin}${u.pathname}`}catch{return url}}
async function listarObjetosKV(env,prefix){const list=await env.KV.list({prefix});const items=[];for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)items.push(v)}return items}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function jsonOk(data){return new Response(JSON.stringify({ok:true,...data}),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}})}
function jsonError(msg,status=400){return new Response(JSON.stringify({ok:false,error:msg}),{status,headers:{...CORS_HEADERS,"Content-Type":"application/json"}})}
function escapeXml(s=""){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
function localeFromVoice(v=""){const m=String(v).match(/^([a-z]{2,3}-[A-Z]{2})-/);return m?m[1]:"es-AR"}
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
function procesarSegmentosAOraciones(segments) {
  if (!segments || !segments.length) return [];
  
  const oraciones = [];
  const MAX_PALABRAS = 15;      // Máximo 15 palabras por oración
  const MAX_CARACTERES = 120;    // Máximo 120 caracteres por oración
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    let texto = seg.text.trim();
    
    // Dividir por signos de puntuación (., !, ?, ;, :) aunque no tengan espacio
    // Usar lookbehind para dividir después del signo
    let frases = [];
    
    // Primero, dividir por puntuación fuerte
    let partes = texto.split(/(?<=[.!?;:])\s*/);
    
    for (let parte of partes) {
      parte = parte.trim();
      if (!parte) continue;
      
      // Verificar si esta parte es demasiado larga
      const palabras = parte.split(/\s+/).length;
      const caracteres = parte.length;
      
      if (palabras <= MAX_PALABRAS && caracteres <= MAX_CARACTERES) {
        frases.push(parte);
      } else {
        // Dividir por palabras
        const palabrasArray = parte.split(/\s+/);
        for (let j = 0; j < palabrasArray.length; j += MAX_PALABRAS) {
          const subFrase = palabrasArray.slice(j, j + MAX_PALABRAS).join(' ');
          if (subFrase.trim()) frases.push(subFrase.trim());
        }
      }
    }
    
    // Si no se generaron frases por puntuación, dividir por longitud
    if (frases.length === 0 && texto.length > MAX_CARACTERES) {
      const palabrasArray = texto.split(/\s+/);
      for (let j = 0; j < palabrasArray.length; j += MAX_PALABRAS) {
        const subFrase = palabrasArray.slice(j, j + MAX_PALABRAS).join(' ');
        if (subFrase.trim()) frases.push(subFrase.trim());
      }
    } else if (frases.length === 0) {
      frases = [texto];
    }
    
    // Distribuir las frases con timestamps proporcionales
    const duracionSegmento = seg.end - seg.start;
    const duracionPorFrase = duracionSegmento / frases.length;
    
    for (let j = 0; j < frases.length; j++) {
      const inicio = seg.start + (j * duracionPorFrase);
      const fin = inicio + duracionPorFrase;
      
      oraciones.push({
        texto: frases[j],
        start: parseFloat(inicio.toFixed(2)),
        end: parseFloat(fin.toFixed(2)),
        duration: parseFloat(duracionPorFrase.toFixed(2)),
        removed: false
      });
    }
  }
  
  return oraciones;
}

function extraerTexto(html){
  html=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<nav[\s\S]*?<\/nav>/gi,'').replace(/<header[\s\S]*?<\/header>/gi,'').replace(/<footer[\s\S]*?<\/footer>/gi,'').replace(/<aside[\s\S]*?<\/aside>/gi,'');
  html=html.replace(/<\/(p|h[1-6]|li|br|div)>/gi,'\n').replace(/<[^>]+>/g,'');
  html=html.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  return html.split('\n').map(l=>l.trim()).filter(l=>l.length>30).slice(0,80).join('\n');
}
async function fetchHtml(url,cacheTtl=300){
  const res=await fetch(url,{headers:BROWSER_HEADERS,redirect:"follow",cf:{cacheTtl,cacheEverything:true}});
  if(!res.ok) throw new Error(`Error ${res.status}`);
  return {res,html:await res.text()};
}
function extraerAtributoTag(tag,attr){
  const regex=new RegExp(`${attr}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,"i");
  const match=tag.match(regex);
  return limpiarEspacios(match?.[2]||"");
}
function extraerMetaTag(html,keyAttr,keyValue){
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  const keyRegex=new RegExp(`${keyAttr}\\s*=\\s*(["'])${keyValue}\\1`,"i");
  for(const tag of tags){
    if(!keyRegex.test(tag)) continue;
    const content=extraerAtributoTag(tag,"content");
    if(content) return content;
  }
  return "";
}
function extraerDatosNota(html,url){
  const title=normalizarTituloSitio(extraerMetaTag(html,"property","og:title")||extraerMetaTag(html,"name","twitter:title")||extractMeta(html,/<title[^>]*>([^<]{1,300})<\/title>/i));
  const description=extraerMetaTag(html,"property","og:description")||extraerMetaTag(html,"name","description");
  const image=extraerMetaTag(html,"property","og:image")||extraerMetaTag(html,"name","twitter:image");
  const category=extraerMetaTag(html,"property","article:section")||extraerMetaTag(html,"name","section")||inferirCategoriaDesdeUrl(url);
  const images=extraerImagenesNota(html,url,image);
  return {title,category,description,body:extraerTexto(html),image,url,images};
}

function extraerImagenesNota(html,baseUrl,coverImage){
  const tags=html.match(/<img\b[^>]*>/gi)||[];
  const out=[];
  const seen=new Set();
  const coverClean=limpiarUrlImagen(coverImage,baseUrl);
  for(const tag of tags){
    const candidates=[
      extraerAtributoTag(tag,"src"),
      extraerAtributoTag(tag,"data-src"),
      extraerAtributoTag(tag,"data-lazy-src"),
      extraerAtributoTag(tag,"data-original"),
      extraerSrcsetPrincipal(tag)
    ].filter(Boolean);
    for(const candidate of candidates){
      const abs=limpiarUrlImagen(candidate,baseUrl);
      if(!abs||seen.has(abs)||abs===coverClean||abs.startsWith("data:")) continue;
      const lower=abs.toLowerCase();
      if(!/\.(jpg|jpeg|png|webp|avif)(?:$|\?)/i.test(lower) && lower.indexOf('/image/')<0 && lower.indexOf('/uploads/')<0) continue;
      if(/logo|avatar|icon|ads|pixel|emoji|favicon|placeholder|gravatar|banner/i.test(lower)) continue;
      seen.add(abs);
      out.push(abs);
      if(out.length>=6) return out;
    }
  }
  return out;
}

function extraerSrcsetPrincipal(tag){
  const srcset=extraerAtributoTag(tag,"srcset")||extraerAtributoTag(tag,"data-srcset");
  if(!srcset) return "";
  const first=srcset.split(",")[0]||"";
  return limpiarEspacios(first.split(/\s+/)[0]||"");
}

function limpiarUrlImagen(src,baseUrl){
  try{
    if(!src) return "";
    return new URL(String(src).replace(/&amp;/g,'&'),baseUrl).toString();
  }catch{
    return "";
  }
}

// ============================================================
// RESUMEN DIARIO
// ============================================================

const RESUMEN_PREFIX = "resumen:";

function getTTLHastaManana5AM() {
  const ahora = new Date();
  const manana5AM = new Date(ahora);
  manana5AM.setDate(ahora.getDate() + 1);
  manana5AM.setHours(5, 0, 0, 0);
  const diferenciaMs = manana5AM - ahora;
  const ttlSegundos = Math.floor(diferenciaMs / 1000);
  return Math.max(ttlSegundos, 3600);
}

async function handleResumenAgregar(body, env) {
  const { id, fecha, titulo, url, urlCorta, categoria, imagen, timestamp } = body;
  
  if (!id || !fecha || !titulo) {
    return jsonError('Faltan campos requeridos (id, fecha, titulo)', 400);
  }
  
  const key = `${RESUMEN_PREFIX}${fecha}:${id}`;
  const ttl = getTTLHastaManana5AM();
  
  const item = {
    id,
    fecha,
    titulo,
    url: url || '',
    urlCorta: urlCorta || '',
    categoria: categoria || 'General',
    imagen: imagen || '',
    timestamp: timestamp || Date.now()
  };
  
  try {
    await env.KV.put(key, JSON.stringify(item), { expirationTtl: ttl });
    return jsonOk({ guardado: true, id, expiraEn: ttl });
  } catch (err) {
    console.error('Error guardando resumen:', err);
    return jsonError('Error guardando en KV: ' + err.message, 500);
  }
}

async function handleResumenObtener(url, env) {
  const fecha = url.searchParams.get('fecha');
  if (!fecha) {
    return jsonError('Falta parámetro fecha (YYYY-MM-DD)', 400);
  }
  
  const prefix = `${RESUMEN_PREFIX}${fecha}:`;
  
  try {
    const list = await env.KV.list({ prefix });
    const notas = [];
    
    for (const key of list.keys) {
      const nota = await env.KV.get(key.name, 'json');
      if (nota) notas.push(nota);
    }
    
    notas.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    return jsonOk({ fecha, notas, total: notas.length });
  } catch (err) {
    console.error('Error obteniendo resumen:', err);
    return jsonError('Error obteniendo resumen: ' + err.message, 500);
  }
}

async function handleResumenGenerar(body, env) {
  const { fecha, notas } = body;
  
  if (!notas || !notas.length) {
    return jsonError('No hay notas para generar resumen', 400);
  }
  
  const editorial = await getEditorial(env);
  const editorialText = editorial ? `\n\nLÍNEA EDITORIAL:\n${editorial.substring(0, 500)}` : '';
  
  let notasTexto = '';
  let notasInfo = [];
  for (let i = 0; i < notas.length; i++) {
    const n = notas[i];
    notasTexto += `${i + 1}. ${n.titulo}\n   🔗 ${n.urlCorta || n.url}\n`;
    notasInfo.push({
      titulo: n.titulo,
      url: n.url,
      urlCorta: n.urlCorta || n.url,
      categoria: n.categoria || 'General',
      imagen: n.imagen || ''
    });
  }
  
  const prompt = `Sos editor de Media Mendoza, diario del sur de Mendoza, Argentina.
Generá un resumen diario de noticias para WhatsApp y para redes sociales.

NOTAS DEL DÍA (${fecha || 'hoy'}):
${notasTexto}

INSTRUCCIONES:
1. Para WHATSAPP (grupo o canal):
   - Tono directo, con emojis estratégicos
   - Encabezado llamativo: "📰 RESUMEN DEL DÍA · ${fecha || 'HOY'}"
   - Cada noticia: un emoji según categoría + titular + link corto
   - Al final: "📱 *Media Mendoza* — Noticias confiables del sur mendocino"
   - Máximo 1500 caracteres

2. Para INSTAGRAM/FACEBOOK (post):
   - Tono visual, dinámico, con emojis
   - Frase gancho al inicio
   - Lista de noticias con mini-resumen de 1 línea cada una
   - 5-8 hashtags al final (#Mendoza #Noticias #Resumen)
   - Máximo 2000 caracteres

3. Para GUIDON DE REEL (texto plano para narración):
   - Sin emojis, sin hashtags, sin links, sin negritas
   - Texto fluido, natural, para leer en voz alta
   - Incluir el título de cada nota seguido de un breve resumen
   - Máximo 250 palabras

Respondé SOLO con JSON sin markdown:
{
  "whatsapp": "mensaje completo para WhatsApp con emojis",
  "redes": "texto completo para Instagram/Facebook con emojis",
  "guion_reel": "texto plano para narración del video",
  "sugerencia_hashtags": ["#hashtag1", "#hashtag2"],
  "notas": [
    {
      "titulo": "título de la nota",
      "resumen": "resumen corto de 20-30 palabras para el video",
      "url": "url de la nota",
      "categoria": "categoría"
    }
  ]
}`;

  const r = await callGemini(prompt + editorialText, env);
  if (r.error) return jsonError(r.error, 500);
  
  const notasConImagen = (r.data?.notas || []).map((nota, idx) => ({
    ...nota,
    imagen: notas[idx]?.imagen || '',
    urlCorta: notas[idx]?.urlCorta || nota.url
  }));
  
  return jsonOk({
    whatsapp: r.data?.whatsapp || '',
    redes: r.data?.redes || '',
    guion_reel: r.data?.guion_reel || '',
    hashtags: r.data?.sugerencia_hashtags || [],
    notas: notasConImagen
  });
}

async function handleGenerarGuionReel(body, env) {
  const { texto } = body;
  if (!texto) return jsonError('Falta texto', 400);
  
  const prompt = `Convertí este texto en un guion fluido para narración de video.
  REGLAS:
  - Eliminá emojis, hashtags, links, negritas, asteriscos, guiones
  - Texto natural, en español rioplatense, como si lo leyera un locutor
  - Fluido para leer en voz alta
  - Mantené la información principal

  TEXTO ORIGINAL:
  ${texto.substring(0, 2000)}

  Respondé SOLO con JSON: { "guion": "texto del guion limpio" }`;

  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);
  
  let guion = r.data?.guion || texto;
  guion = guion.replace(/[#*_`]/g, '').replace(/https?:\/\/[^\s]+/g, '').replace(/[🔗📱📣🎧✅⚠️✗✓★✦▶️⏸️🎬📋🗑✏️🕐📍📅📰💬⚡🔍🎵🎙️]/g, '');
  
  return jsonOk({ guion });
}

async function handleResumenEliminar(body, env) {
  const { id, fecha } = body;
  if (!id || !fecha) {
    return jsonError('Faltan id o fecha', 400);
  }
  const key = `${RESUMEN_PREFIX}${fecha}:${id}`;
  try {
    await env.KV.delete(key);
    return jsonOk({ eliminado: true, id });
  } catch (err) {
    return jsonError('Error eliminando: ' + err.message, 500);
  }
}

// ============================================================
// STUDIO - Transcripción con Cloudflare Whisper (CORREGIDO)
// ============================================================

async function handleStudioTranscribir(request, env) {
  if (!env.AI) {
    return jsonError("Cloudflare AI no está configurado", 500);
  }

  try {
    const formData = await request.formData();
    let audioFile = formData.get('audio');
    if (!audioFile) audioFile = formData.get('file');
    
    if (!audioFile) {
      return jsonError("Falta archivo de audio", 400);
    }

    // 1. Obtener el ArrayBuffer del archivo
    const audioBuffer = await audioFile.arrayBuffer();

    // 2. CONVERSIÓN CRÍTICA: ArrayBuffer a array de números
    const audioArray = [...new Uint8Array(audioBuffer)];

    // 3. Llamar al modelo Whisper
    const response = await env.AI.run('@cf/openai/whisper', {
      audio: audioArray
    });

    // 4. Procesar la respuesta de Whisper
    let texto = '';
    let vtt = '';
    let segments = [];
    let words = [];
    
    if (response) {
      texto = response.text || '';
      vtt = response.vtt || '';
      
      if (response.words && Array.isArray(response.words)) {
        words = response.words;
        const groupSize = 6;
        for (let i = 0; i < words.length; i += groupSize) {
          const group = words.slice(i, i + groupSize);
          segments.push({
            start: group[0].start,
            end: group[group.length - 1].end,
            text: group.map(w => w.word).join(' ')
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto }];
      }
    }

    return jsonOk({
      texto: texto,
      word_count: response?.word_count || texto.split(/\s+/).length,
      segments: segments,
      words: words,
      vtt: vtt
    });

  } catch (err) {
    console.error('Error en transcripción:', err);
    return jsonError("Error en transcripción: " + err.message, 500);
  }
}

async function handleStudioGenerarVTT(request, env) {
  try {
    const { segments } = await request.json();
    
    if (!segments || !segments.length) {
      return jsonError("Faltan segments", 400);
    }

    let vtt = "WEBVTT\n\n";
    
    segments.forEach((seg, i) => {
      const start = formatTimestamp(seg.start);
      const end = formatTimestamp(seg.end);
      vtt += `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n\n`;
    });

    return new Response(vtt, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/vtt',
        'Content-Disposition': 'attachment; filename="subtitulos.vtt"'
      }
    });

  } catch (err) {
    return jsonError("Error generando VTT: " + err.message, 500);
  }
}

async function handleStudioGuardarProyecto(body, env) {
  const { id, titulo, transcripcion, segments, createdAt } = body;
  
  if (!id || !titulo) {
    return jsonError("Faltan id o titulo", 400);
  }

  const proyecto = {
    id,
    titulo,
    transcripcion: transcripcion || '',
    segments: segments || [],
    createdAt: createdAt || Date.now(),
    updatedAt: Date.now()
  };

  try {
    await env.KV.put(`${STUDIO_PROYECTOS_PREFIX}${id}`, JSON.stringify(proyecto));
    return jsonOk({ guardado: true, id });
  } catch (err) {
    return jsonError("Error guardando proyecto: " + err.message, 500);
  }
}

async function handleStudioObtenerProyectos(env) {
  try {
    const list = await env.KV.list({ prefix: STUDIO_PROYECTOS_PREFIX });
    const proyectos = [];
    
    for (const key of list.keys) {
      const proyecto = await env.KV.get(key.name, 'json');
      if (proyecto) proyectos.push(proyecto);
    }
    
    proyectos.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
    return jsonOk({ proyectos });
  } catch (err) {
    return jsonError("Error obteniendo proyectos: " + err.message, 500);
  }
}

async function handleStudioEliminarProyecto(url, env) {
  const id = url.searchParams.get('id');
  if (!id) return jsonError("Falta id", 400);
  
  try {
    await env.KV.delete(`${STUDIO_PROYECTOS_PREFIX}${id}`);
    return jsonOk({ eliminado: true });
  } catch (err) {
    return jsonError("Error eliminando: " + err.message, 500);
  }
}

// ============================================================
// VIDEO-EDITOR - Transcripción de audio extraído de video
// ============================================================

async function handleVideoEditorTranscribir(request, env) {
  if (!env.AI) {
    return jsonError("Cloudflare AI no está configurado", 500);
  }

  try {
    const formData = await request.formData();
    let audioFile = formData.get('audio');
    if (!audioFile) audioFile = formData.get('file');
    
    if (!audioFile) {
      return jsonError("Falta archivo de audio", 400);
    }

    console.log('[video-editor] Audio recibido:', audioFile.name, audioFile.size, audioFile.type);

    const audioBuffer = await audioFile.arrayBuffer();
    const audioArray = [...new Uint8Array(audioBuffer)];

    const response = await env.AI.run('@cf/openai/whisper', {
      audio: audioArray
    });

    let texto = '';
    let vtt = '';
    let segments = [];
    let words = [];
    
    if (response) {
      texto = response.text || '';
      vtt = response.vtt || '';
      
      if (response.words && Array.isArray(response.words)) {
        words = response.words;
        const groupSize = 6;
        for (let i = 0; i < words.length; i += groupSize) {
          const group = words.slice(i, i + groupSize);
          const textoAgrupado = group.map(w => w.word).join(' ');
          
          segments.push({
            start: group[0].start,
            end: group[group.length - 1].end,
            text: textoAgrupado,   // Mantiene compatibilidad original
            texto: textoAgrupado   // <--- CORRECCIÓN CLAVE: Para que procesarSegmentosAOraciones no rompa
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto, texto: texto }];
      }
    }

    // Convertir segmentos a oraciones completas
    const oraciones = procesarSegmentosAOraciones(segments);

    // ============================================================
    // DETECCIÓN DE PARTICIPANTES (SPEAKERS) con Gemini mejorado
    // ============================================================
    let oracionesConSpeaker = [...oraciones];
    
    if (oraciones.length > 0) {
      try {
        // Construir el prompt mejorado
        const textoParaPrompt = oraciones.map((o, i) => `${i}: ${o.texto}`).join('\n');
        
        const prompt = `Eres un sistema experto en analizar diálogos y transcripciones.
Tu tarea es analizar la siguiente transcripción de un diálogo y asignar una etiqueta de participante a cada línea.

Reglas para la asignación:
1. Analiza el estilo, las palabras y el contexto de CADA línea.
2. Las líneas que tengan un estilo y contenido similar (por ejemplo, todas las preguntas o todas las afirmaciones de una misma persona) deben tener la MISMA etiqueta.
3. Los cambios de participante suelen ocurrir cuando el contenido de una línea es una respuesta directa o un cambio de tema respecto a la línea anterior.
4. Responde ÚNICAMENTE con un array de strings en formato JSON válido, sin ningún otro texto ni explicación. Por ejemplo: ["Invitado", "Anfitrión", "Invitado", "Invitado", "Anfitrión"]

Transcripción:
${textoParaPrompt}`;

        console.log('[video-editor] Llamando a Gemini para detectar participantes...');
        const geminiResult = await callGemini(prompt, env);

        if (geminiResult.data && Array.isArray(geminiResult.data)) {
          const participants = geminiResult.data;
          if (participants.length === oraciones.length) {
            oracionesConSpeaker = oraciones.map((o, i) => ({
              ...o,
              speaker: participants[i] || 'desconocido'
            }));
            console.log('[video-editor] Participantes detectados:', participants);
          } else {
            console.error('[video-editor] Error: cantidad de etiquetas no coincide', participants.length, oraciones.length);
            throw new Error('Cantidad incorrecta');
          }
        } else {
          throw new Error('Gemini no devolvió array');
        }
        
      } catch (err) {
        console.error('[video-editor] Error detectando participantes con Gemini:', err);
        console.log('[video-editor] Usando fallback: asignación por alternancia');
        
        // Fallback: asignación por turno simple (para no dejar la transcripción sin etiquetas)
        let speakerActual = 'Participante A';
        oracionesConSpeaker = oraciones.map((o, i) => {
          if (i > 0) {
            // Regla simple: si la oración es corta o parece pregunta, cambiar de participante
            const esCorta = o.texto.split(' ').length < 10;
            if (esCorta && i % 2 === 0) {
              speakerActual = speakerActual === 'Participante A' ? 'Participante B' : 'Participante A';
            }
          }
          return { ...o, speaker: speakerActual };
        });
      }
    }

    console.log('[video-editor] Transcripción completada, segmentos:', segments.length, 'oraciones:', oracionesConSpeaker.length);
    
    return jsonOk({
      texto: texto,
      word_count: response?.word_count || texto.split(/\s+/).length,
      segments: segments,
      oraciones: oracionesConSpeaker,
      words: words,
      vtt: vtt
    });

  } catch (err) {
    console.error('Error en transcripción de video:', err);
    return jsonError("Error en transcripción de video: " + err.message, 500);
  }
}

// ============================================================
// VIDEO-EDITOR - Sugerir cortes con IA
// ============================================================

async function handleVideoEditorSuggestCuts(body, env) {
  const { transcript, segments } = body;
  if (!transcript) return jsonError("Falta la transcripción", 400);

  const prompt = `Analiza esta transcripción de entrevista y devuelve SOLO los números de segmento (índices) que contienen muletillas (eh, este, em, o sea, digamos, como que), silencios largos, repeticiones o frases incompletas.
  Formato de respuesta: [0, 2, 5]
  NO añadas explicaciones, solo el array.
  
  Transcripción por segmentos (cada línea es un segmento con su índice):
  ${segments.map((s, i) => `${i}: ${s.text}`).join('\n')}`;

  try {
    const keys = [env.GEMINI_KEY_1, env.GEMINI_KEY_2, env.GEMINI_KEY_3, env.GEMINI_KEY_4, env.GEMINI_KEY_5].filter(Boolean);
    if (!keys.length) throw new Error("No hay API keys de Gemini configuradas");

    let response;
    for (let i = 0; i < keys.length; i++) {
      try {
        const res = await fetch(`${GEMINI_URL}?key=${keys[i]}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 200 } })
        });
        if (res.ok) { response = await res.json(); break; }
      } catch (e) { continue; }
    }
    if (!response) throw new Error("No se pudo obtener respuesta de Gemini");

    const raw = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = raw.match(/\[[\d,\s]*\]/);
    let indices = [];
    if (match) {
      indices = JSON.parse(match[0]);
    } else {
      const muletillas = ['eh', 'este', 'em', 'mm', 'ah', 'ehh', 'estee', 'o sea', 'digamos', 'como que'];
      indices = segments.filter((seg, idx) => {
        const text = seg.text.toLowerCase();
        return muletillas.some(m => text.includes(m)) || (seg.end - seg.start) < 1.5;
      }).map((_, idx) => idx);
    }
    return jsonOk({ suggestions: indices.map(i => ({ start: segments[i].start, end: segments[i].end, reason: "sugerido por IA" })), total_suggestions: indices.length });
  } catch (err) {
    console.error('Error en sugerencias de corte:', err);
    return jsonError("Error procesando sugerencias: " + err.message, 500);
  }
}

// ============================================================
// GENERAR TITULAR CON GEMINI VISION (desde imagen)
// ============================================================

async function handleGenerateHeadline(request, env) {
  try {
    const { image } = await request.json();
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Falta configurar GEMINI_API_KEY' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];
    const payload = {
      contents: [{
        parts: [
          { text: "Eres un editor periodístico de Media Mendoza. Mira esta imagen y escribe un titular corto, impactante y en español argentino (máximo 8 palabras). Usa mayúsculas solo en la primera letra y nombres propios. Sin puntos finales." },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }]
    };
    const aiResponse = await fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const aiData = await aiResponse.json();
    const headline = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Titular no disponible";
    return new Response(JSON.stringify({ headline: headline.trim() }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error Gemini:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
}

// ============================================================
// TEST - Verificar binding AI
// ============================================================

async function handleTestAI(env) {
  const hasAI = !!env.AI;

  return jsonOk({
    ai_disponible: hasAI,
    mensaje: hasAI ? "✅ AI configurado correctamente" : "❌ AI NO está configurado. Agregá binding 'AI' en el dashboard."
  });
}

// ============================================================
// SMN - Servicio Meteorológico Nacional
// ============================================================

async function handleSMNUpdateToken(body, env) {
  const { token } = body;

  if (!token) {
    return jsonError("Falta token", 400);
  }

  try {
    await env.KV.put(SMN_KV_TOKEN_KEY, token, { expirationTtl: SMN_TOKEN_TTL });
    return jsonOk({ guardado: true, expiraEn: SMN_TOKEN_TTL });
  } catch (err) {
    console.error('Error guardando token SMN:', err);
    return jsonError("Error guardando token: " + err.message, 500);
  }
}

// Normaliza la respuesta SMN para que coincida con lo que espera placas/04-clima.js
function smnEsRespuestaValida(payload) {
  return payload && !payload.error && typeof payload === "object";
}

function smnAplanarSol(sunPayload) {
  const nested = sunPayload?.sun || {};
  return {
    sunrise: nested.sunrise || "06:00",
    sunset: nested.sunset || "18:00",
    location_id: sunPayload?.location_id ?? null,
    date: sunPayload?.date ?? null,
  };
}

function smnNormalizarPeriodo(periodo) {
  if (!periodo || periodo.error) return null;

  const wind = periodo.wind || {};
  return {
    ...periodo,
    rain_prob_range: Array.isArray(periodo.rain_prob_range) ? periodo.rain_prob_range : [0, 0],
    gust_range: Array.isArray(periodo.gust_range) ? periodo.gust_range : null,
    rain06h: periodo.rain06h ?? 0,
    visibility: periodo.visibility || "Buena",
    weather: periodo.weather || { id: 3, description: "Nublado" },
    wind: {
      ...wind,
      direction: wind.direction || "",
      deg: wind.deg ?? 0,
      speed_range: Array.isArray(wind.speed_range) ? wind.speed_range : [0, 0],
    },
  };
}

function smnElegirPeriodoRepresentativo(dia) {
  return dia?.afternoon || dia?.morning || dia?.night || dia?.early_morning || null;
}

function smnNormalizarDiaPronostico(dia) {
  const normalizado = {
    ...dia,
    early_morning: smnNormalizarPeriodo(dia.early_morning),
    morning: smnNormalizarPeriodo(dia.morning),
    afternoon: smnNormalizarPeriodo(dia.afternoon),
    night: smnNormalizarPeriodo(dia.night),
  };

  // Preservar weather original del día si existe; si no, usar período representativo
  if (!normalizado.weather || !normalizado.weather.id) {
    const periodoRef = smnElegirPeriodoRepresentativo(normalizado);
    normalizado.weather = periodoRef?.weather || { id: 3, description: "Nublado" };
  }

  return normalizado;
}

function smnNormalizarPronostico(forecastPayload) {
  if (!smnEsRespuestaValida(forecastPayload)) {
    return { forecast: [] };
  }

  const dias = Array.isArray(forecastPayload.forecast) ? forecastPayload.forecast : [];
  return {
    ...forecastPayload,
    forecast: dias.map(smnNormalizarDiaPronostico),
  };
}

function smnEnriquecerVientoActual(weatherPayload, forecastPayload) {
  if (!smnEsRespuestaValida(weatherPayload)) return null;

  const wind = weatherPayload.wind || {};
  if (wind.gust != null) {
    return { ...weatherPayload, wind: { direction: "", deg: 0, ...wind } };
  }

  const hoy = smnNormalizarPronostico(forecastPayload).forecast?.[0];
  const periodo = smnElegirPeriodoRepresentativo(hoy);
  const rafaga = periodo?.gust_range
    ? Math.round((periodo.gust_range[0] + periodo.gust_range[1]) / 2)
    : null;

  return {
    ...weatherPayload,
    wind: {
      direction: "",
      deg: 0,
      speed: 0,
      ...wind,
      gust: rafaga,
    },
  };
}

async function handleSMNWeather(url, env) {
  const ciudad = url.searchParams.get('ciudad') || 'San Rafael';
  const locationId = SMN_LOCATION_IDS[ciudad];

  if (!locationId) {
    return jsonError(`Ciudad no encontrada: ${ciudad}`, 404);
  }

  try {
    const token = await env.KV.get(SMN_KV_TOKEN_KEY);

    if (!token) {
      return jsonError("Token SMN no disponible. Ejecutá el script de actualización.", 503);
    }

    const endpoints = [
      `georef/location/${locationId}`,
      `weather/location/${locationId}`,
      `forecast/location/${locationId}`,
      `sun/location/${locationId}`,
      `warning/shortterm/location/${locationId}`,
      `warning/alert/location/${locationId}`
    ];

    // Agregar alertas meteorológicas si la ciudad tiene área de alertas
    const warningArea = SMN_WARNING_AREAS[ciudad];
    if (warningArea) {
      endpoints.push(`warning/heat/area/${warningArea}`);
    }

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${SMN_API_BASE}/${endpoint}`, {
          headers: {
            "Authorization": `JWT ${token}`,
            "User-Agent": BROWSER_HEADERS["User-Agent"]
          }
        });

        let key = endpoint.split('/')[0];
        // warning/shortterm, warning/alert, warning/heat → warning_shortterm, warning_alert, warning_heat
        if (key === 'warning') {
          key = 'warning_' + endpoint.split('/')[1];
        }

        if (response.ok) {
          const data = await response.json();
          results[key] = data;
        } else {
          results[key] = { error: `HTTP ${response.status}` };
        }
      } catch (e) {
        let key = endpoint.split('/')[0];
        if (key === 'warning') {
          key = 'warning_' + endpoint.split('/')[1];
        }
        results[key] = { error: e.message };
      }
    }

    const weather = smnEnriquecerVientoActual(results.weather, results.forecast);
    if (!weather) {
      return jsonError("No se pudo obtener el clima actual desde SMN", 502);
    }

    const forecast = smnNormalizarPronostico(results.forecast);
    const sunRaw = smnEsRespuestaValida(results.sun) ? results.sun : null;
    const sun = smnAplanarSol(sunRaw);
    const warningAlert = smnEsRespuestaValida(results.warning_alert) ? results.warning_alert : null;
    const warningShortTerm = smnEsRespuestaValida(results.warning_shortterm) ? results.warning_shortterm : null;
    const warningHeat = smnEsRespuestaValida(results.warning_heat) ? results.warning_heat : null;
    const georef = smnEsRespuestaValida(results.georef) ? results.georef : null;

    return jsonOk({
      ciudad,
      locationId,
      georef,
      sun,
      data: {
        weather,
        forecast,
        sun: sunRaw,
        warning_alert: warningAlert,
        warning_shortterm: warningShortTerm,
        warning_heat: warningHeat,
        georef,
      },
    });

  } catch (err) {
    console.error('Error obteniendo clima SMN:', err);
    return jsonError("Error obteniendo clima: " + err.message, 500);
  }
}

async function handleSMNIcon(url, env) {
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code', { status: 400 });
  try {
    // Intentar desde KV primero
    if (env.KV) {
      const cached = await env.KV.get(`smn:icon:${code}`, { type: 'text' });
      if (cached) {
        const binary = Uint8Array.from(atob(cached), c => c.charCodeAt(0));
        return new Response(binary, {
          headers: { ...CORS_HEADERS, 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
        });
      }
    }
    // Fallback: fetch desde SMN y cachear en KV
    const token = env.KV ? await env.KV.get(SMN_KV_TOKEN_KEY) : null;
    const resp = await fetch(`https://www.smn.gob.ar/sites/all/themes/smn/img/weather-icons/${code}.png`, {
      headers: {
        'User-Agent': BROWSER_HEADERS['User-Agent'],
        ...(token ? { 'Authorization': `JWT ${token}` } : {}),
      },
    });
    if (!resp.ok) return new Response('Icon not found', { status: 404 });
    const blob = await resp.arrayBuffer();
    // Cachear en KV si está disponible
    if (env.KV) {
      try {
        const b64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
        await env.KV.put(`smn:icon:${code}`, b64, { expirationTtl: 2592000 });
      } catch (e) { /* ignore KV errors */ }
    }
    return new Response(blob, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': resp.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    return new Response('Proxy error', { status: 502 });
  }
}

async function handleSMNUploadIcon(request, env) {
  try {
    const body = await request.json();
    const { code, data } = body;
    if (!code || !data) return new Response('Missing code or data', { status: 400 });
    await env.KV.put(`smn:icon:${code}`, data, { expirationTtl: 2592000 });
    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
}

// ============================================================
// BLOQUE 1️⃣: CONFIGURACIÓN Y HELPERS DE FÚTBOL (GENÉRICO)
// ============================================================

const FOOTBALL_DATA_URL = "https://api.football-data.org/v4";

// ── Registry de competiciones ──
const COMPETITIONS = {
  'liga-profesional': {
    nombre: 'Liga Profesional Argentina',
    footballData: { id: null, season: null },
    apiFootball: { league: 128, season: 2026 },
    theSportsDB: { id: 4406, season: 2026 },
    icon: '🇦🇷',
    tipoLiga: true,
    hasTheSportsDBStandings: true,
  },
  'copa-argentina': {
    nombre: 'Copa Argentina',
    footballData: { id: null, season: null },
    apiFootball: { league: 131, season: 2026 },
    theSportsDB: { id: 4500, season: 2026 },
    icon: '🏆',
    tipoLiga: false,
    hasTheSportsDBStandings: false,
  },
  'libertadores': {
    nombre: 'Copa Libertadores',
    footballData: { id: null, season: null },
    apiFootball: { league: 13, season: 2026 },
    theSportsDB: { id: 4501, season: 2026 },
    icon: '🏆',
    tipoLiga: false,
    hasTheSportsDBStandings: true,
  },
  'sudamericana': {
    nombre: 'Copa Sudamericana',
    footballData: { id: null, season: null },
    apiFootball: { league: 11, season: 2026 },
    theSportsDB: { id: 4724, season: 2026 },
    icon: '🏆',
    tipoLiga: false,
    hasTheSportsDBStandings: true,
  },
  'mundial': {
    nombre: 'Mundial 2026',
    footballData: { id: 2000, season: 2026 },
    apiFootball: { league: 1, season: 2026 },
    theSportsDB: { id: 4429, season: 2026 },
    icon: '🌍',
    tipoLiga: false,
    hasTheSportsDBStandings: false,
  },
};

function getCompeticion(key) {
  return COMPETITIONS[key] || COMPETITIONS['liga-profesional'];
}

function getCompeticionByFootballDataId(competitionId) {
  return Object.entries(COMPETITIONS).find(([, c]) => c.footballData?.id === competitionId)?.[0] || 'mundial';
}

function getCompeticionByApiFootballLeague(leagueId) {
  return Object.entries(COMPETITIONS).find(([, c]) => c.apiFootball?.league === leagueId)?.[0] || 'mundial';
}

const COUNTRY_FLAGS = {
  "Argentina": "🇦🇷", "Perú": "🇵🇪", "Brasil": "🇧🇷", "Chile": "🇨🇱",
  "Colombia": "🇨🇴", "Ecuador": "🇪🇨", "Paraguay": "🇵🇾", "Uruguay": "🇺🇾",
  "Venezuela": "🇻🇪", "Bolivia": "🇧🇴", "México": "🇲🇽", "Canadá": "🇨🇦",
  "Estados Unidos": "🇺🇸", "Costa Rica": "🇨🇷", "Honduras": "🇭🇳",
  "Francia": "🇫🇷", "España": "🇪🇸", "Alemania": "🇩🇪", "Italia": "🇮🇹",
  "Portugal": "🇵🇹", "Inglaterra": "🇬🇧", "Países Bajos": "🇳🇱",
  "Bélgica": "🇧🇪", "Dinamarca": "🇩🇰", "Suecia": "🇸🇪", "Polonia": "🇵🇱",
  "Japón": "🇯🇵", "Corea del Sur": "🇰🇷", "Australia": "🇦🇺",
  "Nueva Zelanda": "🇳🇿", "Marruecos": "🇲🇦", "Túnez": "🇹🇳",
  "Argelia": "🇩🇿", "Senegal": "🇸🇳", "Nigeria": "🇳🇬", "Ghana": "🇬🇭",
  "Chequia": "🇨🇿", "República Checa": "🇨🇿", "Noruega": "🇳🇴", "Croacia": "🇭🇷",
  "Serbia": "🇷🇸", "Suiza": "🇨🇭", "Austria": "🇦🇹", "Turquía": "🇹🇷",
  "Escocia": "🇬🇧", "Irán": "🇮🇷", "Iraq": "🇮🇶", "Uzbekistán": "🇺🇿",
  "Jordania": "🇯🇴", "Arabia Saudita": "🇸🇦", "Egipto": "🇪🇬", "Sudáfrica": "🇿🇦",
  "Costa de Marfil": "🇨🇮", "Cabo Verde": "🇨🇻", "Catar": "🇶🇦", "Qatar": "🇶🇦",
  "Panamá": "🇵🇦", "Curazao": "🇨🇼", "Haití": "🇭🇹", "Jamaica": "🇯🇲",
  "Bosnia y Herzegovina": "🇧🇦", "RD Congo": "🇨🇩", "Camerún": "🇨🇲",
  "Islandia": "🇮🇸", "Finlandia": "🇫🇮", "Hungría": "🇭🇺", "Rumania": "🇷🇴",
  "Grecia": "🇬🇷", "Ucrania": "🇺🇦", "Rusia": "🇷🇺", "Israel": "🇮🇱",
};

function getFlagPais(nombrePais) {
  const flagMap = {
    "Iran": "🇮🇷", "New Zealand": "🇳🇿", "France": "🇫🇷", 
    "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
    "Argentina": "🇦🇷", "Peru": "🇵🇪", "Brazil": "🇧🇷", "Chile": "🇨🇱",
    "Colombia": "🇨🇴", "Ecuador": "🇪🇨", "Paraguay": "🇵🇾", "Uruguay": "🇺🇾",
    "Venezuela": "🇻🇪", "Bolivia": "🇧🇴", "Mexico": "🇲🇽", "Canada": "🇨🇦",
    "United States": "🇺🇸", "USA": "🇺🇸", "Costa Rica": "🇨🇷", "Honduras": "🇭🇳",
    "Spain": "🇪🇸", "Germany": "🇩🇪", "Italy": "🇮🇹",
    "Portugal": "🇵🇹", "England": "🇬🇧", "Netherlands": "🇳🇱",
    "Belgium": "🇧🇪", "Denmark": "🇩🇰", "Sweden": "🇸🇪", "Poland": "🇵🇱",
    "Japan": "🇯🇵", "South Korea": "🇰🇷", "Australia": "🇦🇺",
    "Morocco": "🇲🇦", "Tunisia": "🇹🇳", "Nigeria": "🇳🇬", "Ghana": "🇬🇭",
    "Croatia": "🇭🇷", "Serbia": "🇷🇸", "Switzerland": "🇨🇭", "Austria": "🇦🇹",
    "Turkey": "🇹🇷", "Greece": "🇬🇷", "Ukraine": "🇺🇦", "Algeria": "🇩🇿",
    "Czech Republic": "🇨🇿", "Czechia": "🇨🇿", "Scotland": "🇬🇧", "Wales": "🇬🇧",
    "Ivory Coast": "🇨🇮", "South Africa": "🇿🇦", "Cameroon": "🇨🇲", "Egypt": "🇪🇬",
    "Saudi Arabia": "🇸🇦", "Qatar": "🇶🇦", "Jordan": "🇯🇴", "Uzbekistan": "🇺🇿",
    "Cape Verde": "🇨🇻", "Curacao": "🇨🇼", "Curaçao": "🇨🇼", "Haiti": "🇭🇹",
    "Bosnia and Herzegovina": "🇧🇦", "Bosnia-Herzegovina": "🇧🇦",
    "Bosnia y Herzegovina": "🇧🇦",
    "Estados Unidos": "🇺🇸", "Corea del Sur": "🇰🇷", "Corea del Norte": "🇰🇵",
    "DR Congo": "🇨🇩", "Democratic Republic of Congo": "🇨🇩",
    "Panama": "🇵🇦", "Jamaica": "🇯🇲", "Iceland": "🇮🇸", "Finland": "🇫🇮",
    "Hungary": "🇭🇺", "Romania": "🇷🇴", "Russia": "🇷🇺", "Israel": "🇮🇱",
    "United Arab Emirates": "🇦🇪", "China": "🇨🇳", "China PR": "🇨🇳",
    "North Korea": "🇰🇵", "India": "🇮🇳", "Thailand": "🇹🇭",
    // Spanish names
    "Sudáfrica": "🇿🇦", "Marruecos": "🇲🇦", "Túnez": "🇹🇳", "Argelia": "🇩🇿",
    "Camerún": "🇨🇲", "Nueva Zelanda": "🇳🇿", "Arabia Saudita": "🇸🇦",
    "Japón": "🇯🇵", "Canadá": "🇨🇦", "México": "🇲🇽", "Chequia": "🇨🇿",
    "Noruega": "🇳🇴", "Suecia": "🇸🇪", "Alemania": "🇩🇪", "Francia": "🇫🇷",
    "España": "🇪🇸", "Inglaterra": "🇬🇧", "Países Bajos": "🇳🇱",
    "Bélgica": "🇧🇪", "Croacia": "🇭🇷", "Serbia": "🇷🇸", "Suiza": "🇨🇭",
    "Austria": "🇦🇹", "Turquía": "🇹🇷", "Grecia": "🇬🇷", "Ucrania": "🇺🇦",
    "Polonia": "🇵🇱", "Hungría": "🇭🇺", "Rumania": "🇷🇴", "Rusia": "🇷🇺",
    "Irán": "🇮🇷", "Irak": "🇮🇶", "Costa de Marfil": "🇨🇮", "Ghana": "🇬🇭",
    "Senegal": "🇸🇳", "Nigeria": "🇳🇬", "Egipto": "🇪🇬", "Brasil": "🇧🇷",
    "Perú": "🇵🇪", "Colombia": "🇨🇴", "Uruguay": "🇺🇾", "Chile": "🇨🇱",
    "Paraguay": "🇵🇾", "Venezuela": "🇻🇪", "Ecuador": "🇪🇨", "Bolivia": "🇧🇴",
    "Panamá": "🇵🇦", "Honduras": "🇭🇳", "Jamaica": "🇯🇲", "Costa Rica": "🇨🇷",
    "Islandia": "🇮🇸", "Finlandia": "🇫🇮", "Dinamarca": "🇩🇰",
    "Eslovaquia": "🇸🇰", "Eslovenia": "🇸🇮", "Escocia": "🇬🇧", "Gales": "🇬🇧",
    "Haití": "🇭🇹", "Catar": "🇶🇦", "Jordania": "🇯🇴",
  };
  return flagMap[nombrePais] || "⚽";
}

function formatearHora(isoString) {
  if (!isoString) return "--:--";
  try {
    const fecha = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(fecha);
  } catch (e) {
    return "--:--";
  }
}

// Madrugada: partidos entre 00:00 y este cutoff (hora Argentina) se agrupan con el día anterior
const MADRUGADA_CUTOFF_GLOBAL = 4;

// Función global para calcular la "fecha de placa" de un partido
// Devuelve { fechaPlaca, esMadrugada }
function calcularFechaPlaca(horaUTC) {
  if (!horaUTC) return { fechaPlaca: null, esMadrugada: false };
  try {
    const fecha = new Date(horaUTC);
    const tiempoAR = new Date(fecha.getTime() - 3 * 60 * 60 * 1000);
    const horaAR = tiempoAR.getUTCHours();
    let diaAR = new Date(tiempoAR);
    let esMadrugada = false;

    if (horaAR < MADRUGADA_CUTOFF_GLOBAL) {
      diaAR = new Date(diaAR.getTime() - 24 * 60 * 60 * 1000);
      esMadrugada = true;
    }

    return {
      fechaPlaca: diaAR.toISOString().split('T')[0],
      esMadrugada,
    };
  } catch(e) {
    return { fechaPlaca: null, esMadrugada: false };
  }
}

// Traducir nombre de grupo del inglés al español
function traducirGrupo(group) {
  if (!group) return null;
  const map = {
    'GROUP_A': 'Grupo A', 'GROUP_B': 'Grupo B', 'GROUP_C': 'Grupo C',
    'GROUP_D': 'Grupo D', 'GROUP_E': 'Grupo E', 'GROUP_F': 'Grupo F',
    'GROUP_G': 'Grupo G', 'GROUP_H': 'Grupo H', 'GROUP_I': 'Grupo I',
    'GROUP_J': 'Grupo J', 'GROUP_K': 'Grupo K', 'GROUP_L': 'Grupo L',
    'Group A': 'Grupo A', 'Group B': 'Grupo B', 'Group C': 'Grupo C',
    'Group D': 'Grupo D', 'Group E': 'Grupo E', 'Group F': 'Grupo F',
    'Group G': 'Grupo G', 'Group H': 'Grupo H', 'Group I': 'Grupo I',
    'Group J': 'Grupo J', 'Group K': 'Grupo K', 'Group L': 'Grupo L',
  };
  return map[group] || group.replace(/GROUP_/i, 'Grupo ').replace(/Group /i, 'Grupo ');
}

// Traducir etapa del torneo del inglés al español
function traducirEtapa(stage) {
  if (!stage) return null;
  const map = {
    'GROUP_STAGE': 'Fase de grupos', 'GROUP_STAGE_1': 'Fase de grupos',
    'ROUND_OF_32': 'Dieciseisavos de final',
    'ROUND_OF_16': 'Octavos de final',
    'QUARTER_FINALS': 'Cuartos de final', 'QUARTER_FINAL': 'Cuartos de final',
    'SEMI_FINALS': 'Semifinal', 'SEMI_FINAL': 'Semifinal',
    'THIRD_PLACE_PLAY_OFF': 'Tercer puesto', 'THIRD_PLACE_PLAYOFF': 'Tercer puesto',
    'FINAL': 'Final',
    'MATCHDAY_1': 'Fecha 1', 'MATCHDAY_2': 'Fecha 2', 'MATCHDAY_3': 'Fecha 3',
  };
  return map[stage] || stage.replace(/_/g, ' ');
}

// Mapa de partidos Mundial 2026: equipo local → estadio/ciudad asignada
// Datos del calendario oficial FIFA 2026 (sede de cada partido)
const MUNDIAL_2026_SEDES = {
  // Fecha 1
  'Mexico_South Africa': { estadio: 'Estadio Azteca', ciudad: 'Ciudad de México' },
  'South Korea_Czechia': { estadio: 'Estadio Akron', ciudad: 'Guadalajara' },
  'South Korea_Czech Republic': { estadio: 'Estadio Akron', ciudad: 'Guadalajara' },
  // Se completará dinámicamente desde Zafronix o se usará como fallback
};

// Resolver estadio/ciudad para un partido usando Zafronix matches
async function resolverSedePartido(env, homeTeam, awayTeam, fecha) {
  // Intentar desde Zafronix matches endpoint
  try {
    const cacheKey = 'mundial:zafronix:matches:2026';
    let allMatches = null;

    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 6 * 60 * 60 * 1000)) {
        allMatches = cached.matches;
      }
    }

    if (!allMatches && env.ZAFRONIX_KEY) {
      const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
        headers: { 'X-API-Key': env.ZAFRONIX_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        allMatches = data.data || [];
        try {
          if (env.KV) {
            await env.KV.put(cacheKey, JSON.stringify({
              matches: allMatches, _cachedAt: Date.now()
            }), { expirationTtl: 21600 });
          }
        } catch(e) {}
      }
    }

    if (allMatches && allMatches.length > 0) {
      // Buscar match por equipos y fecha
      const home = homeTeam.toLowerCase();
      const away = awayTeam.toLowerCase();
      const match = allMatches.find(m => {
        const mHome = (m.homeTeam || '').toLowerCase();
        const mAway = (m.awayTeam || '').toLowerCase();
        const homeMatch = mHome === home || mHome.includes(home) || home.includes(mHome);
        const awayMatch = mAway === away || mAway.includes(away) || away.includes(mAway);
        if (homeMatch && awayMatch) return true;
        // Match cruzado
        if (mHome === away && mAway === home) return true;
        return false;
      });

      if (match) {
        return {
          estadio: match.stadium || '',
          ciudad: match.city || '',
          estadioId: match.stadiumId || null,
        };
      }
    }
  } catch(e) {
    console.error('Error resolviendo sede:', e.message);
  }

  return null;
}

function traducirPais(nombre) {
  const traducciones = {
    "United States": "Estados Unidos",
    "USA": "Estados Unidos",
    "Korea Republic": "Corea del Sur",
    "Korea": "Corea del Sur",
    "England": "Inglaterra",
    "France": "Francia",
    "Spain": "España",
    "Germany": "Alemania",
    "Italy": "Italia",
    "Portugal": "Portugal",
    "Netherlands": "Países Bajos",
    "Belgium": "Bélgica",
    "Denmark": "Dinamarca",
    "Sweden": "Suecia",
    "Poland": "Polonia",
    "Czech Republic": "Chequia",
    "Czechia": "Chequia",
    "Hungary": "Hungría",
    "Romania": "Rumania",
    "Turkey": "Turquía",
    "Greece": "Grecia",
    "Ukraine": "Ucrania",
    "Russia": "Rusia",
    "Iran": "Irán",
    "Iraq": "Iraq",
    "Saudi Arabia": "Arabia Saudita",
    "United Arab Emirates": "Emiratos Árabes",
    "Israel": "Israel",
    "Thailand": "Tailandia",
    "Vietnam": "Vietnam",
    "Indonesia": "Indonesia",
    "Malaysia": "Malasia",
    "Singapore": "Singapur",
    "Hong Kong": "Hong Kong",
    "Taiwan": "Taiwán",
    "India": "India",
    "Pakistan": "Pakistán",
    "Bangladesh": "Bangladesh",
    "Sri Lanka": "Sri Lanka",
    "Brazil": "Brasil",
    "Mexico": "México",
    "Canada": "Canadá",
    "Costa Rica": "Costa Rica",
    "Honduras": "Honduras",
    "Argentina": "Argentina",
    "Peru": "Perú",
    "Chile": "Chile",
    "Colombia": "Colombia",
    "Ecuador": "Ecuador",
    "Paraguay": "Paraguay",
    "Uruguay": "Uruguay",
    "Venezuela": "Venezuela",
    "Bolivia": "Bolivia",
    "South Africa": "Sudáfrica",
    "Morocco": "Marruecos",
    "Tunisia": "Túnez",
    "Senegal": "Senegal",
    "Nigeria": "Nigeria",
    "Ghana": "Ghana",
    "Cameroon": "Camerún",
    "Mali": "Mali",
    "Ivory Coast": "Costa de Marfil",
    "Côte d'Ivoire": "Costa de Marfil",
    "Croatia": "Croacia",
    "Serbia": "Serbia",
    "Switzerland": "Suiza",
    "Austria": "Austria",
    "Japan": "Japón",
    "South Korea": "Corea del Sur",
    "Australia": "Australia",
    "New Zealand": "Nueva Zelanda",
    "Norway": "Noruega",
    "Algeria": "Argelia",
    "Uzbekistan": "Uzbekistán",
    "Jordan": "Jordania",
    "Cape Verde": "Cabo Verde",
    "Qatar": "Qatar",
    "Curacao": "Curazao",
    "Curaçao": "Curazao",
    "Haiti": "Haití",
    "Bosnia and Herzegovina": "Bosnia y Herzegovina",
    "Bosnia-Herzegovina": "Bosnia y Herzegovina",
    "DR Congo": "RD Congo",
    "Democratic Republic of Congo": "RD Congo",
    "Congo DR": "RD Congo",
    "Scotland": "Escocia",
    "Wales": "Gales",
    "Northern Ireland": "Irlanda del Norte",
    "Slovakia": "Eslovaquia",
    "Slovenia": "Eslovenia",
    "North Macedonia": "Macedonia del Norte",
    "Kosovo": "Kosovo",
    "Montenegro": "Montenegro",
    "Albania": "Albania",
    "Georgia": "Georgia",
    "Armenia": "Armenia",
    "Azerbaijan": "Azerbaiyán",
    "Kazakhstan": "Kazajistán",
    "Iceland": "Islandia",
    "Ireland": "Irlanda",
    "Finland": "Finlandia",
    "Denmark": "Dinamarca",
    "Poland": "Polonia",
    "Hungary": "Hungría",
    "Romania": "Rumania",
    "Greece": "Grecia",
    "Ukraine": "Ucrania",
    "Serbia": "Serbia",
    "Russia": "Rusia",
    "Israel": "Israel",
    "Bahrain": "Baréin",
    "Oman": "Omán",
    "Kuwait": "Kuwait",
    "Lebanon": "Líbano",
    "Syria": "Siria",
    "Palestine": "Palestina",
    "China PR": "China",
    "China": "China",
    "North Korea": "Corea del Norte",
    "DPR Korea": "Corea del Norte",
    "Korea Republic": "Corea del Sur",
    "Korea": "Corea del Sur",
    "United Arab Emirates": "Emiratos Árabes",
    "UAE": "Emiratos Árabes",
    "Thailand": "Tailandia",
    "Vietnam": "Vietnam",
    "Indonesia": "Indonesia",
    "Malaysia": "Malasia",
    "Singapore": "Singapur",
    "India": "India",
    "Pakistan": "Pakistán",
    "Bangladesh": "Bangladés",
    "Nepal": "Nepal",
    "Sri Lanka": "Sri Lanka",
    "Myanmar": "Myanmar",
    "Philippines": "Filipinas",
    "Cambodia": "Camboya",
    "Laos": "Laos",
    "Tanzania": "Tanzania",
    "Kenya": "Kenia",
    "Uganda": "Uganda",
    "Ethiopia": "Etiopía",
    "Zambia": "Zambia",
    "Zimbabwe": "Zimbabue",
    "Mozambique": "Mozambique",
    "Angola": "Angola",
    "Togo": "Togo",
    "Benin": "Benín",
    "Guinea": "Guinea",
    "Gabon": "Gabón",
    "Congo": "Congo",
    "Madagascar": "Madagascar",
    "Mauritius": "Mauricio",
    "Rwanda": "Ruanda",
    "Burundi": "Burundi",
    "Burkina Faso": "Burkina Faso",
    "Sierra Leone": "Sierra Leona",
    "Equatorial Guinea": "Guinea Ecuatorial",
    "Libya": "Libia",
    "Sudan": "Sudán",
    "Namibia": "Namibia",
    "Botswana": "Botsuana",
    "Cuba": "Cuba",
    "Dominican Republic": "Rep. Dominicana",
    "Guatemala": "Guatemala",
    "El Salvador": "El Salvador",
    "Nicaragua": "Nicaragua",
    "Jamaica": "Jamaica",
    "Trinidad and Tobago": "Trinidad y Tobago",
    "Suriname": "Surinam",
    "Guyana": "Guyana",
    "Bolivia": "Bolivia",
    "Chile": "Chile",
    "Peru": "Perú",
    "Venezuela": "Venezuela",
    "Fiji": "Fiji",
    "Papua New Guinea": "Papúa Nueva Guinea",
    "Solomon Islands": "Islas Salomón",
    "Tahiti": "Tahití",
    "New Caledonia": "Nueva Caledonia"
  };
  return traducciones[nombre] || nombre;
}

// ════════════════════════════════════════════════════════════════
// FUNCIONES GENÉRICAS DE FÚTBOL (cualquier competición)
// ════════════════════════════════════════════════════════════════

// Obtener partidos de API-Football para cualquier competición
async function obtenerPartidosAPIFootballFutbol(env, fecha, competicionKey) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };

  const comp = getCompeticion(competicionKey);
  const leagueId = comp.apiFootball?.league;
  const season = comp.apiFootball?.season;
  if (!leagueId || !season) return { partidos: [], fecha, mensaje: `${comp.nombre} no disponible en API-Football` };

  try {
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoy = ahoraAR.toISOString().split('T')[0];
    const fechaBase = fecha || hoy;

    const seasonCacheKey = `futbol:af:${competicionKey}:${season}`;
    let allFixtures = null;
    try {
      if (env.KV) {
        const raw = await env.KV.get(seasonCacheKey, 'json');
        if (raw && raw.fixtures && raw.fixtures.length > 0) {
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          const hayEnVivo = raw.fixtures.some(f => {
            try {
              const fDate = new Date(f.fixture.date);
              const arDate = new Date(fDate.getTime() - 3 * 60 * 60 * 1000);
              const fDay = arDate.toISOString().split('T')[0];
              const st = f.fixture.status.short;
              return fDay === fechaBase && (
                st === '1H' || st === '2H' || st === 'HT' || st === 'LIVE' || st === 'ET' || st === 'P' ||
                st === 'FT' || st === 'AET' || st === 'PEN'
              );
            } catch(e) { return false; }
          });
          const maxAge = hayEnVivo ? 2 * 60 * 1000 : 12 * 60 * 60 * 1000;
          if (cacheAge < maxAge) allFixtures = raw.fixtures;
        }
      }
    } catch (cacheErr) {}

    if (!allFixtures) {
      const seasonsToTry = [season, season - 1, season - 2].filter(s => s >= 2022);
      let lastError = null;
      for (const trySeason of seasonsToTry) {
        const url = `${API_FOOTBALL_URL}/fixtures?league=${leagueId}&season=${trySeason}`;
        let res;
        try {
          res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
        } catch (fetchErr) {
          lastError = { error: `Error de conexión API-Football: ${fetchErr.message}` };
          continue;
        }
        const rawText = await res.text();
        let data;
        try { data = JSON.parse(rawText); } catch(e) {
          lastError = { error: 'Error parseando respuesta', _debug: { status: res.status, body: rawText.substring(0, 500) } };
          continue;
        }
        if (!res.ok) { lastError = { error: `Error API-Football: ${res.status}` }; continue; }
        if (data.errors && (data.errors.rateLimit || data.errors.Requests)) {
          return { error: 'Rate limit API-Football: esperá unos minutos' };
        }
        if (!data.response || data.response.length === 0) { lastError = { partidos: [], fecha: fechaBase, mensaje: `API-Football sin partidos para season ${trySeason}` }; continue; }
        allFixtures = data.response;
        // Cachear con la key que incluye el season que funcionó
        try {
          if (env.KV) {
            await env.KV.put(`futbol:af:${competicionKey}:${trySeason}`, JSON.stringify({
              fixtures: allFixtures, _cachedAt: Date.now(), _count: allFixtures.length
            }), { expirationTtl: 43200 });
          }
        } catch(e) {}
        break; // found data, exit loop
      }
      if (!allFixtures) {
        return lastError || { partidos: [], fecha: fechaBase, mensaje: 'API-Football sin partidos en ninguna temporada' };
      }
    }

    const partidos = allFixtures.map(f => {
      const teams = f.teams;
      const goals = f.goals;
      const fixture = f.fixture;
      const league = f.league;
      const status = traducirEstadoAPIFootball(fixture.status.short);
      const horaAR = fixture.date ? (() => {
        try {
          const d = new Date(fixture.date);
          return new Intl.DateTimeFormat('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour: '2-digit', minute: '2-digit', hour12: false,
          }).format(d);
        } catch { return '--:--'; }
      })() : '--:--';

      let fechaPartido = null;
      if (fixture.date) {
        try {
          const d = new Date(fixture.date);
          const ar = new Date(d.getTime() - 3 * 60 * 60 * 1000);
          fechaPartido = ar.toISOString().split('T')[0];
        } catch {}
      }

      return {
        id: fixture.id,
        local: teams.home?.name || '?',
        visitante: teams.away?.name || '?',
        banderaLocal: getFlagPais(teams.home?.name),
        banderaVisitante: getFlagPais(teams.away?.name),
        hora: horaAR,
        horaUTC: fixture.date,
        estado: status,
        estadio: fixture.venue?.name || '',
        ciudad: fixture.venue?.city || '',
        competicion: league?.name || comp.nombre,
        grupo: null,
        etapa: null,
        jornada: league?.round || null,
        arbitro: fixture.referee || null,
        golesLocal: goals.home ?? null,
        golesVisitante: goals.away ?? null,
        golesHTLocal: null,
        golesHTVisitante: null,
        goleadores: [],
        _fechaPartido: fechaPartido,
        badgeLocal: teams.home?.logo || null,
        badgeVisitante: teams.away?.logo || null,
      };
    }).filter(p => p._fechaPartido === fechaBase || p._fechaPartido === null);

    return { partidos, fecha: fechaBase, fuente: 'api-football', totalSeason: allFixtures.length };
  } catch (err) {
    return { error: err.message };
  }
}

// Obtener posiciones para cualquier competición
// Consulta diaria de API-Football: una respuesta acotada por competencia y fecha.
// Una respuesta vacÃ­a vÃ¡lida no debe reemplazarse por un fallback parcial.
async function obtenerPartidosAPIFootballDiarios(env, fecha, competicionKey) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: 'API-Football key no configurada' };

  const comp = getCompeticion(competicionKey);
  const leagueId = comp.apiFootball?.league;
  const season = comp.apiFootball?.season;
  if (!leagueId || !season) return { error: `${comp.nombre} no disponible en API-Football` };

  const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const fechaBase = fecha || ahoraAR.toISOString().split('T')[0];
  const cacheKey = `futbol:af:diario:${competicionKey}:${fechaBase}`;

  try {
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached?.partidos && Date.now() - (cached._cachedAt || 0) < 6 * 60 * 60 * 1000) {
        return { partidos: cached.partidos, fecha: fechaBase, fuente: 'api-football-cache', completa: true };
      }
    }
  } catch (e) {}

  const params = new URLSearchParams({
    league: String(leagueId),
    season: String(season),
    date: fechaBase,
    timezone: 'America/Argentina/Buenos_Aires',
  });

  let res;
  try {
    res = await fetch(`${API_FOOTBALL_URL}/fixtures?${params}`, {
      headers: { 'x-apisports-key': apiKey },
    });
  } catch (e) {
    return { error: `Error de conexiÃ³n API-Football: ${e.message}` };
  }

  const rawText = await res.text();
  let data;
  try { data = JSON.parse(rawText); } catch (e) {
    return { error: 'Error parseando respuesta de API-Football', _debug: { status: res.status } };
  }
  if (!res.ok) return { error: `Error API-Football: ${res.status}` };
  if (data.errors && Object.keys(data.errors).length > 0) {
    if (data.errors.rateLimit || data.errors.Requests) return { error: 'Rate limit API-Football: esperÃ¡ unos minutos' };
    return { error: `API-Football: ${Object.values(data.errors).join(', ')}` };
  }

  const partidos = deduplicarYOrdenarPartidos((data.response || [])
    .map(raw => {
      const partido = normalizarFixtureAPIFootball(raw, fechaBase);
      if (!partido) return null;
      return {
        ...partido,
        banderaLocal: getFlagPais(partido.local),
        banderaVisitante: getFlagPais(partido.visitante),
        estado: traducirEstadoAPIFootball(partido.estado),
        grupo: null,
        etapa: null,
        arbitro: raw.fixture?.referee || null,
        golesHTLocal: null,
        golesHTVisitante: null,
        goleadores: [],
        _fechaPartido: partido.fecha,
      };
    })
    .filter(Boolean));

  try {
    if (env.KV) {
      await env.KV.put(cacheKey, JSON.stringify({ partidos, _cachedAt: Date.now() }), { expirationTtl: 21600 });
    }
  } catch (e) {}

  return { partidos, fecha: fechaBase, fuente: 'api-football', completa: true };
}

async function obtenerPosicionesFutbol(env, competicionKey) {
  const comp = getCompeticion(competicionKey);

  // 1) TheSportsDB como fuente principal
  if (comp.theSportsDB?.id && comp.hasTheSportsDBStandings) {
    const tsdbResult = await obtenerPosicionesTheSportsDB(env, competicionKey);
    if (tsdbResult && !tsdbResult.error && (tsdbResult.tabla || tsdbResult.grupos)) {
      return tsdbResult;
    }
  }

  // 2) API-Football como fallback
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };

  const leagueId = comp.apiFootball?.league;
  const season = comp.apiFootball?.season;
  if (!leagueId || !season) return { error: `${comp.nombre} sin posiciones disponibles` };

  try {
    const seasonsToTry = [season, season - 1, season - 2].filter(s => s >= 2022);
    let lastError = null;
    for (const trySeason of seasonsToTry) {
      const url = `${API_FOOTBALL_URL}/standings?league=${leagueId}&season=${trySeason}`;
      const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
      if (!res.ok) { lastError = { error: `Error API-Football: ${res.status}` }; continue; }

      const data = await res.json();
      if (!data.response || data.response.length === 0) { lastError = { grupos: [] }; continue; }

      const result = data.response[0];
      const leagueData = result.league;

    // Para ligas (todos contra todos): standings viene como array de un solo grupo
    if (leagueData.standings && leagueData.standings.length === 1) {
      const tabla = leagueData.standings[0].map(eq => ({
        posicion: eq.rank,
        equipo: eq.team?.name || '?',
        escudo: eq.team?.logo || null,
        puntos: eq.points,
        jugados: eq.all?.played || 0,
        ganados: eq.all?.win || 0,
        empatados: eq.all?.draw || 0,
        perdidos: eq.all?.lose || 0,
        golesFavor: eq.all?.goals?.for || 0,
        golesContra: eq.all?.goals?.against || 0,
        diferenciaGoles: eq.goalsDiff || 0,
        forma: eq.form || null,
        puntosFmt: eq.points?.toString() || '-',
      }));
      return { tabla, competicion: comp.nombre, tipo: 'tabla', fuente: 'api-football' };
    }

    // Para copas con grupos: standings viene como array de grupos
    const grupos = {};
    leagueData.standings.forEach(grupo => {
      const letra = grupo[0]?.group?.replace('Group ', '') || '?';
      grupos[letra] = grupo.map(eq => ({
        posicion: eq.rank,
        equipo: eq.team?.name || '?',
        escudo: eq.team?.logo || null,
        puntos: eq.points,
        jugados: eq.all?.played || 0,
        ganados: eq.all?.win || 0,
        empatados: eq.all?.draw || 0,
        perdidos: eq.all?.lose || 0,
        golesFavor: eq.all?.goals?.for || 0,
        golesContra: eq.all?.goals?.against || 0,
        diferenciaGoles: eq.goalsDiff || 0,
        forma: eq.form || null,
        clasificado: eq.rank <= 2,
      }));
    });
      return { grupos, competicion: comp.nombre, tipo: 'grupos', fuente: 'api-football' };
    }
    return { grupos: [], competicion: comp.nombre, tipo: 'grupos' };
  } catch (err) {
    return { error: err.message };
  }
}

// Obtener goleadores para cualquier competición
async function obtenerGoleadoresFutbol(env, competicionKey) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };

  const comp = getCompeticion(competicionKey);
  const leagueId = comp.apiFootball?.league;
  const season = comp.apiFootball?.season;
  if (!leagueId || !season) return { error: `${comp.nombre} sin goleadores disponibles` };

  try {
    const seasonsToTry = [season, season - 1, season - 2].filter(s => s >= 2022);
    let lastError = null;
    for (const trySeason of seasonsToTry) {
      const url = `${API_FOOTBALL_URL}/players/topscorers?league=${leagueId}&season=${trySeason}`;
      const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
      if (!res.ok) { lastError = { error: `Error API-Football: ${res.status}` }; continue; }

      const data = await res.json();
      if (!data.response) { lastError = { goleadores: [] }; continue; }

      const goleadores = data.response.slice(0, 15).map(g => ({
      nombre: g.player?.name || '?',
      equipo: g.statistics?.[0]?.team?.name || '?',
      escudo: g.statistics?.[0]?.team?.logo || null,
      bandera: getFlagPais(g.statistics?.[0]?.team?.name),
      goles: g.statistics?.[0]?.goals?.total || 0,
      asistencias: g.statistics?.[0]?.goals?.assists || 0,
      partidos: g.statistics?.[0]?.games?.appearences || 0,
    }));

    return { goleadores, competicion: comp.nombre, fuente: 'api-football' };
    } // fin for
    return { goleadores: [], competicion: comp.nombre, fuente: 'api-football' };
  } catch (err) {
    return { error: err.message };
  }
}

// Función principal: obtener partidos combinados para cualquier competición
async function obtenerPartidosCombinadosFutbol(env, fecha, competicionKey) {
  const comp = getCompeticion(competicionKey);
  const resultados = { partidos: [], fecha: fecha || null, fuentes: [], competicion: comp.nombre };
  const afDiario = await obtenerPartidosAPIFootballDiarios(env, fecha, competicionKey);
  if (!afDiario.error && afDiario.completa) {
    resultados.fuentes.push(afDiario.fuente || 'api-football');
    resultados.fecha = afDiario.fecha;
    return { ...resultados, partidos: afDiario.partidos };
  }

  // 0) OANOR como fuente principal (datos más completos, una llamada por fecha)
  const oanorAll = await obtenerPartidosOANOR(env, fecha);
  if (oanorAll && oanorAll.partidos.length > 0) {
    const compLeagueName = Object.entries(OANOR_LEAGUE_MAP)
      .find(([, v]) => v === competicionKey)?.[0];
    if (compLeagueName) {
      const filtered = oanorAll.partidos.filter(p => p.competicion === compLeagueName);
      if (filtered.length > 0) {
        resultados.fuentes.push('oanor');
        resultados.fecha = oanorAll.fecha;
        return { ...resultados, partidos: filtered };
      }
    }
  }

  // 1) API-Football como segunda fuente
  const afResult = await obtenerPartidosAPIFootballFutbol(env, fecha, competicionKey);
  if (!afResult.error && afResult.partidos && afResult.partidos.length > 0) {
    resultados.fuentes.push('api-football');
    resultados.fecha = afResult.fecha;
    return { ...resultados, partidos: afResult.partidos };
  }

  // 2) TheSportsDB como tercer fallback
  if (comp.theSportsDB?.id) {
    try {
      const tsdbResult = await obtenerPartidosTheSportsDB(env, fecha, competicionKey);
      if (!tsdbResult.error && tsdbResult.partidos && tsdbResult.partidos.length > 0) {
        resultados.fuentes.push('thesportsdb');
        resultados.fecha = tsdbResult.fecha;
        return { ...resultados, partidos: tsdbResult.partidos };
      }
    } catch(e) {}
  }

  // 3) football-data.org (solo para Mundial)
  if (comp.footballData?.id) {
    try {
      const fdResult = await obtenerPartidosMundial(env, comp.footballData.id, fecha);
      if (!fdResult.error && fdResult.partidos && fdResult.partidos.length > 0) {
        resultados.fuentes.push('football-data');
        resultados.fecha = fdResult.fecha;
        return { ...resultados, partidos: fdResult.partidos };
      }
    } catch(e) {}
  }

  return { ...resultados, partidos: [], mensaje: `Sin partidos para ${comp.nombre}` };
}

// Obtener detalle de partido genérico (cualquier competición)
async function obtenerDetallePartidoFutbol(env, fixtureId, competicionKey) {
  // Por ahora solo API-Football tiene detalle
  return await obtenerDetallePartidoAPIFootball(env, fixtureId);
}

async function obtenerPartidosMundial(env, competitionId = 2000, fechaSolicitada = null) {
  const apiKey = env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return { error: "API key de football-data no configurada" };
  }

  try {
    // Fecha dinámica en zona horaria Argentina (UTC-3)
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoy = ahoraAR.toISOString().split('T')[0];
    const fechaBase = fechaSolicitada || hoy;

    // ── CACHE KV: toda la competencia (dinámica: 6h normal, 2 min si hay partidos en vivo/recién terminados) ──
    const cacheKey = `mundial:fd:${competitionId}`;
    let allMatches = null;
    try {
      if (env.KV) {
        const raw = await env.KV.get(cacheKey, 'json');
        if (raw && raw.matches && raw.matches.length > 0) {
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          // Detectar si hay partidos en vivo o recién terminados para la fecha solicitada
          const hayEnVivo = raw.matches.some(m => {
            try {
              const mDate = new Date(m.utcDate);
              const arDate = new Date(mDate.getTime() - 3 * 60 * 60 * 1000);
              const mDay = arDate.toISOString().split('T')[0];
              // En vivo o terminados hoy: refrescar cada 2 min para obtener status/goles actualizados
              return mDay === fechaBase && (
                m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === '1H' || m.status === '2H' || m.status === 'HT' ||
                m.status === 'FINISHED' || m.status === 'AET' || m.status === 'PEN'
              );
            } catch(e) { return false; }
          });
          // Cache válido: 2 min si hay partidos en juego o terminados hoy, 6h si no
          const maxAge = hayEnVivo ? 2 * 60 * 1000 : 6 * 60 * 60 * 1000;
          if (cacheAge < maxAge) {
            allMatches = raw.matches;
          }
        }
      }
    } catch (cacheErr) { /* ignorar */ }

    // Si no hay cache, llamar a la API
    if (!allMatches) {
      // Pedir TODOS los partidos de la competencia (sin filtro de fecha)
      const url = `${FOOTBALL_DATA_URL}/competitions/${competitionId}/matches`;
      const res = await fetch(url, { headers: { 'X-Auth-Token': apiKey } });

      if (!res.ok) {
        return { error: `Error API: ${res.status}` };
      }

      const data = await res.json();

      if (!data.matches || data.matches.length === 0) {
        return { partidos: [], fecha: fechaBase, mensaje: 'Sin partidos en la competencia' };
      }

      allMatches = data.matches;

      // Guardar en cache
      try {
        if (env.KV) {
          await env.KV.put(cacheKey, JSON.stringify({
            matches: allMatches,
            _cachedAt: Date.now(),
            _count: allMatches.length
          }), { expirationTtl: 21600 }); // 6 horas
        }
      } catch(e) { /* ignorar */ }
    }

    // ── Procesar y filtrar por fecha ──
    const partidos = allMatches.map(m => ({
      id: m.id,
      local: traducirPais(m.homeTeam.name),
      visitante: traducirPais(m.awayTeam.name),
      _homeRaw: m.homeTeam.name,
      _awayRaw: m.awayTeam.name,
      banderaLocal: getFlagPais(m.homeTeam.name),
      banderaVisitante: getFlagPais(m.awayTeam.name),
      hora: formatearHora(m.utcDate),
      horaUTC: m.utcDate,
      estado: m.status,
      estadio: m.venue || '',
      ciudad: '',
      competicion: m.competition?.name || '',
      grupo: traducirGrupo(m.group),
      etapa: traducirEtapa(m.stage),
      jornada: m.matchday || null,
      arbitro: m.referee || null,
      golesLocal: m.score?.fullTime?.home ?? null,
      golesVisitante: m.score?.fullTime?.away ?? null,
      golesHTLocal: m.score?.halfTime?.home ?? null,
      golesHTVisitante: m.score?.halfTime?.away ?? null,
      goleadores: m.goals ? m.goals.map(g => `${g.scorer.name} ${g.minute}'`).slice(0, 5) : []
    }));

    // ── Filtrar por fecha placa con lógica de MADRUGADA (función global) ──
    // Partidos entre 00:00 y 03:59 AM hora Argentina se agrupan con el día ANTERIOR.
    // Ejemplo: Austria vs Jordania a las 01:00 del 17/06 → aparece en la placa del 16/06

    // Asignar metadata de madrugada a cada partido
    partidos.forEach(p => {
      const info = calcularFechaPlaca(p.horaUTC);
      p._fechaPlaca = info.fechaPlaca;
      p._esMadrugada = info.esMadrugada;
    });

    // Filtrar por fecha placa (no fecha calendario estricta)
    const partidosDelDia = partidos.filter(p => p._fechaPlaca === fechaBase);

    // ── ENRIQUECER CON SEDES (estadio/ciudad) desde Zafronix ──
    // Buscar en Zafronix matches los estadios para partidos que no tienen venue
    try {
      if (env.ZAFRONIX_KEY) {
        const cacheKey = 'mundial:zafronix:matches:2026';
        let zMatches = null;
        if (env.KV) {
          const cached = await env.KV.get(cacheKey, 'json');
          if (cached && cached.matches) zMatches = cached.matches;
        }
        if (!zMatches) {
          const zRes = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
            headers: { 'X-API-Key': env.ZAFRONIX_KEY }
          });
          if (zRes.ok) {
            const zData = await zRes.json();
            zMatches = zData.data || [];
            if (env.KV) await env.KV.put(cacheKey, JSON.stringify({ matches: zMatches, _cachedAt: Date.now() }), { expirationTtl: 21600 });
          }
        }
        if (zMatches && zMatches.length > 0) {
          partidosDelDia.forEach(p => {
            const home = normalizeTeamName(p._homeRaw || '');
            const away = normalizeTeamName(p._awayRaw || '');
            if (!home || !away) return;
            const found = zMatches.find(m => {
              const mh = normalizeTeamName(m.homeTeam || '');
              const ma = normalizeTeamName(m.awayTeam || '');
              return (mh === home && ma === away) || (mh === away && ma === home);
            });
            if (found) {
              if (!p.estadio) p.estadio = found.stadium || '';
              if (!p.ciudad) p.ciudad = found.city || '';
            }
          });
        }
      }
    } catch(zErr) { /* silencioso */ }

    // Exponer madugada como campo público y limpiar internos
    partidosDelDia.forEach(p => {
      p.madrugada = p._esMadrugada || false;
      delete p._esMadrugada;
      delete p._fechaPlaca;
      delete p._homeRaw;
      delete p._awayRaw;
    });

    return { partidos: partidosDelDia, fecha: fechaBase, totalSeason: allMatches.length };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================
// BLOQUE 1b: API-FOOTBALL (api-sports.io) — FUENTE COMPLEMENTARIA
// ============================================================

const API_FOOTBALL_URL = "https://v3.football.api-sports.io";

// Traducir nombre de equipo de API-Football (puede venir en inglés o español)
function traducirPaisAPIFootball(nombre) {
  // Reutilizar el mismo mapa de traducciones
  return traducirPais(nombre);
}

// Obtener partidos desde API-Football por fecha
async function obtenerPartidosAPIFootball(env, fecha) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return { error: "API-Football key no configurada" };
  }

  try {
    // Fecha dinámica en zona horaria Argentina (UTC-3)
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoy = ahoraAR.toISOString().split('T')[0];
    const fechaBase = fecha || hoy;

    // ── CACHE: toda la temporada en KV (dinámica: 12h normal, 2 min si hay en vivo/recién terminados) ──
    const seasonCacheKey = 'mundial:season:2026';
    let allFixtures = null;
    try {
      if (env.KV) {
        const raw = await env.KV.get(seasonCacheKey, 'json');
        if (raw && raw.fixtures && raw.fixtures.length > 0) {
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          // Detectar partidos en vivo O recién terminados del día
          const hayEnVivo = raw.fixtures.some(f => {
            try {
              const fDate = new Date(f.fixture.date);
              const arDate = new Date(fDate.getTime() - 3 * 60 * 60 * 1000);
              const fDay = arDate.toISOString().split('T')[0];
              const st = f.fixture.status.short;
              // En vivo o recién terminados (FT/AET/PEN) del día actual
              return fDay === fechaBase && (
                st === '1H' || st === '2H' || st === 'HT' || st === 'LIVE' || st === 'ET' || st === 'P' ||
                st === 'FT' || st === 'AET' || st === 'PEN'
              );
            } catch(e) { return false; }
          });
          // Si hay en vivo o terminados hoy: refrescar cada 2 min para obtener status/goles actualizados
          const maxAge = hayEnVivo ? 2 * 60 * 1000 : 12 * 60 * 60 * 1000;
          if (cacheAge < maxAge) {
            allFixtures = raw.fixtures;
          }
        }
      }
    } catch (cacheErr) { /* ignorar */ }

    // Si no hay cache, llamar a la API por TODA la temporada (1 request)
    if (!allFixtures) {
      const url = `${API_FOOTBALL_URL}/fixtures?league=1&season=2026`;
      let res;
      try {
        res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
      } catch (fetchErr) {
        return { error: `Error de conexión API-Football: ${fetchErr.message}`, _debug: { step: 'fetch' } };
      }

      const rawText = await res.text();
      let data;
      try { data = JSON.parse(rawText); } catch(e) {
        return { error: 'Error parseando respuesta', _debug: { step: 'parse', status: res.status, body: rawText.substring(0, 500) } };
      }

      // Debug info que siempre se incluye
      const debugInfo = {
        status: res.status,
        url: url,
        response_count: data.response?.length ?? 'null/undefined',
        results_field: data.results,
        errors_field: data.errors,
        raw_keys: Object.keys(data),
        raw_response_sample: Array.isArray(data.response) ? data.response.slice(0, 1) : data.response,
      };

      if (!res.ok) {
        return { error: `Error API-Football: ${res.status}`, _debug: debugInfo };
      }

      // Detectar rate limit
      if (data.errors && (data.errors.rateLimit || data.errors.Requests)) {
        return { error: 'Rate limit API-Football: esperá unos minutos', _debug: debugInfo };
      }

      if (!data.response || data.response.length === 0) {
        return { partidos: [], fecha: fechaBase, mensaje: 'API-Football no devolvió partidos', _debug: debugInfo };
      }

      // Guardar TODOS los fixtures en cache
      allFixtures = data.response;
      try {
        if (env.KV) {
          await env.KV.put(seasonCacheKey, JSON.stringify({
            fixtures: allFixtures,
            _cachedAt: Date.now(),
            _count: allFixtures.length
          }), { expirationTtl: 43200 }); // 12 horas
        }
      } catch(e) { /* ignorar */ }
    }

    // ── Filtrar localmente por fecha placa (con lógica de madrugada) ──
    const partidosDelDia = allFixtures.filter(f => {
      try {
        const info = calcularFechaPlaca(f.fixture.date);
        return info.fechaPlaca === fechaBase;
      } catch(e) { return false; }
    });

    const partidos = partidosDelDia.map(f => {
      const infoPlaca = calcularFechaPlaca(f.fixture.date);
      return {
      id: f.fixture.id,
      local: traducirPais(f.teams.home.name),
      visitante: traducirPais(f.teams.away.name),
      banderaLocal: getFlagPais(f.teams.home.name),
      banderaVisitante: getFlagPais(f.teams.away.name),
      hora: formatearHora(f.fixture.date),
      horaUTC: f.fixture.date,
      estado: traducirEstadoAPIFootball(f.fixture.status.short),
      estadio: f.fixture.venue?.name || '',
      ciudad: f.fixture.venue?.city || '',
      grupo: traducirGrupo(f.league?.round) || null,
      arbitro: f.fixture.referee || null,
      golesLocal: f.goals?.home ?? null,
      golesVisitante: f.goals?.away ?? null,
      eventos: [],
      estadisticas: [],
      madugada: infoPlaca.esMadrugada,
    };});

    return { partidos, fecha: fechaBase, fuente: 'api-football', totalSeason: allFixtures.length };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================
// BLOQUE 1c: THESPORTSDB — FUENTE COMPLEMENTARIA (Free tier: 15 eventos/request)
// ============================================================

const THESPORTSDB_URL = 'https://www.thesportsdb.com/api/v1/json';

// ============================================================
// OANOR Fixtures & Scores API (wraps TheSportsDB data)
// ============================================================
const OANOR_URL = 'https://api.oanor.com/fixtures-api';

const OANOR_LEAGUE_MAP = {
  'Argentinian Primera Division': 'liga-profesional',
  'Copa Argentina': 'copa-argentina',
  'Copa Libertadores': 'libertadores',
  'Copa Sudamericana': 'sudamericana',
  'World Cup 2026': 'mundial',
};

// In-memory cache per request
let _oanorCache = null;
let _oanorCacheFecha = null;

async function obtenerPartidosOANOR(env, fecha) {
  const apiKey = env.OANOR_KEY;
  if (!apiKey) return null;

  const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const hoy = ahoraAR.toISOString().split('T')[0];
  const fechaBase = fecha || hoy;

  // In-memory cache dentro del mismo request
  if (_oanorCache && _oanorCacheFecha === fechaBase) {
    return _oanorCache;
  }

  try {
    const url = `${OANOR_URL}/v1/day?date=${fechaBase}&sport=Soccer`;
    const res = await fetch(url, { headers: { 'x-oanor-key': apiKey } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.data?.events || !data.data.events.length) return null;

    const partidos = data.data.events.map(ev => {
      const compKey = OANOR_LEAGUE_MAP[ev.league] || null;
      const comp = compKey ? COMPETITIONS[compKey] : null;
      const utcDate = new Date(ev.timestamp || `${ev.date}T${ev.time}Z`);
      const infoPlaca = calcularFechaPlaca(utcDate.toISOString());
      const scoreLocal = ev.home_score !== null && ev.home_score !== undefined ? parseInt(ev.home_score) : null;
      const scoreVisit = ev.away_score !== null && ev.away_score !== undefined ? parseInt(ev.away_score) : null;

      return {
        id: ev.id,
        local: ev.home_team,
        visitante: ev.away_team,
        banderaLocal: getFlagPais(ev.home_team),
        banderaVisitante: getFlagPais(ev.away_team),
        hora: formatearHora(ev.timestamp || `${ev.date}T${ev.time}Z`),
        horaUTC: ev.timestamp || `${ev.date}T${ev.time}`,
        estado: traducirEstadoTSDB(ev.status),
        estadio: ev.venue || '',
        ciudad: '',
        competicion: ev.league || '',
        grupo: null,
        etapa: null,
        jornada: ev.round ? parseInt(ev.round) : null,
        arbitro: null,
        golesLocal: scoreLocal,
        golesVisitante: scoreVisit,
        golesHTLocal: null,
        golesHTVisitante: null,
        goleadores: [],
        eventos: [],
        estadisticas: [],
        badgeLocal: null,
        badgeVisitante: null,
        poster: null,
        madugada: infoPlaca.esMadrugada,
        _compKey: compKey,
        _compNombre: comp ? comp.nombre : '',
        _compIcon: comp ? comp.icon : '',
      };
    });

    const result = { partidos, fecha: fechaBase, fuente: 'oanor' };
    _oanorCache = result;
    _oanorCacheFecha = fechaBase;
    return result;
  } catch (e) {
    console.error('OANOR error:', e.message);
    return null;
  }
}

// Mapeo de estados TheSportsDB → estados internos
function traducirEstadoTSDB(status) {
  const mapa = {
    'NS': 'SCHEDULED', 'TBD': 'SCHEDULED',
    '1H': 'IN_PLAY', '2H': 'IN_PLAY', 'HT': 'IN_PLAY', 'ET': 'IN_PLAY', 'P': 'IN_PLAY', 'LIVE': 'IN_PLAY',
    'FT': 'FINISHED', 'AET': 'FINISHED', 'PEN': 'FINISHED',
    'PST': 'POSTPONED', 'CANC': 'CANCELLED',
  };
  return mapa[status] || status || 'SCHEDULED';
}

async function obtenerPartidosTheSportsDB(env, fecha, competicionKey) {
  const apiKey = env.THESPORTSDB_KEY || '123';
  const comp = getCompeticion(competicionKey);
  const leagueId = comp.theSportsDB?.id;
  const season = comp.theSportsDB?.season;
  if (!leagueId || !season) return { partidos: [], fecha: fecha || null, mensaje: `${comp.nombre} no disponible en TheSportsDB` };

  try {
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoy = ahoraAR.toISOString().split('T')[0];
    const fechaBase = fecha || hoy;

    const cacheKey = `futbol:tsdb:${competicionKey}:${season}`;
    let allEvents = [];
    let cachedIds = new Set();

    // Try to get cached season events
    try {
      if (env.KV) {
        const raw = await env.KV.get(cacheKey, 'json');
        if (raw && raw.events && raw.events.length > 0) {
          allEvents = raw.events;
          raw.events.forEach(e => cachedIds.add(e.idEvent));
          const cacheAge = Date.now() - (raw._cachedAt || 0);
          const hayEnVivo = raw.events.some(ev => {
            try {
              const evDate = new Date(ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z'));
              const arDate = new Date(evDate.getTime() - 3 * 60 * 60 * 1000);
              const evDay = arDate.toISOString().split('T')[0];
              const st = ev.strStatus;
              return evDay === fechaBase && (st === '1H' || st === '2H' || st === 'HT' || st === 'LIVE' || st === 'ET' || st === 'P');
            } catch(e) { return false; }
          });
          const maxAge = hayEnVivo ? 2 * 60 * 1000 : 12 * 60 * 60 * 1000;
          if (cacheAge < maxAge && allEvents.length >= 5) {
            return filtrarTSDBPorFecha(allEvents, fechaBase, competicionKey);
          }
        }
      }
    } catch (cacheErr) {}

    // Fetch season events from TheSportsDB
    const url = `${THESPORTSDB_URL}/${apiKey}/eventsseason.php?id=${leagueId}&s=${season}`;
    let res;
    try {
      res = await fetch(url);
    } catch (fetchErr) {
      if (allEvents.length > 0) return filtrarTSDBPorFecha(allEvents, fechaBase, competicionKey);
      return { error: `Error conexión TheSportsDB: ${fetchErr.message}` };
    }

    if (!res.ok) {
      if (allEvents.length > 0) return filtrarTSDBPorFecha(allEvents, fechaBase, competicionKey);
      return { error: `Error TheSportsDB: ${res.status}` };
    }

    const data = await res.json();
    const newEvents = data.events || [];
    for (const ev of newEvents) {
      if (!cachedIds.has(ev.idEvent)) {
        allEvents.push(ev);
        cachedIds.add(ev.idEvent);
      }
    }

    // Also fetch next + past for additional coverage
    const upcomingUrls = [
      `${THESPORTSDB_URL}/${apiKey}/eventsnextleague.php?id=${leagueId}`,
      `${THESPORTSDB_URL}/${apiKey}/eventspastleague.php?id=${leagueId}`,
    ];
    for (const url of upcomingUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const extraEvents = data.events || [];
          for (const ev of extraEvents) {
            if (!cachedIds.has(ev.idEvent)) {
              allEvents.push(ev);
              cachedIds.add(ev.idEvent);
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          events: allEvents,
          _cachedAt: Date.now(),
          _count: allEvents.length
        }), { expirationTtl: 43200 });
      }
    } catch(e) {}

    return filtrarTSDBPorFecha(allEvents, fechaBase, competicionKey);
  } catch (err) {
    return { error: err.message };
  }
}

// Filtrar eventos TheSportsDB por fecha placa (con lógica de madrugada)
function filtrarTSDBPorFecha(events, fechaBase, competicionKey) {
  const esMundial = competicionKey === 'mundial';
  const partidosDelDia = events.filter(ev => {
    if (!ev.strTimestamp && !ev.dateEvent) return false;
    try {
      const utcDate = new Date(ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z'));
      const info = calcularFechaPlaca(utcDate.toISOString());
      return info.fechaPlaca === fechaBase;
    } catch(e) { return false; }
  });

  const partidos = partidosDelDia.map(ev => {
    const utcDate = new Date(ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z'));
    const infoPlaca = calcularFechaPlaca(utcDate.toISOString());
    return {
    id: ev.idEvent,
    local: esMundial ? traducirPais(ev.strHomeTeam) : ev.strHomeTeam,
    visitante: esMundial ? traducirPais(ev.strAwayTeam) : ev.strAwayTeam,
    banderaLocal: getFlagPais(ev.strHomeTeam),
    banderaVisitante: getFlagPais(ev.strAwayTeam),
    hora: formatearHora(ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z')),
    horaUTC: ev.strTimestamp || (ev.dateEvent + 'T' + (ev.strTime || '00:00:00')),
    estado: traducirEstadoTSDB(ev.strStatus),
    estadio: ev.strVenue || '',
    ciudad: ev.strCountry || '',
    competicion: ev.strLeague || '',
    grupo: null,
    etapa: ev.strCircuit || null,
    jornada: ev.intRound ? parseInt(ev.intRound) : null,
    arbitro: null,
    golesLocal: ev.intHomeScore !== null && ev.intHomeScore !== undefined ? parseInt(ev.intHomeScore) : null,
    golesVisitante: ev.intAwayScore !== null && ev.intAwayScore !== undefined ? parseInt(ev.intAwayScore) : null,
    golesHTLocal: null,
    golesHTVisitante: null,
    goleadores: [],
    eventos: [],
    estadisticas: [],
    badgeLocal: ev.strHomeTeamBadge || null,
    badgeVisitante: ev.strAwayTeamBadge || null,
    poster: ev.strPoster || null,
    madugada: infoPlaca.esMadrugada,
  };});

  return { partidos, fecha: fechaBase, fuente: 'thesportsdb', totalSeason: events.length };
}

// Obtener posiciones desde TheSportsDB (tabla de posiciones)
async function obtenerPosicionesTheSportsDB(env, competicionKey) {
  const apiKey = env.THESPORTSDB_KEY || '123';
  const comp = getCompeticion(competicionKey);
  const leagueId = comp.theSportsDB?.id;
  const season = comp.theSportsDB?.season;
  if (!leagueId || !season) return null;
  if (!comp.hasTheSportsDBStandings) return null; // copas sin tabla de grupos

  try {
    const url = `${THESPORTSDB_URL}/${apiKey}/lookuptable.php?l=${leagueId}&s=${season}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.table || !data.table.length) return null;

    const groups = {};
    for (const row of data.table) {
      const grupo = row.strGroup || 'A';
      if (!groups[grupo]) groups[grupo] = [];
      groups[grupo].push({
        posicion: parseInt(row.intRank) || 0,
        equipo: row.strTeam || '?',
        escudo: row.strBadge ? row.strBadge.replace('/tiny', '') : null,
        puntos: parseInt(row.intPoints) || 0,
        jugados: parseInt(row.intPlayed) || 0,
        ganados: parseInt(row.intWin) || 0,
        empatados: parseInt(row.intDraw) || 0,
        perdidos: parseInt(row.intLoss) || 0,
        golesFavor: parseInt(row.intGoalsFor) || 0,
        golesContra: parseInt(row.intGoalsAgainst) || 0,
        diferenciaGoles: parseInt(row.intGoalDifference) || 0,
        forma: row.strForm || null,
        clasificado: row.strDescription?.includes('Promotion') || row.strDescription?.includes('Play') || false,
      });
    }

    const groupKeys = Object.keys(groups);
    // Solo un grupo → tabla directa
    if (groupKeys.length === 1) {
      return { tabla: groups[groupKeys[0]], competicion: comp.nombre, tipo: 'tabla', fuente: 'thesportsdb' };
    }
    // Múltiples grupos
    return { grupos: groups, competicion: comp.nombre, tipo: 'grupos', fuente: 'thesportsdb' };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================
// BLOQUE 1d: ZAFRONIX WC API — ENRIQUECIMIENTO MUNDIAL
// ============================================================

const ZAFRONIX_URL = 'https://api.zafronix.com/fifa/worldcup/v1';
const KG_URL = 'https://kgsearch.googleapis.com/v1/entities:search';

// Obtener tabla de posiciones del Mundial 2026 vía Zafronix
async function obtenerPosicionesZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null; // silently skip if no key

  try {
    // Cache KV: 10 min durante torneo, 1h fuera de torneo
    const cacheKey = 'mundial:zafronix:standings:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 10 * 60 * 1000)) {
        return cached;
      }
    }

    const res = await fetch(`${ZAFRONIX_URL}/standings?year=2026`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.groups) return null;

    const grupos = {};
    Object.entries(data.groups).forEach(([letra, equipos]) => {
      grupos[letra] = equipos.map(eq => ({
        posicion: eq.position,
        equipo: traducirPais(eq.team),
        bandera: getFlagPais(eq.team),
        puntos: eq.points,
        jugados: eq.played,
        ganados: eq.won,
        empatados: eq.drawn,
        perdidos: eq.lost,
        golesFavor: eq.goalsFor,
        golesContra: eq.goalsAgainst,
        diferenciaGoles: eq.goalDifference,
        clasificado: eq.advanced || false,
      }));
    });

    const resultado = { grupos, fuente: 'zafronix' };

    // Guardar cache
    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix standings error:', err.message);
    return null;
  }
}

// Obtener goleadores del Mundial 2026 agregando goles desde partidos terminados (Zafronix)
async function obtenerGoleadoresZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;

  try {
    const cacheKey = 'mundial:zafronix:topscorers:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 30 * 60 * 1000)) {
        return cached;
      }
    }

    // Obtener todos los partidos desde Zafronix
    const matchesCacheKey = 'mundial:zafronix:matches:2026';
    let zMatches = null;

    if (env.KV) {
      const cached = await env.KV.get(matchesCacheKey, 'json');
      if (cached && cached.matches) zMatches = cached.matches;
    }

    if (!zMatches) {
      const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
        headers: { 'X-API-Key': apiKey }
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Intentar múltiples formatos de respuesta
      if (Array.isArray(data)) zMatches = data;
      else if (data.matches && Array.isArray(data.matches)) zMatches = data.matches;
      else if (data.data && Array.isArray(data.data)) zMatches = data.data;
      else if (data.results && Array.isArray(data.results)) zMatches = data.results;
      else if (data.fixtures && Array.isArray(data.fixtures)) zMatches = data.fixtures;
    }

    if (!zMatches || !Array.isArray(zMatches)) return null;

    // Filtrar solo partidos terminados (Zafronix usa "finished" en minúsculas)
    const finished = zMatches.filter(m => {
      const status = (m.status || m.state || '').toString().toLowerCase();
      return ['ft', 'finished', 'aet', 'pen', 'ended', 'complete', 'completed', 'final'].includes(status);
    });

    if (finished.length === 0) return null;

    // Agregar goles por jugador
    const golesPorJugador = {};

    for (const match of finished) {
      // Zafronix puede devolver homeTeam como string o como objeto
      const homeTeam = typeof match.homeTeam === 'string' ? match.homeTeam : (match.homeTeam?.name || match.home || '');
      const awayTeam = typeof match.awayTeam === 'string' ? match.awayTeam : (match.awayTeam?.name || match.away || '');

      // Procesar goles (Zafronix usa array `goals` con {player, team:"home"/"away", minute})
      const goals = match.goals || [];

      for (const goal of goals) {
        // Limpiar nombre: quitar minutos y detalles (ej: "Havertz 45+5' pen" → "Havertz")
        let player = (goal.player || goal.scorer || goal.name || '').toString();
        player = player.replace(/\s+\d+[\+\d]*'\s*(pen|og|agg)?$/i, '').trim();

        // team puede ser "home"/"away" → resolver al nombre real
        const teamRaw = (goal.team || '').toString().toLowerCase();
        const team = teamRaw === 'home' ? homeTeam : (teamRaw === 'away' ? awayTeam : goal.team || '');

        if (!player) continue;

        const key = `${player}|||${team}`;
        if (!golesPorJugador[key]) {
          const equipoTraducido = traducirPais(team);
          golesPorJugador[key] = {
            nombre: player,
            equipo: equipoTraducido,
            bandera: getFlagPais(equipoTraducido) || getFlagPais(team),
            goles: 0,
            asistencias: 0,
            partidos: 0,
          };
        }
        golesPorJugador[key].goles++;
      }
    }

    // Convertir a array y ordenar por goles descendente
    const goleadores = Object.values(golesPorJugador)
      .sort((a, b) => b.goles - a.goles)
      .slice(0, 10);

    if (golesPorJugador.length === 0) return null;

    const resultado = { goleadores, fuente: 'zafronix-aggregated' };

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix aggregated topscorers error:', err.message);
    return null;
  }
}

// Obtener bracket de eliminación directa vía Zafronix
async function obtenerBracketZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;

  try {
    const cacheKey = 'mundial:zafronix:bracket:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 10 * 60 * 1000)) {
        return cached;
      }
    }

    const res = await fetch(`${ZAFRONIX_URL}/bracket?year=2026`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.stages) return null;

    const etapas = {};
    const stageNames = {
      'round_of_32': 'Ronda de 32',
      'round_of_16': 'Octavos de Final',
      'quarter_final': 'Cuartos de Final',
      'semi_final': 'Semifinales',
      'third_place': 'Tercer Puesto',
      'final': 'Final'
    };

    Object.entries(data.stages).forEach(([stage, matches]) => {
      etapas[stageNames[stage] || stage] = matches.map(m => ({
        id: m.matchId,
        local: m.home ? traducirPais(m.home) : (m.homeRef || 'TBD'),
        visitante: m.away ? traducirPais(m.away) : (m.awayRef || 'TBD'),
        golesLocal: m.homeScore,
        golesVisitante: m.awayScore,
        estadio: m.stadium || '',
        ciudad: m.city || '',
        horaUTC: m.kickoffUtc || null,
        ganador: m.winner ? traducirPais(m.winner) : null,
      }));
    });

    const resultado = { etapas, fuente: 'zafronix' };

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 3600 });
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix bracket error:', err.message);
    return null;
  }
}

// Obtener planteles del Mundial 2026 vía Zafronix
async function obtenerPlantelesZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;

  try {
    const cacheKey = 'mundial:zafronix:teams:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 6 * 60 * 60 * 1000)) {
        return cached;
      }
    }

    const res = await fetch(`${ZAFRONIX_URL}/teams?tournament=2026`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const equipos = {};
    data.forEach(team => {
      const nombre = traducirPais(team.name);
      equipos[nombre] = {
        nombre,
        bandera: getFlagPais(team.name),
        grupo: team.group || null,
        jugadores: (team.roster || []).map(j => ({
          numero: j.jersey,
          nombre: j.name,
          posicion: j.position,
          club: j.club?.name || '',
          goles: j.goals || 0,
          capitan: j.captain || false,
        })),
      };
    });

    const resultado = { equipos, fuente: 'zafronix' };

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 21600 }); // 6 horas
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix teams error:', err.message);
    return null;
  }
}

// Obtener estadios del Mundial 2026 vía Zafronix
async function obtenerEstadiosZafronix(env) {
  const apiKey = env.ZAFRONIX_KEY;
  if (!apiKey) return null;

  try {
    const cacheKey = 'mundial:zafronix:stadiums:2026';
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached) return cached; // Estadios no cambian
    }

    const res = await fetch(`${ZAFRONIX_URL}/stadiums?tournament=2026`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.data) return null;

    const estadios = data.data.map(s => ({
      id: s.id,
      nombre: s.name,
      nombreFIFA: s.fifaNames?.['2026'] || s.name,
      ciudad: s.city,
      pais: s.country,
      capacidad: s.capacity,
      coordenadas: s.coords || null,
      altitud: s.elevationM || null,
    }));

    const resultado = { estadios, fuente: 'zafronix' };

    try {
      if (env.KV) {
        await env.KV.put(cacheKey, JSON.stringify({
          ...resultado, _cachedAt: Date.now()
        }), { expirationTtl: 86400 }); // 24 horas
      }
    } catch(e) { /* ignorar */ }

    return resultado;
  } catch (err) {
    console.error('Zafronix stadiums error:', err.message);
    return null;
  }
}

// Enriquecer partidos con datos de estadios Zafronix
async function enriquecerConEstadios(env, partidos) {
  const estadiosData = await obtenerEstadiosZafronix(env);
  if (!estadiosData || !estadiosData.estadios) return partidos;

  // Crear mapa por nombre de estadio (búsqueda flexible)
  const estadioMap = {};
  estadiosData.estadios.forEach(e => {
    estadioMap[e.nombre.toLowerCase()] = e;
    if (e.nombreFIFA !== e.nombre) estadioMap[e.nombreFIFA.toLowerCase()] = e;
  });

  return partidos.map(p => {
    if (p.estadio && p.estadio !== 'TBD') {
      const key = p.estadio.toLowerCase();
      const estadio = estadioMap[key];
      if (estadio) {
        p.estadioInfo = estadio;
        if (!p.ciudad) p.ciudad = estadio.ciudad;
      }
    }
    return p;
  });
}

// ============================================================
// BLOQUE 1e: GOOGLE KNOWLEDGE GRAPH — EQUIPOS/ESTADIOS/CIUDADES
// ============================================================

// Buscar entidad en Knowledge Graph
async function buscarKG(env, query, types = []) {
  if (!env.KG_KEY) return null;
  const cacheKey = `kg:${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  try {
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && (Date.now() - (cached._cachedAt || 0) < 24 * 60 * 60 * 1000)) {
        return cached.data;
      }
    }

    const params = new URLSearchParams({
      query,
      key: env.KG_KEY,
      limit: '1',
      indent: 'true'
    });
    if (types.length > 0) params.append('types', types.join(','));

    const res = await fetch(`${KG_URL}?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.itemListElement?.[0]?.result;
    if (!item) return null;

    const result = {
      name: item.name || null,
      description: item.description || null,
      detailedDescription: item.detailedDescription?.articleBody || null,
      url: item.detailedDescription?.url || null,
      image: item.image?.contentUrl || null,
      type: item['@type'] || [],
    };

    if (env.KV) {
      await env.KV.put(cacheKey, JSON.stringify({
        data: result, _cachedAt: Date.now()
      }), { expirationTtl: 86400 }); // 24h cache for static data
    }

    return result;
  } catch (e) {
    return null;
  }
}

// Enriquecer partidos con datos de Knowledge Graph (equipos, estadios, ciudades)
async function enriquecerConKnowledgeGraph(env, partidos) {
  if (!env.KG_KEY) return partidos;

  for (const p of partidos) {
    // Enriquecer equipo local
    if (p.local && !p.localKG) {
      const query = `${p.local} national football team`;
      const kgData = await buscarKG(env, query, ['SportsTeam']);
      if (kgData) p.localKG = kgData;
    }

    // Enriquecer equipo visitante
    if (p.visitante && !p.visitanteKG) {
      const query = `${p.visitante} national football team`;
      const kgData = await buscarKG(env, query, ['SportsTeam']);
      if (kgData) p.visitanteKG = kgData;
    }

    // Enriquecer estadio
    if (p.estadio && p.estadio !== 'TBD' && !p.estadioKG) {
      const kgData = await buscarKG(env, p.estadio, ['Stadium', 'Place']);
      if (kgData) p.estadioKG = kgData;
    }

    // Enriquecer ciudad
    if (p.ciudad && !p.ciudadKG) {
      const kgData = await buscarKG(env, `${p.ciudad} Mexico`, ['City', 'Place']);
      if (kgData) p.ciudadKG = kgData;
    }
  }

  return partidos;
}

// ============================================================
// BLOQUE 1d: ZAFRONIX ENRICHMENT — GOLES/EVENTOS/LINEUPS/CARDS
// ============================================================

// Enriquecer partidos con datos completos de Zafronix (reemplaza API-Football para WC2026)
async function enriquecerConZafronix(env, partidos) {
  if (!env.ZAFRONIX_KEY) return partidos;

  // Fetch all WC2026 matches from Zafronix
  let zMatches = null;
  const cacheKey = 'mundial:zafronix:matches:2026';

  try {
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && cached.matches && (Date.now() - (cached._cachedAt || 0) < 5 * 60 * 1000)) {
        zMatches = cached.matches;
      }
    }

    if (!zMatches) {
      const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
        headers: { 'X-API-Key': env.ZAFRONIX_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        zMatches = data.data || [];
        if (env.KV && zMatches.length > 0) {
          await env.KV.put(cacheKey, JSON.stringify({
            matches: zMatches, _cachedAt: Date.now()
          }), { expirationTtl: 300 }); // 5 min cache for live data
        }
      }
    }
  } catch(e) { return partidos; }

  if (!zMatches || zMatches.length === 0) return partidos;

  // Match and enrich each partido (list endpoint - basic info)
  partidos.forEach(p => {
    const pHome = normalizeTeamName(p._homeRaw || p.local || '');
    const pAway = normalizeTeamName(p._awayRaw || p.visitante || '');
    if (!pHome || !pAway) return;

    const found = zMatches.find(m => {
      const mh = normalizeTeamName(m.homeTeam || '');
      const ma = normalizeTeamName(m.awayTeam || '');
      return (mh === pHome && ma === pAway) || (mh === pAway && ma === pHome);
    });

    if (!found) return;

    // Guardar ID de Zafronix para llamada de detalle
    p._zafronixId = found.id;

    // Basic info (stadium, city, referee)
    if (found.stadium && !p.estadio) p.estadio = found.stadium;
    if (found.city && !p.ciudad) p.ciudad = found.city;
    if (found.referee) {
      p.arbitro = typeof found.referee === 'object' ? (found.referee.name || '') : found.referee;
    }
    if (found.attendance) p.asistencia = found.attendance;

    // Status mapping
    if (found.status === 'finished' || found.status === 'full_time' || found.status === 'aet' || found.status === 'penalties' ||
        (found.homeScore !== null && found.homeScore !== undefined && found.awayScore !== null && found.awayScore !== undefined && !found.liveMinute)) {
      if (p.estado === 'TIMED' || p.estado === 'SCHEDULED') {
        p.estado = 'FINISHED';
      }
    } else if (found.status === 'in_play' || found.status === 'live' || found.liveMinute) {
      if (p.estado === 'TIMED' || p.estado === 'SCHEDULED') {
        p.estado = 'IN_PLAY';
      }
      p.minutoLive = found.liveMinute || null;
    }

    // Scores
    if (found.homeScore !== null && found.homeScore !== undefined) {
      p.golesLocal = found.homeScore;
    }
    if (found.awayScore !== null && found.awayScore !== undefined) {
      p.golesVisitante = found.awayScore;
    }

    // Goals/Goalscorers from list endpoint (usually null for 2026)
    if (found.goals && Array.isArray(found.goals) && found.goals.length > 0) {
      p._zafronixHasGoals = true;
      p.goleadores = found.goals.map(g => {
        const player = g.player || g.name || g.scorer || '';
        const minute = g.minute || g.time || '';
        return `${player} ${minute}'`;
      }).slice(0, 8);

      if (!p.eventos) p.eventos = [];
      found.goals.forEach(g => {
        p.eventos.push({
          tipo: 'Goal',
          minuto: g.minute || g.time || null,
          jugador: g.player || g.name || g.scorer || '',
          equipo: g.team || '',
          detalle: g.type || null,
        });
      });
    }

    // Cards
    if (found.cards && Array.isArray(found.cards) && found.cards.length > 0) {
      if (!p.eventos) p.eventos = [];
      found.cards.forEach(c => {
        p.eventos.push({
          tipo: 'Card',
          minuto: c.minute || c.time || null,
          jugador: c.player || c.name || '',
          equipo: c.team || '',
          detalle: c.card || c.type || null,
        });
      });
    }

    // Substitutions
    if (found.substitutions && Array.isArray(found.substitutions) && found.substitutions.length > 0) {
      if (!p.eventos) p.eventos = [];
      found.substitutions.forEach(s => {
        p.eventos.push({
          tipo: 'subst',
          minuto: s.minute || s.time || null,
          jugador: s.playerIn || s.in || '',
          equipo: s.team || '',
          detalle: `Sale: ${s.playerOut || s.out || ''}`,
        });
      });
    }

    // Lineups and formations
    if (found.lineups) {
      if (found.lineups.home && Array.isArray(found.lineups.home) && found.lineups.home.length > 0) {
        p.formacionLocal = {
          formacion: found.formations?.home || null,
          jugadores: found.lineups.home.map(pl => pl.name || pl.player || pl).slice(0, 11),
        };
      }
      if (found.lineups.away && Array.isArray(found.lineups.away) && found.lineups.away.length > 0) {
        p.formacionVisitante = {
          formacion: found.formations?.away || null,
          jugadores: found.lineups.away.map(pl => pl.name || pl.player || pl).slice(0, 11),
        };
      }
    } else if (found.formations) {
      if (found.formations.home) {
        p.formacionLocal = { formacion: found.formations.home, jugadores: [] };
      }
      if (found.formations.away) {
        p.formacionVisitante = { formacion: found.formations.away, jugadores: [] };
      }
    }
  });

  // ── DETAIL CALLS: Fetch per-match enrichment (goals, events) for finished/live matches ──
  const needDetail = partidos.filter(p =>
    p._zafronixId && !p._zafronixHasGoals &&
    (p.estado === 'FINISHED' || p.estado === 'IN_PLAY' || p.estado === 'FT' || p.estado === 'AET' || p.estado === 'PEN')
  );

  for (const p of needDetail) {
    try {
      const detailCacheKey = `zafronix:match:${p._zafronixId}`;
      let detail = null;

      // Check cache first
      if (env.KV) {
        const cached = await env.KV.get(detailCacheKey, 'json');
        const ttl = (p.estado === 'FINISHED' || p.estado === 'FT') ? 3600 : 120;
        if (cached && (Date.now() - (cached._cachedAt || 0) < ttl * 1000)) {
          detail = cached;
        }
      }

      if (!detail) {
        const detRes = await fetch(`${ZAFRONIX_URL}/matches/${p._zafronixId}`, {
          headers: { 'X-API-Key': env.ZAFRONIX_KEY }
        });
        if (detRes.ok) {
          detail = await detRes.json();
          if (env.KV && detail) {
            const ttl = (p.estado === 'FINISHED' || p.estado === 'FT') ? 3600 : 120;
            await env.KV.put(detailCacheKey, JSON.stringify({
              ...detail, _cachedAt: Date.now()
            }), { expirationTtl: ttl });
          }
        }
      }

      if (detail) {
        // Goals from detail endpoint
        if (detail.goals && Array.isArray(detail.goals) && detail.goals.length > 0) {
          p.goleadores = detail.goals.map(g => {
            const player = g.player || g.name || g.scorer || '';
            const minute = g.minute || g.time || '';
            return `${player} ${minute}'`;
          }).slice(0, 8);

          if (!p.eventos) p.eventos = [];
          detail.goals.forEach(g => {
            p.eventos.push({
              tipo: 'Goal',
              minuto: g.minute || g.time || null,
              jugador: g.player || g.name || g.scorer || '',
              equipo: g.team || '',
              detalle: g.type || g.bodyPart || null,
            });
          });
        }

        // Cards from detail
        if (detail.cards && Array.isArray(detail.cards) && detail.cards.length > 0) {
          if (!p.eventos) p.eventos = [];
          detail.cards.forEach(c => {
            p.eventos.push({
              tipo: 'Card', minuto: c.minute || c.time || null,
              jugador: c.player || c.name || '', equipo: c.team || '',
              detalle: c.card || c.type || null,
            });
          });
        }

        // Substitutions from detail
        if (detail.substitutions && Array.isArray(detail.substitutions) && detail.substitutions.length > 0) {
          if (!p.eventos) p.eventos = [];
          detail.substitutions.forEach(s => {
            p.eventos.push({
              tipo: 'subst', minuto: s.minute || s.time || null,
              jugador: s.playerIn || s.in || '', equipo: s.team || '',
              detalle: `Sale: ${s.playerOut || s.out || ''}`,
            });
          });
        }

        // Lineups from detail
        if (detail.lineups) {
          if (detail.lineups.home && Array.isArray(detail.lineups.home) && detail.lineups.home.length > 0) {
            p.formacionLocal = {
              formacion: detail.formations?.home || null,
              jugadores: detail.lineups.home.map(pl => pl.name || pl.player || pl).slice(0, 11),
            };
          }
          if (detail.lineups.away && Array.isArray(detail.lineups.away) && detail.lineups.away.length > 0) {
            p.formacionVisitante = {
              formacion: detail.formations?.away || null,
              jugadores: detail.lineups.away.map(pl => pl.name || pl.player || pl).slice(0, 11),
            };
          }
        }

        // Weather
        if (detail.weather) p.weather = detail.weather;
        // Captains
        if (detail.captains) p.capitanes = detail.captains;
      }

      // Small delay between detail calls
      await sleep(80);
    } catch(e) {
      console.error(`Error fetching Zafronix detail for ${p._zafronixId}:`, e.message);
    }
  }

  // ── SANITY CHECK: Validate goleadores count vs actual score ──
  partidos.forEach(p => {
    if (p.goleadores && p.goleadores.length > 0 && p.golesLocal !== null && p.golesVisitante !== null) {
      const totalGoals = (p.golesLocal || 0) + (p.golesVisitante || 0);
      if (p.goleadores.length > totalGoals && totalGoals >= 0) {
        // Goleadores count exceeds actual score — likely fake data, discard
        p._goleadoresOriginales = p.goleadores;
        p.goleadores = [];
        p._goleadoresDescartados = true;
      }
    }
  });

  return partidos;
}

// ============================================================
// BLOQUE 1e: API-FOOTBALL DETAIL CACHE — EVENTOS/FORMACIONES
// ============================================================

// Obtener eventos y formaciones de partidos terminados (batch, con cache)
async function enriquecerEventosAPIFootball(env, partidos) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return partidos;

  // Solo enriquecer partidos terminados o en vivo
  const elegibles = partidos.filter(p => {
    const estado = p.estado;
    return estado === 'FINISHED' || estado === 'IN_PLAY' || estado === 'FT' || estado === 'AET' || estado === 'PEN';
  });

  if (elegibles.length === 0) return partidos;

  // Limitar a 4 partidos por batch para no quemar requests (4 partidos × 1 req = 4 requests)
  const batch = elegibles.slice(0, 4);

  for (const partido of batch) {
    // Usar afFixtureId (ID de API-Football) si existe, sino intentar con el ID genérico
    const fixtureId = partido.afFixtureId || partido.id;
    if (!fixtureId) continue;

    try {
      // Cache KV para eventos por fixture
      const cacheKey = `mundial:af:detail:${fixtureId}`;
      if (env.KV) {
        const cached = await env.KV.get(cacheKey, 'json');
        if (cached && cached.eventos) {
          partido.eventos = cached.eventos;
          partido.formacionLocal = cached.formacionLocal || null;
          partido.formacionVisitante = cached.formacionVisitante || null;
          partido.estadisticas = cached.estadisticas || [];
          partido.goleadores = cached.goleadores || partido.goleadores || [];
          continue;
        }
      }

      // Llamar al endpoint de detalle (1 request = eventos + formaciones + stats)
      const detalle = await obtenerDetallePartidoAPIFootball(env, fixtureId);
      if (detalle && !detalle.error) {
        partido.eventos = detalle.eventos || [];
        partido.formacionLocal = detalle.formacionLocal || null;
        partido.formacionVisitante = detalle.formacionVisitante || null;
        partido.estadisticas = detalle.estadisticas || [];

        // Extraer goleadores de eventos de tipo "Goal"
        if (detalle.eventos && detalle.eventos.length > 0) {
          partido.goleadores = detalle.eventos
            .filter(e => e.tipo === 'Goal')
            .map(e => `${e.jugador} ${e.minuto}'`)
            .slice(0, 5);
        }

        // Cache por 2 horas (partidos terminados no cambian)
        try {
          if (env.KV) {
            const ttl = (partido.estado === 'FINISHED' || partido.estado === 'FT') ? 7200 : 120;
            await env.KV.put(cacheKey, JSON.stringify({
              eventos: partido.eventos,
              formacionLocal: partido.formacionLocal,
              formacionVisitante: partido.formacionVisitante,
              estadisticas: partido.estadisticas,
              goleadores: partido.goleadores,
              _cachedAt: Date.now(),
            }), { expirationTtl: ttl });
          }
        } catch(e) { /* ignorar */ }
      }

      // Pequeña pausa para no saturar la API
      await sleep(100);
    } catch(e) {
      console.error(`Error enriqueciendo partido ${fixtureId}:`, e.message);
    }
  }

  return partidos;
}

// Obtener detalle enriquecido de un partido (eventos, formaciones, stats)
async function obtenerDetallePartidoAPIFootball(env, fixtureId) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };

  try {
    const [eventsRes, lineupsRes, statsRes] = await Promise.all([
      fetch(`${API_FOOTBALL_URL}/fixtures/events?fixture=${fixtureId}`, { headers: { 'x-apisports-key': apiKey } }),
      fetch(`${API_FOOTBALL_URL}/fixtures/lineups?fixture=${fixtureId}`, { headers: { 'x-apisports-key': apiKey } }),
      fetch(`${API_FOOTBALL_URL}/fixtures/statistics?fixture=${fixtureId}`, { headers: { 'x-apisports-key': apiKey } }),
    ]);

    const resultado = { eventos: [], formacionLocal: null, formacionVisitante: null, estadisticas: [] };

    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      if (eventsData.response) {
        resultado.eventos = eventsData.response.map(e => ({
          tipo: e.type,           // Goal, Card, subst
          minuto: e.time?.elapsed,
          equipo: e.team?.name,
          jugador: e.player?.name,
          asistio: e.assist?.name || null,
          detalle: e.detail || null,
        }));
      }
    }

    if (lineupsRes.ok) {
      const lineupsData = await lineupsRes.json();
      if (lineupsData.response && lineupsData.response.length >= 2) {
        resultado.formacionLocal = {
          formacion: lineupsData.response[0].formation,
          jugadores: lineupsData.response[0].startXI?.map(p => p.player?.name) || [],
        };
        resultado.formacionVisitante = {
          formacion: lineupsData.response[1].formation,
          jugadores: lineupsData.response[1].startXI?.map(p => p.player?.name) || [],
        };
      }
    }

    if (statsRes.ok) {
      const statsData = await statsRes.json();
      if (statsData.response) {
        resultado.estadisticas = statsData.response.map(s => ({
          equipo: s.team?.name,
          stats: s.statistics?.map(st => ({ tipo: st.type, valor: st.value })) || [],
        }));
      }
    }

    return resultado;
  } catch (err) {
    return { error: err.message };
  }
}

// Obtener posiciones de grupos del Mundial
async function obtenerPosicionesGrupos(env) {
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada" };

  try {
    const url = `${API_FOOTBALL_URL}/standings?league=1&season=2026`;
    const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });

    if (!res.ok) return { error: `Error API-Football: ${res.status}` };

    const data = await res.json();
    if (!data.response || data.response.length === 0) return { grupos: [] };

    const grupos = {};
    data.response[0].league.standings.forEach(grupo => {
      const letra = grupo[0]?.group?.replace('Group ', '') || '?';
      grupos[letra] = grupo.map(eq => ({
        posicion: eq.rank,
        equipo: traducirPais(eq.team?.name),
        bandera: getFlagPais(eq.team?.name),
        puntos: eq.points,
        jugados: eq.all?.played,
        ganados: eq.all?.win,
        empatados: eq.all?.draw,
        perdidos: eq.all?.lose,
        golesFavor: eq.all?.goals?.for,
        golesContra: eq.all?.goals?.against,
        diferenciaGoles: eq.goalsDiff,
      }));
    });

    return { grupos };
  } catch (err) {
    return { error: err.message };
  }
}

// Obtener goleadores del Mundial
async function obtenerGoleadores(env) {
  // ── Prioridad 1: Zafronix (fuente oficial WC2026) ──
  const zafronix = await obtenerGoleadoresZafronix(env);
  if (zafronix && zafronix.goleadores && zafronix.goleadores.length > 0) {
    return zafronix;
  }

  // ── Prioridad 2: API-Football (fallback) ──
  const apiKey = env.API_FOOTBALL_KEY;
  if (!apiKey) return { error: "API-Football key no configurada y Zafronix sin datos" };

  try {
    const url = `${API_FOOTBALL_URL}/players/topscorers?league=1&season=2026`;
    const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });

    if (!res.ok) return { error: `Error API-Football: ${res.status}` };

    const data = await res.json();
    if (!data.response) return { goleadores: [] };

    const goleadores = data.response.slice(0, 10).map(g => ({
      nombre: g.player?.name,
      equipo: traducirPais(g.statistics?.[0]?.team?.name),
      bandera: getFlagPais(g.statistics?.[0]?.team?.name),
      goles: g.statistics?.[0]?.goals?.total || 0,
      asistencias: g.statistics?.[0]?.goals?.assists || 0,
      partidos: g.statistics?.[0]?.games?.appearences || 0,
    }));

    return { goleadores, fuente: 'api-football' };
  } catch (err) {
    return { error: err.message };
  }
}

// Traducir estado de API-Football al formato football-data
function traducirEstadoAPIFootball(status) {
  const mapa = {
    'TBD': 'SCHEDULED', 'NS': 'SCHEDULED', 'PND': 'SCHEDULED',
    '1H': 'IN_PLAY', '2H': 'IN_PLAY', 'HT': 'IN_PLAY',
    'ET': 'IN_PLAY', 'BT': 'IN_PLAY', 'P': 'IN_PLAY',
    'SUSP': 'SUSPENDED', 'INT': 'SUSPENDED',
    'FT': 'FINISHED', 'AET': 'FINISHED', 'PEN': 'FINISHED',
    'PST': 'POSTPONED', 'CANC': 'CANCELLED', 'ABD': 'CANCELLED',
    'AWD': 'AWARDED', 'WO': 'AWARDED', 'LIVE': 'IN_PLAY',
  };
  return mapa[status] || status;
}

// Combinar datos de ambas APIs para un partido dado
function combinarDatosPartido(partidoFD, partidoAF) {
  if (!partidoFD && !partidoAF) return null;
  if (!partidoFD) return partidoAF;
  if (!partidoAF) return partidoFD;

  // Usar football-data como base y enriquecer con API-Football
  return {
    ...partidoFD,
    // ID de API-Football para enriquecer con detalle después
    afFixtureId: partidoAF.id || null,
    // Estadio: preferir API-Football si football-data no tiene
    estadio: (partidoFD.estadio && partidoFD.estadio !== 'TBD' && partidoFD.estadio !== '')
      ? partidoFD.estadio
      : (partidoAF.estadio && partidoAF.estadio !== 'TBD' ? partidoAF.estadio : partidoFD.estadio),
    // Campos enriquecidos solo de API-Football
    ciudad: partidoAF.ciudad || null,
    arbitro: partidoAF.arbitro || null,
    formacionLocal: partidoAF.formacionLocal,
    formacionVisitante: partidoAF.formacionVisitante,
    eventos: partidoAF.eventos || [],
    estadisticas: partidoAF.estadisticas || [],
    // Si API-Football tiene grupo mejor formateado, usarlo
    grupo: partidoAF.grupo || partidoFD.grupo,
  };
}

// Obtener partidos combinados de las 3 APIs (football-data + API-Football + TheSportsDB)
async function obtenerPartidosCombinados(env, fecha) {
  const resultados = { partidos: [], fecha: fecha || null, fuentes: [], enriquecido: false };

  // 1) football-data.org (primary - mejor cobertura Mundial 2026)
  const fdResult = await obtenerPartidosMundial(env, 2000, fecha);
  let fdPartidos = [];
  if (!fdResult.error && fdResult.partidos) {
    fdPartidos = fdResult.partidos;
    resultados.fuentes.push('football-data');
    resultados.fecha = fdResult.fecha;
  }

  // 2) API-Football (secundaria - enriquece con eventos/ciudad/arbitro)
  const afResult = await obtenerPartidosAPIFootball(env, fecha);
  let afPartidos = [];
  if (!afResult.error && afResult.partidos) {
    afPartidos = afResult.partidos;
    resultados.fuentes.push('api-football');
    if (!resultados.fecha) resultados.fecha = afResult.fecha;
  }

  // 3) TheSportsDB (terciaria - aporta badges/poster)
  const tsdbResult = await obtenerPartidosTheSportsDB(env, fecha, 'mundial');
  let tsdbPartidos = [];
  if (!tsdbResult.error && tsdbResult.partidos) {
    tsdbPartidos = tsdbResult.partidos;
    resultados.fuentes.push('thesportsdb');
    if (!resultados.fecha) resultados.fecha = tsdbResult.fecha;
  }

  // Si no hay datos de ninguna API
  if (fdPartidos.length === 0 && afPartidos.length === 0 && tsdbPartidos.length === 0) {
    return { ...resultados, mensaje: "Sin partidos para esta fecha" };
  }
  // Si solo hay datos de una API
  if (fdPartidos.length === 0 && afPartidos.length === 0) {
    let partidos = tsdbPartidos;
    partidos = await enriquecerEventosAPIFootball(env, partidos);
    partidos = await enriquecerConEstadios(env, partidos);
    resultados.enriquecido = true;
    return { ...resultados, partidos };
  }
  if (afPartidos.length === 0 && tsdbPartidos.length === 0) {
    let partidos = fdPartidos;
    partidos = await enriquecerEventosAPIFootball(env, partidos);
    partidos = await enriquecerConEstadios(env, partidos);
    resultados.enriquecido = true;
    return { ...resultados, partidos };
  }
  if (fdPartidos.length === 0 && tsdbPartidos.length === 0) {
    let partidos = afPartidos;
    partidos = await enriquecerEventosAPIFootball(env, partidos);
    partidos = await enriquecerConEstadios(env, partidos);
    resultados.enriquecido = true;
    return { ...resultados, partidos };
  }

  // Combinar: football-data como base, enriquecer con API-Football y TheSportsDB
  const partidosCombinados = fdPartidos.map(fd => {
    const af = afPartidos.find(a => matchPartidos(a, fd));
    const tsdb = tsdbPartidos.find(t => matchPartidos(t, fd));
    const combined = combinarDatosPartido(fd, af);
    // Enriquecer con TheSportsDB (badges, poster, estadio real)
    if (tsdb) {
      if (tsdb.badgeLocal && !combined.badgeLocal) combined.badgeLocal = tsdb.badgeLocal;
      if (tsdb.badgeVisitante && !combined.badgeVisitante) combined.badgeVisitante = tsdb.badgeVisitante;
      if (tsdb.poster && !combined.poster) combined.poster = tsdb.poster;
      // Preferir estadio real de TheSportsDB sobre nombres genéricos
      if (tsdb.estadio && tsdb.estadio !== 'TBD' && tsdb.estadio !== '') {
        // Solo usar TSDB si el actual es vacío, genérico o viene de Zafronix
        if (!combined.estadio || combined.estadio === '' || combined.estadio === 'TBD' ||
            /stadium/i.test(combined.estadio)) {
          combined.estadio = tsdb.estadio;
        }
      }
    }
    // Preservar _homeRaw/_awayRaw para enriquecimiento Zafronix
    delete combined._localRaw;
    delete combined._visitanteRaw;
    delete combined._fechaPlaca;
    // Exponer madugada como campo público
    combined.madrugada = combined._esMadrugada || false;
    delete combined._esMadrugada;
    return combined;
  });

  // Agregar partidos de API-Football que no estén en football-data (usando matchPartidos con normalización)
  afPartidos.forEach(af => {
    const yaExiste = partidosCombinados.some(p => matchPartidos(p, af));
    if (!yaExiste) {
      // Asegurar madugada flag (ya viene calculada por la API, pero por seguridad)
      if (af.madrugada === undefined && af.horaUTC) {
        af.madrugada = calcularFechaPlaca(af.horaUTC).esMadrugada;
      }
      partidosCombinados.push(af);
    }
  });

  // Agregar partidos de TheSportsDB que no estén en los anteriores (usando matchPartidos con normalización)
  tsdbPartidos.forEach(tsdb => {
    const yaExiste = partidosCombinados.some(p => matchPartidos(p, tsdb));
    if (!yaExiste) {
      if (tsdb.madrugada === undefined && tsdb.horaUTC) {
        tsdb.madrugada = calcularFechaPlaca(tsdb.horaUTC).esMadrugada;
      }
      partidosCombinados.push(tsdb);
    }
  });

  // ── ENRIQUECIMIENTO AVANZADO ──
  // 4) Enriquecer con Zafronix (goles, eventos, lineups, cards, status en vivo)
  await enriquecerConZafronix(env, partidosCombinados);
  if (env.ZAFRONIX_KEY) resultados.fuentes.push('zafronix-events');

  // 5) Enriquecer con eventos/formaciones de API-Football (fallback si Zafronix no tiene datos)
  await enriquecerEventosAPIFootball(env, partidosCombinados);

  // 6) Enriquecer con datos de estadios de Zafronix
  await enriquecerConEstadios(env, partidosCombinados);
  if (env.ZAFRONIX_KEY) resultados.fuentes.push('zafronix');

  // 7) Enriquecer con Google Knowledge Graph (equipos, estadios, ciudades)
  await enriquecerConKnowledgeGraph(env, partidosCombinados);
  if (env.KG_KEY) resultados.fuentes.push('knowledge-graph');

  // Limpiar campos internos después del enriquecimiento
  partidosCombinados.forEach(p => {
    delete p._homeRaw;
    delete p._awayRaw;
  });

  resultados.enriquecido = true;

  // Debug info detallado
  const matched = partidosCombinados.filter(p => p.ciudad || p.arbitro || (p.eventos && p.eventos.length > 0)).length;
  const conEventos = partidosCombinados.filter(p => p.eventos && p.eventos.length > 0).length;
  const conFormacion = partidosCombinados.filter(p => p.formacionLocal || p.formacionVisitante).length;
  resultados.debug = {
    fd_count: fdPartidos.length,
    af_count: afPartidos.length,
    tsdb_count: tsdbPartidos.length,
    matched_count: matched,
    total_combined: partidosCombinados.length,
    con_eventos: conEventos,
    con_formacion: conFormacion,
    // Detalle por partido para diagnóstico
    partidos_detalle: partidosCombinados.map(p => ({
      local: p.local,
      visitante: p.visitante,
      estado: p.estado,
      afFixtureId: p.afFixtureId || null,
      estadio: p.estadio || '(vacío)',
      ciudad: p.ciudad || null,
      arbitro: p.arbitro || null,
      golesLocal: p.golesLocal,
      golesVisitante: p.golesVisitante,
      goleadores: p.goleadores || [],
      eventos_count: (p.eventos || []).length,
      formacionLocal: p.formacionLocal ? true : false,
      formacionVisitante: p.formacionVisitante ? true : false,
    })),
  };

  return { ...resultados, partidos: partidosCombinados };
}

// Helper: normalizar nombres de equipos para comparar entre APIs
function normalizeTeamName(name) {
  if (!name) return '';
  const map = {
    'czech republic': 'czechia', 'czechia': 'czechia', 'cze': 'czechia',
    'south korea': 'south korea', 'korea republic': 'south korea', 'korea': 'south korea', 'south korea': 'south korea', 'kor': 'south korea',
    'united states': 'united states', 'usa': 'united states', 'united states of america': 'united states', 'us': 'united states',
    'ivory coast': 'ivory coast', "côte d'ivoire": 'ivory coast', 'cote divoire': 'ivory coast',
    'democratic republic of congo': 'dr congo', 'dr congo': 'dr congo', 'congo dr': 'dr congo',
    'republic of congo': 'congo', 'congo': 'congo',
    'new zealand': 'new zealand', 'nz': 'new zealand',
    'costa rica': 'costa rica', 'crc': 'costa rica',
    'saudi arabia': 'saudi arabia', 'ksa': 'saudi arabia',
    'south africa': 'south africa', 'rsa': 'south africa',
    'north korea': 'north korea', "dpr korea": 'north korea', 'prk': 'north korea',
    'bosnia and herzegovina': 'bosnia', 'bosnia': 'bosnia', 'bih': 'bosnia',
    'trinidad and tobago': 'trinidad', 'trinidad': 'trinidad', 'tri': 'trinidad',
    'united arab emirates': 'uae', 'uae': 'uae',
    'equatorial guinea': 'equatorial guinea', 'eqg': 'equatorial guinea',
    'cape verde': 'cape verde', 'cpv': 'cape verde',
    'sierra leone': 'sierra leone', 'sle': 'sierra leone',
    'burkina faso': 'burkina faso', 'bfa': 'burkina faso',
  };
  const lower = name.toLowerCase().trim();
  return map[lower] || lower;
}

// Helper: matchear partidos entre APIs por nombre normalizado y hora
function matchPartidos(a, b) {
  const aLocal = normalizeTeamName(a.local || a._localRaw);
  const bLocal = normalizeTeamName(b.local || b._localRaw);
  const aVis = normalizeTeamName(a.visitante || a._visitanteRaw);
  const bVis = normalizeTeamName(b.visitante || b._visitanteRaw);
  // Match por nombres normalizados
  if (aLocal && bLocal && aVis && bVis) {
    if (aLocal === bLocal && aVis === bVis) return true;
    if (aLocal === bVis && aVis === bLocal) return true;
  }
  // Fallback: match exacto original
  if (a.local === b.local && a.visitante === b.visitante) return true;
  if (a.local === b.visitante && a.visitante === b.local) return true;
  // Match por hora cercana (misma fecha, <90min) + al menos un equipo similar
  try {
    const tA = new Date(a.horaUTC).getTime();
    const tB = new Date(b.horaUTC).getTime();
    if (Math.abs(tA - tB) < 90 * 60 * 1000) {
      // Si la hora es cercana Y al menos un equipo coincide normalizado
      if (aLocal && bLocal && (aLocal === bLocal || aVis === bVis)) return true;
    }
  } catch(e) {}
  return false;
}

// ============================================================
// BLOQUE 2️⃣: FUNCIÓN PLACA MAÑANA
// ============================================================

async function handleMundialManana(env) {
  try {
    const resultado = await obtenerPartidosMundial(env, 2000);
    
    if (resultado.error) {
      return new Response(JSON.stringify({ok:false,error:resultado.error}),{status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }

    if (!resultado.partidos || resultado.partidos.length === 0) {
      return new Response(JSON.stringify({
        ok:true,
        tipo:"mañana",
        fecha:resultado.fecha,
        partidos:[],
        mensaje:"No hay partidos hoy",
        titular:"Sin partidos programados",
        bajada:"Vuelva a consultar más tarde"
      }),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }

    let detallePartidos = "";
    resultado.partidos.forEach((p, i) => {
      detallePartidos += `${i + 1}. ${p.banderaLocal} ${p.local} vs ${p.visitante} ${p.banderaVisitante} a las ${p.hora} hs (${p.estadio})\n`;
    });

    const prompt = `Sos redactor de Media Mendoza.
Generá un titular y bajada para una PLACA MATUTINA del Mundial de Fútbol 2026.

PARTIDOS DE HOY:
${detallePartidos}

INSTRUCCIONES:
- Titular: máx 10 palabras, llamativo
- Bajada: máx 15 palabras, tono urgente
- Emojis: máx 2

Respondé SOLO con JSON sin backticks:
{"titular":"...","bajada":"..."}`;

    const geminiResult = await callGemini(prompt, env);
    
    const respuesta = {
      ok:true,
      tipo:"mañana",
      fecha:resultado.fecha,
      partidos:resultado.partidos,
      titular:geminiResult.error ? `Hoy ${resultado.partidos.length} partido${resultado.partidos.length > 1 ? 's' : ''}` : (geminiResult.data?.titular || "Partidos del Mundial"),
      bajada:geminiResult.error ? `No te pierdas la acción a partir de las ${resultado.partidos[0].hora}` : (geminiResult.data?.bajada || "Seguí toda la acción")
    };

    return new Response(JSON.stringify(respuesta),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}});

  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:err.message}),{status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  }
}

// ============================================================
// BLOQUE 3️⃣: FUNCIÓN PLACA NOCHE
// ============================================================

async function handleMundialNoche(env) {
  try {
    const resultado = await obtenerPartidosMundial(env, 2000);
    
    if (resultado.error) {
      return new Response(JSON.stringify({ok:false,error:resultado.error}),{status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }

    const resultados = (resultado.partidos || []).filter(p => 
      p.estado === "FINISHED" && p.golesLocal !== null && p.golesVisitante !== null
    );

    if (resultados.length === 0) {
      return new Response(JSON.stringify({
        ok:true,
        tipo:"noche",
        fecha:resultado.fecha,
        resultados:[],
        mensaje:"No hay resultados aún",
        titular:"Esperando resultados...",
        bajada:"Los partidos aún no han terminado"
      }),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }

    let detalleResultados = "";
    resultados.forEach((r, i) => {
      const resumen = `${r.banderaLocal} ${r.local} ${r.golesLocal} - ${r.golesVisitante} ${r.visitante} ${r.banderaVisitante}`;
      const goles = r.goleadores.length > 0 ? ` (${r.goleadores.join(', ')})` : "";
      detalleResultados += `${i + 1}. ${resumen}${goles}\n`;
    });

    const prompt = `Sos redactor de Media Mendoza.
Generá un titular y bajada para una PLACA NOCTURNA de resultados del Mundial 2026.

RESULTADOS DE HOY:
${detalleResultados}

INSTRUCCIONES:
- Titular: máx 10 palabras
- Bajada: máx 15 palabras
- Emojis: máx 2

Respondé SOLO con JSON sin backticks:
{"titular":"...","bajada":"..."}`;

    const geminiResult = await callGemini(prompt, env);
    
    const respuesta = {
      ok:true,
      tipo:"noche",
      fecha:resultado.fecha,
      resultados:resultados,
      titular:geminiResult.error ? `${resultados.length} resultado${resultados.length > 1 ? 's' : ''}` : (geminiResult.data?.titular || "Resultados del Mundial"),
      bajada:geminiResult.error ? "Conocé todos los goles y lo mejor de la jornada" : (geminiResult.data?.bajada || "Seguí toda la acción")
    };

    return new Response(JSON.stringify(respuesta),{headers:{...CORS_HEADERS,"Content-Type":"application/json"}});

  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:err.message}),{status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  }
}

// ============================================================
// REEL — CONFIG
// ============================================================

async function handleGetReelConfig(env){
  try{
    const prompt = await env.KV.get(REEL_PROMPT_KEY,"text");
    const voces  = await env.KV.get(REEL_VOCES_KEY,"json");
    return jsonOk({
      prompt: prompt || REEL_PROMPT_DEFAULT,
      voces:  voces  || VOCES_DEFAULT
    });
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostReelConfig(body,env){
  try{
    if(body.prompt !== undefined){
      await env.KV.put(REEL_PROMPT_KEY, String(body.prompt||"").trim() || REEL_PROMPT_DEFAULT);
    }
    if(body.voces !== undefined){
      if(!Array.isArray(body.voces)) return jsonError("voces debe ser array",400);
      await env.KV.put(REEL_VOCES_KEY, JSON.stringify(body.voces));
    }
    return jsonOk({guardado:true});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleResetVoces(env){
  try{
    await env.KV.delete(REEL_VOCES_KEY);
    return jsonOk({reseteado:true});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}

async function handleReelGuion(body,env){
  const articulo = String(body.articulo||"").trim();
  if(!articulo) return jsonError("Falta campo: articulo",400);
  const promptBase = await env.KV.get(REEL_PROMPT_KEY,"text").catch(()=>null) || REEL_PROMPT_DEFAULT;
  const r = await callGemini(promptBase + `\n\nARTÍCULO:\n${articulo.substring(0,3000)}`, env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk({titulo: r.data?.titulo||"", guion: r.data?.guion||""});
}

async function handleReelAudio(body, env) {
  const titulo  = String(body.titulo  || '').trim();
  const guion   = String(body.guion   || '').trim();
  const voiceId = String(body.voiceId || 'es-AR-TomasNeural').trim();

  if (!guion) return jsonError('Falta campo: guion', 400);

  const textoCompleto = titulo ? `${titulo}. ${guion}` : guion;

  const vocesKV = await env.KV.get(REEL_VOCES_KEY, 'json').catch(() => null) || VOCES_DEFAULT;
  const vozData = vocesKV.find(v => v.id === voiceId) || vocesKV[0] || VOCES_DEFAULT[0];
  const intentos = [vozData, ...vocesKV.filter(v => v.id !== vozData.id)];
  const errores  = [];

  for (const voz of intentos) {
    const keyName    = voz.keyAlias || 'AZURE_TTS_KEY_1';
    const regionName = voz.region   || 'AZURE_TTS_REGION_1';
    const azureKey    = String(env[keyName]    || '').trim();
    const azureRegion = String(env[regionName] || '').trim();

    if (!azureKey || !azureRegion) {
      errores.push(`${voz.nombre || voz.id}: secrets "${keyName}"/"${regionName}" no configurados`);
      continue;
    }

    const locale = localeFromVoice(voz.id);

    const ssml = titulo
      ? `<speak version="1.0" xml:lang="${locale}">
           <voice name="${escapeXml(voz.id)}">
             <prosody rate="medium">
               ${escapeXml(titulo)}
               <break time="600ms"/>
               ${escapeXml(guion)}
             </prosody>
           </voice>
         </speak>`
      : `<speak version="1.0" xml:lang="${locale}">
           <voice name="${escapeXml(voz.id)}">${escapeXml(guion)}</voice>
         </speak>`;

    try {
      const res = await fetch(
        `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
            'User-Agent': 'mm-worker',
          },
          body: ssml,
        }
      );

      if (res.status === 429) { errores.push(`${voz.nombre || voz.id}: cuota agotada`); continue; }
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        errores.push(`${voz.nombre || voz.id}: HTTP ${res.status} → ${errBody.substring(0, 200)}`);
        continue;
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength < 100) { errores.push(`${voz.nombre || voz.id}: audio vacío`); continue; }

      return new Response(buf, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(buf.byteLength),
          'Cache-Control': 'no-store',
        },
      });

    } catch (e) {
      errores.push(`${voz.nombre || voz.id}: ${e.message}`);
    }
  }

  return jsonError(`Azure TTS falló: ${errores.join(' | ')}`, 502);
}

// ============================================================
// SOCIAL — PROMPTS Y GENERACIÓN
// ============================================================

async function handleGetSocialPrompt(url,env){
  const net=url.searchParams.get("net");
  if(!net) return jsonError("Falta parámetro net",400);
  try{ const v=await env.KV.get("social:prompt:"+net,"text"); return jsonOk({prompt:v||null}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handlePostSocialPrompt(body,env){
  const net=String(body.net||"").trim();
  const prompt=String(body.prompt||"").trim();
  if(!net||!prompt) return jsonError("Faltan campos",400);
  try{ await env.KV.put("social:prompt:"+net,prompt); return jsonOk({guardado:true}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handleSocialGenerar(body,env){
  const systemPrompt=String(body.systemPrompt||"").trim();
  const userMsg=String(body.userMsg||"").trim();
  if(!systemPrompt||!userMsg) return jsonError("Faltan campos",400);
  const r=await callGemini(`${systemPrompt}\n\nResponde SOLO con JSON sin backticks ni markdown.\n\n${userMsg}`,env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk({result:r.data});
}

// ============================================================
// CONFIG WA
// ============================================================

async function handleGetWaPrompt(env){
  try{ const v=await env.KV.get(WA_PROMPT_KV_KEY,"text"); return jsonOk({prompt:v||null}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handlePostWaPrompt(body,env){
  const prompt=String(body.prompt||"").trim();
  if(!prompt) return jsonError("Falta prompt",400);
  try{ await env.KV.put(WA_PROMPT_KV_KEY,prompt); return jsonOk({guardado:true}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handleGetWaLinks(env){
  try{ const v=await env.KV.get(WA_LINKS_KV_KEY,"json"); return jsonOk({links:v||{grupo:"",canal:""}}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}
async function handlePostWaLinks(body,env){
  const links={grupo:String(body.links?.grupo||"").trim(),canal:String(body.links?.canal||"").trim()};
  try{ await env.KV.put(WA_LINKS_KV_KEY,JSON.stringify(links)); return jsonOk({guardado:true}); }
  catch(err){ return jsonError("Error KV: "+err.message,500); }
}

// ============================================================
// TITULARES / REFORMULAR / REDACTAR
// ============================================================

const ESTILOS_DESC={
  formal:`FORMATO — Periodístico formal:\n- Titular: sujeto+verbo+dato, máx 10 palabras.\n- P1: qué/quién/cuándo/dónde/cómo.\n- P2-4: orden de importancia.\n- Cierre: dato proyectivo.`,
  directo:`FORMATO — Directo:\n- Titular: máx 7 palabras.\n- 3 párrafos de 2 oraciones.`,
  ampliado:`FORMATO — Profundidad:\n- P1 hecho, P2 antecedentes, P3 datos, P4 perspectivas, P5 cierre.`,
  breaking:`FORMATO — Urgente:\n- Titular en presente, máx 8 palabras.\n- P1 hecho, P2 lo que se sabe, P3 lo que falta.`,
  cronica:`FORMATO — Crónica:\n- Titular evocador, apertura escena, protagonista, hecho, contexto, cierre.`,
  deportes:`FORMATO — Deportes:\n- Titular activo. Resultado, momentos clave, datos, próximo paso.`,
  espectaculos:`FORMATO — Espectáculos:\n- Titular llamativo. Hecho, contexto, dato curioso, qué sigue.`,
  redes:`FORMATO — Redes:\n- Titular gancho. 3 párrafos breves. Cierre que invite a compartir.`,
  institucional:`FORMATO — Comunicado:\n- Titular formal. Hecho→justificación→declaración→datos. 4 párrafos.`
};

const IMG_PROMPTS_DEFAULTS={
  // Plantillas en inglés con keywords de realismo editorial. Variables: {titulo} {contenido} {contexto}
  // Se usan como GUÍA DE ESTILO para que Gemini construya el prompt visual concreto de la escena.
  realista:"Professional photojournalism, editorial photography. Scene derived from the news headline: {titulo}. Factual context: {contexto}. {contenido}. Shot on Canon EOS R5, 50mm f/1.8, natural daylight, shallow depth of field, realistic skin texture, candid moment, balanced composition, sharp focus, high dynamic range, print-quality detail",
  dibujo:"High-quality editorial illustration, premium cartoon style. Concept from: {titulo}. Context: {contexto}. {contenido}. Vibrant flat colors, clean confident linework, dynamic composition, expressive characters, contemporary editorial illustration, The New Yorker / The Economist style",
  infografia:"Professional newspaper infographic about: {titulo}. Real data: {contexto}. {contenido}. Precise bar charts, clean line graphs, statistical visualizations, data tables, numeric indicators, modern data visualization, clean white background, Bloomberg / Financial Times style, clear typography, minimalist icons, publication quality",
  "blanco-y-negro":"Black and white documentary photography of: {titulo}. Context: {contexto}. {contenido}. High contrast, fine film grain, dramatic lighting, detailed texture, shot on Leica M6, 35mm f/2, Kodak Tri-X 400, archival documentary style, artistic composition",
  acuarela:"Watercolor painting of: {titulo}. Inspired by: {contexto}. {contenido}. Soft fluid brushstrokes, pastel palette, cold-pressed paper texture, luminous washes, contemporary fine-art watercolor, delicate edges",
  vintage:"Vintage photograph of: {titulo}. Historical context: {contexto}. {contenido}. Sepia tones, coarse grain, vignette edges, archival aesthetic, 1970s retro look, Kodak Portra 400 film texture, faded colors",
  "collage-digital":"Editorial digital collage of: {titulo}. Based on: {contexto}. {contenido}. Layered mixed textures, dynamic composition, modern magazine collage style, overlapping graphic elements, torn-paper effect, contemporary editorial design",
  minimalista:"Minimalist composition about: {titulo}. Essence: {contexto}. {contenido}. Maximum negative space, clean lines, single focal point, reduced color palette, modern premium aesthetic, Swiss design influence"
};

async function getImgPrompts(env){
  try{const v=await env.KV.get(IMG_PROMPTS_KV_KEY,"json");return v||{...IMG_PROMPTS_DEFAULTS}}catch(e){return{...IMG_PROMPTS_DEFAULTS}}
}

// ============================================================
// PROMPT VISUAL CON GEMINI
// Convierte una nota periodística (titular + cuerpo + contexto) en un prompt
// visual concreto en INGLÉS para el modelo de difusión. Devuelve
// {prompt, negative_prompt} o {error} si Gemini no responde JSON válido.
// ============================================================
async function construirPromptVisualGemini(titulo,contenido,contexto,estiloGuia,env){
  const ed=comprimirEditorial(await getEditorial(env));
  const prompt=`You are a world-class prompt engineer for AI image generation models (FLUX, SDXL).
Your job: turn a NEWS ARTICLE into a precise, vivid IMAGE GENERATION PROMPT in English.

NEWS HEADLINE: ${titulo}
ARTICLE BODY (excerpt, max 400 chars): ${contenido.substring(0,400)}
ADDITIONAL CONTEXT: ${contexto||"none"}
EDITORIAL STYLE GUIDE (use this to set the visual tone): ${estiloGuia}

RULES:
- Describe a CONCRETE, JOURNALISTICALLY PLAUSIBLE scene that illustrates the news. Name the subjects, the action, the setting, the mood.
- Do NOT invent fake quotes, fake captions or fake UI text to render inside the image.
- If the news involves real public figures, describe them generically (e.g. "a South American president in a dark suit") — never request identifiable faces or likenesses.
- Write the final image prompt in ENGLISH, one flowing paragraph, 60-120 words.
- Include photography/art direction cues ONLY when the style guide implies realism (lens, lighting, film stock, depth of field). For illustration styles, describe art technique instead.
- NEVER include text, words, letters, watermarks or signatures in the image — put those exclusions in negative_prompt.

Respond with ONLY valid JSON (no markdown, no backticks):
{"prompt":"the full image prompt in English","negative_prompt":"blurry, low quality, distorted, deformed hands, extra fingers, text, words, letters, signatures, watermarks, logos, ugly"}`;

  const r=await callGemini(prompt,env);
  if(r.error||!r.data||!r.data.prompt) return {error: r.error||"Gemini no devolvió un prompt válido"};
  // Mezclar negative_prompt por defecto con el que devuelva Gemini (defensivo)
  const neg=(r.data.negative_prompt||"").trim();
  const baseNeg="blurry, low quality, distorted, deformed hands, extra fingers, text, words, letters, signatures, watermarks, logos";
  const negative_prompt=neg?`${neg}, ${baseNeg}`:baseNeg;
  let promptText=String(r.data.prompt).trim();
  if(ed) promptText+=`\n\nEditorial tone: ${ed.substring(0,300)}`;
  return {prompt:promptText,negative_prompt};
}

async function buscarContextoWeb(query){
  try{
    const res=await fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent(query)+"&kl=es-ar",{headers:{"User-Agent":"Mozilla/5.0","Accept":"text/html"},redirect:"follow"});
    if(!res.ok) return "";
    const html=await res.text();
    const links=[...html.matchAll(/class="result__a"[^>]*href="[^"]*uddg=([^"&]+)/g)].slice(0,3).map(m=>decodeURIComponent(m[1]));
    let ctx="";
    for(const url of links.slice(0,2)){
      try{
        const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"},redirect:"follow",signal:AbortSignal.timeout(5000)});
        if(!r.ok) continue;
        const t=await r.text();
        const m=t.match(/<p[^>]*>([^<]{50,400})<\/p>/g);
        if(m) ctx+=m.slice(0,3).map(p=>p.replace(/<[^>]*>/g,"").trim()).filter(Boolean).join(". ")+". ";
      }catch(e){}
    }
    return ctx.substring(0,1000);
  }catch(e){return ""}
}

function comprimirEditorial(texto){
  if(!texto) return null;
  const lineas=texto.split('\n').map(l=>l.trim()).filter(l=>l.length>5)
    .filter(l=>!l.match(/^(Actuá como|Media Mendoza es|El enfoque|📰|🧭|✍️|🧱|📍|🚨)/))
    .filter(l=>l.startsWith('-')||l.startsWith('•')||l.match(/^(No |Usar |Incluir |Evitar |Redactar )/i))
    .slice(0,20);
  if(!lineas.length) return texto.split('\n').map(l=>l.trim()).filter(l=>l.length>10).slice(0,15).join('\n');
  return lineas.join('\n');
}

async function handleTitulares(body,env){
  const{modo,contenido,contexto="",tono="informativo",cantidad=5}=body;
  if(!modo||!contenido) return jsonError("Faltan campos",400);
  const ed=comprimirEditorial(await getEditorial(env));
  const instr=modo==="nota"?`Generá exactamente ${cantidad} titulares de este texto:\n"""\n${contenido}\n"""`:`Generá exactamente ${cantidad} titulares sobre:\n"""\n${contenido}\n"""`;
  const prompt=`Sos editor de Media Mendoza.\n${instr}\n${contexto?`\nCONTEXTO:\n${contexto}\n`:""}\nTono: ${tono}.\n${ed?`REGLAS:\n${ed}\n`:""}\nRespondé SOLO con JSON sin backticks:\n{"titulares":["T1"],"angulos":[{"nombre":"N","descripcion":"D"}]}`;
  const r=await callGemini(prompt,env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk(r.data);
}
async function handleReformular(body,env){
  const{titulo,contenido,contexto="",estilo="formal"}=body;
  if(!titulo||!contenido) return jsonError("Faltan campos",400);
  const ed=comprimirEditorial(await getEditorial(env));
  const prompt=`Sos redactor de Media Mendoza.\nReformulá completamente esta nota.\n\nTítulo original: "${titulo}"\nCuerpo:\n"""\n${contenido}\n"""\n${contexto?`\nINFO EXTRA:\n${contexto}\n`:""}\n${ESTILOS_DESC[estilo]||ESTILOS_DESC.formal}\n${ed?`\nREGLAS:\n${ed}\n`:""}\nRespondé SOLO con JSON sin backticks:\n{"titular":"","cuerpo":"P1...\n\nP2...","categoria_sugerida":"","hashtags":[]}`;
  const r=await callGemini(prompt,env);
  if(r.error) return jsonError(r.error,500);
  return jsonOk(r.data);
}
async function handleGenerarImagen(body,env){
  const{titulo,contenido,estilo="realista",modelo="",contexto_extra=""}=body;
  if(!titulo||!contenido) return jsonError("Faltan campos",400);
  const prompts=await getImgPrompts(env);
  const template=prompts[estilo]||IMG_PROMPTS_DEFAULTS.realista;

  // ── 1) Pre-procesar con Gemini: descripción visual concreta en inglés ──
  // contexto_extra = contexto visual que aporta el usuario en la UI (se suma al de la web).
  // Si Gemini falla, cae a template + reemplazo de variables (comportamiento anterior).
  const contextoWeb=await buscarContextoWeb(titulo+" "+contenido.substring(0,200));
  const contexto=[contexto_extra,contextoWeb].filter(Boolean).join(" · ")||"";
  const contextoParaTemplate=contexto||"current news";
  const fallbackPrompt=template.replace(/\{titulo\}/g,titulo).replace(/\{contenido\}/g,contenido.substring(0,400)).replace(/\{contexto\}/g,contextoParaTemplate);
  const gp=await construirPromptVisualGemini(titulo,contenido,contexto,template,env);
  const promptText=gp.error?fallbackPrompt:gp.prompt;
  const negativePrompt=gp.error?"text, words, letters, signatures, watermarks, low quality, blurry, distorted, deformed":gp.negative_prompt;
  const seed=Math.floor(Math.random()*1000000);

  // ── 2) Extraer bytes de la respuesta de env.AI.run (formato varía entre modelos) ──
  async function extraerBytesCF(result){
    if(result instanceof ArrayBuffer) return new Uint8Array(result);
    if(result instanceof ReadableStream) return new Uint8Array(await new Response(result).arrayBuffer());
    if(result&&result.body) return new Uint8Array(await new Response(result.body).arrayBuffer());
    if(result&&typeof result.image==="string"&&result.image.length>100){
      // FLUX en Workers AI devuelve {image: "<base64>"}
      const bin=atob(result.image);const u=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;
    }
    return null;
  }

  let bytes=null,modeloUsado="",motorUsado="";

  // ── MOTOR 1: FLUX-1-schnell en Cloudflare Workers AI (primario, mejor fotorrealismo, gratis) ──
  if(!bytes&&env.AI&&!modelo){
    try{
      const result=await env.AI.run('@cf/black-forest-labs/flux-1-schnell',{prompt:promptText,steps:8,seed});
      bytes=await extraerBytesCF(result);
      if(bytes){modeloUsado="flux-1-schnell";motorUsado="Cloudflare AI";}
    }catch(e){}
  }

  // ── MOTOR 2: Pollinations (secundario). 'flux' es el único modelo fiable hoy en el endpoint legacy. ──
  if(!bytes){
    const modelosPoll=modelo?[modelo]:["flux","zimage"];
    for(const m of modelosPoll){
      try{
        const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1200&height=630&model=${m}&nologo=true&seed=${seed}&negative_prompt=${encodeURIComponent(negativePrompt)}`;
        const res=await fetch(url,{signal:AbortSignal.timeout(45000)});
        if(res.ok){bytes=new Uint8Array(await res.arrayBuffer());modeloUsado=m;motorUsado="Pollinations";break}
      }catch(e){}
    }
  }

  // ── MOTOR 3: DreamShaper-8 en CF (fine-tuneado para fotorrealismo, soporta negative_prompt) ──
  if(!bytes&&env.AI&&!modelo){
    try{
      const result=await env.AI.run('@cf/lykon/dreamshaper-8',{prompt:promptText,negative_prompt:negativePrompt,steps:30,guidance:7});
      bytes=await extraerBytesCF(result);
      if(bytes){modeloUsado="dreamshaper-8";motorUsado="Cloudflare AI";}
    }catch(e){}
  }

  // ── MOTOR 4: SDXL-base en CF (último recurso) ──
  if(!bytes&&env.AI){
    try{
      const result=await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0',{prompt:promptText,negative_prompt:negativePrompt,steps:20});
      bytes=await extraerBytesCF(result);
      if(bytes){modeloUsado="sdxl-cf";motorUsado="Cloudflare AI";}
    }catch(e){}
  }

  if(!bytes) return jsonError("No se pudo generar la imagen con ningún motor disponible",502);
  let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
  const imagenB64=btoa(binary);
  // Guardar en KV para permitir edición iterativa con Kontext (toma la imagen por URL pública)
  const imgTempId=guardarImagenTemp(env,imagenB64);
  return jsonOk({imagen:imagenB64,formato:"image/jpeg",estilo_usado:estilo,modelo:modeloUsado,motor:motorUsado,prompt_gemini:gp.error?false:true,imgTempId,editable:true});
}

// ── Helpers de imagen temporal en KV (para edición iterativa con Kontext) ──
// Genera un id y guarda la imagen base64. Devuelve el id. TTL 30 min.
function guardarImagenTemp(env,imagenB64,id=null){
  const imgTempId=id||`imgtemp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  try{env.KV.put(IMGTEMP_PREFIX+imgTempId,imagenB64,{expirationTtl:IMGTEMP_TTL})}catch(e){}
  return imgTempId;
}

// GET /img-temp/{id} — sirve la imagen temporal como binario image/jpeg (público, para Kontext)
async function handleImgTemp(url,env){
  const id=url.pathname.split("/img-temp/")[1];
  if(!id) return new Response("Not found",{status:404});
  let b64=null;
  try{b64=await env.KV.get(IMGTEMP_PREFIX+id)}catch(e){}
  if(!b64) return new Response("Not found",{status:404});
  try{
    const bin=atob(b64);const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return new Response(bytes,{headers:{...CORS_HEADERS,"Content-Type":"image/jpeg","Cache-Control":"no-store"}});
  }catch(e){return new Response("Error",{status:500})}
}

// ============================================================
// EDITAR IMAGEN con Pollinations Kontext (FLUX Kontext) + fallback img2img
// POST /editar-imagen {imgTempId, instruccion}
// Refina la imagen ya generada preservando la composición. Permite iterar.
// ============================================================
async function handleEditarImagen(body,env){
  const{imgTempId,instruccion}=body;
  if(!imgTempId||!instruccion) return jsonError("Faltan imgTempId o instruccion",400);

  // Recuperar la imagen actual de KV
  let imgB64=null;
  try{imgB64=await env.KV.get(IMGTEMP_PREFIX+imgTempId)}catch(e){}
  if(!imgB64) return jsonError("La imagen expiró. Generá una nueva.",410);

  // Pre-procesar la instrucción con Gemini: traducir a inglés y enriquecer levemente
  const promptGp=await construirInstruccionEdicionGemini(instruccion,env);
  const instruccionEN=promptGp.error?instruccion:promptGp.instruccion;
  const seed=Math.floor(Math.random()*1000000);
  const imgURL=`${PUBLIC_WORKER_URL}/img-temp/${imgTempId}`;

  let bytes=null,modeloUsado="",motorUsado="";

  // ── MOTOR 1: Pollinations Kontext (FLUX Kontext, gratis) — preserva la composición ──
  try{
    const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(instruccionEN)}?model=kontext&image=${encodeURIComponent(imgURL)}&width=1200&height=630&nologo=true&seed=${seed}`;
    const res=await fetch(url,{signal:AbortSignal.timeout(60000)});
    if(res.ok){
      const buf=await res.arrayBuffer();
      // Kontext a veces responde con JSON de error aunque status sea 200
      const ct=res.headers.get("Content-Type")||"";
      if(ct.startsWith("image/")){
        bytes=new Uint8Array(buf);modeloUsado="kontext";motorUsado="Pollinations";
      }
    }
  }catch(e){}

  // ── MOTOR 2 (fallback): img2img de Cloudflare — strength bajo para preservar composición ──
  if(!bytes&&env.AI){
    try{
      // Convertir base64 → array de bytes para img2img
      const bin=atob(imgB64);const imgArr=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)imgArr[i]=bin.charCodeAt(i);
      const result=await env.AI.run('@cf/runwayml/stable-diffusion-v1-5-img2img',{
        prompt:instruccionEN,
        image:[...imgArr],
        strength:0.45,           // preserva la composición base
        num_steps:20,
        guidance:7.5,
        negative_prompt:"blurry, low quality, distorted, deformed hands, text, words, letters, watermarks, signatures"
      });
      bytes=await extraerBytesEdicion(result);
      if(bytes){modeloUsado="img2img";motorUsado="Cloudflare AI";}
    }catch(e){}
  }

  if(!bytes) return jsonError("No se pudo editar la imagen. Kontext puede estar saturado (esperá ~15s e intentá de nuevo).",502);

  let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
  const nuevaB64=btoa(binary);
  // Sobrescribir la imagen en KV sobre el MISMO id → permite seguir iterando
  guardarImagenTemp(env,nuevaB64,imgTempId);
  return jsonOk({imagen:nuevaB64,formato:"image/jpeg",modelo:modeloUsado,motor:motorUsado,imgTempId,editable:true});
}

// Extrae bytes de la respuesta de env.AI.run para img2img (formatos posibles)
async function extraerBytesEdicion(result){
  if(result instanceof ArrayBuffer) return new Uint8Array(result);
  if(result instanceof ReadableStream) return new Uint8Array(await new Response(result).arrayBuffer());
  if(result&&result.body) return new Uint8Array(await new Response(result.body).arrayBuffer());
  return null;
}

// Convierte la instrucción del usuario (español) en una instrucción de edición clara en inglés
async function construirInstruccionEdicionGemini(instruccion,env){
  const prompt=`You are editing an existing AI-generated editorial image.
The user gives an edit instruction in Spanish. Translate it into a clear, concise ENGLISH edit instruction
that a FLUX Kontext image-editing model can follow. Keep the scene; only apply the requested change.
Do NOT describe a new image from scratch. Do NOT add fake text. Max 30 words.

User instruction (Spanish): ${instruccion}

Respond with ONLY valid JSON (no markdown, no backticks):
{"instruccion":"<clear english edit instruction>"}`;

  const r=await callGemini(prompt,env);
  if(r.error||!r.data||!r.data.instruccion) return {error:r.error||"no instruction"};
  return {instruccion:String(r.data.instruccion).trim()};
}

async function handleGetImgPrompts(env){
  const prompts=await getImgPrompts(env);
  return jsonOk({prompts});
}

async function handlePostImgPrompts(body,env){
  const{realista,dibujo,infografia,"blanco-y-negro":byb,acuarela,vintage,"collage-digital":cd,minimalista}=body;
  const prompts={realista,dibujo,infografia,"blanco-y-negro":byb,acuarela,vintage,"collage-digital":cd,minimalista};
  const hasAny=Object.values(prompts).some(v=>v&&typeof v==="string"&&v.length>10);
  if(!hasAny){try{await env.KV.delete(IMG_PROMPTS_KV_KEY);return jsonOk({restaurado:true})}catch(e){return jsonError("Error: "+e.message,500)}}
  const valid=Object.values(prompts).every(v=>v&&typeof v==="string"&&v.length>10);
  if(!valid) return jsonError("Todos los estilos deben tener un prompt válido",400);
  try{await env.KV.put(IMG_PROMPTS_KV_KEY,JSON.stringify(prompts));return jsonOk({guardado:true})}
  catch(e){return jsonError("Error guardando: "+e.message,500)}
}
async function handleRedactar(body,env){
  const{ideas,buscarWeb=false}=body;
  if(!ideas) return jsonError("Falta campo: ideas",400);
  const ed=comprimirEditorial(await getEditorial(env));
  const prompt=`Sos redactor de Media Mendoza.\nRedactá una nota periodística.\n\nCONTENIDO:\n${ideas}\n\n${buscarWeb?"Buscá contexto en la web.":"Solo usá la info provista."}\n${ed?`\nREGLAS:\n${ed}\n`:""}\nRespondé SOLO con JSON sin backticks:\n{"titular":"","bajada":"","cuerpo":"P1...\n\nP2...","categoria_sugerida":"","hashtags":[],"fuentes":[]}`;
  const r=await callGemini(prompt,env,buscarWeb);
  if(r.error) return jsonError(r.error,500);
  return jsonOk(r.data);
}

// ============================================================
// AGENDA
// ============================================================

async function handleGetAgendaEfemerides(env){
  try{const e=await listarObjetosKV(env,AGENDA_EF_PREFIX);e.sort((a,b)=>a.mes-b.mes||a.dia-b.dia);return jsonOk({efemerides:e})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostAgendaEfemeride(body,env){
  const titulo=String(body.titulo||"").trim();const dia=parseInt(body.dia)||0;const mes=parseInt(body.mes)||0;
  if(!titulo||!dia||!mes||dia<1||dia>31||mes<1||mes>12) return jsonError("Faltan campos válidos",400);
  const ef={id:body.id||generarId("ef_"),titulo,tituloBase:body.tituloBase||titulo,dia,mes,tipo:String(body.tipo||"efemeride").trim(),alcance:String(body.alcance||"local").trim(),descripcion:String(body.descripcion||"").trim(),creado:body.creado||Date.now()};
  try{await env.KV.put(`${AGENDA_EF_PREFIX}${ef.id}`,JSON.stringify(ef));return jsonOk({guardado:true,id:ef.id,efemeride:ef})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteAgendaEfemeride(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("Falta id",400);
  try{await env.KV.delete(`${AGENDA_EF_PREFIX}${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetAngulosCache(url,env){
  const key=String(url.searchParams.get("key")||"").trim();if(!key) return jsonError("Falta key",400);
  try{const v=await env.KV.get(ANGULOS_PREFIX+key,"json");return jsonOk({data:v||null})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleAgendaAngulos(body,env){
  const titulo=String(body.titulo||"").trim();if(!titulo) return jsonError("Falta titulo",400);
  const kvKey=String(body.kvKey||"").trim();
  if(kvKey){try{const c=await env.KV.get(ANGULOS_PREFIX+kvKey,"json");if(c) return jsonOk({...c,fromCache:true})}catch(e){}}
  const prompt=`Sos editor de agenda de Media Mendoza.\nEVENTO:\nTitulo: ${titulo}\nDescripcion: ${String(body.descripcion||"").trim()}\nFecha: ${String(body.fecha||"").trim()}\nTipo: ${String(body.tipo||"").trim()}\n\nResponde SOLO con JSON sin backticks:\n{"angulos":["a1"],"preguntas":["p1"],"fuentes_sugeridas":["f1"],"consejo":""}`;
  const r=await callGemini(prompt,env);if(r.error) return jsonError(r.error,500);
  const data={angulos:Array.isArray(r.data?.angulos)?r.data.angulos:[],preguntas:Array.isArray(r.data?.preguntas)?r.data.preguntas:[],fuentes_sugeridas:Array.isArray(r.data?.fuentes_sugeridas)?r.data.fuentes_sugeridas:[],consejo:String(r.data?.consejo||"").trim()};
  if(kvKey){try{await env.KV.put(ANGULOS_PREFIX+kvKey,JSON.stringify(data),{expirationTtl:ANGULOS_TTL})}catch(e){}}
  return jsonOk(data);
}
async function handleGetAgendaEventos(url,env){
  try{const mes=String(url.searchParams.get("mes")||"").trim();let ev=await listarObjetosKV(env,AGENDA_EV_PREFIX);if(mes)ev=ev.filter(e=>String(e.fecha||"").startsWith(mes));ev.sort((a,b)=>String(a.fecha||"").localeCompare(String(b.fecha||""))||String(a.hora||"").localeCompare(String(b.hora||"")));return jsonOk({eventos:ev})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostAgendaEvento(body,env){
  const titulo=String(body.titulo||"").trim();const fecha=String(body.fecha||"").trim();
  if(!titulo||!fecha) return jsonError("Faltan campos",400);
  const ev={id:body.id||generarId("ag_"),titulo,fecha,hora:String(body.hora||"").trim(),tipo:String(body.tipo||"evento").trim(),alcance:String(body.alcance||"local").trim(),descripcion:String(body.descripcion||"").trim(),periodista:String(body.periodista||"").trim(),creado:body.creado||Date.now()};
  try{await env.KV.put(`${AGENDA_EV_PREFIX}${ev.id}`,JSON.stringify(ev));return jsonOk({guardado:true,id:ev.id,evento:ev})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteAgendaEvento(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("Falta id",400);
  try{await env.KV.delete(`${AGENDA_EV_PREFIX}${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// SCRAPING / PLACAS
// ============================================================

async function handleScrape(url){
  const targetUrl=url.searchParams.get("url");if(!targetUrl) return jsonError("url requerida",400);
  try{new URL(targetUrl)}catch{return jsonError("URL inválida",400)}
  try{
    const{html}=await fetchHtml(targetUrl,300);
    const data=extraerDatosNota(html,targetUrl);
    const titulo=data.title||"";
    const texto=data.body;
    if(!texto||texto.length<100) return jsonError("No se pudo extraer contenido",422);
    return jsonOk({titulo,categoria:data.category||"",descripcion:data.description||"",texto,imagen:data.image||'',imagenes:data.images||[],url:targetUrl});
  }catch(err){return jsonError(`Error scrapeando: ${err.message}`,502)}
}
async function handlePlacasUrl(url){
  const targetUrl=url.searchParams.get("url");if(!targetUrl) return jsonError("url requerida",400);
  try{new URL(targetUrl)}catch{return jsonError("URL inválida",400)}
  try{const{html}=await fetchHtml(targetUrl,300);const data=extraerDatosNota(html,targetUrl);if(!data.title&&!data.body) return jsonError("No se pudo extraer contenido",422);return jsonOk(data)}
  catch(err){return jsonError(`Error: ${err.message}`,502)}
}
async function handlePlacasImage(url){
  const imageUrl=url.searchParams.get("image");if(!imageUrl) return jsonError("image requerida",400);
  try{new URL(imageUrl)}catch{return jsonError("URL inválida",400)}
  try{
    const res=await fetch(imageUrl,{headers:{"User-Agent":BROWSER_HEADERS["User-Agent"],"Accept":"image/*"},redirect:"follow",cf:{cacheTtl:3600,cacheEverything:true}});
    if(!res.ok) return jsonError(`Error ${res.status}`,502);
    const ct=res.headers.get("Content-Type")||"application/octet-stream";
    if(!ct.startsWith("image/")) return jsonError("No es imagen",422);
    const cl=Number(res.headers.get("Content-Length")||"0");
    if(cl&&cl>MAX_PROXY_IMAGE_BYTES) return jsonError("Imagen muy pesada",413);
    return new Response(res.body,{headers:{...CORS_HEADERS,"Content-Type":ct,"Cache-Control":"public, max-age=3600"}});
  }catch(err){return jsonError(`Error: ${err.message}`,502)}
}
async function handlePlacasAI(request,env,body){
  const system=String(body.system||"").trim();const user=String(body.user||"").trim();
  if(!system||!user) return jsonError("Faltan campos",400);
  const r=await callGemini(`${system}\n\nResponde SOLO con JSON sin backticks:\n{"grupo":"...","canal":"..."}\n\n${user}`,env);
  if(r.error) return jsonError(r.error,500);
  const grupo=limpiarEspacios(r.data?.grupo||"");const canal=limpiarEspacios(r.data?.canal||"");
  if(!grupo&&!canal) return jsonError("IA no devolvió mensajes",502);
  return jsonOk({text:JSON.stringify({grupo,canal})});
}

// ============================================================
// PROCESAR IMÁGENES (placas, banners, flyers) con Gemini Vision
// ============================================================

async function handleProcesarImagenes(request, env) {
  try {
    const formData = await request.formData();
    const imageFiles = [];
    for (const [, value] of formData.entries()) {
      if (value instanceof File && value.type && value.type.startsWith('image/')) {
        imageFiles.push(value);
      }
    }
    if (imageFiles.length === 0) {
      return jsonError("No se recibieron imágenes", 400);
    }
    const VISION_MODELS = [
      GEMINI_MODEL,
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];
    const keys = [env.GEMINI_KEY_1, env.GEMINI_KEY_2, env.GEMINI_KEY_3, env.GEMINI_KEY_4, env.GEMINI_KEY_5, env.GEMINI_API_KEY].filter(Boolean);
    if (!keys.length) return jsonError("No hay API keys de Gemini configuradas", 500);
    const maxImages = Math.min(imageFiles.length, 5);
    const results = [];
    const errores = [];
    for (let i = 0; i < maxImages; i++) {
      const file = imageFiles[i];
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let j = 0; j < bytes.length; j++) binary += String.fromCharCode(bytes[j]);
      const base64 = btoa(binary);
      const mimeType = file.type;
      const prompt = `Extraé TODO el texto e información visible de esta imagen periodística (placa, banner, flyer, afiche).
Respondé SOLO con JSON sin backticks:
{"texto_extraido": "todo el texto que se ve en la imagen", "descripcion": "qué tipo de imagen es y qué información contiene"}`;
      let procesado = false;
      for (const model of VISION_MODELS) {
        for (const key of keys) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 1024 } }) });
            if (res.ok) {
              const data = await res.json();
              const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const match = raw.match(/\{[\s\S]*\}/);
              if (match) { try { const p = JSON.parse(match[0]); results.push(p); } catch(e) { results.push({ texto_extraido: raw.substring(0, 2000), descripcion: '' }); } }
              else { results.push({ texto_extraido: raw.substring(0, 2000), descripcion: '' }); }
              procesado = true;
              break;
            } else if (res.status === 429) { await sleep(2000); continue; }
            else {
              const errText = await res.text().catch(() => '');
              errores.push(`${model}: HTTP ${res.status} ${errText.substring(0, 200)}`);
              continue;
            }
          } catch(e) { errores.push(`${model}: ${e.message}`); continue; }
        }
        if (procesado) break;
      }
      if (!procesado) {
        errores.push(`No se pudo procesar imagen ${i+1} con ningún modelo`);
      }
    }
    const textos = results.map(r => r.texto_extraido).filter(Boolean);
    const descripciones = results.map(r => r.descripcion).filter(Boolean);
    let textoCombinado = textos.join('\n\n---\n\n');
    let tituloSugerido = '';
    if (textoCombinado.length > 30) {
      const tPrompt = `Basado en este texto extraído de una imagen, generá un título corto para nota periodística (máx 10 palabras):\n"""\n${textoCombinado.substring(0, 600)}\n"""\nRespondé SOLO con el título, sin comillas ni JSON.`;
      for (const key of keys) {
        try {
          const res = await fetch(`${GEMINI_URL}?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: tPrompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 50 } }) });
          if (res.ok) { const d = await res.json(); tituloSugerido = (d?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().replace(/^["']|["']$/g, ''); break; }
        } catch(e) { continue; }
      }
    }
    const response = { imagenes_procesadas: results.length, total_imagenes: imageFiles.length, titulo: tituloSugerido, texto: textoCombinado, descripcion: descripciones.join('; ') };
    if (errores.length) response.errores = errores.slice(0, 5);
    return jsonOk(response);
  } catch (err) {
    return jsonError("Error procesando imágenes: " + err.message, 500);
  }
}

// ============================================================
// EDITORIAL / FUENTES / NOTAS / CUBIERTAS
// ============================================================

async function handleGetEditorial(env){
  try{const v=await env.KV.get(EDITORIAL_KV_KEY,"json");return jsonOk({editorial:v||{prompt:"",activo:false}})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostEditorial(body,env){
  if(typeof body.prompt==="undefined") return jsonError("Falta prompt",400);
  try{await env.KV.put(EDITORIAL_KV_KEY,JSON.stringify({prompt:body.prompt.trim(),activo:!!body.activo}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetFuentes(env){
  try{const list=await env.KV.list({prefix:"fuente:"});const fuentes=[];for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)fuentes.push(v)}fuentes.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));return jsonOk({fuentes})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostFuente(body,env){
  const{id,nombre,url,clase}=body;if(!id||!nombre||!url) return jsonError("Faltan campos",400);
  try{await env.KV.put(`fuente:${id}`,JSON.stringify({id,nombre,url,clase:clase||"custom"}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteFuente(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("id requerido",400);
  try{await env.KV.delete(`fuente:${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetNotas(env){
  try{const list=await env.KV.list({prefix:"nota:"});const notas=[];for(const k of list.keys){const v=await env.KV.get(k.name,"json");if(v)notas.push(v)}notas.sort((a,b)=>(b.fecha||0)-(a.fecha||0));return jsonOk({notas})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostNota(body,env){
  const{id,titular,cuerpo,categoria,hashtags,imagen,fecha}=body;if(!id||!titular) return jsonError("Faltan campos",400);
  try{await env.KV.put(`nota:${id}`,JSON.stringify({id,titular,cuerpo,categoria,hashtags,imagen:imagen||'',fecha:fecha||Date.now()}));return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteNota(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("id requerido",400);
  try{await env.KV.delete(`nota:${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetCubiertas(env){
  try{const list=await env.KV.list({prefix:"cubierta:"});return jsonOk({links:list.keys.map(k=>k.name.replace("cubierta:",""))})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostCubierta(body,env){
  const{link,cubierta}=body;if(!link) return jsonError("Falta link",400);
  try{const key="cubierta:"+link.substring(0,400);if(cubierta)await env.KV.put(key,"1",{expirationTtl:60*60*24*30});else await env.KV.delete(key);return jsonOk({guardado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// WHATSAPP
// ============================================================

const WA_PROMPT_DEFECTO=`Sos editor de redes sociales de Media Mendoza, diario digital del sur de Mendoza, Argentina.
Transformá esta noticia en dos mensajes de WhatsApp. Español rioplatense. Emojis estratégicos.

FORMATO "grupo": [emoji] *[LOCALIDAD/CATEGORÍA]:* [titular]
[2-3 líneas clave con *negritas*] 👇
🔗 *DETALLES:* 👉 {URL}
📱 {LINK_GRUPO} 📣 {LINK_CANAL}
*📰 Media Mendoza*

FORMATO "canal": [emoji] *[CATEGORÍA]:* [titular]
• [punto 1]
• [punto 2]
• [punto 3]
🔗 👉 {URL}
*📰 Media Mendoza*

REGLAS: negritas solo en datos clave, NO **, emojis: policiales=🚨 deportes=⚽ política=🏛️ accidente=🚗 salud=🏥 general=📢`;

async function handleWhatsappGenerar(body,env){
  const notaUrl=String(body.notaUrl||"").trim();
  const contextoExtra=String(body.contextoExtra||"").trim();
  let nota={titulo:String(body.titulo||"").trim(),categoria:String(body.categoria||"").trim(),descripcion:"",body:String(body.contenido||"").trim(),url:notaUrl,urlCorta:notaUrl?acortarUrlNota(notaUrl):"",image:""};
  if(notaUrl){
    try{new URL(notaUrl)}catch{return jsonError("URL inválida",400)}
    try{
      const{html}=await fetchHtml(notaUrl,300);
      const s=extraerDatosNota(html,notaUrl);
      nota={titulo:s.title||nota.titulo,categoria:s.category||nota.categoria,descripcion:s.description||"",body:s.body||nota.body,url:notaUrl,urlCorta:acortarUrlNota(notaUrl),image:s.image||""};
    }catch(err){return jsonError(`No se pudo obtener la nota: ${err.message}`,502)}
  }
  if(!nota.titulo&&!nota.body) return jsonError("Falta notaUrl o contenido",400);
  let pt=WA_PROMPT_DEFECTO;
  try{const p=await env.KV.get(WA_PROMPT_KV_KEY,"text");if(p)pt=p}catch(e){}
  let links={grupo:"https://bit.ly/mediamendoza-grupo",canal:"https://bit.ly/mediamendoza-canal"};
  try{const l=await env.KV.get(WA_LINKS_KV_KEY,"json");if(l){if(l.grupo)links.grupo=l.grupo;if(l.canal)links.canal=l.canal}}catch(e){}
  const localidades=["San Rafael","General Alvear","Malargüe","Alvear"];
  const localidad=localidades.find(l=>(nota.titulo+nota.body).includes(l))||"San Rafael";
  const urlFinal=nota.urlCorta||nota.url||"";
  const pf=pt.replace(/\{URL\}/g,urlFinal).replace(/\{LINK_GRUPO\}/g,links.grupo).replace(/\{LINK_CANAL\}/g,links.canal).replace(/\{TITULO\}/g,nota.titulo||"Sin titulo").replace(/\{CATEGORIA\}/g,nota.categoria||"General").replace(/\{LOCALIDAD\}/g,localidad).replace(/\{CONTENIDO\}/g,(nota.body||"").substring(0,1500));
  const nd=pt.includes("{CONTENIDO}")?"" :`\n\nNOTICIA:\nTítulo: ${nota.titulo}\nCategoría: ${nota.categoria||"General"}\nLocalidad: ${localidad}\nContenido: ${(nota.body||"").substring(0,1500)}\nURL: ${urlFinal}`;
  const prompt=`${pf}${nd}${contextoExtra?`\nContexto extra: ${contextoExtra}`:""}\n\nRespondé SOLO con JSON sin backticks: {"grupo":"...","canal":"..."}`;
  const r=await callGemini(prompt,env);
  if(r.error) return jsonError(r.error,500);
  const grupo=(r.data?.grupo||"").trim();const canal=(r.data?.canal||"").trim();
  if(!grupo||!canal) return jsonError("IA no devolvió ambos mensajes",502);
  return jsonOk({nota:{titulo:nota.titulo||"Sin titulo",url:nota.url||"",urlCorta:urlFinal,imagen:nota.image||""},categoria:nota.categoria||"General",grupo,canal});
}
async function handlePostWhatsappProgramar(body,env){
  if(!body?.fecha) return jsonError("Falta fecha",400);
  const item={id:body.id||generarId("wp_"),fecha:Number(body.fecha),fechaLegible:body.fechaLegible||"",tituloNota:String(body.tituloNota||"").trim(),urlCorta:String(body.urlCorta||"").trim(),canales:Array.isArray(body.canales)?body.canales.filter(Boolean):[],textoGrupo:String(body.textoGrupo||"").trim(),textoCanal:String(body.textoCanal||"").trim(),categoria:String(body.categoria||"General").trim(),enviado:!!body.enviado,creado:body.creado||Date.now()};
  if(!item.canales.length) return jsonError("Falta canal",400);
  try{await env.KV.put(`${WHATSAPP_PREFIX}${item.id}`,JSON.stringify(item));return jsonOk({guardado:true,id:item.id})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleGetWhatsappProgramados(env){
  try{const p=await listarObjetosKV(env,WHATSAPP_PREFIX);p.sort((a,b)=>(a.fecha||0)-(b.fecha||0));return jsonOk({programados:p})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handlePostWhatsappMarcarEnviado(body,env){
  const id=String(body.id||"").trim();if(!id) return jsonError("Falta id",400);
  try{
    const key=`${WHATSAPP_PREFIX}${id}`;const actual=await env.KV.get(key,"json");
    if(!actual) return jsonError("Mensaje no encontrado",404);
    await env.KV.put(key,JSON.stringify({...actual,estado:"enviado",enviado:true}));
    return jsonOk({guardado:true,id});
  }catch(err){return jsonError("Error KV: "+err.message,500)}
}
async function handleDeleteWhatsappProgramado(url,env){
  const id=url.searchParams.get("id");if(!id) return jsonError("id requerido",400);
  try{await env.KV.delete(`${WHATSAPP_PREFIX}${id}`);return jsonOk({eliminado:true})}
  catch(err){return jsonError("Error KV: "+err.message,500)}
}

// ============================================================
// RSS / VERIFICAR
// ============================================================

async function handleRSS(url){
  const feedUrl=url.searchParams.get("url");if(!feedUrl) return jsonError("url requerida",400);
  try{new URL(feedUrl)}catch{return jsonError("URL inválida",400)}
  try{
    const res=await fetch(feedUrl,{headers:{...BROWSER_HEADERS,'Accept-Encoding':'identity'},redirect:"follow",cf:{cacheTtl:180,cacheEverything:true}});
    if(!res.ok) return jsonError(`Feed error ${res.status}`,502);
    const text=await res.text();
    if(!esXMLvalido(text)) return jsonError("No es feed RSS válido",422);
    return new Response(text,{headers:{...CORS_HEADERS,"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=180"}});
  }catch(err){return jsonError(`Error feed: ${err.message}`,502)}
}
async function handleVerificar(url){
  const feedUrl=url.searchParams.get("url");if(!feedUrl) return jsonError("url requerida",400);
  try{new URL(feedUrl)}catch{return jsonError("URL inválida",400)}
  try{
    const res=await fetch(feedUrl,{headers:{...BROWSER_HEADERS,'Accept-Encoding':'identity'},redirect:"follow"});
    if(!res.ok) return jsonError(`Feed error ${res.status}`,502);
    const text=await res.text();
    if(!esXMLvalido(text)) return jsonError("No es feed RSS válido",422);
    const tm=text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const nombre=tm?tm[1].replace(/\s+/g,' ').trim().substring(0,80):'Feed RSS';
    const itemCount=(text.match(/<item[\s>]/g)||[]).length+(text.match(/<entry[\s>]/g)||[]).length;
    return jsonOk({valido:true,nombre,items:itemCount});
  }catch(err){return jsonError(`Error: ${err.message}`,502)}
}

// ============================================================
// GEMINI
// ============================================================

async function getEditorial(env){
  try{const v=await env.KV.get(EDITORIAL_KV_KEY,"json");if(v&&v.activo&&v.prompt) return v.prompt}catch(e){}
  return null;
}

async function callGemini(prompt,env,searchEnabled=false,expectJson=true,modelOverride=null){
  const keys=[env.GEMINI_KEY_1,env.GEMINI_KEY_2,env.GEMINI_KEY_3,env.GEMINI_KEY_4,env.GEMINI_KEY_5].filter(Boolean);
  if(!keys.length) return {error:"No hay API keys de Gemini configuradas"};
  // La API REST de Gemini requiere camelCase (googleSearch)
  const makeBody=s=>{const b={contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.4,maxOutputTokens:8000}};if(s)b.tools=[{googleSearch:{}}];return b};
  
  let lastError = "Todas las API keys están agotadas u ocurrió un error desconocido.";
  const modelToUse = modelOverride || GEMINI_MODEL;
  const geminiUrl = GEMINI_URL.replace(GEMINI_MODEL, modelToUse);
  
  for(let i=0;i<keys.length;i++){
    for(let intento=1;intento<=2;intento++){
      try{
        const body=makeBody(searchEnabled);
        const res=await fetch(`${geminiUrl}?key=${keys[i]}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
        
        if(!res.ok){
          const errBody=await res.text().catch(()=>'');
          if(res.status===429){
            lastError = `HTTP 429 (Rate Limit / Quota Exceeded) para la key ${i+1}.`;
            return {error: lastError}; // Abortar: si una key da 429, todas van a dar 429 (misma IP/proyecto)
          }
          if(res.status===400){
            if(searchEnabled){
              // Tool no soportado por este modelo, reintentar sin search
              searchEnabled=false; intento=0; continue;
            }
            lastError = `HTTP 400 (Bad Request): ${errBody.substring(0,200)}`;
            return {error: lastError};
          }
          if(res.status===403){
             lastError = `HTTP 403 (Forbidden/Quota): ${errBody.substring(0,200)}`;
             break; // Intenta otra key
          }
          if(res.status>=500){
             lastError = `HTTP ${res.status} (Gemini Down): ${errBody.substring(0,200)}`;
             if(intento<2){await sleep(3000);continue}else break;
          }
          lastError = `HTTP Error ${res.status}: ${errBody.substring(0,200)}`;
          break;
        }
        
        const data=await res.json();
        const candidate=data?.candidates?.[0];
        if(!candidate){
          lastError = "No candidate: " + JSON.stringify(data);
          return {error: lastError};
        }
        
        const raw=candidate?.content?.parts?.[0]?.text||"";
        if(!raw){
           lastError = "No text: " + JSON.stringify(candidate);
           return {error: lastError};
        }
        
        if(!expectJson) return {data: raw};
        
        let parsed;
        try{parsed=JSON.parse(raw)}catch{
          const match=raw.match(/\{[\s\S]*\}/);
          if(!match){
             lastError = "Regex match failed. Raw: " + raw;
             return {error: lastError};
          }
          try{parsed=JSON.parse(match[0])}catch{
             lastError = "JSON parse failed on match. Raw: " + raw;
             return {error: lastError};
          }
        }
        return {data:parsed};
      }catch(err){
        lastError = `Excepción JS: ${err.message}`;
        if(intento<2) await sleep(3000);
      }
    }
  }
  return {error: lastError};
}

// ============================================================
// MÚSICA DE FONDO - FREESOUND API
// ============================================================

async function handleMusicSearch(url, env) {
  const query = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const perPage = parseInt(url.searchParams.get('per_page')) || 12;
  const apiKey = env.FREESOUND_API_KEY;

  if (!apiKey) {
    return jsonError('API key de Freesound no configurada', 500);
  }

  const apiUrl = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&page=${page}&page_size=${perPage}&fields=id,name,username,previews,duration&token=${apiKey}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data.results) {
      return jsonError('Error en búsqueda de Freesound', 500);
    }

    const tracks = data.results.map(track => {
      const previewUrl = track.previews?.["preview-hq-mp3"] || 
                         track.previews?.["preview-lq-mp3"];
      
      if (!previewUrl) {
        return null;
      }
      
      return {
        id: track.id,
        title: track.name || 'Sin título',
        duration: track.duration || 30,
        artist: track.username || 'Artista Freesound',
        preview_url: previewUrl,
        audio_url: previewUrl,
        attribution: `🎵 Sonido: "${track.name || 'Sin título'}" por ${track.username || 'Artista Freesound'} (Freesound.org)`
      };
    }).filter(t => t !== null);

    return jsonOk({ tracks, total: data.count || 0 });
  } catch (err) {
    console.error('Error en handleMusicSearch:', err);
    return jsonError(`Error: ${err.message}`, 500);
  }
}

async function handleMusicPreview(url, env) {
  const audioUrl = url.searchParams.get('url');
  if (!audioUrl) {
    return jsonError('Falta parámetro url', 400);
  }

  try {
    const res = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'https://freesound.org/',
        'Origin': 'https://freesound.org'
      }
    });
    
    if (!res.ok) {
      return jsonError(`Error en proxy: ${res.status}`, 502);
    }
    
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('Error en handleMusicPreview:', err);
    return jsonError(`Error: ${err.message}`, 500);
  }
}
// ============================================================
// VIDEO EDITOR - PROCESAMIENTO ASÍNCRONO CON COLA (QUEUE)
// ============================================================

async function handleVideoEditorTranscribirAsync(request, env) {
  if (!env.AI) {
    return jsonError("Cloudflare AI no está configurado", 500);
  }

  try {
    const formData = await request.formData();
    let audioFile = formData.get('audio');
    if (!audioFile) audioFile = formData.get('file');
    
    if (!audioFile) {
      return jsonError("Falta archivo de audio", 400);
    }

    console.log('[async] Audio recibido:', audioFile.name, audioFile.size);
    
    // Limitar tamaño a 25MB (límite de R2 free tier)
    if (audioFile.size > 25 * 1024 * 1024) {
      return jsonError("El audio es demasiado grande. Máximo 25MB.", 400);
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const jobId = generarId('transc');
    const r2Key = `audio-transcripcion/${jobId}.wav`;
    
    // Guardar en R2
    await env.R2.put(r2Key, audioBuffer, {
      httpMetadata: { contentType: 'audio/wav' }
    });
    
    console.log(`[async] Audio guardado en R2: ${r2Key}`);
    
    // Enviar mensaje a la cola (en lugar de ejecutar procesarAudioAsync)
    await env.transcription_queue.send({
      jobId: jobId,
      r2Key: r2Key
    });
    console.log(`📤 Mensaje enviado a la cola para job: ${jobId}`);
    
    return jsonOk({ 
      jobId: jobId, 
      estado: 'procesando',
      mensaje: 'La transcripción se está procesando'
    });
    
  } catch (err) {
    console.error('Error al iniciar transcripción:', err);
    return jsonError("Error al iniciar: " + err.message, 500);
  }
}

async function handleVideoEditorEstado(url, env) {
  const jobId = url.searchParams.get('id');
  if (!jobId) {
    return jsonError("Falta parámetro id", 400);
  }
  
  try {
    const data = await env.KV.get(`transc:${jobId}`, 'json');
    if (!data) {
      return jsonError("Job no encontrado", 404);
    }
    return jsonOk(data);
  } catch (err) {
    return jsonError("Error obteniendo estado: " + err.message, 500);
  }
}

// ============================================================
// CONSUMIDOR DE LA COLA (transcription-queue)
// ============================================================

async function queue(batch, env) {
  console.log(`📦 Procesando lote de ${batch.messages.length} mensajes`);
  
  for (const msg of batch.messages) {
    const { jobId, r2Key } = msg.body;
    console.log(`🎯 Procesando job: ${jobId}, r2Key: ${r2Key}`);
    
    try {
      // Actualizar estado: procesando
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: 'procesando',
        progreso: 10,
        mensaje: 'Descargando audio...'
      }), { expirationTtl: 3600 });
      
      // Obtener audio de R2
      const audioObject = await env.R2.get(r2Key);
      if (!audioObject) throw new Error('Audio no encontrado en R2');
      
      const audioBuffer = await audioObject.arrayBuffer();
      console.log(`📊 [${jobId}] Audio recuperado: ${audioBuffer.byteLength} bytes`);
      
      if (audioBuffer.byteLength < 1000) {
        throw new Error(`Audio demasiado pequeño: ${audioBuffer.byteLength} bytes`);
      }
      
      const audioArray = [...new Uint8Array(audioBuffer)];
      
      // Actualizar estado: transcribiendo
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: 'procesando',
        progreso: 30,
        mensaje: 'Transcribiendo con IA...'
      }), { expirationTtl: 3600 });
      
      console.log(`🟡 [${jobId}] Llamando a Whisper...`);
      
      const response = await env.AI.run('@cf/openai/whisper', {
        audio: audioArray
      });
      
      console.log(`✅ [${jobId}] Whisper respondió`);
      
      let texto = response.text || '';
      let segments = [];
      let words = [];
      
      if (response.words && Array.isArray(response.words)) {
        words = response.words;
        const groupSize = 6;
        for (let i = 0; i < words.length; i += groupSize) {
          const group = words.slice(i, i + groupSize);
          segments.push({
            start: group[0].start,
            end: group[group.length - 1].end,
            text: group.map(w => w.word).join(' ')
          });
        }
      } else if (texto) {
        segments = [{ start: 0, end: 30, text: texto }];
      }
      
      const oraciones = procesarSegmentosAOraciones(segments);
      
      // Guardar resultado en KV
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: 'completado',
        progreso: 100,
        texto: texto,
        segments: segments,
        oraciones: oraciones,
        word_count: words.length || texto.split(/\s+/).length
      }), { expirationTtl: 3600 });
      
      // Limpiar R2
      await env.R2.delete(r2Key);
      
      console.log(`✅ Job ${jobId} completado`);
      
      // Marcar mensaje como exitoso
      msg.ack();
      
    } catch (err) {
      console.error(`❌ Error en job ${jobId}:`, err);
      
      await env.KV.put(`transc:${jobId}`, JSON.stringify({
        estado: 'error',
        error: err.message
      }), { expirationTtl: 3600 });
      
      // Reintentar el mensaje (hasta 3 veces)
      if (msg.attempts < 3) {
        console.log(`🔄 Reintentando job ${jobId}, intento ${msg.attempts + 1}`);
        msg.retry();
      } else {
        console.log(`❌ Job ${jobId} descartado después de ${msg.attempts} intentos`);
        msg.ack(); // Descartar después de 3 intentos
      }
    }
  }
}
// ============================================================
// DIAGNÓSTICO - Verificar bindings del worker
// ============================================================

async function handleDiagnostico(env) {
  const hasAI = !!env.AI;
  const hasKV = !!env.KV;
  const hasR2 = !!env.R2;
  const hasQueue = !!env.transcription_queue;
  
  let aiStatus = 'no disponible';
  let whisperTest = null;
  
  if (hasAI) {
    aiStatus = 'binding AI presente';
    // Probar Whisper con un audio de prueba mínimo
    try {
      // Crear un audio de prueba (1 segundo de silencio)
      const testAudio = new Uint8Array(16000 * 2); // 1 segundo a 16kHz, 16-bit
      const result = await env.AI.run('@cf/openai/whisper', {
        audio: [...testAudio]
      });
      whisperTest = 'funciona correctamente';
    } catch (e) {
      whisperTest = `error: ${e.message}`;
    }
  }
  
  return jsonOk({
    ai_disponible: hasAI,
    kv_disponible: hasKV,
    r2_disponible: hasR2,
    queue_disponible: hasQueue,
    ai_status: aiStatus,
    whisper_test: whisperTest,
    football_data_key: !!env.FOOTBALL_DATA_API_KEY,
    api_football_key: !!env.API_FOOTBALL_KEY,
    mensaje: hasAI ? "✅ AI configurado correctamente" : "❌ AI NO está configurado en este worker"
  });
}

async function handleMundialIDs(env) {
  const apiKey = env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ok:false,error:"Sin API key"}), {status:400,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  }
  
  try {
    const res = await fetch("https://api.football-data.org/v4/competitions", {
      headers: { 'X-Auth-Token': apiKey }
    });
    
    const data = await res.json();
    
    const mundiales = data.competitions
      .filter(c => c.name.toLowerCase().includes('world') || c.name.toLowerCase().includes('fifa'))
      .map(c => ({
        id: c.id,
        nombre: c.name,
        inicio: c.currentSeason?.startDate,
        fin: c.currentSeason?.endDate
      }));
    
    return new Response(JSON.stringify({ok:true,mundiales}), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:err.message}), {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
  }
}


// ============================================================
// ROUTER PRINCIPAL
// ============================================================

export default {
  async fetch(request, env) {
    if(request.method==="OPTIONS") return new Response(null,{headers:CORS_HEADERS});
    const url=new URL(request.url);
    const path=url.pathname;

    // ── GET ──
    if(request.method==="GET"){
      if(path==="/"&&url.searchParams.has("url"))    return handlePlacasUrl(url);
      if(path==="/"&&url.searchParams.has("image"))  return handlePlacasImage(url);
      if(path==="/rss")                              return handleRSS(url);
      if(path==="/verificar")                        return handleVerificar(url);
      if(path==="/scrape")                           return handleScrape(url);
      if(path==="/fuentes")                          return handleGetFuentes(env);
      if(path==="/editorial")                        return handleGetEditorial(env);
      if(path==="/img-prompts")                      return handleGetImgPrompts(env);
      if(path==="/cubiertas")                        return handleGetCubiertas(env);
      if(path==="/notas")                            return handleGetNotas(env);
      if(path==="/whatsapp/programados")             return handleGetWhatsappProgramados(env);
      if(path==="/whatsapp/config/prompt")           return handleGetWaPrompt(env);
      if(path==="/whatsapp/config/links")            return handleGetWaLinks(env);
      if(path==="/social/prompt")                    return handleGetSocialPrompt(url,env);
      if(path==="/social/reel/config")               return handleGetReelConfig(env);
      if(path==="/social/reel/reset-voces")          return handleResetVoces(env);
      if(path==="/agenda/eventos")                   return handleGetAgendaEventos(url,env);
      if(path==="/agenda/efemerides")                return handleGetAgendaEfemerides(env);
      if(path==="/placas/v2/efemerides")             return handlePlacasV2Efemerides(url, env);
      if(path==="/agenda/angulos/cache")             return handleGetAngulosCache(url,env);
      if(path==="/resumen/obtener")                  return handleResumenObtener(url, env);
      if(path==="/studio/proyectos")                 return handleStudioObtenerProyectos(env);
      if(path==="/music/search")                     return handleMusicSearch(url, env);
      if(path==="/music/preview")                    return handleMusicPreview(url, env);
      if(path==="/test-ai")                          return handleTestAI(env);
      if(path.startsWith("/img-temp/"))               return handleImgTemp(url,env);
      if(path==="/smn/weather")                      return handleSMNWeather(url, env);
      if(path==="/smn/icon")                         return handleSMNIcon(url, env);
      if(path==="/mundo/placa-manana")               return handleMundialManana(env);
      if(path==="/mundo/placa-noche")                return handleMundialNoche(env);
      if(path==="/mundo/partidos") {
      const fecha = url.searchParams.get("fecha");
      const purge = url.searchParams.get("purge");
      const modo = url.searchParams.get("modo") || 'combinado';
      // Si purge=1, limpiar cache antes de consultar
      if (purge === '1' && env.KV) {
        try { await env.KV.delete('mundial:fd:2000'); } catch(e) {}
        try { await env.KV.delete('mundial:season:2026'); } catch(e) {}
        try { await env.KV.delete('mundial:tsdb:2026'); } catch(e) {}
        // Limpiar también caches de Zafronix, eventos y detalles
        const keys = [
          'mundial:zafronix:standings:2026', 'mundial:zafronix:bracket:2026', 'mundial:zafronix:stadiums:2026',
          'mundial:zafronix:matches:2026'
        ];
        for (const k of keys) { try { await env.KV.delete(k); } catch(e) {} }
      }

      // MODO COMBINADO: Todas las APIs + enriquecimiento (default)
      if (modo === 'combinado') {
        const resultado = await obtenerPartidosCombinados(env, fecha || null);
        return new Response(JSON.stringify({
          ok: true,
          fecha: resultado.fecha,
          partidos: resultado.partidos || [],
          total: (resultado.partidos || []).length,
          fuentes: resultado.fuentes,
          enriquecido: resultado.enriquecido,
          debug: resultado.debug || null,
          totalSeason: null
        }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      // MODO SIMPLE: Solo football-data (rápido, sin enriquecimiento)
      let resultado = await obtenerPartidosMundial(env, 2000, fecha || null);
      let fuente = 'football-data';

      if (resultado.error || (resultado.partidos || []).length === 0) {
        const tsdb = await obtenerPartidosTheSportsDB(env, fecha || null, 'mundial');
        if (!tsdb.error) {
          resultado = tsdb;
          fuente = 'thesportsdb';
        } else if (resultado.error) {
          const af = await obtenerPartidosAPIFootball(env, fecha || null);
          if (!af.error) {
            resultado = af;
            fuente = 'api-football';
          } else {
            return new Response(JSON.stringify({ok:false,error:resultado.error,fallback_errors:{tsdb:tsdb.error,af:af.error}}),
              {status:400,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
          }
        }
      }

      const partidos = resultado.partidos || [];
      return new Response(JSON.stringify({
        ok: true,
        fecha: resultado.fecha,
        partidos: partidos,
        total: partidos.length,
        fuente: fuente,
        totalSeason: resultado.totalSeason || null
      }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
    }
      if(path==="/video-editor/estado")              return handleVideoEditorEstado(url, env);
      if(path==="/diagnostico")                      return handleDiagnostico(env);
      if(path==="/debug/mundial-ids")                return handleMundialIDs(env);

      // ── Endpoints API-Football (complementario) ──
      if(path==="/mundo/partidos-combinados") {
        const fecha = url.searchParams.get("fecha");
        const resultado = await obtenerPartidosCombinados(env, fecha || null);
        return new Response(JSON.stringify({
          ok: true,
          ...resultado
        }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }
      // ── Debug endpoint: probar APIs de fútbol crudas ──
      if(path==="/debug/futbol-apis") {
        const key = url.searchParams.get("key") || 'liga-profesional';
        const comp = getCompeticion(key);
        const results = { comp: comp.nombre, tests: {} };

        // Test football-data.org
        if (comp.footballData?.id) {
          try {
            const fdUrl = `${FOOTBALL_DATA_URL}/competitions/${comp.footballData.id}/matches?dateFrom=2025-01-01&dateTo=2025-12-31`;
            const fdRes = await fetch(fdUrl, { headers: { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY } });
            const fdData = await fdRes.text();
            results.tests.football_data = { status: fdRes.status, matches: (()=>{try{const j=JSON.parse(fdData);return j.resultSet?.count||j.matches?.length||0}catch{return 'parse_error'}})(), body_preview: fdData.substring(0, 500) };
          } catch(e) { results.tests.football_data = { error: e.message }; }
        }

        // Test API-Football
        if (comp.apiFootball?.league) {
          try {
            const afUrl = `${API_FOOTBALL_URL}/fixtures?league=${comp.apiFootball.league}&season=${comp.apiFootball.season}`;
            const afRes = await fetch(afUrl, { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } });
            const afData = await afRes.text();
            results.tests.api_football = { status: afRes.status, fixtures: (()=>{try{const j=JSON.parse(afData);return j.response?.length||0}catch{return 'parse_error'}})(), body_preview: afData.substring(0, 500) };
          } catch(e) { results.tests.api_football = { error: e.message }; }
        }

        // Test API-Football standings
        if (comp.apiFootball?.league) {
          try {
            const afUrl = `${API_FOOTBALL_URL}/standings?league=${comp.apiFootball.league}&season=${comp.apiFootball.season}`;
            const afRes = await fetch(afUrl, { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } });
            const afData = await afRes.text();
            results.tests.api_football_standings = { status: afRes.status, standings: (()=>{try{const j=JSON.parse(afData);return j.response?.length||0}catch{return 'parse_error'}})(), body_preview: afData.substring(0, 500) };
          } catch(e) { results.tests.api_football_standings = { error: e.message }; }
        }

        // Test API-Football topscorers
        if (comp.apiFootball?.league) {
          try {
            const afUrl = `${API_FOOTBALL_URL}/players/topscorers?league=${comp.apiFootball.league}&season=${comp.apiFootball.season}`;
            const afRes = await fetch(afUrl, { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } });
            const afData = await afRes.text();
            results.tests.api_football_topscorers = { status: afRes.status, scorers: (()=>{try{const j=JSON.parse(afData);return j.response?.length||0}catch{return 'parse_error'}})(), body_preview: afData.substring(0, 500) };
          } catch(e) { results.tests.api_football_topscorers = { error: e.message }; }
        }

        // Test TheSportsDB (nueva fuente principal)
        if (comp.theSportsDB?.id) {
          try {
            const tsdbUrl = `${THESPORTSDB_URL}/3/eventsseason.php?id=${comp.theSportsDB.id}&s=${comp.theSportsDB.season}`;
            const tsdbRes = await fetch(tsdbUrl);
            const tsdbData = await tsdbRes.text();
            results.tests.thesportsdb = { status: tsdbRes.status, events: (()=>{try{const j=JSON.parse(tsdbData);return j.events?.length||0}catch{return 'parse_error'}})(), body_preview: tsdbData.substring(0, 500) };
          } catch(e) { results.tests.thesportsdb = { error: e.message }; }

          if (comp.hasTheSportsDBStandings) {
            try {
              const tsdbUrl2 = `${THESPORTSDB_URL}/3/lookuptable.php?l=${comp.theSportsDB.id}&s=${comp.theSportsDB.season}`;
              const tsdbRes2 = await fetch(tsdbUrl2);
              const tsdbData2 = await tsdbRes2.text();
              results.tests.thesportsdb_standings = { status: tsdbRes2.status, rows: (()=>{try{const j=JSON.parse(tsdbData2);return j.table?.length||0}catch{return 'parse_error'}})(), body_preview: tsdbData2.substring(0, 500) };
            } catch(e) { results.tests.thesportsdb_standings = { error: e.message }; }
          }
        }

        results.hasFdKey = !!env.FOOTBALL_DATA_API_KEY;
        results.hasAfKey = !!env.API_FOOTBALL_KEY;

        // Test OANOR
        try {
          const oanorKey = env.OANOR_KEY;
          results.hasOanorKey = !!oanorKey;
          if (oanorKey) {
            const oanorUrl = `${OANOR_URL}/v1/day?date=2026-07-22&sport=Soccer`;
            const oanorRes = await fetch(oanorUrl, { headers: { 'x-oanor-key': oanorKey } });
            const oanorData = await oanorRes.text();
            results.tests.oanor = { status: oanorRes.status, events: (()=>{try{const j=JSON.parse(oanorData);return j.data?.events?.length||0}catch{return 'parse_error'}})(), body_preview: oanorData.substring(0, 500) };
          } else {
            results.tests.oanor = { error: 'OANOR_KEY no configurada' };
          }
        } catch(e) { results.tests.oanor = { error: e.message }; }

        return new Response(JSON.stringify(results, null, 2),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }


      if(path==="/mundo/detalle-partido") {
        const fixtureId = url.searchParams.get("fixtureId");
        if (!fixtureId) {
          return new Response(JSON.stringify({ok:false,error:"Parámetro fixtureId requerido"}),
            {status:400,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        const resultado = await obtenerDetallePartidoAPIFootball(env, fixtureId);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/posiciones") {
        // Intentar Zafronix primero (mejor data: tiebreakers FIFA, clasificados)
        const zafronixData = await obtenerPosicionesZafronix(env);
        if (zafronixData && zafronixData.grupos && Object.keys(zafronixData.grupos).length > 0) {
          return new Response(JSON.stringify({ok:true,...zafronixData}),
            {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        // Fallback: API-Football
        const resultado = await obtenerPosicionesGrupos(env);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      // ── Nuevos endpoints Zafronix ──
      if(path==="/mundo/bracket") {
        const resultado = await obtenerBracketZafronix(env);
        if (!resultado) {
          return new Response(JSON.stringify({ok:false,error:"Bracket no disponible (Zafronix API key requerida)"}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/planteles") {
        const resultado = await obtenerPlantelesZafronix(env);
        if (!resultado) {
          return new Response(JSON.stringify({ok:false,error:"Planteles no disponibles (Zafronix API key requerida)"}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/estadios") {
        const resultado = await obtenerEstadiosZafronix(env);
        if (!resultado) {
          return new Response(JSON.stringify({ok:false,error:"Estadios no disponibles (Zafronix API key requerida)"}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/mundo/goleadores") {
        const resultado = await obtenerGoleadores(env);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      // ════════════════════════════════════════════════════════════════
      // ENDPOINTS GENÉRICOS DE FÚTBOL (/futbol/*)
      // ════════════════════════════════════════════════════════════════

      if(path==="/futbol/competiciones") {
        const lista = Object.entries(COMPETITIONS).map(([key, c]) => ({
          key, nombre: c.nombre, icon: c.icon, tipoLiga: c.tipoLiga,
        }));
        return new Response(JSON.stringify({ok:true, competiciones: lista}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/futbol/partidos-combinados") {
        const fecha = url.searchParams.get("fecha");
        const competicion = url.searchParams.get("competicion") || 'liga-profesional';
        const resultado = await obtenerPartidosCombinadosFutbol(env, fecha || null, competicion);
        return new Response(JSON.stringify({
          ok: true,
          ...resultado,
          partidos: resultado.partidos || [],
          total: (resultado.partidos || []).length,
        }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/futbol/partidos-todos") {
        const fecha = url.searchParams.get("fecha");
        const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const hoy = ahoraAR.toISOString().split('T')[0];
        const fechaBase = fecha || hoy;

        // Try OANOR first (devuelve todas las competiciones en una llamada)
        const oanorResult = await obtenerPartidosOANOR(env, fechaBase);
        if (oanorResult && oanorResult.partidos.length > 0) {
          const conocidos = oanorResult.partidos.filter(p => p._compKey);
          return new Response(JSON.stringify({
            ok: true,
            fecha: fechaBase,
            partidos: conocidos,
            total: conocidos.length,
            fuentes: ['oanor'],
          }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }

        const todos = [];
        const fuentes = [];
        for (const [key, comp] of Object.entries(COMPETITIONS)) {
          try {
            const res = await obtenerPartidosCombinadosFutbol(env, fechaBase, key);
            if (!res.error && res.partidos && res.partidos.length > 0) {
              res.partidos.forEach(p => {
                p._compKey = key;
                p._compNombre = comp.nombre;
                p._compIcon = comp.icon;
              });
              todos.push(...res.partidos);
              if (res.fuentes) fuentes.push(...res.fuentes);
            }
          } catch(e) {}
        }
        // Deduplicar por idEvent/id
        const seen = new Set();
        const unicos = todos.filter(p => {
          const id = p.id || p.idEvent;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        return new Response(JSON.stringify({
          ok: true,
          fecha: fechaBase,
          partidos: unicos,
          total: unicos.length,
          fuentes: [...new Set(fuentes)],
        }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/futbol/partidos") {
        const fecha = url.searchParams.get("fecha");
        const competicion = url.searchParams.get("competicion") || 'liga-profesional';
        const purge = url.searchParams.get("purge");

        if (purge === '1' && env.KV) {
          const comp = getCompeticion(competicion);
          if (comp.footballData?.id) {
            try { await env.KV.delete(`mundial:fd:${comp.footballData.id}`); } catch(e) {}
          }
          if (comp.apiFootball) {
            try { await env.KV.delete(`futbol:af:${competicion}:${comp.apiFootball.season}`); } catch(e) {}
          }
        }

        const resultado = await obtenerPartidosCombinadosFutbol(env, fecha || null, competicion);
        return new Response(JSON.stringify({
          ok: true,
          fecha: resultado.fecha,
          partidos: resultado.partidos || [],
          total: (resultado.partidos || []).length,
          fuentes: resultado.fuentes,
          competicion: resultado.competicion,
        }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/futbol/detalle-partido") {
        const fixtureId = url.searchParams.get("fixtureId");
        const competicion = url.searchParams.get("competicion") || 'liga-profesional';
        if (!fixtureId) {
          return new Response(JSON.stringify({ok:false,error:"Parámetro fixtureId requerido"}),
            {status:400,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        const resultado = await obtenerDetallePartidoFutbol(env, fixtureId, competicion);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/futbol/posiciones") {
        const competicion = url.searchParams.get("competicion") || 'liga-profesional';
        const resultado = await obtenerPosicionesFutbol(env, competicion);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/futbol/goleadores") {
        const competicion = url.searchParams.get("competicion") || 'liga-profesional';
        const resultado = await obtenerGoleadoresFutbol(env, competicion);
        if (resultado.error) {
          return new Response(JSON.stringify({ok:false,error:resultado.error}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
        return new Response(JSON.stringify({ok:true,...resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      if(path==="/futbol/bracket") {
        const competicion = url.searchParams.get("competicion") || 'mundial';
        const resultado = await obtenerBracketZafronix(env);
        return new Response(JSON.stringify({ok:true,etapas:resultado}),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      // ── Diagnóstico de goleadores (verifica datos de Zafronix) ──
      if(path==="/mundo/test-goleadores") {
        const apiKey = env.ZAFRONIX_KEY;
        if (!apiKey) return new Response(JSON.stringify({ok:false,error:"ZAFRONIX_KEY no configurada"}),
          {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});

        try {
          // 1) Obtener partidos de Zafronix
          const res = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, { headers: { 'X-API-Key': apiKey } });
          if (!res.ok) return new Response(JSON.stringify({ok:false,error:`Zafronix matches: HTTP ${res.status}`}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});

          const data = await res.json();

          // Mostrar estructura real de la respuesta
          const keys = Object.keys(data);
          const isArray = Array.isArray(data);
          const hasMatches = !!data.matches;
          const matchesIsArray = Array.isArray(data.matches);

          // Intentar encontrar el array de partidos
          let zMatches = null;
          if (Array.isArray(data)) {
            zMatches = data;
          } else if (data.matches && Array.isArray(data.matches)) {
            zMatches = data.matches;
          } else if (data.data && Array.isArray(data.data)) {
            zMatches = data.data;
          } else if (data.results && Array.isArray(data.results)) {
            zMatches = data.results;
          } else if (data.fixtures && Array.isArray(data.fixtures)) {
            zMatches = data.fixtures;
          }

          if (!zMatches) {
            return new Response(JSON.stringify({
              ok: false,
              error: "No se encontró array de partidos",
              debug: {
                responseKeys: keys,
                isArray: isArray,
                hasMatches: hasMatches,
                matchesIsArray: matchesIsArray,
                sampleKeys: keys.slice(0, 5),
                sampleData: typeof data === 'object' ? Object.fromEntries(keys.slice(0, 3).map(k => [k, typeof data[k] === 'object' ? 'object' : data[k]])) : null
              }
            }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
          }

          // 2) Analizar todos los status presentes
          const statusCount = {};
          zMatches.forEach(m => {
            const s = m.status || m.state || m.matchStatus || m.statusCode || 'unknown';
            statusCount[s] = (statusCount[s] || 0) + 1;
          });

          // Muestra de 3 partidos para ver estructura
          const matchSamples = zMatches.slice(0, 3).map(m => ({
            id: m.id,
            home: m.homeTeam?.name || m.home,
            away: m.awayTeam?.name || m.away,
            allKeys: Object.keys(m).slice(0, 15),
            status: m.status,
            state: m.state,
            matchStatus: m.matchStatus,
            statusCode: m.statusCode,
            score: m.score,
            homeScore: m.homeScore ?? m.homeTeam?.score,
            awayScore: m.awayScore ?? m.awayTeam?.score,
          }));

          // 3) Filtrar terminados con lógica ampliada (Zafronix usa "finished" minúscula)
          const finished = zMatches.filter(m => {
            const status = (m.status || m.state || m.matchStatus || m.statusCode || '').toString().toLowerCase();
            return ['ft', 'finished', 'aet', 'pen', 'ended', 'complete', 'completed', 'final', '3'].includes(status);
          });

          // 4) Muestra de goles de partidos terminados
          const samples = finished.slice(0, 3).map(m => {
            const hTeam = typeof m.homeTeam === 'string' ? m.homeTeam : (m.homeTeam?.name || m.home || '');
            const aTeam = typeof m.awayTeam === 'string' ? m.awayTeam : (m.awayTeam?.name || m.away || '');
            return {
              id: m.id,
              home: hTeam,
              away: aTeam,
              status: m.status || m.state,
              score: `${m.homeScore ?? '?'}-${m.awayScore ?? '?'}`,
              hasGoals: !!(m.goals && m.goals.length > 0),
              goalsCount: m.goals?.length || 0,
              sampleGoals: (m.goals || []).slice(0, 3).map(g => {
                let pName = (g.player || g.scorer || g.name || '').toString();
                pName = pName.replace(/\s+\d+[\+\d]*'\s*(pen|og|agg)?$/i, '').trim();
                const tRaw = (g.team || '').toString().toLowerCase();
                const resolvedTeam = tRaw === 'home' ? hTeam : (tRaw === 'away' ? aTeam : g.team);
                return {
                  player: pName,
                  teamRaw: g.team,
                  teamResolved: resolvedTeam,
                  minute: g.minute || g.time
                };
              })
            };
          });

          // 5) Intentar agregación (con opción de forzar refresh)
          const forceRefresh = url.searchParams.get('refresh') === '1';
          if (forceRefresh && env.KV) {
            await env.KV.delete('mundial:zafronix:topscorers:2026');
          }
          const resultado = await obtenerGoleadoresZafronix(env);

          return new Response(JSON.stringify({
            ok: true,
            totalMatches: zMatches.length,
            statusCount: statusCount,
            matchSamples: matchSamples,
            finishedMatches: finished.length,
            samples: samples,
            aggregatedResult: resultado ? {
              fuente: resultado.fuente,
              count: resultado.goleadores?.length || 0,
              top3: resultado.goleadores?.slice(0, 3) || []
            } : null
          }), {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        } catch(e) {
          return new Response(JSON.stringify({ok:false,error:e.message}),
            {status:500,headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
        }
      }

      // ── Endpoint de diagnóstico para APIs Mundial ──
      if(path==="/mundo/test-apis") {
        const fecha = url.searchParams.get("fecha");
        const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const hoy = ahoraAR.toISOString().split('T')[0];
        const fechaBase = fecha || hoy;
        const report = { fecha: fechaBase, timestamp: new Date().toISOString(), apis: {} };

        // 1) football-data
        try {
          const fd = await obtenerPartidosMundial(env, 2000, fechaBase);
          report.apis['football-data'] = {
            ok: !fd.error,
            count: (fd.partidos || []).length,
            error: fd.error || null,
            partidos: (fd.partidos || []).map(p => ({
              local: p.local, visitante: p.visitante, estado: p.estado,
              golesLocal: p.golesLocal, golesVisitante: p.golesVisitante,
              goleadores: p.goleadores || [],
            })),
          };
        } catch(e) {
          report.apis['football-data'] = { ok: false, error: e.message };
        }

        // 2) API-Football
        try {
          const af = await obtenerPartidosAPIFootball(env, fechaBase);
          report.apis['api-football'] = {
            ok: !af.error,
            count: (af.partidos || []).length,
            error: af.error || null,
            totalSeason: af.totalSeason || null,
            _debug: af._debug || null,
            partidos: (af.partidos || []).map(p => ({
              id: p.id, local: p.local, visitante: p.visitante, estado: p.estado,
              estadio: p.estadio || '(vacío)', arbitro: p.arbitro || null,
              golesLocal: p.golesLocal, golesVisitante: p.golesVisitante,
            })),
          };
        } catch(e) {
          report.apis['api-football'] = { ok: false, error: e.message };
        }

        // 2b) API-Football RAW (llamada directa sin procesar)
        try {
          const afUrl = `${API_FOOTBALL_URL}/fixtures?league=1&season=2026`;
          const afRaw = await fetch(afUrl, { headers: { 'x-apisports-key': env.API_FOOTBALL_KEY } });
          const afData = await afRaw.json();
          const allCount = afData.response?.length || 0;
          // Contar cuántos fixtures hay para la fecha solicitada
          const fixturesForDate = (afData.response || []).filter(f => {
            try {
              const info = calcularFechaPlaca(f.fixture.date);
              return info.fechaPlaca === fechaBase;
            } catch(e) { return false; }
          });
          report.apis['api-football-raw'] = {
            status: afRaw.status,
            total_fixtures_season: allCount,
            fixtures_for_date: fixturesForDate.length,
            sample_fixture: fixturesForDate[0] ? {
              id: fixturesForDate[0].fixture.id,
              date: fixturesForDate[0].fixture.date,
              status: fixturesForDate[0].fixture.status.short,
              home: fixturesForDate[0].teams.home.name,
              away: fixturesForDate[0].teams.away.name,
            } : null,
            date_filter_used: fechaBase,
          };
        } catch(e) {
          report.apis['api-football-raw'] = { ok: false, error: e.message };
        }

        // 3) TheSportsDB
        try {
          const tsdb = await obtenerPartidosTheSportsDB(env, fechaBase, 'mundial');
          report.apis['thesportsdb'] = {
            ok: !tsdb.error,
            count: (tsdb.partidos || []).length,
            error: tsdb.error || null,
            partidos: (tsdb.partidos || []).map(p => ({
              local: p.local, visitante: p.visitante,
              estadio: p.estadio || '(vacío)',
            })),
          };
        } catch(e) {
          report.apis['thesportsdb'] = { ok: false, error: e.message };
        }

        // 3b) Zafronix (RAW - para ver qué datos tiene)
        try {
          if (env.ZAFRONIX_KEY) {
            const zRes = await fetch(`${ZAFRONIX_URL}/matches?year=2026`, {
              headers: { 'X-API-Key': env.ZAFRONIX_KEY }
            });
            if (zRes.ok) {
              const zData = await zRes.json();
              const zMatches = zData.data || [];
              // Filtrar por fecha (formato YYYY-MM-DD)
              const zForDate = zMatches.filter(m => {
                try {
                  const mDate = new Date(m.date || m.kickOff || m.datetime);
                  const arDate = new Date(mDate.getTime() - 3 * 60 * 60 * 1000);
                  return arDate.toISOString().split('T')[0] === fechaBase;
                } catch(e) { return false; }
              });
              report.apis['zafronix-raw'] = {
                ok: true,
                total_matches: zMatches.length,
                matches_for_date: zForDate.length,
                sample: zForDate[0] || null,
                // Mostrar goals/lineups/cards de TODOS los matches de la fecha
                all_matches_detail: zForDate.map(m => ({
                  id: m.id,
                  home: m.homeTeam,
                  away: m.awayTeam,
                  status: m.status,
                  homeScore: m.homeScore,
                  awayScore: m.awayScore,
                  goals: m.goals || null,
                  cards: m.cards || null,
                  lineups: m.lineups ? 'present' : null,
                  formations: m.formations || null,
                  referee: m.referee || null,
                  liveMinute: m.liveMinute || null,
                })),
                all_fields_sample: zMatches[0] ? Object.keys(zMatches[0]) : [],
              };
            } else {
              report.apis['zafronix-raw'] = { ok: false, status: zRes.status };
            }
          } else {
            report.apis['zafronix-raw'] = { ok: false, error: 'ZAFRONIX_KEY not configured' };
          }
        } catch(e) {
          report.apis['zafronix-raw'] = { ok: false, error: e.message };
        }

        // 4) Combinado (para ver si el enriquecimiento funciona)
        try {
          const comb = await obtenerPartidosCombinados(env, fechaBase);
          report.apis['combinado'] = {
            ok: true,
            count: (comb.partidos || []).length,
            debug: comb.debug || null,
            partidos: (comb.partidos || []).map(p => ({
              local: p.local, visitante: p.visitante, estado: p.estado,
              afFixtureId: p.afFixtureId || null,
              estadio: p.estadio || '(vacío)',
              ciudad: p.ciudad || null, arbitro: p.arbitro || null,
              golesLocal: p.golesLocal, golesVisitante: p.golesVisitante,
              goleadores: p.goleadores || [],
              eventos_count: (p.eventos || []).length,
              formacionLocal: p.formacionLocal ? true : false,
            })),
          };
        } catch(e) {
          report.apis['combinado'] = { ok: false, error: e.message };
        }

        return new Response(JSON.stringify(report, null, 2),
          {headers:{...CORS_HEADERS,"Content-Type":"application/json"}});
      }

      return jsonError("Ruta no encontrada",404);
    }

    // ── DELETE ──
    if(request.method==="DELETE"){
      if(path==="/fuentes")                          return handleDeleteFuente(url,env);
      if(path==="/notas")                            return handleDeleteNota(url,env);
      if(path==="/whatsapp/programado")              return handleDeleteWhatsappProgramado(url,env);
      if(path==="/agenda/evento")                    return handleDeleteAgendaEvento(url,env);
      if(path==="/agenda/efemeride")                 return handleDeleteAgendaEfemeride(url,env);
      if(path==="/studio/proyecto")                  return handleStudioEliminarProyecto(url, env);
      return jsonError("Ruta no encontrada",404);
    }

    if(request.method!=="POST") return jsonError("Método no permitido",405);

        // ============================================================
    // PRIMERO: rutas que NO usan JSON (FormData)
    // ============================================================
    if (path === "/studio/transcribir") {
      return handleStudioTranscribir(request, env);
    }
   if (path === "/video-editor/transcribir") {
      return handleVideoEditorTranscribir(request, env);
    }
    if (path === "/api/transcribe") {
      return handleStudioTranscribir(request, env);
    }
    if (path === "/procesar-imagenes") {
      return handleProcesarImagenes(request, env);
    }

    // ============================================================
    // DESPUÉS: rutas que usan JSON
    // ============================================================
    let body; 
    try {
      body = await request.json();
    } catch(e) {
      return jsonError("JSON inválido", 400);
    }

    // ── POST con JSON ──
    if(path==="/"&&url.searchParams.get("ai")==="1") return handlePlacasAI(request,env,body);
    if(path==="/titulares")                          return handleTitulares(body,env);
    if(path==="/reformular")                         return handleReformular(body,env);
    if(path==="/generar-imagen")                     return handleGenerarImagen(body,env);
    if(path==="/editar-imagen")                      return handleEditarImagen(body,env);
    if(path==="/img-prompts")                        return handlePostImgPrompts(body,env);
    if(path==="/fuentes")                            return handlePostFuente(body,env);
    if(path==="/editorial")                          return handlePostEditorial(body,env);
    if(path==="/cubiertas")                          return handlePostCubierta(body,env);
    if(path==="/redactar")                           return handleRedactar(body,env);
    if(path==="/notas")                              return handlePostNota(body,env);
    if(path==="/whatsapp/generar")                   return handleWhatsappGenerar(body,env);
    if(path==="/whatsapp/programar")                 return handlePostWhatsappProgramar(body,env);
    if(path==="/whatsapp/marcar-enviado")            return handlePostWhatsappMarcarEnviado(body,env);
    if(path==="/whatsapp/config/prompt")             return handlePostWaPrompt(body,env);
    if(path==="/whatsapp/config/links")              return handlePostWaLinks(body,env);
    if(path==="/social/prompt")                      return handlePostSocialPrompt(body,env);
    if(path==="/social/generar")                     return handleSocialGenerar(body,env);
    if(path==="/social/reel/guion")                  return handleReelGuion(body,env);
    if(path==="/social/reel/audio")                  return handleReelAudio(body,env);
    if(path==="/social/reel/config")                 return handlePostReelConfig(body,env);
    if(path==="/agenda/evento")                      return handlePostAgendaEvento(body,env);
    if(path==="/agenda/efemeride")                   return handlePostAgendaEfemeride(body,env);
    if(path==="/agenda/angulos")                     return handleAgendaAngulos(body,env);
    if(path==="/resumen/generar")                    return handleResumenGenerar(body, env);
    if(path==="/resumen/agregar")                    return handleResumenAgregar(body, env);
    if(path==="/resumen/eliminar")                   return handleResumenEliminar(body, env);
    if(path==="/resumen/generar-guion-reel")         return handleGenerarGuionReel(body, env);
    if(path==="/studio/generar-vtt")                 return handleStudioGenerarVTT(request, env);
    if(path==="/studio/proyecto")                    return handleStudioGuardarProyecto(body, env);
    if(path==="/api/suggest-cuts")                   return handleVideoEditorSuggestCuts(body, env);
    if(path==="/api/generate-headline")              return handleGenerateHeadline(request, env);
    if(path==="/smn/update-token")                   return handleSMNUpdateToken(body, env);
    if(path==="/smn/upload-icon")                    return handleSMNUploadIcon(request, env);
    if(path==="/visual/generar")                     return handleVisualGenerar(body, env);
    if(path==="/visual/extraer")                     return handleVisualExtraer(body, env);
    if(path==="/visual/ilustrar")                    return handleVisualIlustrar(body, env);
    if(path==="/placas/v2/generar")                  return handlePlacasV2Generar(body, env);
    if(path==="/placas/v2/paquete")                  return handlePlacasV2Paquete(body, env);

    return jsonError("Ruta no encontrada",404);
  },
  // Handler para la cola
  async queue(batch, env) {
    return queue(batch, env);
  }
};

// ============================================================
// VISUAL SUITE - Generar con IA
// ============================================================
async function handleVisualGenerar(body, env) {
  const prompt = String(body.prompt || "").trim();
  if (!prompt) return jsonError("Falta prompt", 400);

  const r = await callGemini(prompt, env);
  if (r.error) return jsonError(r.error, 500);

  const raw = r.data ? JSON.stringify(r.data) : "";
  return jsonOk({ texto: raw });
}

// ============================================================
// VISUAL SUITE - Ilustración con MODELO DE IMAGEN (diferente al de la suite)
// NO se toca GEMINI_MODEL (gemini-3.1-flash-lite) usado por el resto de la suite.
// ============================================================
const GEMINI_IMAGEN_MODEL = "gemini-3-pro-image-preview";
const GEMINI_IMAGEN_URL  = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGEN_MODEL}:generateContent`;

async function handleVisualIlustrar(body, env) {
  const prompt = String(body.prompt || "").trim();
  if (!prompt) return jsonError("Falta prompt", 400);

  const keys = [env.GEMINI_KEY_1, env.GEMINI_KEY_2, env.GEMINI_KEY_3, env.GEMINI_KEY_4, env.GEMINI_KEY_5].filter(Boolean);
  if (!keys.length) return jsonError("No hay API keys de Gemini configuradas", 500);

  const bodyReq = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
  };

  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await fetch(`${GEMINI_IMAGEN_URL}?key=${keys[i]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyReq)
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error(`Ilustrar ${res.status} key#${i + 1}:`, errBody);
        if (res.status >= 400 && res.status < 500) return jsonError(`Error ${res.status}: ${errBody.substring(0, 200)}`, res.status);
        continue;
      }
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData && p.inlineData.data) {
          const mime = p.inlineData.mimeType || "image/png";
          return jsonOk({ imagen: `data:${mime};base64,${p.inlineData.data}`, modelo: GEMINI_IMAGEN_MODEL });
        }
      }
      return jsonError("El modelo no devolvió una imagen", 500);
    } catch (err) {
      console.error("Ilustrar error:", err);
    }
  }
  return jsonError("No se pudo generar la ilustración (modelo de imagen agotado o no disponible)", 500);
}

async function handleVisualExtraer(body, env) {
  const url = String(body.url || "").trim();
  const tema = String(body.tema || "").trim() || 'el artículo';
  if (!url) return jsonError("Falta URL", 400);

  // 1. Extraer contenido
  let contenido = '';
  let modo = '';
  let fuentes = [];

  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow", signal: AbortSignal.timeout(12000) });
    if (res.ok) {
      const html = await res.text();
      contenido = extraerTexto(html);
      modo = 'scrape';
    }
  } catch {}

  // Fallback: si el scraping no funciona, usar Gemini con búsqueda nativa
  if (contenido.length < 100) {
    const promptUrlSearch = `Buscá información sobre esta URL: "${url}" (tema: ${tema || "el artículo"}). Extraé TODA la información disponible en formato JSON estructurado. Respondé SOLO con JSON: { "titulo": "...", "chart": {...}, "mapa": {...}, "timeline": {...}, "infografia": {...} }. Si no hay datos para una sección, poné null.`;
    const rFb = await callGemini(promptUrlSearch, env, true);
    if (!rFb.error && rFb.data) {
      const rawFb = JSON.stringify(rFb.data);
      return jsonOk({ texto: rawFb, fuentes: [], modo: 'gemini_search' });
    }
    return jsonError("No se pudo extraer contenido útil del artículo. Verifique la URL.", 500);
  }

  contenido = contenido.substring(0, 12000);

  // 2. Llamar a Gemini con un prompt que extrae TODO
  const promptExtraer = `Sos un asistente de periodismo de datos de Media Mendoza.
Analizá el siguiente artículo y extraé TODA la información estructurada posible.

ARTÍCULO:
${contenido}

Respondé SOLO con JSON. Sin markdown, sin backticks.
Estructura exacta:

{
  "titulo": "Título del artículo o tema detectado",
  "chart": {
    "titulo": "Título sugerido para el gráfico (o null si no aplica)",
    "tipo": "bar|line|pie (o null)",
    "datos": [{"label": "etiqueta1", "value": 100}, {"label": "etiqueta2", "value": 200}]
  },
  "mapa": {
    "lugares": [{"nombre": "Lugar", "direccion": "Dirección completa (para geocodificar)", "descripcion": "Contexto del lugar en el artículo"}]
  },
  "timeline": {
    "eventos": [{"date": "2026-06-15", "title": "Título corto del evento", "desc": "Descripción con datos concretos"}]
  },
  "infografia": {
    "titulo": "Título de la infografía (o null)",
    "lineas": ["Dato clave 1", "Dato clave 2", "Cifra relevante 3"]
  }
}

REGLAS:
- Si no hay datos para una sección, poné null (no array vacío)
- chart.datos: solo cuando haya números/nombres comparables (meses, categorías con valores)
- chart.tipo: bar para comparaciones, line para tendencias, pie para proporciones
- mapa.lugares: solo cuando haya lugares/ubicaciones mencionados
- timeline.eventos: extraé CADA hecho individual con fecha lo más específica posible
- infografia.lineas: datos numéricos impactantes, fechas clave, cifras relevantes

Respondé SOLO con el JSON.`;

  const r = await callGemini(promptExtraer, env);
  if (r.error) return jsonError(r.error, 500);
  const raw = r.data || {};
  return jsonOk({
    titulo: raw.titulo || tema,
    chart: raw.chart || null,
    mapa: raw.mapa || null,
    timeline: raw.timeline || null,
    infografia: raw.infografia || null,
    modo,
    url
  });
}

// ============================================================
// PLACAS V2 - propuesta editorial versionada
// POST /placas/v2/generar { nota: { ...respuesta de extracción... } }
// ============================================================
const PLACAS_V2_EF_CACHE_PREFIX = 'placas-v2:efemerides:v5:';
const PLACAS_V2_EF_CACHE_TTL = 60 * 60 * 24;

function validEfemeridesDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const date = new Date(value + 'T12:00:00Z');
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() + 1 === Number(match[2]) && date.getUTCDate() === Number(match[3]);
}

function stripHtmlForEfemerides(html) {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\s+/g, ' ').trim();
}

async function discoverTyCEfemeridesUrl(date) {
  const parts = date.split('-');
  const day = Number(parts[2]);
  const monthNames = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const month = monthNames[Number(parts[1])] || '';
  const datePattern = new RegExp(day + '-de-' + month + '(?:-|$)', 'i');
  const decodeUrl = value => String(value || '').replace(/&amp;/g, '&');
  const searchQuery = 'site:tycsports.com/interes-general/efemerides efemerides del ' + day + ' de ' + month;
  try {
    const searchResponse = await fetch('https://www.bing.com/search?q=' + encodeURIComponent(searchQuery), { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (searchResponse.ok) {
      const searchHtml = await searchResponse.text();
      const urls = [...searchHtml.matchAll(/href=["'](https?:\/\/www\.tycsports\.com\/interes-general\/efemerides\/[^"']+)["']/gi)].map(match => decodeUrl(match[1])).filter(source => datePattern.test(source));
      if (urls[0]) return urls[0];
    }
  } catch {}
  try {
    const indexResponse = await fetch('https://www.tycsports.com/efemerides.html', { headers: { ...BROWSER_HEADERS, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (indexResponse.ok) {
      const indexHtml = await indexResponse.text();
      const links = [...indexHtml.matchAll(/href=["']([^"']+)["']/gi)].map(match => decodeUrl(match[1])).filter(link => /tycsports\.com\/interes-general\/efemerides\//i.test(link) && datePattern.test(link));
      if (links[0]) return links[0].startsWith('http') ? links[0] : 'https://www.tycsports.com' + links[0];
    }
  } catch {}
  const query = 'site:tycsports.com/interes-general/efemerides efemérides del ' + day + ' de ' + month;
  try {
    const response = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query) + '&kl=es-ar', { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return '';
    const html = await response.text();
    const urls = [...html.matchAll(/class="result__a"[^>]*href="[^"]*uddg=([^&"]+)/g)].map(match => decodeURIComponent(match[1])).filter(source => /tycsports\.com\/interes-general\/efemerides\//i.test(source));
    return urls.find(source => datePattern.test(source)) || '';
  } catch { return ''; }
}

async function findEfemerideImage(query) {
  if (!query) return null;
  try {
    const endpoint = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(query) + '&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*';
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = await response.json();
    const page = Object.values(data?.query?.pages || {}).find(item => item.imageinfo?.[0]?.mime?.startsWith('image/'));
    const image = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
    return image ? { url: image, source: 'Wikimedia Commons' } : null;
  } catch { return null; }
}

async function findWikipediaImage(query) {
  if (!query) return null;
  try {
    const endpoint = 'https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(query) + '&gsrlimit=1&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json&origin=*';
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = await response.json();
    const page = Object.values(data?.query?.pages || {})[0];
    const image = page?.original?.source || page?.thumbnail?.source;
    return image ? { url: image, source: 'Wikipedia' } : null;
  } catch { return null; }
}

async function discoverWikipediaDateUrl(date) {
  const parts = date.split('-');
  const monthNames = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const day = Number(parts[2]);
  const month = monthNames[Number(parts[1])] || '';
  if (!day || !month) return '';
  const sourceUrl = 'https://es.wikipedia.org/wiki/' + day + '_de_' + month;
  try {
    const response = await fetch(sourceUrl, { headers: { Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return '';
    const html = await response.text();
    if (/página no existe|la página solicitada no existe/i.test(html)) return '';
    return sourceUrl;
  } catch { return ''; }
}

function wikipediaDateUrl(date) {
  const parts = date.split('-');
  const monthNames = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const day = Number(parts[2]);
  const month = monthNames[Number(parts[1])] || '';
  return day && month ? 'https://es.wikipedia.org/wiki/' + day + '_de_' + month : '';
}

async function handlePlacasV2Efemerides(url, env) {
  const date = url.searchParams.get('fecha') || '';
  if (!validEfemeridesDate(date)) return jsonError('Fecha inválida. Usá YYYY-MM-DD.', 400);
  const cacheKey = PLACAS_V2_EF_CACHE_PREFIX + date;
  if (env.KV) {
    try {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached && cached.items && cached.items.length) return jsonOk({ ...cached, meta: { ...(cached.meta || {}), cached: true } });
    } catch {}
  }
  // La página diaria de Wikipedia es determinística y existe para todos los
  // días válidos del calendario. Se usa primero para que una búsqueda lenta o
  // intermitente de TyC no deje al editor sin datos; TyC queda como rescate.
  const sourceUrl = wikipediaDateUrl(date) || await discoverTyCEfemeridesUrl(date);
  if (!sourceUrl) return jsonError('No se encontró una fuente de efemérides para esa fecha.', 502);
  let sourceText = '';
  let sourceImages = [];
  try {
    const response = await fetch(sourceUrl, { headers: { ...BROWSER_HEADERS, Accept: 'text/html', 'User-Agent': 'MediaMendoza-Efemerides/1.0' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (response.ok) {
      const html = await response.text();
      sourceText = stripHtmlForEfemerides(html).slice(0, 18000);
      sourceImages = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/gi), ...html.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)/gi)].map(match => match[1]).filter((image, index, images) => image && images.indexOf(image) === index).slice(0, 8);
    }
  } catch {}
  if (!sourceText && /wikipedia\.org\/wiki\//i.test(sourceUrl)) {
    try {
      const page = sourceUrl.split('/wiki/')[1] || '';
      const apiUrl = 'https://es.wikipedia.org/w/api.php?action=parse&page=' + encodeURIComponent(page) + '&prop=text&format=json&origin=*';
      const response = await fetch(apiUrl, { headers: { Accept: 'application/json', 'User-Agent': 'MediaMendoza-Efemerides/1.0' }, signal: AbortSignal.timeout(12000) });
      if (response.ok) {
        const data = await response.json();
        sourceText = stripHtmlForEfemerides(data?.parse?.text?.['*'] || '').slice(0, 18000);
      }
    } catch {}
  }
  if (!sourceText) return jsonError('La fuente de efemérides no respondió.', 502);
  const sourceName = /wikipedia\.org/i.test(sourceUrl) ? 'Wikipedia' : 'TyC Sports';
  const imageCatalog = sourceImages.map((image, index) => index + ': ' + image).join('\n');
  const prompt = 'Sos documentalista de Media Mendoza. Extraé exclusivamente hechos que aparezcan en la fuente para el ' + date + '. No inventes datos. Devolvé entre 5 y 8 opciones, priorizando hechos argentinos. Cada objeto debe tener id, fecha, alcance, categoria, anio, titulo breve, resumen de máximo 100 caracteres, texto_ampliado de máximo 240 caracteres, icono, icono_descripcion, imagen_descripcion, imagen_indice y prioridad. imagen_indice solo puede apuntar a una imagen del catálogo si es pertinente para ese hecho; si no, usa -1. icono debe ser uno de: futbol, deportes, aviacion, musica, teatro, politica, historia, sociedad, economia, mundo o canal. icono_descripcion debe describir en 3 a 8 palabras el símbolo concreto que corresponde al hecho. imagen_descripcion debe describir una imagen documental posible, sin inventar que existe una fotografía. Respondé SOLO JSON válido con {"items":[...]}. Fuente: ' + sourceUrl + '\nImágenes disponibles:\n' + imageCatalog + '\nTexto:\n' + sourceText;
  const result = await callGemini(prompt, env);
  if (result.error || !Array.isArray(result.data?.items)) return jsonError('No se pudieron normalizar las efemérides.', 502);
  const rawItems = Array.isArray(result.data.items) ? result.data.items : [];
  const searchedImages = await Promise.all(rawItems.map(async item => {
    const index = Number(item.imagen_indice);
    if (Number.isInteger(index) && index >= 0 && sourceImages[index]) return { url: sourceImages[index], source: 'Fuente original' };
    const title = String(item.titulo || '').replace(/^(paso a la inmortalidad de|nacimiento de|muere|debuta|debut de|se funda|día de)\s+/i, '').trim();
    const searchTitle = /san mart[ií]n/i.test(title) ? 'José de San Martín' : /messi/i.test(title) ? 'Lionel Messi' : title;
    return (await findEfemerideImage(searchTitle + ' ' + String(item.imagen_descripcion || ''))) || findWikipediaImage(searchTitle);
  }));
  const items = rawItems.map((item, index) => ({
    id: String(item.id || (date + '-' + (index + 1))).trim(), fecha: date, alcance: item.alcance === 'nacional' ? 'nacional' : 'internacional', categoria: String(item.categoria || 'historia').trim(), icono: String(item.icono || item.categoria || 'historia').trim(), icono_descripcion: String(item.icono_descripcion || item.icono || item.categoria || 'símbolo histórico').trim(), imagen_descripcion: String(item.imagen_descripcion || item.icono_descripcion || '').trim(), imagen: searchedImages[index]?.url || '', imagen_fuente: searchedImages[index]?.source || '',
    año: String(item.anio || item.año || '').trim(), titulo: String(item.titulo || '').trim(), resumen: String(item.resumen || '').trim(), texto_ampliado: String(item.texto_ampliado || item.resumen || '').trim(), prioridad: Number(item.prioridad) || index + 1,
    fuente: sourceName, url_fuente: sourceUrl, verificada: true, nivel_verificacion: 'fuente_secundaria', fuente_descubrimiento: sourceUrl,
  })).filter(item => item.titulo && item.año && item.resumen).sort((a, b) => (a.alcance === 'nacional' ? 0 : 1) - (b.alcance === 'nacional' ? 0 : 1) || a.prioridad - b.prioridad);
  if (items.length < 5) return jsonError('La fuente devolvió menos de cinco opciones utilizables.', 502);
  const payload = { items, meta: { fecha: date, fuente: sourceUrl, nivel_verificacion: 'fuente_secundaria', generatedAt: new Date().toISOString(), cached: false } };
  if (env.KV) { try { await env.KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: PLACAS_V2_EF_CACHE_TTL }); } catch {} }
  return jsonOk(payload);
}

async function handlePlacasV2Generar(body, env) {
  const note = body?.nota && typeof body.nota === 'object' ? body.nota : body;
  const hasContent = String(note?.url || note?.title || note?.titulo || note?.body || note?.texto || '').trim();
  if (!hasContent) return jsonError('Falta la nota extraída', 400);

  const fallback = deterministicEditorialResponse(note);
  try {
    const result = await callGemini(buildPlateEditorialPrompt(note), env);
    if (result.error || !result.data || typeof result.data !== 'object') {
      return jsonOk({ placa: fallback, warnings: ['ia_no_disponible'] });
    }
    const placa = normalizeEditorialResponse(result.data, note);
    return jsonOk({ placa, warnings: [] });
  } catch (error) {
    return jsonOk({ placa: fallback, warnings: ['ia_no_disponible'] });
  }
}

// POST /placas/v2/paquete { nota: { ...respuesta de extracciÃ³n... }, salidas: ["placa", "carrusel", "reel"] }
async function handlePlacasV2Paquete(body, env) {
  const note = body?.nota && typeof body.nota === 'object' ? body.nota : body;
  const hasContent = String(note?.url || note?.title || note?.titulo || note?.body || note?.texto || '').trim();
  if (!hasContent) return jsonError('Falta la nota extraÃ­da', 400);

  const requested = Array.isArray(body?.salidas) ? [...new Set(body.salidas)] : ['placa'];
  const allowed = ['placa', 'carrusel', 'reel'];
  const invalid = requested.filter(output => !allowed.includes(output));
  if (invalid.length) return jsonError(`Salidas invÃ¡lidas: ${invalid.join(', ')}`, 400);
  if (!requested.length) requested.push('placa');

  let placa;
  let warnings = [];
  try {
    const result = await callGemini(buildPlateEditorialPrompt(note), env);
    if (result.error || !result.data || typeof result.data !== 'object') {
      placa = deterministicEditorialResponse(note);
      warnings = ['ia_no_disponible'];
    } else {
      placa = normalizeEditorialResponse(result.data, note);
    }
  } catch (error) {
    placa = deterministicEditorialResponse(note);
    warnings = ['ia_no_disponible'];
  }

  // Las imágenes de la nota actual son la fuente de verdad. La placa puede
  // conservar datos de una sesión anterior y no debe contaminar carrusel/reel.
  const noteImages = uniqueImages({
    image: note.image || note.imagen,
    images: note.images || note.imagenes,
  });
  const imagenes = noteImages;
  const paquete = {
    tipo: 'noticia_editorial',
    version: 2,
    fuente: {
      url: placa.fuente?.url || note.url || '',
      titulo_original: placa.fuente?.titulo_original || note.title || note.titulo || '',
      categoria: placa.fuente?.categoria || note.category || note.categoria || '',
      cuerpo: placa.fuente?.texto || note.body || note.texto || note.contenido || '',
      imagen: note.image || note.imagen || imagenes[0] || '',
      imagenes,
    },
    editorial: {
      seccion: placa.fuente?.categoria || note.category || note.categoria || '',
      familia: placa.template_sugerido || 'general',
      tipo_noticia: 'noticia',
      complejidad: 'medium',
      tono: 'informative',
      titulo: placa.titulo || '',
      titulo_sintetico: placa.titulo_sintetico || '',
      bajada: placa.bajada || '',
      contexto: placa.contexto || '',
      pregunta_social: placa.pregunta_social || '',
      datos_clave: Array.isArray(placa.datos_clave) && placa.datos_clave.length ? placa.datos_clave : placa.contexto ? [placa.contexto] : [],
      textual: placa.textual || [],
      personas: Array.isArray(placa.personas) ? placa.personas : [],
    },
    salidas: {
      placas: requested.includes('placa') ? [placa] : [],
      carrusel: requested.includes('carrusel') ? null : null,
      reel: requested.includes('reel') ? null : null,
    },
    redes: placa.redes || { instagram: '', facebook: '' },
  };

  return jsonOk({ ok: true, paquete, warnings, requestedOutputs: requested });
}
