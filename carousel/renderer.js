console.log("RENDER");

import { renderSlideToCanvas } from "./canvas-renderer.js";
import { normalizeCarouselSlide } from "./slide-model.js";

const WORKER = "https://mm-herramientas-worker.mhhurtado.workers.dev";

export function renderCarousel(project) {
  if (!project || !project.slides || !project.slides.length) {
    return [];
  }

  project.slides = project.slides.map(function (slide, index) {
    return normalizeCarouselSlide(slide, index, project.slides.length);
  });

  var renderedSlides = [];

  for (var i = 0; i < project.slides.length; i++) {
    var slide = project.slides[i];
    slide.id = slide.id || ("slide-" + i);

    if (slide.type === "cover" && !slide.content.image && project.article.image) {
      slide.content.image = toRenderableImageUrl(project.article.image);
    }

    if (slide.content && slide.content.supportImage) {
      slide.content.supportImage = toRenderableImageUrl(slide.content.supportImage);
    }

    var canvas = renderSlideToCanvas(slide, project);
    if (canvas) {
      canvas.className = "carousel-canvas";
      renderedSlides.push({
        slide: slide,
        canvas: canvas,
        index: i
      });
    }
  }

  return renderedSlides;
}

function toRenderableImageUrl(imgUrl) {
  if (!imgUrl) return "";
  if (imgUrl.indexOf("data:") === 0 || imgUrl.indexOf("blob:") === 0) return imgUrl;
  if (imgUrl.indexOf(WORKER + "?image=") === 0) return imgUrl;
  return WORKER + "?image=" + encodeURIComponent(imgUrl);
}
