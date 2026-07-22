console.log("RENDER");

import { renderSlideToCanvas } from "./canvas-renderer.js";

export function renderCarousel(project) {
  console.log("renderCarousel called", project ? "project ok" : "NO PROJECT");
  if (!project || !project.slides || !project.slides.length) {
    return '<div style="padding:20px;text-align:center;color:#999">Sin diapositivas</div>';
  }

  console.log("slides count:", project.slides.length);
  for (var i = 0; i < project.slides.length; i++) {
    var slide = project.slides[i];
    slide.id = slide.id || ("slide-" + i);

    if (slide.type === "cover" && !slide.content.image && project.article.image) {
      slide.content.image = project.article.image;
    }

    console.log("SLIDE " + (i + 1), slide.template);
    var canvas = renderSlideToCanvas(slide, project);
    canvas.className = "carousel-canvas";
    var previewEl = document.getElementById("carousel-preview");
    console.log("preview element:", previewEl);
    if (previewEl) {
      previewEl.appendChild(canvas);
    } else {
      console.log("ERROR: #carousel-preview is null");
    }
  }
}
