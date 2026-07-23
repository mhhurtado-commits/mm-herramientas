import { createCarouselProject } from "./models.js";
import { setProject, getProject } from "./state.js";
import { renderCarousel } from "./renderer.js";
import { renderSlideToCanvas } from "./canvas-renderer.js";
import { createDemoProject } from "./demo.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";
var activeSlideIndex = 0;

export function initUI() {
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

        activeSlideIndex = 0;
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
      activeSlideIndex = 0;
      renderInPreview();
    });
  }
}

function renderInPreview() {
  var preview = document.getElementById("previewContent");
  var carouselPreview = document.getElementById("carousel-preview");
  var project = getProject();
  var renderedSlides = renderCarousel(project);

  if (!carouselPreview) return;

  carouselPreview.innerHTML = "";

  if (!renderedSlides.length) {
    carouselPreview.innerHTML = '<div class="carousel-empty">Sin diapositivas</div>';
    if (preview) preview.innerHTML = "";
    return;
  }

  if (activeSlideIndex >= renderedSlides.length) {
    activeSlideIndex = 0;
  }

  if (preview) {
    preview.innerHTML = renderedSlides.length + " slides generados";
  }

  var editor = document.createElement("div");
  editor.className = "carousel-editor";

  var sidebar = document.createElement("div");
  sidebar.className = "carousel-sidebar";

  var thumbs = document.createElement("div");
  thumbs.className = "carousel-thumbs";

  var stage = document.createElement("div");
  stage.className = "carousel-stage";

  var stageInner = document.createElement("div");
  stageInner.className = "carousel-stage-inner";

  var stageMeta = document.createElement("div");
  stageMeta.className = "carousel-stage-meta";

  for (var i = 0; i < renderedSlides.length; i++) {
    var item = renderedSlides[i];
    var thumbButton = createThumbnailButton(item, i === activeSlideIndex);
    thumbButton.addEventListener("click", createSlideSelectHandler(i));
    thumbs.appendChild(thumbButton);
  }

  var activeItem = renderedSlides[activeSlideIndex];
  var activeCanvas = renderSlideToCanvas(activeItem.slide, project);
  if (activeCanvas) {
    activeCanvas.className = "carousel-canvas carousel-canvas--stage";
    stageInner.appendChild(activeCanvas);
  }

  stageMeta.textContent = getSlideLabel(activeItem, activeSlideIndex) + " de " + renderedSlides.length;

  sidebar.appendChild(thumbs);
  stage.appendChild(stageInner);
  stage.appendChild(stageMeta);
  editor.appendChild(sidebar);
  editor.appendChild(stage);
  carouselPreview.appendChild(editor);
}

function createSlideSelectHandler(index) {
  return function () {
    activeSlideIndex = index;
    renderInPreview();
  };
}

function createThumbnailButton(item, isActive) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "carousel-thumb" + (isActive ? " is-active" : "");

  var previewCanvas = item.canvas;
  previewCanvas.className = "carousel-thumb-canvas";

  var info = document.createElement("div");
  info.className = "carousel-thumb-info";

  var indexLabel = document.createElement("span");
  indexLabel.className = "carousel-thumb-index";
  indexLabel.textContent = (item.index + 1).toString().padStart(2, "0");

  var typeLabel = document.createElement("span");
  typeLabel.className = "carousel-thumb-type";
  typeLabel.textContent = getSlideLabel(item, item.index);

  info.appendChild(indexLabel);
  info.appendChild(typeLabel);

  button.appendChild(previewCanvas);
  button.appendChild(info);

  return button;
}

function getSlideLabel(item, index) {
  var slide = item.slide || {};
  var title = slide.content && slide.content.title ? slide.content.title : "";
  if (title) return title;
  if (slide.type) return slide.type;
  return "Slide " + (index + 1);
}
