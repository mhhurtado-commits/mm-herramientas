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

export async function preloadReelSceneAssets(scenes, project) {
  var sources = ["/assets/logo.png"];
  var list = Array.isArray(scenes) ? scenes : [];

  for (var i = 0; i < list.length; i++) {
    var imageUrl = resolveSceneImage(list[i], project);
    if (imageUrl) sources.push(imageUrl);
  }

  var unique = {};
  var tasks = [];
  for (var j = 0; j < sources.length; j++) {
    var normalized = normalizeImageSource(sources[j]);
    if (!normalized || unique[normalized]) continue;
    unique[normalized] = true;
    tasks.push(loadImage(normalized));
  }

  await Promise.all(tasks);
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

  drawSceneBadge(ctx, getSceneBadgeLabel(scene, null));
  drawSceneBrand(ctx, scene.visual_type === "text_card");
}

function drawSceneBadge(ctx, text) {
  var label = formatReelRoleLabel(text || "escena").toUpperCase();
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
    var panelY = 250;
    var panelH = H - 414;
    fillRoundRect(ctx, 64, panelY, W - 128, panelH, 44, "rgba(255,255,255,0.94)");
    ctx.strokeStyle = MMTheme.colors.lineSoft;
    ctx.lineWidth = 2;
    roundRectStroke(ctx, 64, panelY, W - 128, panelH, 44);

    ctx.font = "700 248px Inter, Arial, sans-serif";
    ctx.fillStyle = "rgba(166,206,57,0.12)";
    ctx.textAlign = "right";
    ctx.fillText("0" + String(Math.min(9, Math.max(1, Number(scene.order || 1)))), W - 134, panelY + 34);
    ctx.textAlign = "start";

    fillRoundRect(ctx, 86, panelY + 42, 20, 420, 10, MMTheme.colors.accent);

    ctx.font = "700 102px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textPrimary;
    var titleEnd = wrapText(ctx, title, 142, panelY + 92, W - 262, 108);

    if (subtitle) {
      ctx.font = "500 56px Inter, Arial, sans-serif";
      ctx.fillStyle = MMTheme.colors.textSecondary;
      wrapText(ctx, subtitle, 142, titleEnd + 46, W - 262, 70);
    }

    fillRoundRect(ctx, 142, H - 288, W - 284, 3, 2, MMTheme.colors.brandLine);
    return;
  }

  var panelY = H - 660;
  fillRoundRect(ctx, 28, panelY, W - 56, 632, 42, "rgba(255,255,255,0.97)");
  ctx.strokeStyle = "rgba(222,216,205,0.88)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, 28, panelY, W - 56, 632, 42);

  fillRoundRect(ctx, 56, panelY + 54, 14, 164, 7, MMTheme.colors.accent);

  ctx.font = "700 88px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.textPrimary;
  var titleEnd = wrapText(ctx, title, contentX, panelY + 70, contentW - 24, 94);

  if (subtitle) {
    ctx.font = "500 48px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textSecondary;
    wrapText(ctx, subtitle, contentX, titleEnd + 30, contentW - 40, 60);
  }
}

function drawSceneFooter(ctx, scene) {
  var isTextCard = scene.visual_type === "text_card";
  var footerY = H - 104;

  ctx.strokeStyle = MMTheme.colors.brandLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(84, footerY);
  ctx.lineTo(W - 84, footerY);
  ctx.stroke();

  ctx.font = "700 24px Inter, Arial, sans-serif";
  ctx.fillStyle = isTextCard ? MMTheme.colors.footer : "rgba(255,255,255,0.78)";
  ctx.textAlign = "left";
  ctx.fillText("Media Mendoza", 84, footerY - 34);
  ctx.textAlign = "right";
  ctx.fillText("Escena " + String(scene.order || 1).padStart(2, "0"), W - 86, footerY - 34);
  ctx.textAlign = "start";
}

function resolveSceneImage(scene, project) {
  if (!scene || !project || !project.article) return "";
  var article = project.article;
  var source = String(scene.visual_source || "");

  if (source === "article.image") return article.image || "";

  var match = source.match(/^article\.images\[(\d+)\]$/);
  if (match && project.settings && project.settings.useSecondaryImages && Array.isArray(article.images)) {
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

function loadImage(normalizedSrc) {
  return new Promise(function (resolve) {
    var cached = imageCache[normalizedSrc];
    if (cached && cached.loaded && cached.img) {
      resolve(cached.img);
      return;
    }

    if (cached && cached.img) {
      cached.img.addEventListener("load", function handleLoad() {
        cached.img.removeEventListener("load", handleLoad);
        resolve(cached.img);
      });
      cached.img.addEventListener("error", function handleError() {
        cached.img.removeEventListener("error", handleError);
        resolve(null);
      });
      return;
    }

    var img = new Image();
    img.crossOrigin = "anonymous";
    imageCache[normalizedSrc] = { img: img, loaded: false };

    img.onload = function () {
      imageCache[normalizedSrc].loaded = true;
      resolve(img);
    };

    img.onerror = function () {
      delete imageCache[normalizedSrc];
      resolve(null);
    };

    img.src = normalizedSrc;
  });
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

function getSceneBadgeLabel(scene) {
  if (!scene) return "escena";
  if (scene.visual_type === "support_image" && !scene.visual_source) return "text_card";
  return scene.visual_role || scene.visual_type || "escena";
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
