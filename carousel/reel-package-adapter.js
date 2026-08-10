import { createEmptyReelOutput } from "./editorial-contract.js";
import { fromEditorialPackage as fromSharedEditorialPackage } from "./shared-package-adapter.js";
import { packageToCarouselArticle } from "../shared/editorial-package.mjs";

export function fromEditorialPackage(editorialPackage = {}) {
  const shared = fromSharedEditorialPackage(editorialPackage);
  const article = packageToCarouselArticle(editorialPackage);
  article.category = shared.article.category;
  const editorial = editorialPackage.editorial || {};
  const source = editorialPackage.fuente || {};
  const image = source.imagen_principal || article.image || (article.images || [])[0] || "";
  const title = editorial.titulo || article.title;
  const summary = editorial.bajada || article.summary;
  const context = editorial.contexto || "";
  const category = article.category || editorial.etiqueta || "Actualidad";
  const storedReel = editorialPackage.salidas?.reel;
  if (storedReel && Array.isArray(storedReel.scenes) && storedReel.scenes.length) {
    return {
      article,
      reel: { ...createEmptyReelOutput(), ...storedReel, scenes: ensureReelClosure(storedReel, article).scenes },
      categoryOptions: shared.categoryOptions,
      diagnosis: shared.diagnosis,
    };
  }

  const scenes = [];
  if (title) {
    scenes.push({
      order: 1,
      duration_ms: 3200,
      visual_type: image ? "image" : "text",
      visual_source: image,
      visual_role: "cover",
      layout: "cover",
      text: title,
      subtitle: category,
      items: []
    });
  }
  if (summary) {
    scenes.push({
      order: scenes.length + 1,
      duration_ms: 3600,
      visual_type: image ? "image" : "text",
      visual_source: image,
      visual_role: "main_idea",
      layout: "text",
      text: summary,
      subtitle: "Lo más importante",
      items: []
    });
  }
  if (context) {
    scenes.push({
      order: scenes.length + 1,
      duration_ms: 3400,
      visual_type: "text",
      visual_source: "",
      visual_role: "context",
      layout: "text",
      text: context,
      subtitle: "Contexto",
      items: []
    });
  }

  const output = createEmptyReelOutput();
  output.format = "reel_silent";
  output.hook = title;
  output.cover_text = title;
  output.caption = editorialPackage.redes?.instagram || editorialPackage.redes?.facebook || editorial.redes?.instagram || editorial.redes?.facebook || "";
  output.hashtags = [];
  output.scenes = ensureReelClosure(scenes, article);
  return { article, reel: output, categoryOptions: shared.categoryOptions, diagnosis: shared.diagnosis };
}

export function ensureReelClosure(reelOrScenes, article = {}) {
  const reel = Array.isArray(reelOrScenes) ? { scenes: reelOrScenes } : { ...(reelOrScenes || {}) };
  const scenes = Array.isArray(reel.scenes) ? reel.scenes.map(scene => ({ ...scene })) : [];
  const hasClosure = scenes.some(scene => {
    const role = String(scene.visual_role || "").toLowerCase();
    const layout = String(scene.layout || "").toLowerCase();
    return role === "cta" || role === "conclusion" || layout === "cta";
  });
  if (!hasClosure) {
    const closure = {
      order: scenes.length + 1,
      duration_ms: 3200,
      visual_type: "text",
      visual_source: "",
      visual_role: "cta",
      layout: "cta",
      text: "Leé la nota completa",
      subtitle: article.url ? "Más información en mediamendoza.com" : "Seguí la cobertura en Media Mendoza",
      items: []
    };
    if (scenes.length >= 6) scenes[scenes.length - 1] = closure;
    else scenes.push(closure);
  }
  return Array.isArray(reelOrScenes) ? scenes : { ...reel, scenes };
}

export function attachReelPackage(project = {}, editorialPackage = {}) {
  const next = { ...project };
  const adapted = fromEditorialPackage(editorialPackage);
  next.article = adapted.article;
  next.categoryOptions = adapted.categoryOptions;
  next.selectedCategoryId = adapted.categoryOptions.find(option => option.recommended)?.id || adapted.categoryOptions[0]?.id || "";
  next.editorialDiagnosis = adapted.diagnosis;
  next.reelPlan = adapted.reel;
  next.editorialPackage = {
    ...editorialPackage,
    salidas: {
      ...(editorialPackage.salidas || {}),
      reel: adapted.reel
    }
  };
  return next;
}
