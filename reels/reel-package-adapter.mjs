const MAX_KEY_FACT_CARDS = 2;
const MAX_CARD_WORDS = 14;

export function ensureReelClosure(reelOrScenes, article = {}) {
  const reel = Array.isArray(reelOrScenes) ? { scenes: reelOrScenes } : { ...(reelOrScenes || {}) };
  const scenes = Array.isArray(reel.scenes) ? reel.scenes.map(scene => ({ ...scene })) : [];
  const hasClosure = scenes.some(scene => String(scene.visual_role || '').toLowerCase() === 'cta' || scene.layout === 'cta');
  if (!hasClosure) scenes.push(scene('cta', 'Leé la nota completa', article.url ? 'Más información en mediamendoza.com' : 'Seguí la cobertura en Media Mendoza', scenes.length + 1));
  return Array.isArray(reelOrScenes) ? scenes : { ...reel, scenes };
}

export function createReelOutputFromEditorialPackage(editorialPackage = {}) {
  const source = editorialPackage.fuente || {};
  const editorial = editorialPackage.editorial || {};
  const plate = editorialPackage.salidas?.placas?.[0] || {};
  const title = clean(editorial.titulo || plate.titulo || source.titulo_original);
  const summary = clean(editorial.bajada || plate.bajada || source.descripcion);
  const context = clean(editorial.contexto || plate.contexto || summary);
  const canonicalText = [title, summary, context];
  const cards = compactCards(buildCards(editorial, plate, canonicalText));

  const image = clean(source.imagen || source.imagenes?.[0]);
  const scenes = [
    scene('hook', title, summary, 1, { visual_type: image ? 'cover_image' : 'text_card', visual_source: image ? 'article.image' : 'generated', layout: 'cover' }),
    scene('context', 'Qué pasó', context, 2),
  ];

  if (cards.length) scenes.push(scene('key_fact', 'Puntos clave', '', scenes.length + 1, { layout: 'list', items: cards }));
  scenes.push(scene('cta', 'Leé la nota completa', '', scenes.length + 1, { layout: 'cta' }));
  return {
    format: 'reel_silent',
    hook: title,
    cover_text: title,
    caption: '',
    hashtags: [],
    scenes: ensureReelClosure(scenes, { url: source.url }),
  };
}

function buildCards(editorial, plate, excluded) {
  const facts = uniqueStrings([
    editorial.datos_clave,
    plate.datos_clave,
    plate.bloques?.filter(block => block?.tipo === 'dato-clave').map(block => block.texto),
  ]).filter(text => !sameText(text, excluded));
  const cards = facts.map(text => ({ label: 'Dato clave', text }));
  const quote = getVerifiedQuote(editorial.textual) || getVerifiedQuote(plate.textual);
  if (quote && !sameText(quote, excluded)) cards.push({ label: 'Cita verificada', text: quote });
  const people = uniqueObjects([editorial.personas, plate.personas]);
  for (const person of people.slice(0, 2)) {
    const name = clean(person.nombre || person.name);
    const role = clean(person.rol || person.role || person.cargo);
    if (name) cards.push({ label: role || 'Persona mencionada', text: role ? `${name}: ${role}` : name });
  }
  return dedupeCards(cards);
}

function getVerifiedQuote(value) {
  const values = Array.isArray(value) ? value : [value];
  const match = values.find(item => item?.verificada && clean(item.cita || item.texto || item.text));
  return clean(match?.cita || match?.texto || match?.text);
}

function sameText(value, candidates) {
  const normalized = clean(value).replace(/…$/, '').toLowerCase();
  return candidates.some(candidate => {
    const other = clean(candidate).replace(/…$/, '').toLowerCase();
    return other === normalized || (normalized.length > 20 && other.length > 20 && (other.includes(normalized) || normalized.includes(other)));
  });
}

function dedupeCards(cards) {
  const seen = new Set();
  return cards.filter(card => {
    const key = clean(card?.text).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compactCards(cards) {
  return dedupeCards(cards).slice(0, MAX_KEY_FACT_CARDS).map(card => ({
    ...card,
    text: compactText(card.text),
  }));
}

function compactText(value) {
  const words = clean(value).split(/\s+/).filter(Boolean);
  if (words.length <= MAX_CARD_WORDS) return words.join(' ');
  return `${words.slice(0, MAX_CARD_WORDS).join(' ')}…`;
}

function scene(role, title, subtitle, order, extra = {}) {
  return {
    order,
    duration_ms: role === 'cta' ? 3200 : 3000,
    visual_type: extra.visual_type || 'text_card',
    visual_source: extra.visual_source || 'generated',
    visual_role: role,
    layout: extra.layout || 'default',
    text: title,
    title,
    subtitle: clean(subtitle),
    items: Array.isArray(extra.items) ? extra.items : [],
  };
}

function clean(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function uniqueStrings(groups) {
  return [...new Set((Array.isArray(groups) ? groups : [groups]).flatMap(value => Array.isArray(value) ? value : [value]).map(clean).filter(Boolean))];
}

function uniqueObjects(groups) {
  return [...new Map((Array.isArray(groups) ? groups : [groups]).flatMap(value => Array.isArray(value) ? value : []).map(item => [clean(item?.nombre || item?.name), item]).filter(([key]) => key)).values()];
}
