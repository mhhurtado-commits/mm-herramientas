import { setDefaultProject, getProject, setProject } from "./state.js";
import { initUI } from "./ui.js";
import { buildCarouselPrompt } from "./prompts.js";
import { createSlide } from "./slide-model.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";

const TEMPLATE_MAP = {
  cover:   { template: "cover" },
  context: { template: "text" },
  facts:   { template: "stats" },
  impact:  { template: "text" },
  cta:     { template: "end" }
};

export function createCarousel() {
  setDefaultProject();
  initUI();
  console.log("Carousel listo");
}

function convertirPlanASlides(plan) {
  const slides = [];
  let order = 0;

  if (plan.cover) {
    const s = createSlide();
    s.id = "slide-" + order;
    s.type = "cover";
    s.template = "cover";
    s.order = order++;
    s.content.title = plan.cover.title || "";
    s.content.subtitle = plan.cover.subtitle || "";
    slides.push(s);
  }

  for (const item of plan.slides || []) {
    const map = TEMPLATE_MAP[item.type] || { template: "text" };
    const s = createSlide();
    s.id = "slide-" + order;
    s.type = item.type;
    s.template = map.template;
    s.order = order++;
    s.content.title = item.title || "";
    s.content.text = item.text || "";
    s.content.items = item.items || [];
    slides.push(s);
  }

  return slides;
}

export async function generatePlan() {
  const project = getProject();
  if (!project) return;

  const prompt = buildCarouselPrompt(project.article);

  try {
    const res = await fetch(WORKER + "/social/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: prompt,
        userMsg: "Generá el plan editorial para el carrusel."
      })
    });

    const data = await res.json();

    if (data.ok && data.result) {
      project.editorialPlan = data.result;
      project.slides = convertirPlanASlides(data.result);
      setProject(project);

      console.log("Carousel:");
      console.log("Artículo:");
      console.log(project.article.title || project.article.url);
      console.log("Slides:");
      console.log(project.slides.length);
    }
  } catch (e) {
    console.error("Error generando plan editorial:", e);
  }
}

export function loadTemplate(){}

export function renderSlide(){}

export function exportCarousel(){}
