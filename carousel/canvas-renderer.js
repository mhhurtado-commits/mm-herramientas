import { createCanvas } from "./core/canvas.js";
import { calcZones, getHeaderZone, getBodyZone, getFooterZone } from "./core/layout.js";
import { drawImageCover } from "./core/image.js";
import { wrapText } from "./core/text.js";
import { MMTheme } from "./core/theme.js";

var W = 1080;
var H = 1350;

function drawWhiteBackground(ctx) {
  ctx.fillStyle = MMTheme.colors.background;
  ctx.fillRect(0, 0, W, H);
}

function drawGreenBackground(ctx) {
  ctx.fillStyle = MMTheme.colors.corporateGreen;
  ctx.fillRect(0, 0, W, H);
}

function drawGradientOverlay(ctx, zone) {
  var grad = ctx.createLinearGradient(0, zone.y + zone.h * 0.5, 0, zone.y + zone.h);
  grad.addColorStop(0, MMTheme.colors.transparent);
  grad.addColorStop(1, MMTheme.colors.overlay75);
  ctx.fillStyle = grad;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
}

function loadCoverImage(ctx, slide, project) {
  var imgUrl = slide.content.image || (project.article && project.article.image);
  if (!imgUrl) return;

  var img = new Image();
  img.crossOrigin = "anonymous";

  function drawLoaded() {
    var zone = getHeaderZone();
    drawImageCover(ctx, img, zone.x, zone.y, zone.w, zone.h);
    drawGradientOverlay(ctx, zone);
  }

  if (img.complete && img.naturalWidth > 0) {
    img.crossOrigin = null;
    drawLoaded();
    return;
  }

  img.onload = drawLoaded;
  img.onerror = function () {};
  img.src = imgUrl;
}

function drawLogo(ctx, src, drawFn) {
  if (!src) return;
  var img = new Image();
  img.onload = function () {
    drawFn(ctx, img);
  };
  img.onerror = function () {};
  img.src = src;
}

// ──────── COVER ────────

function drawCategoryBadge(ctx, label, x, y) {
  if (!label) return;
  ctx.font = MMTheme.fonts.category;
  var text = label.toUpperCase();
  var tw = ctx.measureText(text).width;
  var padX = 20;
  var padY = 10;
  var bw = tw + padX * 2;
  var bh = 24 + padY * 2;
  ctx.fillStyle = MMTheme.colors.accent;
  ctx.beginPath();
  ctx.roundRect(x, y, bw, bh, MMTheme.radius.badge);
  ctx.fill();
  ctx.fillStyle = MMTheme.colors.white;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + bh / 2);
}

function drawCoverTitle(ctx, text, x, y, maxW) {
  if (!text) return y;
  ctx.font = MMTheme.fonts.coverTitle;
  ctx.fillStyle = MMTheme.colors.textPrimary;
  ctx.textBaseline = "top";
  return wrapText(ctx, text, x, y, maxW, MMTheme.spacing.coverLineHTitle);
}

function drawCoverSubtitle(ctx, text, x, y, maxW) {
  if (!text) return y;
  ctx.font = MMTheme.fonts.coverSubtitle;
  ctx.fillStyle = MMTheme.colors.gray555;
  ctx.textBaseline = "top";
  return wrapText(ctx, text, x, y, maxW, MMTheme.spacing.coverLineHSubtitle);
}

function renderCover(ctx, slide, project) {
  calcZones("cover");
  drawWhiteBackground(ctx);
  loadCoverImage(ctx, slide, project);

  var header = getHeaderZone();
  var cat = project.article && project.article.category;
  drawCategoryBadge(ctx, cat, 40, 40);

  var body = getBodyZone();
  var pad = MMTheme.spacing.paddingCover;
  var bodyX = pad;
  var maxW = W - pad * 2;

  var titleText = slide.content.title || "";
  var titleY = body.y + 50;
  var titleEnd = drawCoverTitle(ctx, titleText, bodyX, titleY, maxW);

  var subText = slide.content.subtitle || "";
  var subY = titleEnd + 20;
  drawCoverSubtitle(ctx, subText, bodyX, subY, maxW);

  drawLogo(ctx, "/assets/logo.png", function (ctx, img) {
    var maxW = 180;
    var w = Math.min(img.width, maxW);
    var h = img.height * (w / img.width);
    var x = body.x + body.w - w - 40;
    var y = body.y + body.h - h - 30;
    ctx.drawImage(img, x, y, w, h);
  });
}

// ──────── TEXT ────────

function renderTextSlide(ctx, slide, project) {
  calcZones("text");
  drawWhiteBackground(ctx);

  var gridX = 60;
  var maxW = W - 120;
  var cat = project.article && project.article.category;

  ctx.fillStyle = MMTheme.colors.accent;
  ctx.fillRect(0, 0, W, 80);
  if (cat) {
    ctx.font = MMTheme.fonts.category;
    ctx.fillStyle = MMTheme.colors.white;
    ctx.textBaseline = "middle";
    ctx.fillText(cat.toUpperCase(), gridX, 40);
  }

  var title = slide.content.title || "";
  var titleY = 110;
  if (title) {
    ctx.font = MMTheme.fonts.title;
    ctx.fillStyle = MMTheme.colors.textPrimary;
    ctx.textBaseline = "top";
    titleY = wrapText(ctx, title, gridX, titleY, maxW, MMTheme.spacing.lineHTitle);
  }

  var text = slide.content.text || "";
  var textY = titleY + 24;
  if (text) {
    ctx.font = MMTheme.fonts.body;
    ctx.fillStyle = MMTheme.colors.textSecondary;
    ctx.textBaseline = "top";
    wrapText(ctx, text, gridX, textY, maxW, MMTheme.spacing.lineHBody);
  }

  drawPageNumber(ctx, slide, project);
}

// ──────── STATS ────────

function renderStatsSlide(ctx, slide, project) {
  calcZones("stats");
  drawWhiteBackground(ctx);

  var body = getBodyZone();
  var gridX = 60;
  var maxW = W - 120;
  var cardW = maxW;
  var cardH = 90;
  var cardPad = MMTheme.spacing.cardPadding;
  var gap = MMTheme.spacing.cardGap;

  var title = slide.content.title || "";
  if (title) {
    ctx.font = MMTheme.fonts.title;
    ctx.fillStyle = MMTheme.colors.textPrimary;
    ctx.textBaseline = "top";
    wrapText(ctx, title, gridX, body.y + 40, maxW, MMTheme.spacing.lineHTitle);
  }

  var items = slide.content.items || [];
  var startY = body.y + 120;
  for (var i = 0; i < items.length; i++) {
    var cy = startY + i * (cardH + gap);
    if (cy + cardH > body.y + body.h) break;

    ctx.fillStyle = MMTheme.colors.grayLight;
    ctx.beginPath();
    ctx.roundRect(gridX, cy, cardW, cardH, MMTheme.radius.card);
    ctx.fill();

    ctx.font = MMTheme.fonts.list;
    ctx.fillStyle = MMTheme.colors.textSecondary;
    ctx.textBaseline = "middle";
    ctx.fillText("•  " + items[i], gridX + cardPad, cy + cardH / 2);
  }

  drawPageNumber(ctx, slide, project);
}

// ──────── END ────────

function renderEndSlide(ctx, slide, project) {
  calcZones("end");
  drawGreenBackground(ctx);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  drawLogo(ctx, "/assets/logo.png", function (ctx, img) {
    var maxW = 300;
    var w = Math.min(img.width, maxW);
    var h = img.height * (w / img.width);
    var x = (W - w) / 2;
    var y = 380;
    ctx.drawImage(img, x, y, w, h);
  });

  ctx.font = "28px sans-serif";
  ctx.fillStyle = MMTheme.colors.white;
  ctx.fillText("Leé la nota completa en", W / 2, 630);

  ctx.font = "bold 36px sans-serif";
  ctx.fillText("mediamendoza.com", W / 2, 690);

  ctx.font = "24px sans-serif";
  ctx.fillText("Noticias confiables del sur mendocino", W / 2, 750);

  ctx.textAlign = "start";
  ctx.textBaseline = "top";

  drawPageNumber(ctx, slide, project);
}

// ──────── SHARED ────────

function drawPageNumber(ctx, slide, project) {
  var footer = getFooterZone();
  if (footer.h === 0) return;
  var total = project.slides ? project.slides.length : 1;
  var num = (slide.order || 0) + 1;
  ctx.font = MMTheme.fonts.footer;
  ctx.fillStyle = MMTheme.colors.footer;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText(num + " / " + total, W - MMTheme.spacing.paddingX, footer.y + footer.h / 2);
  ctx.textAlign = "start";
}

export function renderSlideToCanvas(slide, project) {
  try {
  var canvas = createCanvas(W, H);
  var ctx = canvas.getContext("2d");

  switch (slide.template) {
    case "cover": renderCover(ctx, slide, project); break;
    case "text":  renderTextSlide(ctx, slide, project); break;
    case "stats": renderStatsSlide(ctx, slide, project); break;
    case "end":   renderEndSlide(ctx, slide, project); break;
    default:      renderTextSlide(ctx, slide, project);
  }

  return canvas;
  } catch (e) {
    console.log("EXCEPTION in renderSlideToCanvas:", e);
    return null;
  }
}
