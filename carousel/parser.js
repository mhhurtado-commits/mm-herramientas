export { normalizeCarouselSlide } from "./slide-model.js";

export const CAROUSEL_PLAN_VERSION = "1.2";

const MAX_FACT_ITEMS = 4;
const ALLOWED_NEWS_TYPES = ["breaking", "service", "institutional", "analysis", "data", "evergreen"];
const ALLOWED_COMPLEXITIES = ["brief", "medium", "deep"];
const ALLOWED_TONES = ["informative", "explainer", "chronological", "impact", "utility"];
const ALLOWED_CAROUSEL_TYPES = ["summary", "explainer", "timeline", "data_points", "service"];
const ALLOWED_TEMPLATES = ["mm_classic", "mm_briefing", "mm_impact"];
const ALLOWED_VERTICALS = ["policiales", "servicios", "sociales", "espectaculos", "clima", "deportes", "politica", "economia", "general"];

const CAROUSEL_STRUCTURES = {
  summary: ["context", "facts", "impact", "cta"],
  explainer: ["context", "impact", "facts", "impact", "cta"],
  timeline: ["context", "impact", "impact", "facts", "cta"],
  data_points: ["context", "facts", "facts", "cta"],
  service: ["context", "impact", "facts", "cta"]
};

const SLIDE_TYPE_ALIASES = {
  context: "contexto",
  facts: "dato",
  cta: "end"
};

const ALLOWED_SLIDE_TYPES = ["clave", "contexto", "dato", "cita", "imagen", "end", "impact"];

export function normalizeCarouselPlan(rawPlan, article) {
  const errors = [];
  const source = isPlainObject(rawPlan) ? rawPlan : {};
  const normalizedArticle = normalizeArticle(article);
  const diagnosis = normalizeDiagnosis(source.diagnosis, normalizedArticle, errors);
  const cover = normalizeCover(source.cover, normalizedArticle, diagnosis, errors);
  const slides = normalizeSlides(source.slides, normalizedArticle, diagnosis, errors);
  diagnosis.slide_count = slides.length + 1;
  const normalizedPlan = {
    version: CAROUSEL_PLAN_VERSION,
    article: normalizedArticle,
    diagnosis: diagnosis,
    cover: cover,
    slides: slides
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

function normalizeDiagnosis(diagnosis, article, errors) {
  const source = isPlainObject(diagnosis) ? diagnosis : {};
  const newsType = pickAllowed(source.news_type, ALLOWED_NEWS_TYPES, inferNewsType(article));
  const vertical = pickAllowed(source.vertical, ALLOWED_VERTICALS, inferVertical(article));
  const complexity = pickAllowed(source.complexity, ALLOWED_COMPLEXITIES, inferComplexity(article));
  const tone = pickAllowed(source.tone, ALLOWED_TONES, inferTone(newsType, vertical));
  const carouselType = pickAllowed(source.carousel_type, ALLOWED_CAROUSEL_TYPES, inferCarouselType(newsType, complexity, vertical));
  const template = pickAllowed(source.template, ALLOWED_TEMPLATES, inferTemplate(newsType, carouselType, tone, vertical));
  const slideCount = getSlideCountForCarouselType(carouselType, { vertical: vertical, complexity: complexity, news_type: newsType });
  const reason = cleanText(source.reason) || buildDiagnosisReason(newsType, carouselType, vertical, article);

  if (!cleanText(source.news_type)) errors.push("diagnosis.news_type faltante");
  if (!cleanText(source.vertical)) errors.push("diagnosis.vertical faltante");
  if (!cleanText(source.carousel_type)) errors.push("diagnosis.carousel_type faltante");
  if (!cleanText(source.template)) errors.push("diagnosis.template faltante");

  return {
    news_type: newsType,
    vertical: vertical,
    complexity: complexity,
    tone: tone,
    carousel_type: carouselType,
    template: template,
    slide_count: slideCount,
    reason: reason
  };
}

function normalizeCover(cover, article, diagnosis, errors) {
  const source = isPlainObject(cover) ? cover : {};
  const title = cleanText(source.title) || article.title || "Resumen de la nota";
  const subtitle = cleanText(source.subtitle) || article.summary || buildCoverSubtitle(diagnosis, article);

  if (!cleanText(source.title)) {
    errors.push("cover.title faltante");
  }

  return {
    title: title,
    subtitle: subtitle
  };
}

function normalizeSlides(slides, article, diagnosis, errors) {
  const sourceSlides = Array.isArray(slides) ? slides : [];
  const normalized = [];

  for (let i = 0; i < sourceSlides.length; i++) {
    const source = sourceSlides[i];
    if (!isPlainObject(source)) {
      errors.push("slide invalida en posicion " + (i + 1));
      continue;
    }

    const type = normalizeSlideType(source.type);
    if (!type) {
      errors.push("tipo de slide invalido en posicion " + (i + 1));
      continue;
    }

    const slide = normalizeSlide(type, source, article, diagnosis, i);
    if (!slide.title && type !== "cita") {
      errors.push("slide sin titulo en posicion " + (i + 1) + ": " + type);
    }
    normalized.push(slide);
  }

  if (normalized.length) {
    return normalized;
  }

  const expectedTypes = getExpectedSlideTypes(diagnosis.carousel_type, diagnosis);
  return expectedTypes.map(function (legacyType, index) {
    const type = normalizeSlideType(legacyType);
    errors.push("slide faltante en posicion " + (index + 1) + ": " + type);
    return normalizeSlide(type, {}, article, diagnosis, index);
  });
}

function normalizeSlide(type, slide, article, diagnosis, index) {
  const source = isPlainObject(slide) ? slide : {};
  const defaults = getSlideDefaults(type, article, diagnosis, index);
  const title = cleanText(source.title) || defaults.title;
  const normalized = {
    type: type,
    title: title,
    text: cleanText(source.text) || defaults.text
  };

  if (type === "dato") {
    const items = normalizeItems(source.items);
    normalized.items = items.length ? items : defaults.items;
  }

  const quote = cleanQuoteText(source.quote);
  if (quote) normalized.quote = quote;
  copyTextFields(normalized, source, ["author", "role", "image", "supportImage"]);
  return normalized;
}

function getSlideDefaults(type, article, diagnosis, index) {
  const summary = article.summary || article.title || "Informacion principal";
  const labels = getContextualLabels(diagnosis.carousel_type, diagnosis.vertical);

  if (type === "clave") {
    return {
      title: "La clave",
      text: summary
    };
  }

  if (type === "contexto") {
    return {
      title: labels.context[index] || "Contexto",
      text: summary
    };
  }

  if (type === "dato") {
    return {
      title: labels.facts[index] || "Datos clave",
      items: buildFactFallbackItems(article, diagnosis, index)
    };
  }

  if (type === "impact") {
    return {
      title: labels.impact[index] || "Lo importante",
      text: article.title || summary
    };
  }

  if (type === "cita") {
    return {
      title: "",
      text: ""
    };
  }

  if (type === "imagen") {
    return {
      title: "Imagen",
      text: ""
    };
  }

  if (type === "end") {
    return {
      title: labels.cta[index] || "Segui la cobertura",
      text: article.url ? "Lee la nota completa en mediamendoza.com" : "Segui informado con Media Mendoza"
    };
  }

  return {
    title: "Slide",
    text: summary
  };
}

function getContextualLabels(carouselType, vertical) {
  if (vertical === "clima" || vertical === "servicios") {
    return {
      context: ["Panorama"],
      facts: ["Datos utiles", "Recomendaciones"],
      impact: ["Que cambia"],
      cta: ["Consulta completa"]
    };
  }

  if (vertical === "policiales") {
    return {
      context: ["El hecho"],
      facts: ["Datos del caso", "Puntos bajo investigacion"],
      impact: ["Como ocurrio", "Estado de la causa"],
      cta: ["Sigue la cobertura"]
    };
  }

  if (vertical === "espectaculos" || vertical === "sociales") {
    return {
      context: ["La historia"],
      facts: ["Claves"],
      impact: ["Por que se habla de esto"],
      cta: ["Mas detalles"]
    };
  }

  switch (carouselType) {
    case "explainer":
      return {
        context: ["El contexto"],
        facts: ["Claves del caso"],
        impact: ["Que paso", "Por que importa"],
        cta: ["Mas informacion"]
      };
    case "timeline":
      return {
        context: ["Inicio"],
        facts: ["Puntos clave"],
        impact: ["Desarrollo", "Estado actual"],
        cta: ["Sigue la cobertura"]
      };
    case "data_points":
      return {
        context: ["Panorama"],
        facts: ["Datos principales", "Detalle adicional"],
        impact: [],
        cta: ["Mas informacion"]
      };
    case "service":
      return {
        context: ["Que hay que saber"],
        facts: ["Datos utiles"],
        impact: ["Que cambia"],
        cta: ["Informacion completa"]
      };
    case "summary":
    default:
      return {
        context: ["Contexto"],
        facts: ["Datos clave"],
        impact: ["Lo importante"],
        cta: ["Segui la cobertura"]
      };
  }
}

function buildFactFallbackItems(article, diagnosis, index) {
  const items = [];

  if (diagnosis.carousel_type === "data_points" && index > 1 && article.summary) {
    items.push(article.summary);
  }
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

function buildCoverSubtitle(diagnosis, article) {
  if (article.summary) return article.summary;

  switch (diagnosis.news_type) {
    case "service":
      return "Informacion util para seguir la noticia";
    case "data":
      return "Claves y datos para entender el tema";
    case "institutional":
      return "Resumen del hecho y sus puntos principales";
    default:
      return article.category || "";
  }
}

function buildDiagnosisReason(newsType, carouselType, vertical, article) {
  const base = article.title || article.summary || "nota";
  return "Se clasifica como " + newsType + " dentro del vertical " + vertical + " y conviene un carrusel tipo " + carouselType + " por el enfoque de la nota: " + base;
}

function inferNewsType(article) {
  const text = (article.title + " " + article.summary + " " + article.category).toLowerCase();
  if (matchesAny(text, ["servicio", "recomendacion", "transito", "cortes", "horarios", "clima"])) return "service";
  if (matchesAny(text, ["balance", "estadistica", "datos", "informe", "reporte"])) return "data";
  if (matchesAny(text, ["analisis", "claves", "explicacion"])) return "analysis";
  if (matchesAny(text, ["asociacion", "institucion", "municipio", "escuela"])) return "institutional";
  if (matchesAny(text, ["alerta", "urgente", "accidente", "incendio", "muerte", "fatal", "choque", "siniestro"])) return "breaking";
  return "evergreen";
}

function inferVertical(article) {
  const category = cleanText(article.category).toLowerCase();
  const text = (article.title + " " + article.summary + " " + article.category).toLowerCase();

  if (matchesAny(category + " " + text, ["policial", "policiales", "accidente", "crimen", "fiscal", "homicidio", "robo"])) return "policiales";
  if (matchesAny(category + " " + text, ["clima", "meteorologia", "nevadas", "temperatura", "alerta amarilla", "viento", "zonda"])) return "clima";
  if (matchesAny(category + " " + text, ["servicio", "transito", "cortes", "horarios", "recomendacion", "tramite"])) return "servicios";
  if (matchesAny(category + " " + text, ["espectaculo", "show", "cine", "serie", "musica", "famos", "artista"])) return "espectaculos";
  if (matchesAny(category + " " + text, ["social", "sociedad", "comunidad", "vecinos", "solidario", "asociacion civil"])) return "sociales";
  if (matchesAny(category + " " + text, ["deporte", "futbol", "tenis", "basquet", "liga", "seleccion"])) return "deportes";
  if (matchesAny(category + " " + text, ["politica", "gobierno", "senado", "diputados", "eleccion"])) return "politica";
  if (matchesAny(category + " " + text, ["economia", "dolar", "inflacion", "mercado", "salario"])) return "economia";
  return "general";
}

function inferComplexity(article) {
  const length = cleanText(article.summary).length + cleanText(article.title).length;
  if (length > 220) return "deep";
  if (length > 110) return "medium";
  return "brief";
}

function inferTone(newsType, vertical) {
  if (vertical === "clima" || vertical === "servicios") return "utility";
  if (vertical === "policiales") return "impact";
  if (vertical === "espectaculos" || vertical === "sociales") return "chronological";
  switch (newsType) {
    case "service":
      return "utility";
    case "analysis":
      return "explainer";
    case "data":
      return "informative";
    case "institutional":
      return "chronological";
    default:
      return "impact";
  }
}

function inferCarouselType(newsType, complexity, vertical) {
  if (vertical === "clima" || vertical === "servicios" || newsType === "service") return "service";
  if (vertical === "policiales" && complexity !== "brief") return "timeline";
  if (vertical === "espectaculos" || vertical === "sociales") return complexity === "deep" ? "explainer" : "summary";
  if (newsType === "data" || vertical === "economia") return "data_points";
  if (newsType === "analysis" || vertical === "politica") return "explainer";
  if (complexity === "deep") return "timeline";
  return "summary";
}

function inferTemplate(newsType, carouselType, tone, vertical) {
  if (vertical === "clima" || vertical === "servicios" || carouselType === "service" || carouselType === "data_points") {
    return "mm_briefing";
  }

  if (vertical === "policiales" || newsType === "breaking" || tone === "impact") {
    return "mm_impact";
  }

  if (vertical === "espectaculos" || vertical === "sociales") {
    return "mm_classic";
  }

  if (newsType === "analysis" || carouselType === "explainer" || carouselType === "timeline") {
    return "mm_briefing";
  }

  return "mm_classic";
}

function getExpectedSlideTypes(carouselType, diagnosis) {
  const vertical = diagnosis && diagnosis.vertical;
  const complexity = diagnosis && diagnosis.complexity;
  const newsType = diagnosis && diagnosis.news_type;

  if (carouselType === "service") {
    if (complexity === "deep") return ["context", "facts", "facts", "cta"];
    return ["context", "facts", "cta"];
  }

  if (carouselType === "data_points") {
    if (complexity === "deep" || vertical === "economia") return ["context", "facts", "facts", "impact", "cta"];
    return ["context", "facts", "facts", "cta"];
  }

  if (carouselType === "explainer") {
    if (complexity === "deep" || vertical === "politica") return ["context", "impact", "facts", "impact", "facts", "cta"];
    return ["context", "impact", "facts", "impact", "cta"];
  }

  if (carouselType === "timeline") {
    if (complexity === "deep" || vertical === "policiales" || newsType === "breaking") {
      return ["context", "impact", "facts", "impact", "facts", "cta"];
    }
    return ["context", "impact", "impact", "facts", "cta"];
  }

  if (carouselType === "summary") {
    if (vertical === "espectaculos" || vertical === "sociales" || complexity === "brief") {
      return ["context", "impact", "cta"];
    }
  }

  return CAROUSEL_STRUCTURES[carouselType] || CAROUSEL_STRUCTURES.summary;
}

function getSlideCountForCarouselType(carouselType, diagnosis) {
  return getExpectedSlideTypes(carouselType, diagnosis).length + 1;
}

function normalizeSlideType(type) {
  const cleaned = cleanText(type).toLowerCase();
  const normalized = SLIDE_TYPE_ALIASES[cleaned] || cleaned;
  return ALLOWED_SLIDE_TYPES.indexOf(normalized) >= 0 ? normalized : "";
}

function copyTextFields(target, source, fields) {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const value = cleanText(source[field]);
    if (value) target[field] = value;
  }
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

function pickAllowed(value, allowed, fallback) {
  const cleaned = cleanText(value).toLowerCase();
  return allowed.indexOf(cleaned) >= 0 ? cleaned : fallback;
}

function matchesAny(text, words) {
  for (let i = 0; i < words.length; i++) {
    if (text.indexOf(words[i]) >= 0) return true;
  }
  return false;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanQuoteText(value) {
  return String(value || "").trim();
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
