import test from "node:test";
import assert from "node:assert/strict";
import { packageFromPlate } from "./editorial-package.mjs";
import { loadEditorialSession } from "../placas-v2/editorial-session.mjs";
import { fromEditorialPackage as toCarousel } from "../carousel/shared-package-adapter.js";
import { fromEditorialPackage as toReel } from "../carousel/reel-package-adapter.js";

const plate = {
  url: "https://mediamendoza.com/sociedad/251500-noticia",
  etiqueta: "SOCIEDAD",
  titulo: "El hospital sumó un nuevo servicio para la comunidad",
  bajada: "La iniciativa amplía la atención y facilita el acceso de los vecinos.",
  contexto: "El servicio funcionará desde esta semana con turnos programados.",
  cuerpo: "La noticia completa con información institucional.",
  image: "https://example.com/hospital.jpg",
  category: "sociedad",
  template_sugerido: "sociales",
  redes: { instagram: "Texto IG", facebook: "Texto FB" }
};

test("una noticia alimenta placa, carrusel y reel desde una sola extracción", async () => {
  const editorialPackage = packageFromPlate({
    ...plate,
    fuente: {
      url: plate.url,
      titulo_original: plate.titulo,
      categoria: plate.category,
      cuerpo: plate.cuerpo,
      imagen: plate.image,
      imagenes: [plate.image]
    }
  });
  let extractCalls = 0;
  let generateCalls = 0;
  const session = await loadEditorialSession(plate.url, ["placa", "carrusel", "reel"], {
    extract: async () => {
      extractCalls += 1;
      return plate;
    },
    generate: async () => {
      generateCalls += 1;
      return { ok: true, paquete: editorialPackage };
    }
  });
  const carousel = toCarousel(session.package);
  const reel = toReel(session.package);

  assert.equal(extractCalls, 1);
  assert.equal(generateCalls, 1);
  assert.equal(session.plate.titulo, plate.titulo);
  assert.equal(carousel.article.image, plate.image);
  assert.equal(reel.reel.scenes[2].text, plate.contexto);
});
