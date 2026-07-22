import { createCarouselProject } from "./models.js";
import { setProject } from "./state.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";

export function initUI() {
  const btn = document.getElementById("loadBtn");
  if (!btn) return;

  btn.addEventListener("click", async function () {
    const url = document.getElementById("urlInput").value.trim();
    if (!url) return;

    const preview = document.getElementById("previewContent");
    preview.innerHTML = "Cargando...";

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

      const imgHtml = project.article.image
        ? '<img src="' + project.article.image + '" style="max-width:200px;display:block;margin-bottom:8px" />'
        : "";

      preview.innerHTML =
        imgHtml +
        "<strong>Título:</strong> " + project.article.title + "<br>" +
        "<strong>Categoría:</strong> " + project.article.category + "<br>" +
        "<strong>Contenido:</strong> " + (project.article.content.length + " caracteres");
    } catch (e) {
      preview.innerHTML = "No fue posible obtener la noticia.";
    }
  });
}
