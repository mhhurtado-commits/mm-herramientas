import { normalizeFocalPosition } from "./core/image.js";

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
  clave: "key",
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
  let type = EDITORIAL_TYPES[rawType]
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
  copyQuote(content, sourceContent.quote, source.quote);
  copyOptionalText(content, "author", sourceContent.author, source.author);
  copyOptionalText(content, "role", sourceContent.role, source.role);
  copyOptionalText(content, "source", sourceContent.source, source.source);
  copyOptionalText(content, "cta", sourceContent.cta, source.cta);
  const validation = firstText(sourceContent.validation, source.validation, sourceContent.quoteValidation, source.quoteValidation);
  const hasQuote = !!String(content.quote || "").trim();
  const quoteValidation = type === "cita" && !hasQuote && validation === "validated"
    ? "rejected"
    : validation;
  if (quoteValidation) {
    content.validation = quoteValidation;
    content.quoteValidation = quoteValidation;
  }
  if (type === "cita" && (quoteValidation !== "validated" || !hasQuote)) {
    type = "contexto";
    content.title = content.title || "Cita sin verificar";
    content.text = content.text || content.quote || "La cita no pudo verificarse en la nota.";
    delete content.quote;
    delete content.author;
    delete content.role;
  }
  if (type === "end") {
    content.source = content.source || content.title;
    content.cta = content.cta || content.text;
    content.text = "";
  }
  if (type === "imagen" && !content.image) {
    type = "contexto";
    content.title = content.title || "Imagen no disponible";
    content.text = content.text || "No hay una imagen verificable para esta diapositiva.";
  }
  const focalPosition = sourceContent.focalPosition !== undefined
    ? sourceContent.focalPosition
    : source.focalPosition !== undefined
      ? source.focalPosition
      : (sourceContent.focalX !== undefined || sourceContent.focalY !== undefined)
        ? { x: sourceContent.focalX, y: sourceContent.focalY }
        : undefined;
  if (focalPosition !== undefined) {
    const focus = normalizeFocalPosition(focalPosition);
    content.focalPosition = focus;
    content.focalX = focus.x;
    content.focalY = focus.y;
  }

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

function firstText(...values) {
  for (let i = 0; i < values.length; i++) {
    const value = cleanText(values[i]);
    if (value) return value;
  }
  return "";
}

function copyOptionalText(target, key, ...values) {
  const value = firstText(...values);
  if (value) target[key] = value;
}

function copyQuote(target, ...values) {
  for (let i = 0; i < values.length; i++) {
    const value = String(values[i] || "").trim();
    if (value) {
      target.quote = value;
      return;
    }
  }
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
