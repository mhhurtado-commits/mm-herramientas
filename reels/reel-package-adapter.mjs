export function ensureReelClosure(reelOrScenes, article = {}) {
  const reel = Array.isArray(reelOrScenes) ? { scenes: reelOrScenes } : { ...(reelOrScenes || {}) };
  const scenes = Array.isArray(reel.scenes) ? reel.scenes.map(scene => ({ ...scene })) : [];
  const hasClosure = scenes.some(scene => {
    const role = String(scene.visual_role || '').toLowerCase();
    const layout = String(scene.layout || '').toLowerCase();
    return role === 'cta' || role === 'conclusion' || layout === 'cta';
  });
  if (!hasClosure) {
    const closure = {
      order: scenes.length + 1,
      duration_ms: 3200,
      visual_type: 'text',
      visual_source: '',
      visual_role: 'cta',
      layout: 'cta',
      text: 'Leé la nota completa',
      subtitle: article.url ? 'Más información en mediamendoza.com' : 'Seguí la cobertura en Media Mendoza',
      items: [],
    };
    if (scenes.length >= 6) scenes[scenes.length - 1] = closure;
    else scenes.push(closure);
  }
  return Array.isArray(reelOrScenes) ? scenes : { ...reel, scenes };
}

export function createReelOutputFromEditorialPackage(editorialPackage = {}) {
  const source = editorialPackage.fuente || {};
  const editorial = editorialPackage.editorial || {};
  const plate = Array.isArray(editorialPackage.salidas?.placas) ? editorialPackage.salidas.placas[0] || {} : {};
  const title = clean(editorial.titulo || plate.titulo || source.titulo_original);
  const summary = clean(editorial.bajada || plate.bajada || source.descripcion);
  const context = clean(editorial.contexto || plate.contexto || firstSentence(source.cuerpo));
  const facts = uniqueStrings([
    editorial.datos_clave,
    plate.datos_clave,
    Array.isArray(plate.bloques) ? plate.bloques.filter(block => block?.tipo === 'dato-clave').map(block => block.texto) : [],
  ]);
  const scenes = [];
  const image = clean(source.imagen || source.imagenes?.[0]);
  scenes.push({ order: 1, duration_ms: 3200, visual_type: image ? 'cover_image' : 'text_card', visual_source: image ? 'article.image' : 'generated', visual_role: 'hook', layout: 'cover', text: title, subtitle: summary, items: [] });
  if (context) scenes.push({ order: scenes.length + 1, duration_ms: 3000, visual_type: 'text_card', visual_source: 'generated', visual_role: 'context', layout: 'default', title: 'Qué pasó', text: 'Qué pasó', subtitle: context, items: [] });
  if (facts.length) scenes.push({ order: scenes.length + 1, duration_ms: 3000, visual_type: 'text_card', visual_source: 'generated', visual_role: 'key_fact', layout: 'list', title: 'Puntos clave', text: 'Puntos clave', subtitle: '', items: facts.map(text => ({ text })) });
  scenes.push({ order: scenes.length + 1, duration_ms: 3200, visual_type: 'text_card', visual_source: 'generated', visual_role: 'cta', layout: 'cta', text: 'Leé la nota completa', subtitle: [title, summary, context].filter(Boolean).join(' '), items: [] });
  return { format: 'reel_silent', hook: title, cover_text: title, caption: '', hashtags: [], scenes: ensureReelClosure(scenes, { url: source.url }) };
}

function clean(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function firstSentence(value) {
  const text = clean(value);
  return text.split(/(?<=[.!?])\s+/)[0] || text;
}

function uniqueStrings(groups) {
  return [...new Set((Array.isArray(groups) ? groups : [groups]).flatMap(value => Array.isArray(value) ? value : [value]).map(clean).filter(Boolean))];
}
