import test from "node:test";
import assert from "node:assert/strict";
import { fromEditorialPackage, attachReelPackage, ensureReelClosure } from "./reel-package-adapter.js";

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
  assert.equal(adapted.reel.scenes.length, 4);
  assert.equal(adapted.reel.scenes[0].visual_source, "https://example.com/foto.jpg");
  assert.equal(adapted.reel.scenes[2].visual_role, "context");
  assert.equal(adapted.reel.scenes[3].layout, "cta");
});

test("adjunta la salida reel al proyecto existente", () => {
  const project = { article: { title: "viejo" }, reelPlan: null, editorialPackage: null };
  const next = attachReelPackage(project, samplePackage());
  assert.equal(next.article.title, "Título original");
  assert.equal(next.reelPlan.scenes.length, 4);
  assert.equal(next.editorialPackage.salidas.reel.scenes.length, 4);
  assert.equal(project.reelPlan, null);
});

test("agrega un cierre sin duplicarlo y conserva las escenas generadas", () => {
  const scenes = [
    { visual_role: "hook", layout: "cover", text: "Título" },
    { visual_role: "context", layout: "text", text: "Contexto" },
  ];
  const output = ensureReelClosure({ scenes }, { url: "https://mediamendoza.com/general/1" });
  assert.equal(output.scenes.length, 3);
  assert.equal(output.scenes[2].visual_role, "cta");
  assert.equal(output.scenes[2].subtitle, "Más información en mediamendoza.com");

  const existing = ensureReelClosure({ scenes: [...output.scenes] }, {});
  assert.equal(existing.scenes.length, 3);
});

test("hereda la categoria editorial seleccionada y la aplica al Reel", () => {
  const packageWithOptions = {
    ...samplePackage(),
    editorial: {
      ...samplePackage().editorial,
      seccion: "Policiales",
      category_options: [
        { id: "policiales-principal", label: "Policiales", vertical: "policiales", recommended: true },
        { id: "general-editorial", label: "Actualidad", vertical: "general" },
      ],
    },
  };

  const adapted = attachReelPackage({}, packageWithOptions);

  assert.equal(adapted.article.category, "Policiales");
  assert.deepEqual(adapted.categoryOptions.map((option) => option.label), ["Policiales", "Actualidad"]);
  assert.equal(adapted.selectedCategoryId, "policiales-principal");
  assert.equal(adapted.editorialDiagnosis.vertical, "policiales");
});

test("consume el ReelPlan guardado en el paquete", () => {
  const stored = {
    ...samplePackage(),
    salidas: {
      placas: [],
      carrusel: null,
      reel: {
        format: "reel_silent",
        scenes: [{ visual_role: "hook", layout: "cover", text: "Hook guardado" }],
      },
    },
  };
  const adapted = fromEditorialPackage(stored);

  assert.equal(adapted.reel.scenes[0].text, "Hook guardado");
  assert.equal(adapted.reel.scenes.at(-1).visual_role, "cta");
});
