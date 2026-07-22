import { createCanvas } from "./core/canvas.js";
import { calcZones, getHeaderZone, getFooterZone } from "./core/layout.js";
import { drawImageCover } from "./core/image.js";
import { drawTitle, drawSubtitle, drawParagraph, drawList } from "./core/text.js";
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

function drawCoverImage(ctx, slide, project) {
  var imgUrl = slide.content.image || (project.article && project.article.image);
  if (!imgUrl) return;

  var img = new Image();
  img.crossOrigin = "anonymous";

  function drawLoaded() {
    var zone = getHeaderZone();
    drawImageCover(ctx, img, zone.x, zone.y, zone.w, zone.h);
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

function drawGradientOverlay(ctx) {
  var zone = getHeaderZone();
  var grad = ctx.createLinearGradient(0, zone.h * 0.4, 0, zone.h);
  grad.addColorStop(0, MMTheme.colors.transparent);
  grad.addColorStop(1, MMTheme.colors.overlay);
  ctx.fillStyle = grad;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
}

function drawCategoryBadge(ctx, text) {
  if (!text) return;
  var zone = getHeaderZone();
  ctx.font = MMTheme.fonts.category;
  var label = text.toUpperCase();
  var tw = ctx.measureText(label).width;
  var bandX = MMTheme.spacing.paddingX;
  var bandY = zone.h - 220;
  var bandH = 46;
  var bandW = tw + 36;
  ctx.fillStyle = MMTheme.colors.accent;
  ctx.fillRect(bandX, bandY, bandW, bandH);
  ctx.fillStyle = MMTheme.colors.white;
  ctx.textBaseline = "top";
  ctx.fillText(label, bandX + 18, bandY + 11);
}

function drawCoverTitle(ctx, slide) {
  var title = slide.content.title || "";
  if (!title) return;
  var zone = getHeaderZone();
  drawTitle(ctx, title, MMTheme.spacing.paddingX, zone.h - 160, W - MMTheme.spacing.paddingX * 2, MMTheme.spacing.lineHTitle, MMTheme.colors.white);
}

function drawCoverSubtitle(ctx, slide) {
  var sub = slide.content.subtitle || "";
  if (!sub) return;
  var zone = getHeaderZone();
  drawSubtitle(ctx, sub, MMTheme.spacing.paddingX, zone.h - 80, W - MMTheme.spacing.paddingX * 2, MMTheme.spacing.lineHSubtitle, MMTheme.colors.white);
}

function drawCoverFooter(ctx, slide, project) {
  var footer = getFooterZone();
  ctx.font = "bold " + MMTheme.fonts.footer;
  ctx.fillStyle = MMTheme.colors.footer;
  ctx.textBaseline = "top";
  ctx.fillText("Media Mendoza", MMTheme.spacing.paddingX, footer.y + 4);
  ctx.font = MMTheme.fonts.footer;
  ctx.fillText("mediamendoza.com", MMTheme.spacing.paddingX, footer.y + 28);
  var total = project.slides ? project.slides.length : 1;
  var num = (slide.order || 0) + 1;
  ctx.textAlign = "right";
  ctx.fillText(num + " / " + total, W - MMTheme.spacing.paddingX, footer.y + 4);
  ctx.textAlign = "start";
}

function drawGreenHeaderBand(ctx, text) {
  var bandH = 60;
  ctx.fillStyle = MMTheme.colors.accent;
  ctx.fillRect(0, 0, W, bandH);
  if (!text) return;
  ctx.font = MMTheme.fonts.category;
  ctx.fillStyle = MMTheme.colors.white;
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), MMTheme.spacing.paddingX, bandH / 2);
}

function drawTextSlideTitle(ctx, slide) {
  var title = slide.content.title || "";
  if (!title) return;
  drawTitle(ctx, title, MMTheme.spacing.paddingY, 90, W - MMTheme.spacing.paddingY * 2, MMTheme.spacing.lineHTitle, MMTheme.colors.textPrimary);
}

function drawTextSlideBody(ctx, slide) {
  var text = slide.content.text || "";
  if (!text) return;
  drawParagraph(ctx, text, MMTheme.spacing.paddingY, 170, W - MMTheme.spacing.paddingY * 2, MMTheme.spacing.lineHBody, MMTheme.colors.textSecondary);
}

function drawStatsTitle(ctx, slide) {
  var title = slide.content.title || "";
  if (!title) return;
  drawTitle(ctx, title, MMTheme.spacing.paddingY, 60, W - MMTheme.spacing.paddingY * 2, MMTheme.spacing.lineHTitle, MMTheme.colors.textPrimary);
}

function drawStatsItems(ctx, slide) {
  var items = slide.content.items || [];
  if (!items.length) return;
  drawList(ctx, items, MMTheme.spacing.paddingY, 140, W - MMTheme.spacing.paddingY * 2, MMTheme.spacing.lineHList, MMTheme.colors.textSecondary);
}

function drawEndContent(ctx, slide) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = MMTheme.fonts.title;
  ctx.fillStyle = MMTheme.colors.white;
  ctx.fillText("Media Mendoza", W / 2, 480);
  var text = slide.content.text || "";
  if (text) {
    ctx.font = "32px sans-serif";
    ctx.fillText(text, W / 2, 560);
  }
  ctx.font = "24px sans-serif";
  ctx.fillText("mediamendoza.com", W / 2, 640);
  ctx.textAlign = "start";
  ctx.textBaseline = "top";
}

function drawPageNumber(ctx, slide, project) {
  var footer = getFooterZone();
  var total = project.slides ? project.slides.length : 1;
  var num = (slide.order || 0) + 1;
  ctx.font = MMTheme.fonts.footer;
  ctx.fillStyle = MMTheme.colors.footer;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText(num + " / " + total, W - MMTheme.spacing.paddingX, footer.y + footer.h / 2);
  ctx.textAlign = "start";
}

function renderCover(ctx, slide, project) {
  calcZones("cover");
  drawWhiteBackground(ctx);
  drawCoverImage(ctx, slide, project);
  drawGradientOverlay(ctx);
  drawCategoryBadge(ctx, project.article && project.article.category);
  drawCoverTitle(ctx, slide);
  drawCoverSubtitle(ctx, slide);
  drawCoverFooter(ctx, slide, project);
}

function renderTextSlide(ctx, slide, project) {
  calcZones("text");
  drawWhiteBackground(ctx);
  drawGreenHeaderBand(ctx, project.article && project.article.category);
  drawTextSlideTitle(ctx, slide);
  drawTextSlideBody(ctx, slide);
  drawPageNumber(ctx, slide, project);
}

function renderStatsSlide(ctx, slide, project) {
  calcZones("stats");
  drawWhiteBackground(ctx);
  drawStatsTitle(ctx, slide);
  drawStatsItems(ctx, slide);
  drawPageNumber(ctx, slide, project);
}

function renderEndSlide(ctx, slide, project) {
  calcZones("end");
  drawGreenBackground(ctx);
  drawEndContent(ctx, slide);
  drawPageNumber(ctx, slide, project);
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
