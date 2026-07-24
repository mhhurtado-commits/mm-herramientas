import { createCanvas } from "./core/canvas.js";
import { drawImageCover } from "./core/image.js";
import { wrapText } from "./core/text.js";
import { MMTheme, applyThemeVariant } from "./core/theme.js";

var W = 1080;
var H = 1920;
var IMAGE_PROXY = "https://mm-herramientas-worker.mhhurtado.workers.dev?image=";
var imageCache = {};

export function renderReelSceneToCanvas(scene, project) {
  if (!scene) return null;

  applyThemeVariant(resolveThemeName(project));
  var canvas = createCanvas(W, H);
  var ctx = canvas.getContext("2d");

  drawBackground(ctx, scene, project);
  drawSceneChrome(ctx, scene);
  drawSceneText(ctx, scene);
  drawSceneFooter(ctx, scene);

  return canvas;
}

function resolveThemeName(project) {
  if (project && project.editorialPlan && project.editorialPlan.diagnosis && project.editorialPlan.diagnosis.template) {
    return project.editorialPlan.diagnosis.template;
  }
  return "mm_classic";
}

function drawBackground(ctx, scene, project) {
  var imageUrl = resolveSceneImage(scene, project);
  var isTextCard = scene.visual_type === "text_card" || !imageUrl;

  if (isTextCard) {
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, MMTheme.colors.surfaceSoft || "#f8f6f1");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var glow = ctx.createRadialGradient(W * 0.5, 180, 40, W * 0.5, 180, 420);
    glow.addColorStop(0, "rgba(166,206,57,0.22)");
    glow.addColorStop(1, "rgba(166,206,57,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  var img = getCachedImage(imageUrl);
  if (img) {
    drawImageCover(ctx, img, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#d9ddd4";
    ctx.fillRect(0, 0, W, H);
  }

  var overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(0,0,0,0.18)");
  overlay.addColorStop(0.48, "rgba(0,0,0,0.22)");
  overlay.addColorStop(1, "rgba(0,0,0,0.76)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);
}

function drawSceneChrome(ctx, scene) {
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, 28, 28, W - 56, H - 56, 36);

  var topBar = ctx.createLinearGradient(62, 82, W - 62, 82);
  topBar.addColorStop(0, MMTheme.colors.accent);
  topBar.addColorStop(1, MMTheme.colors.accentBarEnd || "#d9eb97");
  fillRoundRect(ctx, 62, 58, W - 124, 26, 13, topBar);

  drawSceneBadge(ctx, scene.visual_role || scene.visual_type || "escena");
  drawSceneBrand(ctx, scene.visual_type === "text_card");
}

function drawSceneBadge(ctx, text) {
  var label = String(text || "escena").replace(/_/g, " ").toUpperCase();
  ctx.font = "700 28px Inter, Arial, sans-serif";
  var textW = ctx.measureText(label).width;
  var badgeW = textW + 52;
  fillRoundRect(ctx, 76, 126, badgeW, 56, 28, MMTheme.colors.accent);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 102, 154);
  ctx.textBaseline = "top";
}

function drawSceneBrand(ctx, invert) {
  var brandY = 122;
  var logo = getCachedImage("/assets/logo.png");
  if (logo) {
    var logoW = 286;
    var logoH = logo.height * (logoW / logo.width);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.16)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(logo, W - logoW - 78, brandY, logoW, logoH);
    ctx.restore();
    return;
  }

  ctx.font = "700 26px Inter, Arial, sans-serif";
  ctx.fillStyle = invert ? MMTheme.colors.accentDark : "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText("MEDIA MENDOZA", W - 82, brandY + 8);
  ctx.textAlign = "start";
}

function drawSceneText(ctx, scene) {
  var isTextCard = scene.visual_type === "text_card";
  var title = String(scene.text || "").trim() || "Sin texto principal";
  var subtitle = String(scene.subtitle || "").trim();
  var contentX = 84;
  var contentW = W - 168;

  if (isTextCard) {
    ctx.fillStyle = MMTheme.colors.panel;
    fillRoundRect(ctx, 64, 248, W - 128, H - 360, 44, MMTheme.colors.panel);
    ctx.strokeStyle = MMTheme.colors.lineSoft;
    ctx.lineWidth = 2;
    roundRectStroke(ctx, 64, 248, W - 128, H - 360, 44);

    fillRoundRect(ctx, 86, 286, 18, 360, 9, MMTheme.colors.accent);
    ctx.font = "700 92px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textPrimary;
    var titleEnd = wrapText(ctx, title, 134, 324, W - 250, 98);

    if (subtitle) {
      ctx.font = "500 52px Inter, Arial, sans-serif";
      ctx.fillStyle = MMTheme.colors.textSecondary;
      wrapText(ctx, subtitle, 134, titleEnd + 42, W - 250, 64);
    }
    return;
  }

  var panelY = H - 620;
  fillRoundRect(ctx, 28, panelY, W - 56, 592, 42, "rgba(255,255,255,0.96)");
  ctx.strokeStyle = "rgba(222,216,205,0.88)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, 28, panelY, W - 56, 592, 42);

  ctx.font = "700 82px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.textPrimary;
  var titleEnd = wrapText(ctx, title, contentX, panelY + 72, contentW, 92);

  if (subtitle) {
    ctx.font = "500 46px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textSecondary;
    wrapText(ctx, subtitle, contentX, titleEnd + 26, contentW - 40, 58);
  }
}

function drawSceneFooter(ctx, scene) {
  var isTextCard = scene.visual_type === "text_card";
  var footerY = H - 110;

  ctx.strokeStyle = MMTheme.colors.brandLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(84, footerY);
  ctx.lineTo(W - 84, footerY);
  ctx.stroke();

  ctx.font = "700 24px Inter, Arial, sans-serif";
  ctx.fillStyle = isTextCard ? MMTheme.colors.footer : "rgba(255,255,255,0.78)";
  ctx.textAlign = "right";
  ctx.fillText("1080 x 1920", W - 86, footerY - 34);
  ctx.textAlign = "start";
}

function resolveSceneImage(scene, project) {
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

function getCachedImage(src) {
  var normalizedSrc = normalizeImageSource(src);
  if (!normalizedSrc) return null;

  var cached = imageCache[normalizedSrc];
  if (cached && cached.loaded && cached.img) return cached.img;
  if (cached && !cached.loaded) return null;

  var img = new Image();
  img.crossOrigin = "anonymous";
  imageCache[normalizedSrc] = { img: img, loaded: false };

  img.onload = function () {
    var entry = imageCache[normalizedSrc];
    if (!entry) return;
    entry.loaded = true;
    if (typeof window !== "undefined" && window.dispatchEvent && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("carousel:asset-ready", { detail: { src: normalizedSrc } }));
    }
  };

  img.onerror = function () {
    delete imageCache[normalizedSrc];
  };

  img.src = normalizedSrc;
  return null;
}

function normalizeImageSource(src) {
  if (!src) return "";
  if (src.indexOf("data:") === 0 || src.indexOf("blob:") === 0) return src;
  if (src.indexOf("/assets/") === 0 || src.indexOf("./") === 0 || src.indexOf("../") === 0) return src;
  if (src.indexOf(IMAGE_PROXY) === 0) return src;
  if (/^https?:\/\//i.test(src)) return IMAGE_PROXY + encodeURIComponent(src);
  return src;
}

function fillRoundRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}
