import { createCarouselProject } from "./models.js";
import { createSlide } from "./slide-model.js";

console.log("GENERANDO DEMO");

export function createDemoProject() {
  console.log("CREATE DEMO PROJECT");
  var project = createCarouselProject();

  project.article.url = "https://mediamendoza.com/demo-clima";
  project.article.title = "Martes frío y con lloviznas";
  project.article.category = "Clima";
  project.article.image = "https://picsum.photos/1080/1350";
  project.article.summary = "Martes gris, temperatura máxima de 14°C y probabilidad de lloviznas durante toda la jornada en el Gran Mendoza.";
  project.article.content = "La jornada de este martes se presenta con cielo cubierto, temperaturas que no superarán los 14°C y probabilidad de lloviznas durante todo el día en el Gran Mendoza. El viento sopla del sector sur con una velocidad promedio de 15 km/h, lo que incrementa la sensación térmica fría. Se recomienda a los conductores extremar las precauciones en rutas y calles debido a la calzada resbaladiza. Para el miércoles se espera un leve ascenso de temperatura con máxima de 18°C y cielo parcialmente nublado.";

  var slides = [];
  var order = 0;

  var cover = createSlide();
  cover.id = "slide-" + order;
  cover.type = "cover";
  cover.template = "cover";
  cover.order = order++;
  cover.content.title = "Martes frío y con lloviznas";
  cover.content.subtitle = "La temperatura máxima no superará los 14°C en el Gran Mendoza";
  slides.push(cover);

  var slide1 = createSlide();
  slide1.id = "slide-" + order;
  slide1.type = "context";
  slide1.template = "text";
  slide1.order = order++;
  slide1.content.title = "Jornada bajo cero";
  slide1.content.text = "Cielo cubierto durante toda la jornada con temperaturas que oscilarán entre los 8°C y 14°C. El viento sur mantiene la sensación térmica por debajo de los valores reales.";
  slides.push(slide1);

  var slide2 = createSlide();
  slide2.id = "slide-" + order;
  slide2.type = "facts";
  slide2.template = "stats";
  slide2.order = order++;
  slide2.content.title = "Datos del día";
  slide2.content.items = [
    "Temperatura máxima: 14°C",
    "Temperatura mínima: 8°C",
    "Velocidad del viento: 15 km/h",
    "Probabilidad de lluvia: 70%"
  ];
  slides.push(slide2);

  var slide3 = createSlide();
  slide3.id = "slide-" + order;
  slide3.type = "impact";
  slide3.template = "text";
  slide3.order = order++;
  slide3.content.title = "Recomendaciones";
  slide3.content.text = "Extremar precauciones en rutas y calles por calzada resbaladiza. Se espera un leve ascenso de temperatura para el miércoles con máxima de 18°C.";
  slides.push(slide3);

  var slide4 = createSlide();
  slide4.id = "slide-" + order;
  slide4.type = "cta";
  slide4.template = "end";
  slide4.order = order++;
  slide4.content.title = "Gracias por leernos";
  slide4.content.text = "Mantenete informado con Media Mendoza";
  slides.push(slide4);

  project.slides = slides;

  return project;
}
