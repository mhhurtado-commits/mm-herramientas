import { setDefaultProject, getProject, setProject } from "./state.js";
import { initUI } from "./ui.js";
import { buildCarouselPrompt } from "./prompts.js";
import { createSlide } from "./slide-model.js";
import { normalizeCarouselPlan } from "./parser.js";
import { attachCarouselOutput, createEditorialEnvelope } from "./editorial-contract.js";
import { attachEditorialPackage, openCarouselFromEditorialPackage } from "./shared-package-adapter.js";
import { resolveArticleImage, resolveSupportImage } from "./image-provenance.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";

const TEMPLATE_MAP = {
  cover: { template: "cover" },
  clave: { template: "key" },
  contexto: { template: "text" },
  dato: { template: "stats" },
  cita: { template: "quote" },
  imagen: { template: "image" },
  end: { template: "end" },
  context: { template: "text" },
  facts: { template: "stats" },
  impact: { template: "text" },
  cta: { template: "end" }
};

export function createCarousel() {
  setDefaultProject();
  initUI();
  console.log("Carousel listo");
}

export function loadEditorialPackage(editorialPackage) {
  const project = getProject();
  const next = project
    ? attachEditorialPackage(project, editorialPackage)
    : openCarouselFromEditorialPackage(editorialPackage);
  if (next.editorialPlan?.cover && Array.isArray(next.editorialPlan.slides)) {
    next.slides = convertirPlanASlides(next.editorialPlan, next.article, next.settings, next.manualSlideImages);
    next.socialCopy = {
      ...(next.socialCopy || {}),
      caption: editorialPackage.redes?.instagram || next.socialCopy?.caption || '',
      hashtags: next.socialCopy?.hashtags || [],
    };
  }
  setProject(next);
  return next;
}

export function convertirPlanASlides(plan, article, settings, manualSlideImages) {
  const slides = [];
  let order = 0;
  const theme = (plan.diagnosis && plan.diagnosis.template) || "mm_classic";
  const supportImages = settings && settings.useSecondaryImages ? getSupportImages(article) : [];
  let supportIndex = 0;

  if (plan.cover) {
    const slide = createSlide();
    slide.id = "slide-" + order;
    slide.type = "cover";
    slide.template = "cover";
    slide.order = order++;
    slide.content.title = plan.cover.title || "";
    slide.content.subtitle = plan.cover.subtitle || "";
    slide.content.image = plan.cover.image || "";
    slide.content.imageOnly = Boolean(plan.cover.imageOnly);
    slide.style.theme = theme;
    slides.push(slide);
  }

  for (const item of plan.slides || []) {
    const map = TEMPLATE_MAP[item.type] || { template: "text" };
    const slide = createSlide();
    slide.id = "slide-" + order;
    slide.type = item.type;
    slide.template = map.template;
    slide.order = order++;
    slide.content.title = item.title || "";
    slide.content.text = item.type === "end" ? "" : (item.text || "");
    slide.content.items = Array.isArray(item.items) ? item.items.slice() : [];
    slide.content.quote = item.quote || "";
    slide.content.author = item.author || "";
    slide.content.role = item.role || "";
    slide.content.source = item.source || (item.type === "end" ? item.title || "" : "");
    slide.content.cta = item.cta || (item.type === "end" ? item.text || "" : "");
    slide.content.supportImage = resolveSupportImage(item.supportImage, article);
    const hasManualImageChoice = manualSlideImages && Object.prototype.hasOwnProperty.call(manualSlideImages, slide.id);
    const manualImage = hasManualImageChoice ? manualSlideImages[slide.id] || "" : "";
    if (hasManualImageChoice && item.type !== "imagen") {
      slide.content.supportImage = manualImage;
    }
    slide.content.quoteValidation = item.quoteValidation || "";
    slide.content.validation = item.validation || item.quoteValidation || "";
    if (item.focalPosition !== undefined) {
      slide.content.focalPosition = item.focalPosition;
    }
    if (!slide.content.supportImage && !hasManualImageChoice && supportsSecondaryImage(item.type) && supportImages[supportIndex]) {
      slide.content.supportImage = supportImages[supportIndex++];
    }
    if (item.type === "imagen") {
      const image = manualImage || resolveEditorialImage(item.image || item.imagen, article);
      if (image) {
        slide.content.image = image;
      } else {
        slide.type = "contexto";
        slide.template = "text";
        slide.content.title = item.title || "Imagen no disponible";
        slide.content.text = item.text || "No hay una imagen verificable para esta diapositiva.";
      }
    } else {
      slide.content.image = item.image || "";
    }
    slide.style.theme = theme;
    slides.push(slide);
  }

  return slides;
}

function supportsSecondaryImage(type) {
  return type === "contexto" || type === "dato" || type === "impact" || type === "context" || type === "facts";
}

export async function generatePlan() {
  const project = getProject();
  if (!project) return { ok: false, errors: ["Proyecto no inicializado"] };

  const prompt = buildCarouselPrompt(project.article);

  try {
    const res = await fetch(WORKER + "/social/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: prompt,
        userMsg: "Genera el plan editorial para el carrusel."
      })
    });

    const data = await res.json();

    if (data.ok && data.result) {
      const parsed = normalizeCarouselPlan(data.result, project.article);
      if (!parsed.ok) {
        console.warn("Carousel plan rejected:", parsed.errors);
        return parsed;
      }
      project.editorialPlan = parsed.plan;
      project.slides = convertirPlanASlides(parsed.plan, project.article, project.settings, project.manualSlideImages);
      project.editorialPackage = attachCarouselOutput(
        createEditorialEnvelope(project.article, parsed.plan.diagnosis),
        parsed.plan,
        project.socialCopy
      );
      setProject(project);

      console.log("Carousel:");
      console.log("Articulo:");
      console.log(project.article.title || project.article.url);
      if (parsed.plan.diagnosis) {
        console.log("Diagnostico:");
        console.log(
          parsed.plan.diagnosis.news_type +
            " / " +
            parsed.plan.diagnosis.carousel_type +
            " / " +
            parsed.plan.diagnosis.template
        );
      }
      console.log("Slides:");
      console.log(project.slides.length);

      if (parsed.errors.length) {
        console.warn("Carousel plan normalized with warnings:", parsed.errors);
      }

      return parsed;
    }
  } catch (e) {
    console.error("Error generando plan editorial:", e);
    return { ok: false, errors: [e.message || "Error generando plan editorial"] };
  }

  return { ok: false, errors: ["No se recibio un plan editorial valido"] };
}

export function loadTemplate() {}

export function renderSlide() {}

export function exportCarousel() {}

function getSupportImages(article) {
  if (!article || !Array.isArray(article.images)) return [];
  const cover = article.image || "";
  const seen = new Set();
  const out = [];
  for (let i = 0; i < article.images.length; i++) {
    const img = String(article.images[i] || "").trim();
    if (!img || img === cover || seen.has(img)) continue;
    seen.add(img);
    out.push(img);
  }
  return out;
}

function resolveEditorialImage(reference, article) {
  return resolveArticleImage(reference, article);
}
