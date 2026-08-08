import test from "node:test";
import assert from "node:assert/strict";
import { fromEditorialPackage, attachReelPackage } from "./reel-package-adapter.js";

function samplePackage() {
  return {
    tipo: "noticia_editorial",
    version: 2,
    fuente: {
      url: "https://mediamendoza.com/general/1",
      titulo_original: "Título original",
      categoria: "general",
      cuerpo: "Texto de la noticia",
      imagen_principal: "https://example.com/foto.jpg",
      imagenes: ["https://example.com/foto.jpg"]
    },
    editorial: {
      etiqueta: "ACTUALIDAD",
      titulo: "Una noticia importante para la comunidad",
      bajada: "La información principal resumida para el video.",
      contexto: "El dato que completa la noticia.",
      redes: { instagram: "Texto para Instagram", facebook: "Texto para Facebook" }
    },
    salidas: { placas: [], carrusel: null, reel: null },
    redes: { instagram: "Texto para Instagram", facebook: "Texto para Facebook" }
  };
}

test("construye un ReelPlan desde el paquete común sin volver a extraer", () => {
  const adapted = fromEditorialPackage(samplePackage());
  assert.equal(adapted.article.title, "Título original");
  assert.equal(adapted.reel.scenes.length, 3);
  assert.equal(adapted.reel.scenes[0].visual_source, "https://example.com/foto.jpg");
  assert.equal(adapted.reel.scenes[2].visual_role, "context");
});

test("adjunta la salida reel al proyecto existente", () => {
  const project = { article: { title: "viejo" }, reelPlan: null, editorialPackage: null };
  const next = attachReelPackage(project, samplePackage());
  assert.equal(next.article.title, "Título original");
  assert.equal(next.reelPlan.scenes.length, 3);
  assert.equal(next.editorialPackage.salidas.reel.scenes.length, 3);
  assert.equal(project.reelPlan, null);
});
