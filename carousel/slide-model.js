export function createSlide() {
  return {
    id: "",
    type: "",
    template: "",
    order: 0,
    content: {
      title: "",
      subtitle: "",
      text: "",
      items: [],
      image: ""
    },
    style: {
      theme: "default",
      background: "image",
      accent: ""
    }
  };
}

const EDITORIAL_TYPES = {
  cover: "cover",
  clave: "text",
  contexto: "text",
  dato: "stats",
  cita: "quote",
  imagen: "image",
  end: "end"
};

const LEGACY_TEMPLATES = {
  text: "contexto",
  stats: "dato",
  cover: "cover",
  end: "end"
};

const EDITORIAL_LABELS = {
  clave: "Clave",
  contexto: "Contexto",
  dato: "Dato",
  cita: "Cita",
  imagen: "Imagen",
  end: "Cierre"
};

export function getEditorialSlideLabel(type) {
  const normalizedType = cleanText(type).toLowerCase();
  return EDITORIAL_LABELS[normalizedType] || normalizedType;
}

export function normalizeCarouselSlide(slide, index, total) {
  const source = isPlainObject(slide) ? slide : {};
  const sourceContent = isPlainObject(source.content) ? source.content : {};
  const sourceStyle = isPlainObject(source.style) ? source.style : {};
  const rawType = cleanText(source.type).toLowerCase();
  const rawTemplate = cleanText(source.template).toLowerCase();
  const type = EDITORIAL_TYPES[rawType]
    ? rawType
    : LEGACY_TEMPLATES[rawTemplate] || "contexto";
  const content = {
    ...sourceContent,
    title: firstText(sourceContent.title, source.title),
    subtitle: firstText(sourceContent.subtitle, source.subtitle),
    text: firstText(sourceContent.text, source.text),
    items: Array.isArray(sourceContent.items) ? sourceContent.items : [],
    image: firstText(sourceContent.image, source.image)
  };

  return {
    ...source,
    type: type,
    template: EDITORIAL_TYPES[type],
    order: Number.isInteger(index) ? index : 0,
    total: Number.isInteger(total) ? total : 1,
    content: content,
    style: {
      ...sourceStyle,
      theme: firstText(sourceStyle.theme, "mm_editorial"),
      background: firstText(sourceStyle.background, "paper"),
      accent: firstText(sourceStyle.accent)
    }
  };
}

function firstText(value, fallback) {
  const primary = cleanText(value);
  return primary || cleanText(fallback);
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
