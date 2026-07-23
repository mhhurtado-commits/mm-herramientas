import { createCarouselProject } from "./models.js";
import { setProject, getProject } from "./state.js";
import { renderCarousel } from "./renderer.js";
import { renderSlideToCanvas } from "./canvas-renderer.js";
import { createDemoProject } from "./demo.js";
import { attachCarouselOutput, attachReelOutput } from "./editorial-contract.js";
import { buildInstagramCaptionPrompt, buildReelPrompt } from "./prompts.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";
var activeSlideIndex = 0;

export function initUI() {
  window.removeEventListener("carousel:asset-ready", handleAssetReady);
  window.addEventListener("carousel:asset-ready", handleAssetReady);
  ensureBulkDownloadButton();
  ensureCaptionPanel();
  ensureReelPanel();
  ensureReelStoryboardPanel();

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
        await generateInstagramCaption(project);
        await generateReelPlan(project);

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

  var clearBtn = document.getElementById("clearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearCarouselWorkspace);
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
    renderCaptionPanel(project);
    renderReelPanel(project);
    renderReelStoryboard(project);
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
  renderCaptionPanel(project);
  renderReelPanel(project);
  renderReelStoryboard(project);
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

function ensureCaptionPanel() {
  var previewPanel = document.getElementById("previewPanel");
  if (!previewPanel || document.getElementById("captionPanel")) return;

  var panel = document.createElement("div");
  panel.id = "captionPanel";
  panel.className = "carousel-copy-panel";
  panel.hidden = true;

  var header = document.createElement("div");
  header.className = "carousel-copy-header";

  var titles = document.createElement("div");
  var label = document.createElement("div");
  label.className = "carousel-section-label";
  label.textContent = "Instagram";
  var title = document.createElement("strong");
  title.className = "carousel-copy-title";
  title.textContent = "Texto sugerido";
  titles.appendChild(label);
  titles.appendChild(title);

  var copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.id = "copyCaptionBtn";
  copyBtn.className = "mm-btn";
  copyBtn.textContent = "Copiar texto";
  copyBtn.addEventListener("click", copyInstagramCaption);

  header.appendChild(titles);
  header.appendChild(copyBtn);

  var textarea = document.createElement("textarea");
  textarea.id = "captionOutput";
  textarea.className = "carousel-copy-text";
  textarea.readOnly = true;
  textarea.placeholder = "Cuando generes un carrusel desde una nota, aca aparecera el copy sugerido para Instagram.";

  panel.appendChild(header);
  panel.appendChild(textarea);
  previewPanel.appendChild(panel);
}

function ensureReelPanel() {
  var previewPanel = document.getElementById("previewPanel");
  if (!previewPanel || document.getElementById("reelPlanPanel")) return;

  var panel = document.createElement("div");
  panel.id = "reelPlanPanel";
  panel.className = "carousel-copy-panel";
  panel.hidden = true;

  var header = document.createElement("div");
  header.className = "carousel-copy-header";

  var titles = document.createElement("div");
  var label = document.createElement("div");
  label.className = "carousel-section-label";
  label.textContent = "Reel";
  var title = document.createElement("strong");
  title.className = "carousel-copy-title";
  title.textContent = "Plan JSON";
  titles.appendChild(label);
  titles.appendChild(title);

  var copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.id = "copyReelBtn";
  copyBtn.className = "mm-btn";
  copyBtn.textContent = "Copiar JSON";
  copyBtn.addEventListener("click", copyReelPlanJson);

  header.appendChild(titles);
  header.appendChild(copyBtn);

  var textarea = document.createElement("textarea");
  textarea.id = "reelPlanOutput";
  textarea.className = "carousel-copy-text carousel-copy-text--code";
  textarea.readOnly = true;
  textarea.placeholder = "Aca aparecera el ReelPlan JSON generado desde la misma noticia.";

  panel.appendChild(header);
  panel.appendChild(textarea);
  previewPanel.appendChild(panel);
}

function ensureReelStoryboardPanel() {
  var previewPanel = document.getElementById("previewPanel");
  if (!previewPanel || document.getElementById("reelStoryboardPanel")) return;

  var panel = document.createElement("div");
  panel.id = "reelStoryboardPanel";
  panel.className = "carousel-copy-panel";
  panel.hidden = true;

  var header = document.createElement("div");
  header.className = "carousel-copy-header";

  var titles = document.createElement("div");
  var label = document.createElement("div");
  label.className = "carousel-section-label";
  label.textContent = "Reel";
  var title = document.createElement("strong");
  title.className = "carousel-copy-title";
  title.textContent = "Storyboard";
  titles.appendChild(label);
  titles.appendChild(title);

  header.appendChild(titles);

  var grid = document.createElement("div");
  grid.id = "reelStoryboardGrid";
  grid.className = "reel-storyboard-grid";

  panel.appendChild(header);
  panel.appendChild(grid);
  previewPanel.appendChild(panel);
}

function renderCaptionPanel(project) {
  var panel = document.getElementById("captionPanel");
  var textarea = document.getElementById("captionOutput");
  if (!panel || !textarea) return;

  var caption = buildCaptionText(project);
  panel.hidden = !caption;
  textarea.value = caption;
}

function renderReelPanel(project) {
  var panel = document.getElementById("reelPlanPanel");
  var textarea = document.getElementById("reelPlanOutput");
  if (!panel || !textarea) return;

  var reelJson = buildReelPlanText(project);
  panel.hidden = !reelJson;
  textarea.value = reelJson;
}

function renderReelStoryboard(project) {
  var panel = document.getElementById("reelStoryboardPanel");
  var grid = document.getElementById("reelStoryboardGrid");
  if (!panel || !grid) return;

  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes) || !reel.scenes.length) {
    panel.hidden = true;
    grid.innerHTML = "";
    return;
  }

  panel.hidden = false;
  grid.innerHTML = "";

  for (var i = 0; i < reel.scenes.length; i++) {
    grid.appendChild(createReelSceneCard(reel.scenes[i], project));
  }
}

function buildCaptionText(project) {
  if (!project || !project.socialCopy) return "";
  var caption = String(project.socialCopy.caption || "").trim();
  var hashtags = Array.isArray(project.socialCopy.hashtags) ? project.socialCopy.hashtags.filter(Boolean) : [];
  if (!caption && !hashtags.length) return "";
  return caption + (hashtags.length ? "\n\n" + hashtags.join(" ") : "");
}

function buildReelPlanText(project) {
  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes) || !reel.scenes.length) return "";
  return JSON.stringify(reel, null, 2);
}

function getReelOutput(project) {
  if (!project || !project.editorialPackage || !project.editorialPackage.outputs) return null;
  return project.editorialPackage.outputs.reel || null;
}

function createReelSceneCard(scene, project) {
  var card = document.createElement("article");
  card.className = "reel-scene-card";

  var media = document.createElement("div");
  media.className = "reel-scene-media";

  var imgUrl = resolveReelSceneImage(scene, project);
  if (imgUrl && scene.visual_type !== "text_card") {
    var img = document.createElement("img");
    img.className = "reel-scene-image";
    img.src = toRenderableSceneImageUrl(imgUrl);
    img.alt = scene.text || scene.visual_role || "Escena del reel";
    media.appendChild(img);
  } else {
    var placeholder = document.createElement("div");
    placeholder.className = "reel-scene-placeholder";
    placeholder.textContent = scene.visual_type === "text_card" ? "" : "Sin imagen";
    media.appendChild(placeholder);
  }

  var overlay = document.createElement("div");
  overlay.className = "reel-scene-overlay" + (scene.visual_type === "text_card" ? " is-text-card" : "");

  var roleChip = document.createElement("span");
  roleChip.className = "reel-scene-chip";
  roleChip.textContent = scene.visual_role || scene.visual_type || "escena";
  overlay.appendChild(roleChip);

  var visualTitle = document.createElement("strong");
  visualTitle.className = "reel-scene-visual-title";
  visualTitle.textContent = scene.text || "Sin texto principal";
  overlay.appendChild(visualTitle);

  if (scene.subtitle) {
    var visualSubtitle = document.createElement("p");
    visualSubtitle.className = "reel-scene-visual-subtitle";
    visualSubtitle.textContent = scene.subtitle;
    overlay.appendChild(visualSubtitle);
  }

  media.appendChild(overlay);

  var body = document.createElement("div");
  body.className = "reel-scene-body";

  var top = document.createElement("div");
  top.className = "reel-scene-top";

  var index = document.createElement("span");
  index.className = "reel-scene-index";
  index.textContent = "Escena " + String(scene.order || 0).padStart(2, "0");

  var timing = document.createElement("span");
  timing.className = "reel-scene-timing";
  timing.textContent = formatSceneDuration(scene.duration_ms);

  top.appendChild(index);
  top.appendChild(timing);

  var role = document.createElement("div");
  role.className = "reel-scene-role";
  role.textContent = scene.visual_role || scene.visual_type || "Escena";

  var title = document.createElement("h3");
  title.className = "reel-scene-title";
  title.textContent = scene.text || "Sin texto principal";

  var subtitle = document.createElement("p");
  subtitle.className = "reel-scene-subtitle";
  subtitle.textContent = scene.subtitle || "";

  var source = document.createElement("div");
  source.className = "reel-scene-source";
  source.textContent = scene.visual_source || "";

  body.appendChild(top);
  body.appendChild(role);
  body.appendChild(title);
  body.appendChild(subtitle);
  body.appendChild(source);

  card.appendChild(media);
  card.appendChild(body);
  return card;
}

function resolveReelSceneImage(scene, project) {
  if (!scene || !project || !project.article) return "";
  var article = project.article;
  var source = String(scene.visual_source || "");

  if (source === "article.image") return article.image || "";

  var match = source.match(/^article\.images\[(\d+)\]$/);
  if (match && Array.isArray(article.images)) {
    var idx = Number(match[1]);
    return article.images[idx] || "";
  }

  return "";
}

function formatSceneDuration(durationMs) {
  var ms = Number(durationMs || 0);
  if (!ms) return "";
  return (ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1) + " s";
}

function toRenderableSceneImageUrl(imgUrl) {
  if (!imgUrl) return "";
  if (imgUrl.indexOf("data:") === 0 || imgUrl.indexOf("blob:") === 0) return imgUrl;
  if (imgUrl.indexOf(WORKER + "?image=") === 0) return imgUrl;
  if (/^https?:\/\//i.test(imgUrl)) return WORKER + "?image=" + encodeURIComponent(imgUrl);
  return imgUrl;
}

function toggleBulkDownloadButton(visible) {
  var bulkBtn = document.getElementById("downloadAllBtn");
  if (!bulkBtn) return;
  bulkBtn.hidden = !visible;
}

async function copyInstagramCaption() {
  var preview = document.getElementById("previewContent");
  var textarea = document.getElementById("captionOutput");
  if (!textarea || !textarea.value.trim()) return;
  try {
    await navigator.clipboard.writeText(textarea.value);
    setStatus(preview, "Texto de Instagram copiado");
  } catch (error) {
    setStatus(preview, "No se pudo copiar el texto");
  }
}

async function copyReelPlanJson() {
  var preview = document.getElementById("previewContent");
  var textarea = document.getElementById("reelPlanOutput");
  if (!textarea || !textarea.value.trim()) return;
  try {
    await navigator.clipboard.writeText(textarea.value);
    setStatus(preview, "ReelPlan copiado");
  } catch (error) {
    setStatus(preview, "No se pudo copiar el ReelPlan");
  }
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

function clearCarouselWorkspace() {
  var hasInput = !!document.getElementById("urlInput").value.trim();
  var project = getProject();
  var hasContent = !!(project && (project.article.title || (project.slides && project.slides.length)));
  if (!hasInput && !hasContent) return;

  if (!window.confirm("Se va a limpiar la URL, el editor y el texto sugerido. Queres continuar?")) {
    return;
  }

  document.getElementById("urlInput").value = "";
  setProject(createCarouselProject());
  activeSlideIndex = 0;
  renderInPreview();
}

async function generateInstagramCaption(project) {
  if (!project || !project.article) return;
  try {
    const res = await fetch(WORKER + "/social/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: buildInstagramCaptionPrompt(project.article, project.editorialPlan),
        userMsg: "Genera el caption para Instagram del carrusel."
      })
    });

    const data = await res.json();
    if (!data.ok || !data.result) return;

    project.socialCopy.caption = data.result.caption || "";
    project.socialCopy.hashtags = Array.isArray(data.result.hashtags) ? data.result.hashtags : [];
    if (project.editorialPackage && project.editorialPlan) {
      project.editorialPackage = attachCarouselOutput(project.editorialPackage, project.editorialPlan, project.socialCopy);
    }
    setProject(project);
  } catch (error) {
    project.socialCopy.caption = "";
    project.socialCopy.hashtags = [];
    if (project.editorialPackage && project.editorialPlan) {
      project.editorialPackage = attachCarouselOutput(project.editorialPackage, project.editorialPlan, project.socialCopy);
    }
    setProject(project);
  }
}

async function generateReelPlan(project) {
  if (!project || !project.article || !project.editorialPlan || !project.editorialPlan.diagnosis) return;
  try {
    const res = await fetch(WORKER + "/social/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: buildReelPrompt(project.article, project.editorialPlan.diagnosis),
        userMsg: "Genera el ReelPlan para esta noticia."
      })
    });

    const data = await res.json();
    if (!data.ok || !data.result) return;

    project.reelPlan = data.result;
    if (project.editorialPackage) {
      project.editorialPackage = attachReelOutput(project.editorialPackage, data.result);
    }
    setProject(project);
  } catch (error) {
    project.reelPlan = null;
    if (project.editorialPackage) {
      project.editorialPackage = attachReelOutput(project.editorialPackage, null);
    }
    setProject(project);
  }
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
