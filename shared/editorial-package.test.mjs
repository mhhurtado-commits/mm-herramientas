import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeEditorialPackage,
  packageFromPlate,
  packageToCarouselArticle,
  packageToPlateInput,
} from './editorial-package.mjs';

test('normaliza un paquete editorial común y lo adapta a carrusel', () => {
  const result = normalizeEditorialPackage({
    tipo: 'noticia_editorial',
    version: 2,
    fuente: {
      url: 'https://example.com/1',
      titulo_original: 'Título',
      categoria: 'Tiempo libre',
      cuerpo: 'Texto',
    },
    editorial: {
      seccion: 'Tiempo libre',
      familia: 'general',
      tipo_noticia: 'noticia',
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.package.version, 2);
  assert.equal(result.package.fuente.url, 'https://example.com/1');
  assert.deepEqual(packageToCarouselArticle(result.package), {
    url: 'https://example.com/1',
    title: 'Título',
    category: 'Tiempo libre',
    summary: '',
    image: '',
    images: [],
    content: 'Texto',
    editorialVertical: 'Tiempo libre',
    editorialContext: '',
    editorialFacts: [],
    editorialTextual: [],
  });
});

test('conserva la fecha para resolver hoy y futuro en el carrusel', () => {
  const result = normalizeEditorialPackage({
    tipo: 'noticia_editorial', version: 2, fecha: '2026-08-19',
    fuente: { url: 'https://example.com/1', titulo_original: 'Clima', categoria: 'Clima' },
    editorial: { seccion: 'Clima', bajada: 'Jornada actual' },
  });
  assert.equal(packageToCarouselArticle(result.package).date, '2026-08-19');
});

test('aplana datos clave anidados sin convertir objetos en texto visible', () => {
  const result = normalizeEditorialPackage({
    tipo: 'noticia_editorial',
    version: 2,
    fuente: { url: 'https://example.com/clima', titulo_original: 'Pronóstico', categoria: 'Clima' },
    editorial: {
      seccion: 'Clima',
      datos_clave: [
        { label: 'Temperatura máxima', value: { value: '19°C', label: 'miércoles' } },
        { label: 'Mínima', value: '-1°C' },
      ],
    },
  });

  assert.deepEqual(result.package.editorial.datos_clave, [
    { label: 'Temperatura máxima', value: '19°C', detail: '' },
    { label: 'Mínima', value: '-1°C', detail: '' },
  ]);
});

test('adapta una placa existente al paquete y vuelve a input de placas', () => {
  const packageResult = normalizeEditorialPackage(packageFromPlate({
    tipo: 'placa_noticia',
    version: 1,
    fuente: {
      url: 'https://example.com/2',
      titulo_original: 'Título original',
      categoria: 'Policiales',
      texto: 'Cuerpo de la noticia',
      imagen: 'https://example.com/cover.jpg',
      imagenes: ['https://example.com/cover.jpg', 'https://example.com/second.jpg'],
    },
    titulo: 'Titular editorial',
    bajada: 'Bajada editorial',
    contexto: 'Contexto editorial',
    pregunta_social: '¿Cómo impacta esta medida?',
    etiqueta: 'Policiales',
    template_sugerido: 'policiales',
    tipo_placa: 'noticia',
    textual: { cita: '', autor: '', cargo: '', verificada: false },
    personas: [],
  }));

  assert.equal(packageResult.ok, true);
  const input = packageToPlateInput(packageResult.package);
  assert.equal(input.titulo, 'Titular editorial');
  assert.equal(input.bajada, 'Bajada editorial');
  assert.equal(input.contexto, 'Contexto editorial');
  assert.equal(input.pregunta_social, '¿Cómo impacta esta medida?');
  assert.equal(input.cuerpo, 'Cuerpo de la noticia');
  assert.deepEqual(input.images, ['https://example.com/cover.jpg', 'https://example.com/second.jpg']);
});

test('devuelve errores determinísticos para paquetes incompletos', () => {
  const result = normalizeEditorialPackage({
    tipo: 'noticia_editorial',
    version: 1,
    fuente: { cuerpo: 'Texto' },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, [
    'version inválida',
    'fuente.url faltante',
    'fuente.titulo_original faltante',
    'editorial faltante',
  ]);
});
