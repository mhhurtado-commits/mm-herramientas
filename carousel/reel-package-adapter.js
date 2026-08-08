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
  output.scenes = scenes;
  return { article, reel: output, categoryOptions: shared.categoryOptions, diagnosis: shared.diagnosis };
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
