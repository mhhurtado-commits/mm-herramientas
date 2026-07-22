import { createCarouselProject } from "./models.js";

export let project = null;

export function setProject(p) {
  project = p;
}

export function getProject() {
  return project;
}

export function setDefaultProject() {
  project = createCarouselProject();
}
