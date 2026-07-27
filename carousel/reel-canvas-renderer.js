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
  drawSceneChrome(ctx, scene, project);
  drawSceneText(ctx, scene, project);
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
    var layout = resolveSceneLayout(scene, getStructuredSceneContent(scene).items);
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, layout === "cta" ? "#eef6d6" : "#ffffff");
    bg.addColorStop(1, layout === "cta" ? "#f8fbeF" : (MMTheme.colors.surfaceSoft || "#f8f6f1"));
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

function drawSceneChrome(ctx, scene, project) {
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, 28, 28, W - 56, H - 56, 36);

  var topBar = ctx.createLinearGradient(62, 82, W - 62, 82);
  topBar.addColorStop(0, MMTheme.colors.accent);
  topBar.addColorStop(1, MMTheme.colors.accentBarEnd || "#d9eb97");
  fillRoundRect(ctx, 62, 58, W - 124, 26, 13, topBar);

  if (isCoverScene(scene)) {
    drawSceneBrand(ctx, scene, project);
  }
}

function drawSceneBrand(ctx, scene, project) {
  var logo = getCachedImage("/assets/logo.png");
  var position = project && project.settings && project.settings.coverLogoPosition || "center";
  var logoW = 286;
  var logoH = logo ? logo.height * (logoW / logo.width) : 52;
  var logoX = W / 2;
  var logoY = 122;

  if (position === "right") {
    logoX = W - logoW / 2 - 78;
    logoY = 112;
  } else if (position === "image-footer") {
    logoX = W / 2;
    logoY = 1110;
  }

  if (logo) {
    drawLogoWithBackdrop(ctx, logo, logoX, logoY, logoW, true);
    return;
  }

  ctx.font = "700 26px Inter, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("MEDIA MENDOZA", logoX, logoY + 8);
  ctx.textAlign = "start";
}

function drawLogoWithBackdrop(ctx, logo, centerX, y, logoW, centeredY) {
  var logoH = logo.height * (logoW / logo.width);
  var drawX = centerX - logoW / 2;
  var padX = 18;
  var padY = 12;
  var boxY = centeredY ? y - logoH / 2 - padY : y - padY;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 3;
  fillRoundRect(ctx, drawX - padX, boxY, logoW + padX * 2, logoH + padY * 2, 22, "rgba(22,28,30,0.82)");
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, drawX - padX, boxY, logoW + padX * 2, logoH + padY * 2, 22);
  ctx.drawImage(logo, drawX, centeredY ? y - logoH / 2 : y, logoW, logoH);
  ctx.restore();
}

function drawSceneText(ctx, scene, project) {
  var isTextCard = scene.visual_type === "text_card" || !resolveSceneImage(scene, project);
  var title = String(scene.text || "").trim() || "Sin texto principal";
  var subtitle = String(scene.subtitle || "").trim();
  var contentX = 104;
  var contentW = W - 208;

  if (isTextCard) {
    var panelY = 234;
    var panelH = H - 382;
    fillRoundRect(ctx, 58, panelY, W - 116, panelH, 46, MMTheme.colors.panel);
    ctx.strokeStyle = MMTheme.colors.lineSoft;
    ctx.lineWidth = 2;
    roundRectStroke(ctx, 58, panelY, W - 116, panelH, 46);

    fillRoundRect(ctx, 86, panelY + 62, 18, 300, 9, MMTheme.colors.accent);
    fillRoundRect(ctx, 58, panelY, W - 116, 24, 12, MMTheme.colors.accent);

    var content = getStructuredSceneContent(scene);
    var layout = resolveSceneLayout(scene, content.items);
    if (layout === "list") {
      drawListTextCard(ctx, content.title, subtitle, content.items, panelY, panelH, contentX, contentW);
    } else if (layout === "contact") {
      drawContactTextCard(ctx, content.title, subtitle, content.items, panelY, panelH, contentX, contentW);
    } else if (layout === "cta" || layout === "quote") {
      drawCalloutTextCard(ctx, content.title, subtitle, panelY, panelH, contentX, contentW, layout);
    } else {
      drawDefaultTextCard(ctx, content.title, subtitle, panelY, panelH, contentX, contentW);
    }

    return;
  }

  var panelY = H - 684;
  fillRoundRect(ctx, 28, panelY, W - 56, 656, 42, "rgba(255,255,255,0.97)");
  ctx.strokeStyle = "rgba(222,216,205,0.88)";
  ctx.lineWidth = 2;
  roundRectStroke(ctx, 28, panelY, W - 56, 656, 42);

  fillRoundRect(ctx, 56, panelY + 52, 14, 174, 7, MMTheme.colors.accent);

  var visualTitleStyle = fitReelTextBlock(ctx, title, {
    maxWidth: contentW - 8,
    maxLines: 3,
    fontSizes: [68, 64, 60, 56, 52],
    lineHeights: [76, 72, 68, 64, 60]
  });
  ctx.font = "700 " + visualTitleStyle.fontSize + "px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.textPrimary;
  var titleEnd = wrapText(ctx, visualTitleStyle.text, contentX, panelY + 72, visualTitleStyle.maxWidth, visualTitleStyle.lineHeight);

  if (subtitle) {
    var visualSubtitleStyle = fitReelTextBlock(ctx, subtitle, {
      maxWidth: contentW - 12,
      maxLines: 3,
      fontSizes: [36, 34, 32, 30],
      lineHeights: [46, 42, 40, 38]
    });
    ctx.font = "500 " + visualSubtitleStyle.fontSize + "px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textSecondary;
    wrapText(ctx, visualSubtitleStyle.text, contentX, titleEnd + 24, visualSubtitleStyle.maxWidth, visualSubtitleStyle.lineHeight);
  }
}

function drawDefaultTextCard(ctx, title, subtitle, panelY, panelH, contentX, contentW) {
  var titleStyle = fitReelTextBlock(ctx, title, {
    maxWidth: contentW - 50,
    maxLines: 4,
    fontSizes: [68, 64, 60, 56, 52],
    lineHeights: [76, 72, 68, 64, 60]
  });
  var subtitleStyle = subtitle ? fitReelTextBlock(ctx, subtitle, {
    maxWidth: contentW - 50,
    maxLines: 2,
    fontSizes: [36, 34, 32, 30],
    lineHeights: [46, 42, 40, 38]
  }) : null;
  var totalH = titleStyle.lineCount * titleStyle.lineHeight + (subtitleStyle ? subtitleStyle.lineCount * subtitleStyle.lineHeight + 30 : 0);
  var startY = panelY + Math.min(390, Math.max(150, (panelH - totalH) / 2 - 40));

  ctx.font = "700 " + titleStyle.fontSize + "px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.textPrimary;
  var titleEnd = wrapText(ctx, titleStyle.text, contentX + 38, startY, titleStyle.maxWidth, titleStyle.lineHeight);

  if (subtitleStyle) {
    ctx.font = "500 " + subtitleStyle.fontSize + "px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textSecondary;
    wrapText(ctx, subtitleStyle.text, contentX + 38, titleEnd + 30, subtitleStyle.maxWidth, subtitleStyle.lineHeight);
  }
}

function drawListTextCard(ctx, title, subtitle, items, panelY, panelH, contentX, contentW) {
  var titleStyle = fitReelTextBlock(ctx, title, {
    maxWidth: contentW - 50,
    maxLines: 2,
    fontSizes: [62, 58, 54, 50],
    lineHeights: [70, 66, 62, 58]
  });
  ctx.font = "700 " + titleStyle.fontSize + "px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.textPrimary;
  var titleEnd = wrapText(ctx, titleStyle.text, contentX + 38, panelY + 110, titleStyle.maxWidth, titleStyle.lineHeight);
  var cursorY = titleEnd + 24;

  if (subtitle) {
    ctx.font = "500 32px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textSecondary;
    cursorY = wrapText(ctx, subtitle, contentX + 38, cursorY, contentW - 76, 42) + 32;
  }

  var rowH = 116;
  var gap = 18;
  var listH = items.length * rowH + Math.max(0, items.length - 1) * gap;
  var centeredY = panelY + Math.max(390, (panelH - listH) / 2 - 40);
  var startY = Math.max(cursorY + 38, Math.min(centeredY, panelY + panelH - listH - 170));
  for (var i = 0; i < items.length; i++) {
    drawListItem(ctx, items[i], contentX + 28, startY + i * (rowH + gap), contentW - 56, rowH, i + 1);
  }
}

function drawContactTextCard(ctx, title, subtitle, items, panelY, panelH, contentX, contentW) {
  drawDefaultTextCard(ctx, title, subtitle, panelY, Math.min(panelH, 720), contentX, contentW);
  var contactItems = items.slice();
  var phone = extractPhone(title + " " + subtitle);
  if (phone && !contactItems.some(function (item) { return item.text.indexOf(phone) >= 0; })) {
    contactItems.push({ label: "Contacto", text: phone });
  }
  if (!contactItems.length) return;

  var contactH = contactItems.length * 132 + Math.max(0, contactItems.length - 1) * 16;
  var boxY = panelY + Math.max(560, (panelH - contactH) / 2 + 120);
  var rowH = Math.min(132, Math.max(104, 520 / contactItems.length));
  for (var i = 0; i < contactItems.length; i++) {
    drawListItem(ctx, contactItems[i], contentX + 28, boxY + i * (rowH + 16), contentW - 56, rowH, 0);
  }
}

function drawCalloutTextCard(ctx, title, subtitle, panelY, panelH, contentX, contentW, layout) {
  if (layout === "cta") {
    drawReelCtaCard(ctx, title, subtitle, panelY, contentX, contentW);
    return;
  }

  var boxY = panelY + 390;
  var boxH = 640;
  var boxFill = layout === "quote" ? "#f4f1ea" : MMTheme.colors.accent;
  fillRoundRect(ctx, contentX + 18, boxY, contentW - 36, boxH, 34, boxFill);
  ctx.strokeStyle = layout === "quote" ? MMTheme.colors.brandLine : MMTheme.colors.accent;
  ctx.lineWidth = 2;
  roundRectStroke(ctx, contentX + 18, boxY, contentW - 36, boxH, 34);

  var titleStyle = fitReelTextBlock(ctx, title, {
    maxWidth: contentW - 110,
    maxLines: 3,
    fontSizes: [60, 56, 52, 48],
    lineHeights: [68, 64, 60, 56]
  });
  ctx.textAlign = "center";
  ctx.font = "700 " + titleStyle.fontSize + "px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.textPrimary;
  var titleEnd = wrapText(ctx, titleStyle.text, W / 2, boxY + 86, titleStyle.maxWidth, titleStyle.lineHeight);
  if (subtitle) {
    ctx.font = "500 34px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textSecondary;
    wrapText(ctx, subtitle, W / 2, titleEnd + 28, contentW - 120, 44);
  }
  if (layout === "cta") {
    fillRoundRect(ctx, W / 2 - 210, boxY + boxH - 126, 420, 64, 32, "#1f2326");
    ctx.font = "700 24px Inter, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SEGUI INFORMADO", W / 2, boxY + boxH - 86);
  }
  ctx.textAlign = "start";
}

function drawReelCtaCard(ctx, title, subtitle, panelY, contentX, contentW) {
  var boxY = panelY + 250;
  var boxH = 860;
  var boxX = contentX - 14;
  var boxW = contentW + 28;
  fillRoundRect(ctx, boxX, boxY, boxW, boxH, 42, "#ffffff");
  ctx.strokeStyle = MMTheme.colors.lineSoft;
  ctx.lineWidth = 2;
  roundRectStroke(ctx, boxX, boxY, boxW, boxH, 42);
  fillRoundRect(ctx, boxX, boxY, boxW, 22, 11, MMTheme.colors.accent);

  var logo = getCachedImage("/assets/logo.png");
  if (logo) drawLogoWithBackdrop(ctx, logo, W / 2, boxY + 104, 250, true);

  ctx.textAlign = "center";
  ctx.font = "700 30px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.accentDark;
  ctx.fillText("SEGUIR INFORMADO", W / 2, boxY + 198);

  var titleStyle = fitReelTextBlock(ctx, title, {
    maxWidth: contentW - 90,
    maxLines: 2,
    fontSizes: [58, 54, 50, 46],
    lineHeights: [66, 62, 58, 54]
  });
  ctx.font = "700 " + titleStyle.fontSize + "px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.textPrimary;
  var titleEnd = wrapText(ctx, titleStyle.text, W / 2, boxY + 278, titleStyle.maxWidth, titleStyle.lineHeight);

  if (subtitle) {
    var subtitleStyle = fitReelTextBlock(ctx, subtitle, {
      maxWidth: contentW - 112,
      maxLines: 4,
      fontSizes: [32, 30, 28],
      lineHeights: [42, 38, 36]
    });
    ctx.font = "500 " + subtitleStyle.fontSize + "px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textSecondary;
    wrapText(ctx, subtitleStyle.text, W / 2, titleEnd + 42, subtitleStyle.maxWidth, subtitleStyle.lineHeight);
  }

  var webY = boxY + boxH - 148;
  fillRoundRect(ctx, W / 2 - 300, webY, 600, 92, 30, "#1f2326");
  ctx.font = "700 42px Inter, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("mediamendoza.com", W / 2, webY + 58);
  ctx.textAlign = "start";
}

function drawListItem(ctx, item, x, y, w, h, number) {
  fillRoundRect(ctx, x, y, w, h, 28, "rgba(246,250,236,0.96)");
  ctx.strokeStyle = MMTheme.colors.brandLine;
  ctx.lineWidth = 2;
  roundRectStroke(ctx, x, y, w, h, 28);
  fillRoundRect(ctx, x + 22, y + 24, 68, h - 48, 20, MMTheme.colors.accent);
  if (number) {
    ctx.font = "700 28px Inter, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(String(number).padStart(2, "0"), x + 56, y + h / 2 - 16);
    ctx.textAlign = "start";
  }
  var text = item && item.text ? item.text : "";
  var label = item && item.label ? String(item.label).trim() : "";
  var style = fitReelTextBlock(ctx, text, {
    maxWidth: w - 142,
    maxLines: 2,
    fontSizes: [32, 29, 26],
    lineHeights: [40, 36, 33]
  });
  ctx.font = "500 " + style.fontSize + "px Inter, Arial, sans-serif";
  ctx.fillStyle = MMTheme.colors.textSecondary;
  var textY = y + Math.max(24, (h - style.lineCount * style.lineHeight) / 2);
  if (label) {
    ctx.font = "700 22px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.accentDark;
    ctx.fillText(label.toUpperCase(), x + 122, y + 22);
    ctx.font = "500 " + style.fontSize + "px Inter, Arial, sans-serif";
    ctx.fillStyle = MMTheme.colors.textSecondary;
    textY = y + 54;
  }
  wrapText(ctx, style.text, x + 122, textY, style.maxWidth, style.lineHeight);
}

function getStructuredSceneContent(scene) {
  var title = String(scene && scene.text || "").trim() || "Sin texto principal";
  var items = Array.isArray(scene && scene.items) ? scene.items.filter(function (item) { return item && item.text; }) : [];
  if (items.length) return { title: title, items: items };

  var parts = title.split(/\s+-\s+/).map(function (part) { return part.trim(); }).filter(Boolean);
  if (parts.length >= 3) {
    return {
      title: parts.shift(),
      items: parts.map(function (part) { return { label: "", text: part }; })
    };
  }
  return { title: title, items: [] };
}

function resolveSceneLayout(scene, items) {
  var layout = String(scene && scene.layout || "").toLowerCase();
  if (["list", "contact", "quote", "cta", "default"].indexOf(layout) >= 0) return layout;
  var role = String(scene && scene.visual_role || "").toLowerCase();
  if (role === "cta" || role === "conclusion") return "cta";
  if (items && items.length) return "list";
  if (/contact|telefono|llam|direccion|retir/.test(String(scene && scene.text || "").toLowerCase())) return "contact";
  return "default";
}

function extractPhone(text) {
  var match = String(text || "").match(/\b\d{4}\s?\d{2}[-\s]?\d{4}\b/);
  return match ? match[0] : "";
}

function drawSceneFooter(ctx, scene) {
  var content = getStructuredSceneContent(scene);
  if (resolveSceneLayout(scene, content.items) === "cta") return;

  var footerY = H - 104;
  var logo = getCachedImage("/assets/logo.png");
  var logoW = 270;
  var logoH = logo ? logo.height * (logoW / logo.width) : 52;
  var gap = 26;

  ctx.strokeStyle = MMTheme.colors.brandLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (isCoverScene(scene)) {
    ctx.moveTo(84, footerY);
    ctx.lineTo(W - 84, footerY);
  } else {
    ctx.moveTo(84, footerY);
    ctx.lineTo(W / 2 - logoW / 2 - gap, footerY);
    ctx.moveTo(W / 2 + logoW / 2 + gap, footerY);
    ctx.lineTo(W - 84, footerY);
  }
  ctx.stroke();

  if (logo && !isCoverScene(scene)) {
    drawLogoWithBackdrop(ctx, logo, W / 2, footerY, logoW, true);
  }
}

function isCoverScene(scene) {
  return !!scene && (scene.visual_type === "cover_image" || scene.visual_role === "hook");
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
    investigation: "Investigación",
    conclusion: "Cierre",
    cta: "Llamado a la acción",
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

function fitReelTextBlock(ctx, text, options) {
  var settings = options || {};
  var raw = String(text || "").replace(/\s+/g, " ").trim();
  var maxWidth = settings.maxWidth || 760;
  var maxLines = settings.maxLines || 4;
  var fontSizes = settings.fontSizes || [72, 66, 60, 54];
  var lineHeights = settings.lineHeights || [78, 72, 66, 60];

  for (var i = 0; i < fontSizes.length; i++) {
    ctx.font = "700 " + fontSizes[i] + "px Inter, Arial, sans-serif";
    var lines = estimateWrappedLines(ctx, raw, maxWidth);
    if (lines <= maxLines) {
      return {
        text: raw,
        fontSize: fontSizes[i],
        lineHeight: lineHeights[Math.min(i, lineHeights.length - 1)],
        maxWidth: maxWidth,
        lineCount: lines
      };
    }
  }

  var lastIndex = fontSizes.length - 1;
  ctx.font = "700 " + fontSizes[lastIndex] + "px Inter, Arial, sans-serif";
  return {
    text: clampWrappedText(ctx, raw, maxWidth, maxLines),
    fontSize: fontSizes[lastIndex],
    lineHeight: lineHeights[Math.min(lastIndex, lineHeights.length - 1)],
    maxWidth: maxWidth,
    lineCount: maxLines
  };
}

function estimateWrappedLines(ctx, text, maxWidth) {
  var words = String(text || "").split(" ");
  var lines = 1;
  var current = "";

  for (var i = 0; i < words.length; i++) {
    var candidate = current ? current + " " + words[i] : words[i];
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines += 1;
      current = words[i];
    }
  }

  return lines;
}

function clampWrappedText(ctx, text, maxWidth, maxLines) {
  var words = String(text || "").split(" ");
  var lines = [];
  var current = "";

  for (var i = 0; i < words.length; i++) {
    var candidate = current ? current + " " + words[i] : words[i];
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = words[i];

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  var remainingWords = words.slice(lines.join(" ").split(" ").filter(Boolean).length);
  if (!remainingWords.length) return lines.join(" ");

  var lastLine = lines[Math.max(0, lines.length - 1)] || "";
  var suffix = remainingWords.join(" ");
  var merged = (lastLine ? lastLine + " " : "") + suffix;
  while (merged.length && ctx.measureText(merged + "…").width > maxWidth) {
    merged = merged.slice(0, -1).trimEnd();
  }
  lines[Math.max(0, lines.length - 1)] = merged + "...";
  return lines.join(" ");
}
