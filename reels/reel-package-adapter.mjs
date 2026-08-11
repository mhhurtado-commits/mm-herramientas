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
