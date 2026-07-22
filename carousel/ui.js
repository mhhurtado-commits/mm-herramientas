import { createCarouselProject } from "./models.js";
import { setProject, getProject } from "./state.js";
import { renderCarousel } from "./renderer.js";
import { createDemoProject } from "./demo.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";

console.log("UI");

export function initUI() {
  console.log("INIT UI");
  var container = document.getElementById("previewPanel");
  if (container) {
    var previewDiv = document.createElement("div");
    previewDiv.id = "carousel-preview";
    container.appendChild(previewDiv);
  }

  var loadBtn = document.getElementById("loadBtn");
  if (loadBtn) {
    loadBtn.addEventListener("click", async function () {
      const url = document.getElementById("urlInput").value.trim();
      if (!url) return;

      const preview = document.getElementById("previewContent");
      if (preview) preview.innerHTML = "Cargando...";

      try {
        const res = await fetch(WORKER + "/scrape?url=" + encodeURIComponent(url));
        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "Error del servidor");
        }

        const project = createCarouselProject();
        project.article.url = data.url || url;
        project.article.title = data.titulo || "";
        project.article.category = data.categoria || "";
        project.article.image = data.imagen || "";
        project.article.content = data.texto || "";
        project.article.summary = data.descripcion || "";
        setProject(project);

        if (preview) preview.innerHTML = "Generando plan editorial...";

        var engine = await import("./carousel-engine.js");
        await engine.generatePlan();

        renderInPreview();
      } catch (e) {
        if (preview) preview.innerHTML = "No fue posible obtener la noticia.";
      }
    });
  }

  var demoBtn = document.getElementById("demoBtn");
  console.log("demoBtn:", demoBtn);
  if (demoBtn) {
    demoBtn.addEventListener("click", function () {
      console.log("CLICK DEMO");
      try {
        var project = createDemoProject();
        console.log("demo project created, slides:", project.slides.length);
        setProject(project);
        renderInPreview();
      } catch (e) {
        console.log("EXCEPTION in DEMO click:", e);
      }
    });
  }
}

function renderInPreview() {
  console.log("RENDER IN PREVIEW");
  try {
    var preview = document.getElementById("previewContent");
    if (preview) preview.innerHTML = "";

    var carouselPreview = document.getElementById("carousel-preview");
    console.log("carousel-preview element:", carouselPreview);
    if (carouselPreview) {
      carouselPreview.innerHTML = "";
      var proj = getProject();
      console.log("project slides:", proj ? proj.slides.length : "NO PROJECT");
      renderCarousel(proj);
    } else {
      console.log("ERROR: #carousel-preview is null");
    }
  } catch (e) {
    console.log("EXCEPTION in renderInPreview:", e);
  }
}
