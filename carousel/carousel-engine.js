import { setDefaultProject } from "./state.js";
import { initUI } from "./ui.js";

export function createCarousel() {
  setDefaultProject();
  initUI();
  console.log("Carousel listo");
}

export function loadTemplate(){}

export function renderSlide(){}

export function exportCarousel(){}
