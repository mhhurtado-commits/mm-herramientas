import { createCarouselProject } from "./models.js";
import { setProject, getProject } from "./state.js";
import { generatePlan } from "./carousel-engine.js";
import { renderCarousel } from "./renderer.js";
import { createDemoProject } from "./demo.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";

export function initUI() {
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

        await generatePlan();

        renderInPreview();
      } catch (e) {
        if (preview) preview.innerHTML = "No fue posible obtener la noticia.";
      }
    });
  }

  var demoBtn = document.getElementById("demoBtn");
  if (demoBtn) {
    demoBtn.addEventListener("click", function () {
      var project = createDemoProject();
      setProject(project);
      renderInPreview();
    });
  }
}

function renderInPreview() {
  var preview = document.getElementById("previewContent");
  if (preview) preview.innerHTML = "";

  var carouselPreview = document.getElementById("carousel-preview");
  if (carouselPreview) {
    carouselPreview.innerHTML = "";
    renderCarousel(getProject());
  }
}
