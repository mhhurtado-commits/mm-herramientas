export const CAROUSEL_PLAN_VERSION = "1.0";

const REQUIRED_SLIDE_TYPES = ["context", "facts", "impact", "cta"];
const MAX_FACT_ITEMS = 4;

export function normalizeCarouselPlan(rawPlan, article) {
  const errors = [];
  const source = isPlainObject(rawPlan) ? rawPlan : {};
  const normalizedArticle = normalizeArticle(article);
  const normalizedPlan = {
    version: CAROUSEL_PLAN_VERSION,
    article: normalizedArticle,
    cover: normalizeCover(source.cover, normalizedArticle, errors),
    slides: normalizeSlides(source.slides, normalizedArticle, errors)
  };

  return {
    ok: errors.length === 0,
    plan: normalizedPlan,
    errors: errors
  };
}

export function buildFallbackPlan(article) {
  return normalizeCarouselPlan({}, article).plan;
}

export function parseArticle(article) {
  return normalizeArticle(article);
}

function normalizeArticle(article) {
  const source = isPlainObject(article) ? article : {};
  return {
    url: cleanText(source.url),
    title: cleanText(source.title),
    category: cleanText(source.category),
    summary: cleanText(source.summary),
    image: cleanText(source.image)
  };
}

function normalizeCover(cover, article, errors) {
  const source = isPlainObject(cover) ? cover : {};
  const title = cleanText(source.title) || article.title || "Resumen de la nota";
  const subtitle = cleanText(source.subtitle) || article.summary || article.category || "";

  if (!cleanText(source.title)) {
    errors.push("cover.title faltante");
  }

  return {
    title: title,
    subtitle: subtitle
  };
}

function normalizeSlides(slides, article, errors) {
  const sourceSlides = Array.isArray(slides) ? slides : [];
  const slidesByType = {};

  for (let i = 0; i < sourceSlides.length; i++) {
    const item = sourceSlides[i];
    if (!isPlainObject(item) || !cleanText(item.type)) continue;
    const type = cleanText(item.type).toLowerCase();
    if (!slidesByType[type]) {
      slidesByType[type] = item;
    }
  }

  return REQUIRED_SLIDE_TYPES.map(function (type) {
    const normalized = normalizeSlide(type, slidesByType[type], article);
    if (!slidesByType[type]) {
      errors.push("slide type faltante: " + type);
    }
    if (!normalized.title) {
      errors.push("slide sin titulo: " + type);
    }
    return normalized;
  });
}

function normalizeSlide(type, slide, article) {
  const source = isPlainObject(slide) ? slide : {};
  const defaults = getSlideDefaults(type, article);
  const title = cleanText(source.title) || defaults.title;

  if (type === "facts") {
    const items = normalizeItems(source.items);
    return {
      type: type,
      title: title,
      items: items.length ? items : defaults.items
    };
  }

  return {
    type: type,
    title: title,
    text: cleanText(source.text) || defaults.text
  };
}

function getSlideDefaults(type, article) {
  const summary = article.summary || article.title || "Informacion principal";

  switch (type) {
    case "context":
      return {
        title: "Contexto",
        text: summary
      };
    case "facts":
      return {
        title: "Datos clave",
        items: buildFactFallbackItems(article)
      };
    case "impact":
      return {
        title: "Lo importante",
        text: article.title || summary
      };
    case "cta":
      return {
        title: "Segui la cobertura",
        text: article.url ? "Lee la nota completa en mediamendoza.com" : "Segui informado con Media Mendoza"
      };
    default:
      return {
        title: "Slide",
        text: summary
      };
  }
}

function buildFactFallbackItems(article) {
  const items = [];

  if (article.category) {
    items.push("Categoria: " + article.category);
  }
  if (article.title) {
    items.push(article.title);
  }
  if (article.summary) {
    items.push(article.summary);
  }
  if (article.url) {
    items.push("Fuente: Media Mendoza");
  }

  return items.slice(0, MAX_FACT_ITEMS);
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  const normalized = [];
  for (let i = 0; i < items.length; i++) {
    const item = cleanText(items[i]);
    if (!item) continue;
    normalized.push(item);
    if (normalized.length >= MAX_FACT_ITEMS) break;
  }

  return normalized;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
