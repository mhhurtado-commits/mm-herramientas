console.log("RENDER");

import { renderSlideToCanvas } from "./canvas-renderer.js";

export function renderCarousel(project) {
  if (!project || !project.slides || !project.slides.length) {
    return [];
  }

  var renderedSlides = [];

  for (var i = 0; i < project.slides.length; i++) {
    var slide = project.slides[i];
    slide.id = slide.id || ("slide-" + i);

    if (slide.type === "cover" && !slide.content.image && project.article.image) {
      slide.content.image = project.article.image;
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
