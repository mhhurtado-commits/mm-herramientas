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

export function createReelOutputFromCarouselPlan(plan = {}, article = {}) {
  const scenes = [];
  const cover = plan.cover || {};
  if (cover.title || cover.subtitle) {
    scenes.push({ order: 1, duration_ms: 3200, visual_type: article.image ? 'cover_image' : 'text_card', visual_source: article.image ? 'article.image' : 'generated', visual_role: 'hook', layout: 'cover', text: cover.title || article.title || '', subtitle: cover.subtitle || article.summary || '', items: [] });
  }
  for (const slide of Array.isArray(plan.slides) ? plan.slides : []) {
    if (!slide || slide.type === 'end') continue;
    const role = slide.type === 'dato' || slide.type === 'facts' || slide.type === 'clave' || slide.type === 'impact' ? 'key_fact' : slide.type === 'imagen' ? 'support_image' : 'context';
    scenes.push({ order: scenes.length + 1, duration_ms: 3000, visual_type: role === 'support_image' && slide.supportImage ? 'support_image' : 'text_card', visual_source: slide.supportImage || 'generated', visual_role: role, layout: role === 'key_fact' ? 'list' : 'default', title: slide.title || '', text: slide.title || '', subtitle: slide.text || '', items: Array.isArray(slide.items) ? slide.items : [] });
  }
  const end = Array.isArray(plan.slides) ? plan.slides.find(slide => slide?.type === 'end') : null;
  scenes.push({ order: scenes.length + 1, duration_ms: 3200, visual_type: 'text_card', visual_source: 'generated', visual_role: 'cta', layout: 'cta', text: end?.cta || 'Leé la nota completa', subtitle: [article.title, article.summary].filter(Boolean).join(' '), items: [] });
  return { format: 'reel_silent', hook: cover.title || article.title || '', cover_text: cover.title || article.title || '', caption: '', hashtags: [], scenes: ensureReelClosure(scenes, article) };
}
