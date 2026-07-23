import { createCarouselProject } from "./models.js";
import { setProject, getProject } from "./state.js";
import { renderCarousel } from "./renderer.js";
import { renderSlideToCanvas } from "./canvas-renderer.js";
import { createDemoProject } from "./demo.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";
var activeSlideIndex = 0;

export function initUI() {
  window.removeEventListener("carousel:asset-ready", handleAssetReady);
  window.addEventListener("carousel:asset-ready", handleAssetReady);
  ensureBulkDownloadButton();

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
        project.article.images = Array.isArray(data.imagenes) ? data.imagenes : [];
        project.article.content = data.texto || "";
        project.article.summary = data.descripcion || "";
        project.settings.useSecondaryImages = false;
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
    toggleBulkDownloadButton(false);
    return;
  }

  if (activeSlideIndex >= renderedSlides.length) {
    activeSlideIndex = 0;
  }

  if (preview) {
    preview.innerHTML = renderedSlides.length + " slides generados";
  }
  toggleBulkDownloadButton(true);

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
    thumbs.appendChild(createThumbnailItem(item, i === activeSlideIndex, project));
  }

  var activeItem = renderedSlides[activeSlideIndex];
  stage.appendChild(createStageControls(project, activeItem));

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

function handleAssetReady() {
  var project = getProject();
  if (!project) return;
  renderInPreview();
}

function createStageControls(project, activeItem) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-stage-controls";

  if (hasSecondaryImages(project)) {
    wrap.appendChild(createSecondaryImagesControls(project));
  }

  if (activeItem && activeItem.slide && activeItem.slide.template === "cover") {
    wrap.appendChild(createCoverLogoControls(project));
  }

  return wrap;
}

function ensureBulkDownloadButton() {
  var header = document.querySelector(".carousel-panel-header");
  var status = document.getElementById("previewContent");
  if (!header || !status) return;

  var actions = document.getElementById("previewActions");
  if (!actions) {
    actions = document.createElement("div");
    actions.id = "previewActions";
    actions.className = "carousel-panel-actions";
    status.parentNode.insertBefore(actions, status);
    actions.appendChild(status);
  }

  var bulkBtn = document.getElementById("downloadAllBtn");
  if (bulkBtn) return;

  bulkBtn = document.createElement("button");
  bulkBtn.type = "button";
  bulkBtn.id = "downloadAllBtn";
  bulkBtn.className = "mm-btn carousel-bulk-btn";
  bulkBtn.textContent = "Descargar carrusel";
  bulkBtn.hidden = true;
  bulkBtn.addEventListener("click", downloadAllSlides);
  actions.appendChild(bulkBtn);
}

function toggleBulkDownloadButton(visible) {
  var bulkBtn = document.getElementById("downloadAllBtn");
  if (!bulkBtn) return;
  bulkBtn.hidden = !visible;
}

function createSlideSelectHandler(index) {
  return function () {
    activeSlideIndex = index;
    renderInPreview();
  };
}

function createThumbnailItem(item, isActive, project) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-thumb-card";

  var button = document.createElement("button");
  button.type = "button";
  button.className = "carousel-thumb" + (isActive ? " is-active" : "");
  button.addEventListener("click", createSlideSelectHandler(item.index));

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

  wrap.appendChild(button);
  wrap.appendChild(createThumbActions(item, project));

  return wrap;
}

function getSlideLabel(item, index) {
  var slide = item.slide || {};
  var title = slide.content && slide.content.title ? slide.content.title : "";
  if (title) return title;
  if (slide.type) return slide.type;
  return "Slide " + (index + 1);
}

function createThumbActions(item, project) {
  var actions = document.createElement("div");
  actions.className = "carousel-thumb-actions";

  var copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "carousel-thumb-action";
  copyBtn.textContent = "Copiar";
  copyBtn.addEventListener("click", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    await copySlideImage(item, project);
  });

  var downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.className = "carousel-thumb-action";
  downloadBtn.textContent = "PNG";
  downloadBtn.addEventListener("click", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    await downloadSlideImage(item, project);
  });

  actions.appendChild(copyBtn);
  actions.appendChild(downloadBtn);
  return actions;
}

async function copySlideImage(item, project) {
  var preview = document.getElementById("previewContent");
  try {
    var canvas = renderSlideToCanvas(item.slide, project);
    if (!canvas) throw new Error("No se pudo renderizar el slide.");
    var blob = await canvasToBlob(canvas);
    if (!blob) throw new Error("No se pudo generar la imagen.");
    if (typeof ClipboardItem !== "function" || !navigator.clipboard || !navigator.clipboard.write) {
      throw new Error("Clipboard no disponible.");
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type || "image/png"]: blob
      })
    ]);

    setStatus(preview, "Slide copiado");
  } catch (error) {
    setStatus(preview, "No se pudo copiar. Usa PNG.");
  }
}

async function downloadSlideImage(item, project, silent) {
  var preview = document.getElementById("previewContent");
  try {
    var canvas = renderSlideToCanvas(item.slide, project);
    if (!canvas) throw new Error("No se pudo renderizar el slide.");
    var blob = await canvasToBlob(canvas);
    if (!blob) throw new Error("No se pudo generar la imagen.");

    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    var fileName = buildSlideFileName(item);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);

    if (!silent) {
      setStatus(preview, "Descargando " + fileName);
    }
  } catch (error) {
    if (!silent) {
      setStatus(preview, "No se pudo descargar el slide.");
    }
  }
}

function canvasToBlob(canvas) {
  return new Promise(function (resolve) {
    canvas.toBlob(function (blob) {
      resolve(blob || null);
    }, "image/png");
  });
}

function buildSlideFileName(item) {
  var label = getSlideLabel(item, item.index)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  return "carousel-slide-" + String(item.index + 1).padStart(2, "0") + (label ? "-" + label : "") + ".png";
}

function setStatus(preview, message) {
  if (!preview) return;
  preview.textContent = message;
}

async function downloadAllSlides() {
  var preview = document.getElementById("previewContent");
  var project = getProject();
  if (!project || !project.slides || !project.slides.length) return;

  setStatus(preview, "Preparando descarga...");

  for (var i = 0; i < project.slides.length; i++) {
    var item = {
      index: i,
      slide: project.slides[i]
    };
    await downloadSlideImage(item, project, true);
    await wait(180);
  }

  setStatus(preview, project.slides.length + " slides descargados");
}

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function createCoverLogoControls(project) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-cover-controls";

  var label = document.createElement("span");
  label.className = "carousel-cover-controls-label";
  label.textContent = "Logo portada";
  wrap.appendChild(label);

  var current = (project.settings && project.settings.coverLogoPosition) || "center";
  var options = [
    { value: "right", label: "Arriba derecha" },
    { value: "center", label: "Centrado" },
    { value: "image-footer", label: "Pie de foto" }
  ];

  for (var i = 0; i < options.length; i++) {
    wrap.appendChild(createCoverLogoButton(project, options[i], current === options[i].value));
  }

  return wrap;
}

function createSecondaryImagesControls(project) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-cover-controls";

  var label = document.createElement("span");
  label.className = "carousel-cover-controls-label";
  label.textContent = "Fotos internas";
  wrap.appendChild(label);

  var onBtn = document.createElement("button");
  onBtn.type = "button";
  onBtn.className = "carousel-cover-chip" + (project.settings && project.settings.useSecondaryImages ? " is-active" : "");
  onBtn.textContent = "Usar";
  onBtn.addEventListener("click", async function () {
    await updateSecondaryImagesSetting(project, true);
  });

  var offBtn = document.createElement("button");
  offBtn.type = "button";
  offBtn.className = "carousel-cover-chip" + (!project.settings || !project.settings.useSecondaryImages ? " is-active" : "");
  offBtn.textContent = "No usar";
  offBtn.addEventListener("click", async function () {
    await updateSecondaryImagesSetting(project, false);
  });

  wrap.appendChild(onBtn);
  wrap.appendChild(offBtn);
  return wrap;
}

function createCoverLogoButton(project, option, isActive) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "carousel-cover-chip" + (isActive ? " is-active" : "");
  button.textContent = option.label;
  button.addEventListener("click", function () {
    if (!project.settings) project.settings = {};
    project.settings.coverLogoPosition = option.value;
    setProject(project);
    renderInPreview();
  });
  return button;
}

async function updateSecondaryImagesSetting(project, enabled) {
  if (!project.settings) project.settings = {};
  if (project.settings.useSecondaryImages === enabled) return;
  project.settings.useSecondaryImages = enabled;
  setProject(project);
  var engine = await import("./carousel-engine.js");
  await engine.generatePlan();
  renderInPreview();
}

function hasSecondaryImages(project) {
  return !!(project && project.article && Array.isArray(project.article.images) && project.article.images.length);
}
