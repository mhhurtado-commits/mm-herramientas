import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEditorialHandoff } from '../placas-v2/output-handoff.mjs';
import { HANDOFF_KEY, parseHandoff, esHandoffWhatsappActivo, extraerDatosNota } from './handoff.mjs';

const PAQUETE = {
  version: 1,
  fuente: {
    url: 'https://mediamendoza.com/policiales/251300-le-hurtaron-la-billetera-tras-un-descuido',
    titulo_original: 'Le hurtaron la billetera tras un descuido',
    categoria: 'policiales',
    cuerpo: 'La Policía San Rafael investiga el hecho ocurrido esta mañana en el microcentro.',
    imagen: 'https://res.cloudinary.com/mediamendoza/image/upload/ejemplo.jpg',
    imagenes: ['https://res.cloudinary.com/mediamendoza/image/upload/ejemplo.jpg'],
    fecha: '2026-10-19',
  },
  editorial: { titulo: 'Le hurtaron la billetera tras un descuido', template_sugerido: 'policiales' },
  salidas: { whatsapp: null },
};

const HANDOFF_VALIDO = createEditorialHandoff(PAQUETE, 'whatsapp', 'publicar');

test('expone la clave exacta del contrato editorial', () => {
  assert.equal(HANDOFF_KEY, 'mm-editorial-handoff');
});

test('parsea el handoff creado desde /publicar para WhatsApp', () => {
  const parsed = parseHandoff(HANDOFF_VALIDO);
  assert.equal(parsed.output, 'whatsapp');
  assert.equal(parsed.origen, 'publicar');
  assert.deepEqual(parsed.package, PAQUETE);
});

test('descarta JSON corrupto', () => {
  assert.equal(parseHandoff('{output:"whatsapp"'), null);
});

test('descarta valores vacíos o nulos', () => {
  assert.equal(parseHandoff(''), null);
  assert.equal(parseHandoff(null), null);
  assert.equal(parseHandoff(undefined), null);
});

test('descarta handoff sin package', () => {
  assert.equal(parseHandoff(JSON.stringify({ output: 'whatsapp', origen: 'publicar' })), null);
});

test('descarta handoff con output fuera del contrato', () => {
  assert.equal(parseHandoff(JSON.stringify({ output: 'instagram', package: PAQUETE, origen: 'publicar' })), null);
});

test('valida el handoff activo para WhatsApp con origen publicar', () => {
  assert.equal(esHandoffWhatsappActivo(parseHandoff(HANDOFF_VALIDO)), true);
});

test('rechaza handoff de otro output', () => {
  assert.equal(esHandoffWhatsappActivo(parseHandoff(createEditorialHandoff(PAQUETE, 'carrusel', 'publicar'))), false);
});

test('rechaza handoff con origen distinto de publicar', () => {
  assert.equal(esHandoffWhatsappActivo(parseHandoff(createEditorialHandoff(PAQUETE, 'whatsapp', 'app'))), false);
});

test('rechaza handoff sin fuente.url', () => {
  const sinUrl = { ...PAQUETE, fuente: { ...PAQUETE.fuente, url: '' } };
  assert.equal(esHandoffWhatsappActivo(parseHandoff(createEditorialHandoff(sinUrl, 'whatsapp', 'publicar'))), false);
});

test('rechaza handoff anulado del sessionStorage', () => {
  assert.equal(esHandoffWhatsappActivo(parseHandoff('null')), false);
  assert.equal(esHandoffWhatsappActivo(null), false);
});

test('extrae los datos de precarga de la nota desde el paquete', () => {
  assert.deepEqual(extraerDatosNota(parseHandoff(HANDOFF_VALIDO)), {
    url: PAQUETE.fuente.url,
    titulo: PAQUETE.fuente.titulo_original,
    categoria: PAQUETE.fuente.categoria,
  });
});

test('no extrae datos de precarga de un handoff inactivo', () => {
  assert.equal(extraerDatosNota(null), null);
  assert.equal(extraerDatosNota(parseHandoff(createEditorialHandoff(PAQUETE, 'reel', 'publicar'))), null);
});
