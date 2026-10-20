import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTADO_KEY,
  construirPayloadPaquete,
  prepararEstado,
  validarEstado,
  serializarEstado,
  deserializarEstado,
  construirResumen,
  leerJson,
} from './logic.mjs';

const NOTA = {
  url: 'https://mediamendoza.com/policiales/251300-le-hurtaron-la-billetera-tras-un-descuido',
  title: 'Le hurtaron la billetera tras un descuido',
  category: 'policiales',
  body: 'La Policía San Rafael investiga el hecho ocurrido esta mañana en el microcentro.',
  image: 'https://res.cloudinary.com/mediamendoza/image/upload/ejemplo.jpg',
};

const PAQUETE = {
  tipo: 'noticia_editorial',
  version: 2,
  fecha: '2026-10-19',
  fuente: {
    url: 'https://mediamendoza.com/policiales/251300-le-hurtaron-la-billetera-tras-un-descuido',
    titulo_original: 'Le hurtaron la billetera tras un descuido',
    categoria: 'policiales',
    cuerpo: 'La Policía San Rafael investiga el hecho ocurrido esta mañana.',
    imagen: 'https://res.cloudinary.com/mediamendoza/image/upload/ejemplo.jpg',
    imagenes: ['https://res.cloudinary.com/mediamendoza/image/upload/ejemplo.jpg'],
  },
  editorial: {
    seccion: 'policiales',
    titulo: 'Le hurtaron la billetera tras un descuido',
    bajada: 'El hecho se investiga en San Rafael.',
    datos_clave: [{ label: 'Zona', value: 'Microcentro de San Rafael', detail: '' }],
  },
  salidas: { placas: [], carrusel: null, reel: null },
  redes: { instagram: '', facebook: '' },
};

test('expone la clave propia para sobrevivir al Back', () => {
  assert.equal(ESTADO_KEY, 'mm-publicar-paquete');
});

test('leerJson devuelve null ante respuesta no JSON y el objeto ante JSON valido', async () => {
  assert.equal(await leerJson({ json: async () => { throw new SyntaxError('Unexpected token < in JSON'); } }), null);
  assert.deepEqual(await leerJson({ json: async () => ({ ok: true, paquete: PAQUETE }) }), { ok: true, paquete: PAQUETE });
});

test('arma el payload con el shape exacto que espera el endpoint', () => {
  const payload = construirPayloadPaquete(NOTA);
  assert.deepEqual(Object.keys(payload), ['nota', 'salidas']);
  assert.deepEqual(payload, { nota: NOTA, salidas: ['placa', 'carrusel', 'reel'] });
});

test('prepara un estado valido desde la respuesta del endpoint', () => {
  const estado = prepararEstado({ ok: true, paquete: PAQUETE, warnings: ['ia_no_disponible'], ia_error: 'deadline 20s' });
  assert.equal(estado.ok, true);
  assert.equal(validarEstado(estado), true);
  assert.equal(estado.package.fuente.url, PAQUETE.fuente.url);
  assert.deepEqual(estado.warnings, ['ia_no_disponible']);
  assert.equal(estado.ia_error, 'deadline 20s');
});

test('prepararEstado valida de nuevo y rechaza paquete sin fuente.url', () => {
  const sinUrl = { ...PAQUETE, fuente: { ...PAQUETE.fuente, url: '' } };
  const estado = prepararEstado({ ok: true, paquete: sinUrl, warnings: [] });
  assert.equal(estado.ok, false);
  assert.equal(validarEstado(estado), false);
  assert.ok(estado.errors.includes('fuente.url faltante'));
});

test('serializar y deserializar sobrevive al Back con revalidacion', () => {
  const estado = prepararEstado({ ok: true, paquete: PAQUETE, warnings: [] });
  const restaurado = deserializarEstado(serializarEstado(estado));
  assert.equal(restaurado.ok, true);
  assert.equal(validarEstado(restaurado), true);
  assert.equal(restaurado.package.fuente.url, PAQUETE.fuente.url);
});

test('deserializarEstado descarta JSON corrupto y valores vacios', () => {
  assert.equal(deserializarEstado(''), null);
  assert.equal(deserializarEstado(null), null);
  assert.equal(deserializarEstado('{paquete:'), null);
});

test('deserializarEstado deja un paquete sin fuente.url como estado invalido', () => {
  const sinUrl = { ...PAQUETE, fuente: { ...PAQUETE.fuente, url: '' } };
  const estado = deserializarEstado(serializarEstado(prepararEstado({ ok: true, paquete: sinUrl, warnings: [] })));
  assert.equal(validarEstado(estado), false);
});

test('construiResumen tolera campos vacios', () => {
  const estado = { ok: false, package: {}, warnings: [], ia_error: null, errors: [] };
  assert.deepEqual(construirResumen(estado), { titulo: '', seccion: '', datosClave: 0, warnings: [], ia_error: null });
});

test('construiResumen muestra titulo, seccion, datos clave, warnings e ia_error', () => {
  const estado = prepararEstado({ ok: true, paquete: PAQUETE, warnings: ['ia_no_disponible'], ia_error: 'respuesta vacia' });
  assert.deepEqual(construirResumen(estado), {
    titulo: 'Le hurtaron la billetera tras un descuido',
    seccion: 'policiales',
    datosClave: 1,
    warnings: ['ia_no_disponible'],
    ia_error: 'respuesta vacia',
  });
});
