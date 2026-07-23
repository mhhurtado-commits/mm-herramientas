import { setDefaultProject, getProject, setProject } from "./state.js";
import { initUI } from "./ui.js";
import { buildCarouselPrompt } from "./prompts.js";
import { createSlide } from "./slide-model.js";
import { normalizeCarouselPlan } from "./parser.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";

const TEMPLATE_MAP = {
  cover: { template: "cover" },
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

function convertirPlanASlides(plan) {
  const slides = [];
  let order = 0;
  const theme = (plan.diagnosis && plan.diagnosis.template) || "mm_classic";

  if (plan.cover) {
    const slide = createSlide();
    slide.id = "slide-" + order;
    slide.type = "cover";
    slide.template = "cover";
    slide.order = order++;
    slide.content.title = plan.cover.title || "";
    slide.content.subtitle = plan.cover.subtitle || "";
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
    slide.content.text = item.text || "";
    slide.content.items = item.items || [];
    slide.style.theme = theme;
    slides.push(slide);
  }

  return slides;
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
      project.editorialPlan = parsed.plan;
      project.slides = convertirPlanASlides(parsed.plan);
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
