import { createCarouselProject } from "./models.js";
import { setProject, getProject } from "./state.js";
import { renderCarousel } from "./renderer.js";
import { getEditorialSlideLabel } from "./slide-model.js";
import { normalizeFocalPosition } from "./core/image.js";
import { preloadCarouselAssets, renderSlideToCanvas } from "./canvas-renderer.js";
import { attachCarouselOutput } from "./editorial-contract.js";
import { buildInstagramCaptionPrompt } from "./prompts.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";
var activeSlideIndex = 0;

export function initUI() {
  window.removeEventListener("carousel:asset-ready", handleAssetReady);
  window.addEventListener("carousel:asset-ready", handleAssetReady);
  window.removeEventListener("carousel:asset-error", handleAssetReady);
  window.addEventListener("carousel:asset-error", handleAssetReady);
  ensureBulkDownloadButton();
  ensureCaptionPanel();
  consumeEditorialHandoff();

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
        activeSlideIndex = 0;
        renderInPreview();
      } catch (e) {
        if (preview) preview.innerHTML = "No fue posible obtener la noticia.";
      }
    });
  }

  var clearBtn = document.getElementById("clearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearCarouselWorkspace);
  }
}

async function consumeEditorialHandoff() {
  const raw = window.sessionStorage?.getItem('mm-editorial-handoff');
  if (!raw) return;
  window.sessionStorage.removeItem('mm-editorial-handoff');
  let handoff;
  try { handoff = JSON.parse(raw); } catch { return; }
  if (!handoff?.package || handoff.output !== 'carrusel') return;

  const urlInput = document.getElementById('urlInput');
  const preview = document.getElementById('previewContent');
  if (urlInput) urlInput.value = handoff.package.fuente?.url || '';
  if (preview) preview.textContent = 'Generando carrusel...';

  try {
    const engine = await import('./carousel-engine.js');
    engine.loadEditorialPackage(handoff.package);
    const project = getProject();
    if (!handoff.package.salidas?.carrusel) {
      await engine.generatePlan();
      await generateInstagramCaption(project);
    }
    activeSlideIndex = 0;
    renderInPreview();
  } catch (error) {
    console.error('No se pudo abrir la salida editorial:', error);
    if (preview) preview.textContent = 'No se pudo generar esta salida. Podés reintentar desde Cargar noticia.';
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
    bindCanvasFocalDrag(activeCanvas, project, activeItem.slide);
  }
  var activeExportEligibility = getCarouselExportEligibility([{
    item: activeItem,
    index: activeSlideIndex,
    canvas: activeCanvas
  }]);

  stageMeta.textContent = getSlideLabel(activeItem, activeSlideIndex) + " de " + renderedSlides.length;

  sidebar.appendChild(thumbs);
  stage.appendChild(stageInner);
  stage.appendChild(stageMeta);
  if (!activeExportEligibility.allowed) {
    var overflowWarning = document.createElement("div");
    overflowWarning.className = "carousel-overflow-warning";
    overflowWarning.setAttribute("role", "alert");
    overflowWarning.textContent = activeExportEligibility.warning;
    stage.appendChild(overflowWarning);
  }
  editor.appendChild(sidebar);
  editor.appendChild(stage);
  carouselPreview.appendChild(editor);
  renderCaptionPanel(project);
}

function handleAssetReady() {
  var project = getProject();
  if (!project) return;
  renderInPreview();
}

function bindCanvasFocalDrag(canvas, project, slide) {
  if (!canvas || !supportsFocalPoint(slide)) return;
  canvas.classList.add("is-focal-draggable");
  canvas.style.touchAction = "none";
  canvas.title = "Arrastrá la imagen para ajustar el encuadre";
  var start = null;
  canvas.addEventListener("pointerdown", function (event) {
    if (event.button !== 0) return;
    var rect = canvas.getBoundingClientRect();
    start = { x: event.clientX, y: event.clientY };
    start.rect = { width: rect.width, height: rect.height };
    start.focus = normalizeFocalPosition(slide.content && slide.content.focalPosition);
    canvas.classList.add("is-focal-dragging");
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  canvas.addEventListener("pointermove", function (event) {
    if (!start) return;
    var next = getDraggedFocalPosition(start.focus, {
      x: event.clientX - start.x,
      y: event.clientY - start.y,
    }, start.rect);
    updateSlideFocalPosition(project, slide.id, next);
    refreshDraggedCanvas(canvas, project, slide);
    event.preventDefault();
  });
  canvas.addEventListener("pointerup", function (event) {
    if (!start) return;
    start = null;
    canvas.classList.remove("is-focal-dragging");
    canvas.releasePointerCapture?.(event.pointerId);
    renderInPreview();
  });
  canvas.addEventListener("pointercancel", function () {
    start = null;
    canvas.classList.remove("is-focal-dragging");
  });
  canvas.addEventListener("lostpointercapture", function () {
    start = null;
    canvas.classList.remove("is-focal-dragging");
  });
}

function refreshDraggedCanvas(canvas, project, slide) {
  var frame = renderSlideToCanvas(slide, project);
  if (!frame || !canvas || !canvas.getContext) return;
  canvas.width = frame.width;
  canvas.height = frame.height;
  canvas.getContext("2d").drawImage(frame, 0, 0);
}

export function getDraggedFocalPosition(current, delta, size) {
  var focus = normalizeFocalPosition(current);
  var width = Math.max(1, Number(size && size.width) || 1);
  var height = Math.max(1, Number(size && size.height) || 1);
  return normalizeFocalPosition({
    x: focus.x - (Number(delta && delta.x) || 0) / width,
    y: focus.y - (Number(delta && delta.y) || 0) / height,
  });
}

function createStageControls(project, activeItem) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-stage-controls";

  if (project.categoryOptions && project.categoryOptions.length > 1) {
    wrap.appendChild(createCategoryControls(project));
  }

  if (hasSecondaryImages(project)) {
    wrap.appendChild(createSecondaryImagesControls(project));
  }

  if (activeItem && activeItem.slide && activeItem.slide.template === "cover") {
    wrap.appendChild(createCoverLogoControls(project));
  }

  if (activeItem && isCarouselInternalScene(activeItem.slide)) {
    wrap.appendChild(createCarouselSupportImageControls(project, activeItem.slide));
  }

  if (activeItem && supportsFocalPoint(activeItem.slide)) {
    wrap.appendChild(createFocalPointControls(project, activeItem.slide));
  }

  return wrap;
}

function isCarouselInternalScene(slide) {
  return !!slide && slide.template !== "cover" && slide.template !== "end";
}

function createCarouselSupportImageControls(project, slide) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-cover-controls carousel-interior-image-controls";

  var label = document.createElement("span");
  label.className = "carousel-cover-controls-label";
  label.textContent = "Imagen interior";
  wrap.appendChild(label);

  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.className = "carousel-interior-image-input";
  input.setAttribute("aria-label", "Cargar imagen para esta diapositiva");
  input.addEventListener("change", function () {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      updateCarouselSlideSupportImage(project, slide, String(reader.result || ""), file.name);
    };
    reader.readAsDataURL(file);
  });
  wrap.appendChild(input);

  if (slide.content && slide.content.supportImage) {
    var clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "carousel-cover-chip";
    clearButton.textContent = "Quitar";
    clearButton.addEventListener("click", function () {
      updateCarouselSlideSupportImage(project, slide, "", "");
    });
    wrap.appendChild(clearButton);
  }

  return wrap;
}

function updateCarouselSlideSupportImage(project, slide, source, name) {
  if (!project || !slide) return;
  project.manualSlideImages = { ...(project.manualSlideImages || {}), [slide.id]: source };
  const isImageSlide = slide.type === "imagen" || slide.template === "image";
  if (isImageSlide) {
    const originalImage = slide.content?.originalImage || slide.content?.image || "";
    slide.content = { ...(slide.content || {}), originalImage, image: source || originalImage };
  } else {
    slide.content = { ...(slide.content || {}), supportImage: source };
  }
  if (name) slide.content.supportImageName = name;
  else delete slide.content.supportImageName;
  setProject(project);
  renderInPreview();
}

function createCategoryControls(project) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-category-controls";
  var label = document.createElement("span");
  label.className = "carousel-cover-controls-label";
  label.textContent = "Familia editorial";
  wrap.appendChild(label);

  project.categoryOptions.forEach(function (option) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "carousel-cover-chip" + (project.selectedCategoryId === option.id ? " is-active" : "");
    button.textContent = option.label;
    button.addEventListener("click", function () {
      project.selectedCategoryId = option.id;
      project.article.category = option.label;
      project.editorialDiagnosis = {
        ...(project.editorialDiagnosis || {}),
        vertical: option.vertical,
      };
      (project.slides || []).forEach(function (slide) {
        slide.style = { ...(slide.style || {}), vertical: option.vertical, accent: "" };
      });
      if (project.editorialPackage && project.editorialPackage.editorial) {
        project.editorialPackage.editorial.seccion = option.label;
      }
      setProject(project);
      renderInPreview();
    });
    wrap.appendChild(button);
  });
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
  bulkBtn.dataset.available = "false";
  bulkBtn.hidden = true;
  bulkBtn.addEventListener("click", downloadAllSlides);
  actions.appendChild(bulkBtn);
}

function ensureCaptionPanel() {
  var host = document.getElementById("captionPanelHost");
  if (!host || document.getElementById("captionPanel")) return;

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
  textarea.placeholder = "Cuando generes una publicacion desde una nota, aca aparecera el copy sugerido para Instagram.";

  panel.appendChild(header);
  panel.appendChild(textarea);
  host.appendChild(panel);
}

function ensureReelPreviewPanel() {
  var host = document.getElementById("reelPreviewPanelHost");
  if (!host || document.getElementById("reelPreviewPanel")) return;

  var panel = document.createElement("div");
  panel.id = "reelPreviewPanel";
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
  title.textContent = "Escenas del Reel";
  titles.appendChild(label);
  titles.appendChild(title);

  var actions = document.createElement("div");
  actions.className = "carousel-copy-actions";

  var meta = document.createElement("div");
  meta.id = "reelPreviewMeta";
  meta.className = "carousel-status carousel-status--inline";

  var copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.id = "copyReelSceneBtn";
  copyBtn.className = "mm-btn";
  copyBtn.textContent = "Copiar escena";
  copyBtn.addEventListener("click", copyActiveReelScene);

  var playBtn = document.createElement("button");
  playBtn.type = "button";
  playBtn.id = "playReelBtn";
  playBtn.className = "mm-btn";
  playBtn.textContent = "Reproducir";
  playBtn.addEventListener("click", toggleReelPlayback);

  var pngBtn = document.createElement("button");
  pngBtn.type = "button";
  pngBtn.id = "downloadReelSceneBtn";
  pngBtn.className = "mm-btn";
  pngBtn.textContent = "Descargar PNG";
  pngBtn.addEventListener("click", downloadActiveReelScene);

  var sequenceBtn = document.createElement("button");
  sequenceBtn.type = "button";
  sequenceBtn.id = "downloadAllReelScenesBtn";
  sequenceBtn.className = "mm-btn";
  sequenceBtn.textContent = "Descargar escenas";
  sequenceBtn.addEventListener("click", downloadAllReelScenes);

  var videoBtn = document.createElement("button");
  videoBtn.type = "button";
  videoBtn.id = "downloadReelVideoBtn";
  videoBtn.className = "mm-btn";
  videoBtn.textContent = "Descargar video";
  videoBtn.addEventListener("click", downloadReelVideo);

  actions.appendChild(playBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(pngBtn);
  actions.appendChild(sequenceBtn);
  actions.appendChild(videoBtn);

  var side = document.createElement("div");
  side.className = "carousel-copy-side";
  side.appendChild(meta);
  side.appendChild(actions);

  header.appendChild(titles);
  header.appendChild(side);

  var layout = document.createElement("div");
  layout.className = "reel-preview-layout";

  var thumbs = document.createElement("div");
  thumbs.id = "reelPreviewThumbs";
  thumbs.className = "reel-preview-thumbs";

  var stage = document.createElement("div");
  stage.className = "reel-preview-stage-wrap";

  var controls = document.createElement("div");
  controls.id = "reelPreviewControls";
  controls.className = "reel-preview-controls";
  controls.hidden = true;

  var frame = document.createElement("div");
  frame.id = "reelPreviewStage";
  frame.className = "reel-preview-stage";

  stage.appendChild(frame);
  layout.appendChild(thumbs);
  layout.appendChild(stage);

  panel.appendChild(header);
  panel.appendChild(controls);
  panel.appendChild(layout);
  host.appendChild(panel);
}

function ensureReelCaptionPanel() {
  var host = document.getElementById("reelCaptionPanelHost");
  if (!host || document.getElementById("reelCaptionPanel")) return;

  var panel = document.createElement("div");
  panel.id = "reelCaptionPanel";
  panel.className = "carousel-copy-panel reel-caption-panel";
  panel.hidden = true;

  var header = document.createElement("div");
  header.className = "carousel-copy-header";

  var titles = document.createElement("div");
  var label = document.createElement("div");
  label.className = "carousel-section-label";
  label.textContent = "Instagram";
  var title = document.createElement("strong");
  title.className = "carousel-copy-title";
  title.textContent = "Texto para publicar";
  titles.appendChild(label);
  titles.appendChild(title);

  var copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "mm-btn";
  copyBtn.textContent = "Copiar texto";
  copyBtn.addEventListener("click", copyReelCaption);

  header.appendChild(titles);
  header.appendChild(copyBtn);

  var textarea = document.createElement("textarea");
  textarea.id = "reelCaptionOutput";
  textarea.className = "carousel-copy-text";
  textarea.readOnly = true;
  textarea.placeholder = "Aca aparecera el texto sugerido para publicar el Reel.";

  panel.appendChild(header);
  panel.appendChild(textarea);
  host.appendChild(panel);
}

function renderCaptionPanel(project) {
  var panel = document.getElementById("captionPanel");
  var textarea = document.getElementById("captionOutput");
  if (!panel || !textarea) return;

  var caption = buildCaptionText(project);
  panel.hidden = !caption;
  textarea.value = caption;
}

function renderReelCaptionPanel(project) {
  var panel = document.getElementById("reelCaptionPanel");
  var textarea = document.getElementById("reelCaptionOutput");
  if (!panel || !textarea) return;

  var caption = buildReelCaptionText(project);
  panel.hidden = !caption;
  textarea.value = caption;
}

function renderReelPreview(project) {
  var panel = document.getElementById("reelPreviewPanel");
  var thumbs = document.getElementById("reelPreviewThumbs");
  var stage = document.getElementById("reelPreviewStage");
  var meta = document.getElementById("reelPreviewMeta");
  var controls = document.getElementById("reelPreviewControls");
  if (!panel || !thumbs || !stage || !meta) return;

  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes) || !reel.scenes.length) {
    panel.hidden = true;
    thumbs.innerHTML = "";
    stage.innerHTML = "";
    meta.textContent = "";
    return;
  }

  if (activeReelSceneIndex >= reel.scenes.length) {
    activeReelSceneIndex = 0;
  }

  panel.hidden = false;
  thumbs.innerHTML = "";
  stage.innerHTML = "";

  for (var i = 0; i < reel.scenes.length; i++) {
    thumbs.appendChild(createReelPreviewThumb(reel.scenes[i], i, project));
  }

  var activeScene = reel.scenes[activeReelSceneIndex];
  if (controls) {
    controls.innerHTML = "";
    var hasReelControls = isReelCoverScene(activeScene) || isReelInternalScene(activeScene) || (project.categoryOptions && project.categoryOptions.length > 1);
    controls.hidden = !hasReelControls;
    if (isReelCoverScene(activeScene)) {
      controls.appendChild(createCoverLogoControls(project));
    }
    if (isReelInternalScene(activeScene)) {
      controls.appendChild(createReelSupportImageControls(project, activeScene));
    }
    if (project.categoryOptions && project.categoryOptions.length > 1) {
      controls.appendChild(createCategoryControls(project));
    }
  }
  var sceneCanvas = renderReelSceneToCanvas(activeScene, project);
  if (sceneCanvas) {
    sceneCanvas.className = "reel-preview-canvas";
    stage.appendChild(sceneCanvas);
  } else {
    stage.appendChild(createReelPreviewFrame(activeScene, project, false));
  }

  meta.textContent = "Escena " + String(activeReelSceneIndex + 1).padStart(2, "0") + " de " + reel.scenes.length;
}

function isReelCoverScene(scene) {
  return !!scene && (scene.visual_type === "cover_image" || scene.visual_role === "hook");
}

function isReelInternalScene(scene) {
  if (!scene || isReelCoverScene(scene)) return false;
  var role = String(scene.visual_role || "").toLowerCase();
  var layout = String(scene.layout || "").toLowerCase();
  return role !== "cta" && role !== "conclusion" && layout !== "cta";
}

function createReelSupportImageControls(project, scene) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-cover-controls carousel-reel-image-controls";

  var label = document.createElement("span");
  label.className = "carousel-cover-controls-label";
  label.textContent = "Imagen de apoyo";
  wrap.appendChild(label);

  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.className = "carousel-reel-image-input";
  input.addEventListener("change", function () {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      updateReelSceneSupportImage(project, scene, String(reader.result || ""), file.name);
    };
    reader.readAsDataURL(file);
  });
  wrap.appendChild(input);

  if (scene.visual_type === "support_image" && scene.visual_source) {
    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "carousel-cover-chip";
    clearBtn.textContent = "Quitar";
    clearBtn.addEventListener("click", function () {
      updateReelSceneSupportImage(project, scene, "", "");
    });
    wrap.appendChild(clearBtn);
  }

  return wrap;
}

function updateReelSceneSupportImage(project, scene, source, name) {
  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes)) return;
  var target = reel.scenes[activeReelSceneIndex];
  if (!target) return;
  target.visual_source = source;
  target.visual_type = source ? "support_image" : "text";
  if (name) target.support_image_name = name;
  else delete target.support_image_name;
  if (project.reelPlan && Array.isArray(project.reelPlan.scenes)) {
    project.reelPlan.scenes[activeReelSceneIndex] = target;
  }
  setProject(project);
  renderReelPreview(project);
}

function buildCaptionText(project) {
  if (!project || !project.socialCopy) return "";
  var caption = String(project.socialCopy.caption || "").trim();
  var hashtags = Array.isArray(project.socialCopy.hashtags) ? project.socialCopy.hashtags.filter(Boolean) : [];
  if (!caption && !hashtags.length) return "";
  return caption + (hashtags.length ? "\n\n" + hashtags.join(" ") : "");
}

function buildReelCaptionText(project) {
  var reel = getReelOutput(project);
  if (!reel) return "";
  var caption = String(reel.caption || "").trim();
  var hashtags = Array.isArray(reel.hashtags) ? reel.hashtags.filter(Boolean) : [];
  if (!caption && !hashtags.length) return "";
  return caption + (hashtags.length ? "\n\n" + hashtags.join(" ") : "");
}

function getReelOutput(project) {
  if (!project || !project.editorialPackage) return null;
  return project.editorialPackage.outputs?.reel || project.editorialPackage.salidas?.reel || null;
}

function createReelPreviewThumb(scene, index, project) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "reel-preview-thumb" + (index === activeReelSceneIndex ? " is-active" : "");
  button.addEventListener("click", function () {
    if (reelPlaybackTimer || reelPlaybackAnimationFrame) stopReelPlayback();
    activeReelSceneIndex = index;
    renderReelPreview(project);
  });

  button.appendChild(createReelPreviewFrame(scene, project, true));

  var meta = document.createElement("div");
  meta.className = "reel-preview-thumb-meta";

  var indexLabel = document.createElement("span");
  indexLabel.className = "reel-preview-thumb-index";
  indexLabel.textContent = "Escena " + String(index + 1).padStart(2, "0");

  var label = document.createElement("span");
  label.className = "reel-preview-thumb-label";
  label.textContent = getPreviewSceneLabel(scene, project);

  meta.appendChild(indexLabel);
  meta.appendChild(label);
  button.appendChild(meta);
  return button;
}

function createReelPreviewFrame(scene, project, compact) {
  var media = document.createElement("div");
  media.className = "reel-scene-media" + (compact ? " is-compact" : " is-stage");

  var family = resolveReelSceneFamily(scene, project);
  var imgUrl = resolveReelSceneImage(scene, project);
  var hasImageFamily = family === "cover" || family === "image";

  var overlay = document.createElement("div");
  overlay.className = "reel-scene-overlay" + (hasImageFamily ? "" : " is-text-card");

  if (imgUrl && hasImageFamily) {
    var img = document.createElement("img");
    img.className = "reel-scene-image";
    img.alt = scene.text || scene.visual_role || "Escena del reel";
    img.onerror = function () {
      if (!img.parentNode) return;
      img.remove();

      var placeholder = document.createElement("div");
      placeholder.className = "reel-scene-placeholder is-text-card";
      placeholder.textContent = "";
      media.insertBefore(placeholder, overlay);
      overlay.classList.add("is-text-card");
    };
    media.appendChild(img);
    img.src = toRenderableSceneImageUrl(imgUrl);
  } else {
    var placeholder = document.createElement("div");
    placeholder.className = "reel-scene-placeholder" + (hasImageFamily ? "" : " is-text-card");
    placeholder.textContent = "";
    media.appendChild(placeholder);
  }

  var roleChip = document.createElement("span");
  roleChip.className = "reel-scene-chip";
  roleChip.textContent = getPreviewSceneLabel(scene, project);
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

  var footer = document.createElement("div");
  footer.className = "reel-scene-brand";
  footer.textContent = "Media Mendoza";
  overlay.appendChild(footer);

  media.appendChild(overlay);
  return media;
}

function resolveReelSceneImage(scene, project) {
  if (!scene || !project || !project.article) return "";
  var article = project.article;
  var source = String(scene.visual_source || "");

  if (/^(data:|blob:|https?:\/\/)/i.test(source)) return source;

  if (source === "article.image") return article.image || "";

  var match = source.match(/^article\.images\[(\d+)\]$/);
  if (match && project.settings && project.settings.useSecondaryImages && Array.isArray(article.images)) {
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

function formatReelRoleLabel(value) {
  var key = String(value || "").trim().toLowerCase();
  var labels = {
    hook: "Apertura",
    context: "Contexto",
    key_fact: "Dato clave",
    facts: "Datos",
    details: "Detalle",
    investigation: "Investigacion",
    conclusion: "Cierre",
    cta: "Llamado",
    cover_image: "Portada",
    support_image: "Imagen de apoyo",
    text_card: "Placa de texto"
  };
  return labels[key] || humanizeReelLabel(key) || "Escena";
}

function formatReelSourceLabel(scene, project) {
  var key = String(scene && scene.visual_source ? scene.visual_source : "").trim();
  if (!key) return "";
  if (key === "article.image") return "Imagen principal";
  if (key === "generated") return "Placa editorial";
  if (/^(data:|blob:)/i.test(key)) return "Imagen manual";

  var match = key.match(/^article\.images\[(\d+)\]$/);
  if (match) {
    if (!resolveReelSceneImage(scene, project)) return "";
    return "Imagen interna " + String(Number(match[1]) + 1).padStart(2, "0");
  }

  return humanizeReelLabel(key);
}

function getPreviewSceneLabel(scene, project) {
  var hasImage = !!resolveReelSceneImage(scene, project);
  if (!hasImage && scene && scene.visual_type === "support_image") {
    return "Placa editorial";
  }
  return formatReelRoleLabel(scene.visual_role || scene.visual_type || "escena");
}

function humanizeReelLabel(value) {
  return String(value || "")
    .replace(/^article\./, "")
    .replace(/[_\.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
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
  bulkBtn.dataset.available = visible ? "true" : "false";
  syncBulkDownloadButtonVisibility();
}

function syncBulkDownloadButtonVisibility() {
  var bulkBtn = document.getElementById("downloadAllBtn");
  if (!bulkBtn) return;
  var isAvailable = bulkBtn.dataset.available === "true";
  bulkBtn.hidden = !isAvailable;
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

async function copyReelCaption() {
  var preview = document.getElementById("previewContent");
  var textarea = document.getElementById("reelCaptionOutput");
  if (!textarea || !textarea.value.trim()) return;
  try {
    await navigator.clipboard.writeText(textarea.value);
    setStatus(preview, "Texto del Reel copiado");
  } catch (error) {
    setStatus(preview, "No se pudo copiar el texto del Reel");
  }
}

function toggleReelPlayback() {
  if (reelPlaybackTimer) {
    stopReelPlayback();
    return;
  }

  var project = getProject();
  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes) || !reel.scenes.length) return;

  var button = document.getElementById("playReelBtn");
  if (button) button.textContent = "Detener";
  advanceReelPlayback(project);
}

function advanceReelPlayback(project) {
  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes) || !reel.scenes.length) {
    stopReelPlayback();
    return;
  }

  renderReelPreview(project);
  var scene = reel.scenes[activeReelSceneIndex];
  var duration = Math.max(1200, Number(scene && scene.duration_ms) || 2500);
  reelPlaybackTimer = window.setTimeout(function () {
    reelPlaybackTimer = null;
    var nextIndex = (activeReelSceneIndex + 1) % reel.scenes.length;
    animateReelPreviewTransition(
      project,
      scene,
      reel.scenes[nextIndex],
      getReelTransitionDurationMs(reel.scenes[nextIndex]),
      nextIndex,
      function () {
        advanceReelPlayback(project);
      }
    );
  }, duration);
}

function animateReelPreviewTransition(project, currentScene, nextScene, durationMs, nextIndex, onComplete) {
  var stage = document.getElementById("reelPreviewStage");
  if (!stage || !currentScene || !nextScene) {
    activeReelSceneIndex = nextIndex;
    if (onComplete) onComplete();
    return;
  }

  var currentCanvas = renderReelSceneToCanvas(currentScene, project);
  var nextCanvas = renderReelSceneToCanvas(nextScene, project);
  if (!currentCanvas || !nextCanvas) {
    activeReelSceneIndex = nextIndex;
    if (onComplete) onComplete();
    return;
  }

  var transitionCanvas = document.createElement("canvas");
  transitionCanvas.width = 1080;
  transitionCanvas.height = 1920;
  transitionCanvas.className = "reel-preview-canvas";
  var ctx = transitionCanvas.getContext("2d");
  stage.innerHTML = "";
  stage.appendChild(transitionCanvas);

  var startedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  var direction = isReelCtaScene(nextScene) ? 0.35 : (nextIndex % 2 === 0 ? 1 : -1);
  var transitionLength = Math.max(240, Number(durationMs) || INTERNAL_TRANSITION_MS);

  function drawFrame(timestamp) {
    var now = timestamp || (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
    var progress = Math.min(1, (now - startedAt) / transitionLength);
    ctx.clearRect(0, 0, 1080, 1920);
    drawReelTransitionFrame(ctx, currentCanvas, nextCanvas, progress, direction);

    if (progress < 1 && reelPlaybackAnimationFrame !== null) {
      reelPlaybackAnimationFrame = window.requestAnimationFrame(drawFrame);
      return;
    }

    reelPlaybackAnimationFrame = null;
    activeReelSceneIndex = nextIndex;
    renderReelPreview(project);
    if (onComplete) onComplete();
  }

  reelPlaybackAnimationFrame = window.requestAnimationFrame(drawFrame);
}

function stopReelPlayback() {
  if (reelPlaybackTimer) {
    window.clearTimeout(reelPlaybackTimer);
    reelPlaybackTimer = null;
  }
  if (reelPlaybackAnimationFrame !== null) {
    window.cancelAnimationFrame(reelPlaybackAnimationFrame);
    reelPlaybackAnimationFrame = null;
  }
  var button = document.getElementById("playReelBtn");
  if (button) button.textContent = "Reproducir";
}

async function copyActiveReelScene() {
  var project = getProject();
  var preview = document.getElementById("previewContent");
  var scene = getActiveReelScene(project);
  if (!scene) return;

  try {
    var canvas = renderReelSceneToCanvas(scene, project);
    if (!canvas) throw new Error("No se pudo renderizar la escena.");
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

    setStatus(preview, "Escena de Reel copiada");
  } catch (error) {
    setStatus(preview, "No se pudo copiar la escena");
  }
}

async function downloadActiveReelScene() {
  var project = getProject();
  var scene = getActiveReelScene(project);
  if (!scene) return;
  await downloadReelSceneImage(scene, activeReelSceneIndex, project, false);
}

async function downloadAllReelScenes() {
  var preview = document.getElementById("previewContent");
  var project = getProject();
  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes) || !reel.scenes.length) return;

  setStatus(preview, "Preparando escenas del Reel...");

  for (var i = 0; i < reel.scenes.length; i++) {
    await downloadReelSceneImage(reel.scenes[i], i, project, true);
    await wait(180);
  }

  setStatus(preview, reel.scenes.length + " escenas de Reel descargadas");
}

async function downloadReelVideo() {
  var preview = document.getElementById("previewContent");
  var project = getProject();
  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes) || !reel.scenes.length) return;

  if (typeof MediaRecorder !== "function") {
    setStatus(preview, "Tu navegador no permite exportar video");
    return;
  }

  var mimeType = getSupportedReelVideoType();
  if (!mimeType) {
    setStatus(preview, "No hay formato de video compatible");
    return;
  }

  setStatus(preview, "Preparando video del Reel...");

  try {
    await preloadReelSceneAssets(reel.scenes, project);
    var blob = await recordReelVideo(reel.scenes, project, mimeType);
    if (!blob) throw new Error("No se pudo generar el video.");

    var ext = mimeType.indexOf("webm") >= 0 ? "webm" : "video";
    var fileName = buildReelVideoFileName(project, ext);
    downloadBlob(blob, fileName);
    setStatus(preview, "Video del Reel listo");
  } catch (error) {
    setStatus(preview, "No se pudo exportar el video");
  }
}

function getActiveReelScene(project) {
  var reel = getReelOutput(project);
  if (!reel || !Array.isArray(reel.scenes) || !reel.scenes.length) return null;
  if (activeReelSceneIndex >= reel.scenes.length) activeReelSceneIndex = 0;
  return reel.scenes[activeReelSceneIndex];
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
  button.className = "carousel-thumb" + (item.slide && item.slide.type === "clave" ? " is-clave" : "") + (isActive ? " is-active" : "");
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

export function getSlideLabel(item, index) {
  var slide = item.slide || {};
  var title = slide.content && slide.content.title ? slide.content.title : "";
  if (slide.type && getEditorialSlideLabel(slide.type) !== slide.type) {
    return getEditorialSlideLabel(slide.type);
  }
  if (title) return title;
  if (slide.type) return getEditorialSlideLabel(slide.type);
  if (slide.template) return slide.template;
  return "Slide " + (index + 1);
}

export function getCarouselExportEligibility(renderedSlides) {
  var overflowed = [];
  for (var i = 0; i < renderedSlides.length; i++) {
    var rendered = renderedSlides[i] || {};
    var canvas = rendered.canvas || rendered;
    if (canvas && (canvas.editorialOverflow === true || (canvas.renderState && canvas.renderState.overflow === true))) {
      overflowed.push(rendered);
    }
  }

  if (!overflowed.length) {
    return { allowed: true, warning: "" };
  }

  var first = overflowed[0];
  var item = first.item || {};
  var index = typeof first.index === "number" ? first.index : 0;
  var canvas = first.canvas || first;
  var block = getOverflowBlockLabel(canvas);
  return {
    allowed: false,
    warning: "El slide " + String(index + 1).padStart(2, "0") + " (" + getSlideLabel(item, index) + ", " + block + ") tiene texto desbordado. Acortá el texto para exportar."
  };
}

function getOverflowBlockLabel(canvas) {
  var blocks = canvas && canvas.renderState && Array.isArray(canvas.renderState.blocks) ? canvas.renderState.blocks : [];
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].overflow) {
      return blocks[i].role ? "bloque " + blocks[i].role : "bloque de texto";
    }
  }
  return "bloque de texto";
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

export async function copySlideImage(item, project) {
  var preview = document.getElementById("previewContent");
  try {
    await preloadCarouselAssets([item.slide], project);
    var canvas = renderSlideToCanvas(item.slide, project);
    if (!canvas) throw new Error("No se pudo renderizar el slide.");
    var exportEligibility = getCarouselExportEligibility([{ item: item, index: item.index, canvas: canvas }]);
    if (!exportEligibility.allowed) {
      setStatus(preview, exportEligibility.warning);
      return false;
    }
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
    return true;
  } catch (error) {
    setStatus(preview, "No se pudo copiar. Usa PNG.");
    return false;
  }
}

async function downloadSlideImage(item, project, silent, renderedCanvas) {
  var preview = document.getElementById("previewContent");
  try {
    await preloadCarouselAssets([item.slide], project);
    var canvas = renderedCanvas || renderSlideToCanvas(item.slide, project);
    if (!canvas) throw new Error("No se pudo renderizar el slide.");
    var exportEligibility = getCarouselExportEligibility([{ item: item, index: item.index, canvas: canvas }]);
    if (!exportEligibility.allowed) {
      setStatus(preview, exportEligibility.warning);
      return false;
    }
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
    return true;
  } catch (error) {
    if (!silent) {
      setStatus(preview, "No se pudo descargar el slide.");
    }
    return false;
  }
}

async function downloadReelSceneImage(scene, index, project, silent) {
  var preview = document.getElementById("previewContent");
  try {
    var canvas = renderReelSceneToCanvas(scene, project);
    if (!canvas) throw new Error("No se pudo renderizar la escena.");
    var blob = await canvasToBlob(canvas);
    if (!blob) throw new Error("No se pudo generar la imagen.");

    var fileName = buildReelSceneFileName(scene, index);
    downloadBlob(blob, fileName);

    if (!silent) {
      setStatus(preview, "Descargando " + fileName);
    }
  } catch (error) {
    if (!silent) {
      setStatus(preview, "No se pudo descargar la escena");
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

function buildReelSceneFileName(scene, index) {
  var label = String(scene && scene.text ? scene.text : "escena")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  return "reel-scene-" + String(index + 1).padStart(2, "0") + (label ? "-" + label : "") + ".png";
}

function buildReelVideoFileName(project, ext) {
  var title = String(project && project.article && project.article.title ? project.article.title : "reel")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return "reel-" + (title || "mediamendoza") + "." + ext;
}

function downloadBlob(blob, fileName) {
  var link = document.createElement("a");
  var url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);
}

var COVER_TRANSITION_MS = 520;
var INTERNAL_TRANSITION_MS = 360;
var CTA_TRANSITION_MS = 620;
var TRANSITION_FPS = 30;

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function drawReelTransitionFrame(ctx, currentCanvas, nextCanvas, progress, direction) {
  var easedProgress = easeOutCubic(progress);
  var nextOffset = direction * (1 - easedProgress) * 28;

  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.drawImage(currentCanvas, 0, 0, 1080, 1920);
  ctx.globalAlpha = progress;
  ctx.drawImage(nextCanvas, 0, nextOffset, 1080, 1920);
  ctx.restore();
}

function isReelCtaScene(scene) {
  var layout = String(scene && scene.layout || "").toLowerCase();
  var role = String(scene && scene.visual_role || "").toLowerCase();
  return layout === "cta" || role === "cta" || role === "conclusion";
}

function isReelCoverSceneForTransition(scene) {
  return !!scene && (scene.visual_type === "cover_image" || scene.visual_role === "hook");
}

function getReelTransitionDurationMs(scene) {
  if (isReelCtaScene(scene)) return CTA_TRANSITION_MS;
  if (isReelCoverSceneForTransition(scene)) return COVER_TRANSITION_MS;
  return INTERNAL_TRANSITION_MS;
}

function getSupportedReelVideoType() {
  if (typeof MediaRecorder !== "function" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "video/webm";
  }

  var types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];

  for (var i = 0; i < types.length; i++) {
    if (MediaRecorder.isTypeSupported(types[i])) return types[i];
  }

  return "";
}

async function recordReelVideo(scenes, project, mimeType) {
  var fps = TRANSITION_FPS;
  var renderedScenes = [];

  for (var i = 0; i < scenes.length; i++) {
    var renderedCanvas = renderReelSceneToCanvas(scenes[i], project);
    if (renderedCanvas) {
      renderedScenes.push({ scene: scenes[i], canvas: renderedCanvas });
    }
  }

  if (!renderedScenes.length) return null;

  var stageCanvas = document.createElement("canvas");
  stageCanvas.width = 1080;
  stageCanvas.height = 1920;
  var ctx = stageCanvas.getContext("2d");
  var stream = stageCanvas.captureStream(fps);
  var chunks = [];

  var recorder = new MediaRecorder(stream, {
    mimeType: mimeType,
    videoBitsPerSecond: 8000000
  });

  recorder.ondataavailable = function (event) {
    if (event.data && event.data.size) chunks.push(event.data);
  };

  var stopPromise = new Promise(function (resolve) {
    recorder.onstop = function () {
      resolve(new Blob(chunks, { type: mimeType }));
    };
  });

  recorder.start();

  for (var i = 0; i < renderedScenes.length; i++) {
    var current = renderedScenes[i];
    var durationMs = Math.max(1200, Number(current.scene.duration_ms || 0) || 2500);
    var frameCount = Math.max(1, Math.round((durationMs / 1000) * fps));

    for (var f = 0; f < frameCount; f++) {
      ctx.clearRect(0, 0, stageCanvas.width, stageCanvas.height);
      ctx.drawImage(current.canvas, 0, 0, stageCanvas.width, stageCanvas.height);
      await wait(Math.round(1000 / fps));
    }

    var next = renderedScenes[i + 1];
    if (next) {
      var transitionDurationMs = getReelTransitionDurationMs(next.scene);
      var transitionFrameCount = Math.max(1, Math.round((transitionDurationMs / 1000) * fps));
      var direction = isReelCtaScene(next.scene) ? 0.35 : (i % 2 === 0 ? 1 : -1);

      for (var t = 0; t < transitionFrameCount; t++) {
        var progress = (t + 1) / transitionFrameCount;
        ctx.clearRect(0, 0, stageCanvas.width, stageCanvas.height);
        drawReelTransitionFrame(ctx, current.canvas, next.canvas, progress, direction);
        await wait(Math.round(1000 / fps));
      }
    }
  }

  await wait(160);
  recorder.stop();
  return await stopPromise;
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

export async function downloadAllSlides() {
  var preview = document.getElementById("previewContent");
  var project = getProject();
  if (!project || !project.slides || !project.slides.length) return 0;

  try {
    await preloadCarouselAssets(project.slides, project);
  } catch (error) {
    setStatus(preview, "No se pudieron cargar las imagenes del carrusel.");
    return 0;
  }

  var renderedSlides = renderCarousel(project);
  var renderedMetadata = [];
  for (var i = 0; i < renderedSlides.length; i++) {
    renderedMetadata.push({
      item: renderedSlides[i],
      index: i,
      canvas: renderedSlides[i].canvas
    });
  }
  var exportEligibility = getCarouselExportEligibility(renderedMetadata);
  if (!exportEligibility.allowed) {
    setStatus(preview, exportEligibility.warning);
    return 0;
  }

  setStatus(preview, "Preparando descarga...");

  var exportedCount = 0;
  for (var j = 0; j < renderedMetadata.length; j++) {
    if (await downloadSlideImage(renderedMetadata[j].item, project, true, renderedMetadata[j].canvas)) {
      exportedCount += 1;
    }
    await wait(180);
  }

  setStatus(preview, exportedCount + " slides descargados");
  return exportedCount;
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

function supportsFocalPoint(slide) {
  if (!slide || !slide.content) return false;
  return slide.template === "image" || !!slide.content.supportImage;
}

function createFocalPointControls(project, slide) {
  var wrap = document.createElement("div");
  wrap.className = "carousel-focal-controls";

  var label = document.createElement("span");
  label.className = "carousel-cover-controls-label";
  label.textContent = "Foco de imagen";
  wrap.appendChild(label);

  var focus = normalizeFocalPosition(slide.content.focalPosition || {
    x: slide.content.focalX,
    y: slide.content.focalY,
  });
  wrap.appendChild(createFocalAxisControl(project, slide, "X", focus.x));
  wrap.appendChild(createFocalAxisControl(project, slide, "Y", focus.y));
  return wrap;
}

function createFocalAxisControl(project, slide, axis, value) {
  var label = document.createElement("label");
  label.className = "carousel-focal-axis";
  label.textContent = axis;
  var input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.value = String(Math.round(value * 100));
  input.setAttribute("aria-label", "Foco " + axis.toLowerCase());
  input.addEventListener("input", function () {
    var current = normalizeFocalPosition(slide.content && slide.content.focalPosition);
    current[axis.toLowerCase()] = Number(input.value) / 100;
    updateSlideFocalPosition(project, slide.id, current);
    renderInPreview();
  });
  label.appendChild(input);
  return label;
}

export function updateSlideFocalPosition(project, slideId, focalPosition) {
  if (!project || !Array.isArray(project.slides)) return project;
  var targetId = String(slideId || "");
  var slide = project.slides.find(function (candidate) {
    return String(candidate && candidate.id || "") === targetId;
  });
  if (!slide) return project;

  var focus = normalizeFocalPosition(focalPosition);
  slide.content = {
    ...(slide.content || {}),
    focalPosition: focus,
    focalX: focus.x,
    focalY: focus.y,
  };
  setProject(project);
  return project;
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
