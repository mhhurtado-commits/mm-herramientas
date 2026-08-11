import { fromEditorialPackage } from './reel-shared-package-adapter.mjs';

const MAX_FACT_SCENES = 2;

// Genera un guion corto desde el paquete de Placas V2. No consume ni modifica
// el adaptador de Carrusel: solo usa el mismo plan editorial ya generado.
export function ensureReelClosure(reelOrScenes, article = {}) {
  const reel = Array.isArray(reelOrScenes) ? { scenes: reelOrScenes } : { ...(reelOrScenes || {}) };
  const scenes = Array.isArray(reel.scenes) ? reel.scenes.map(scene => ({ ...scene })) : [];
  const hasClosure = scenes.some(scene => String(scene.visual_role || '').toLowerCase() === 'cta' || scene.layout === 'cta');
  if (!hasClosure) scenes.push(scene('cta', 'Segu\u00ed la cobertura', 'M\u00e1s informaci\u00f3n en mediamendoza.com', scenes.length + 1, { layout: 'cta', cta: 'Le\u00e9 la nota completa' }));
  return Array.isArray(reelOrScenes) ? scenes : { ...reel, scenes };
}

export function createReelOutputFromEditorialPackage(editorialPackage = {}) {
  const source = editorialPackage.fuente || {};
  const adapted = fromEditorialPackage(editorialPackage);
  const editorial = adapted.editorial;
  const plate = editorialPackage.salidas?.placas?.[0] || {};
  const title = clean(editorial.titulo || plate.titulo || source.titulo_original);
  const summary = clean(editorial.bajada || plate.bajada || source.descripcion);
  const image = clean(source.imagen || source.imagenes?.[0]);
  const storyBlocks = Array.isArray(adapted.storyBlocks) ? adapted.storyBlocks : [];
  const context = storyBlocks.find(block => block.role === 'context');
  const facts = storyBlocks.filter(block => block !== context).slice(0, MAX_FACT_SCENES);
  const scenes = [scene('hook', title, summary, 1, {
    visual_type: image ? 'cover_image' : 'text_card',
    visual_source: image ? 'article.image' : 'generated',
    layout: 'cover',
  })];

  if (context) scenes.push(blockToScene('context', context, scenes.length + 1));
  else if (summary) scenes.push(scene('context', 'Qu\u00e9 pas\u00f3', summary, scenes.length + 1));
  for (const block of facts) scenes.push(blockToScene('key_fact', block, scenes.length + 1));
  scenes.push(scene('cta', 'Segu\u00ed la cobertura', 'M\u00e1s informaci\u00f3n en mediamendoza.com', scenes.length + 1, {
    layout: 'cta',
    cta: 'Le\u00e9 la nota completa',
  }));

  return {
    format: 'reel_silent',
    hook: title,
    cover_text: title,
    caption: '',
    hashtags: [],
    scenes: ensureReelClosure(scenes, { url: source.url }),
  };
}

function blockToScene(role, block, order) {
  const items = Array.isArray(block.items)
    ? block.items.slice(0, 2).map(item => ({ label: clean(item.label) || 'Dato clave', text: clean(item.text) })).filter(item => item.text)
    : [];
  return scene(role, clean(block.title) || (role === 'context' ? 'Qu\u00e9 pas\u00f3' : 'Dato clave'), clean(block.body), order, {
    layout: items.length ? 'list' : 'default',
    items,
  });
}

function scene(role, title, subtitle, order, extra = {}) {
  return {
    order,
    duration_ms: role === 'hook' ? 3600 : role === 'cta' ? 3000 : 2800,
    visual_type: extra.visual_type || 'text_card',
    visual_source: extra.visual_source || 'generated',
    visual_role: role,
    layout: extra.layout || 'default',
    text: title,
    title,
    subtitle: clean(subtitle),
    items: Array.isArray(extra.items) ? extra.items : [],
    cta: clean(extra.cta),
  };
}

function clean(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}
