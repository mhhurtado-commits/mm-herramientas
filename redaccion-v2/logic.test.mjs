import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKER_PRODUCCION, resolverApiBase, crearEstadoInicial,
  validarEntradaReformular, construirPayloadReformular, fuentesSeguras,
  mensajeError, etiquetaModelo, resumenNota, normalizarSalud,
  normalizarHashtags, serializarBorrador, deserializarBorrador,
} from './logic.mjs';

test('usa el worker local en localhost y el de produccion en el resto', () => {
  assert.equal(resolverApiBase({ hostname: 'localhost', protocol: 'http:' }), 'http://localhost:8787');
  assert.equal(resolverApiBase({ hostname: '127.0.0.1', protocol: 'http:' }), 'http://localhost:8787');
  assert.equal(resolverApiBase({ hostname: 'mediamendoza.pages.dev', protocol: 'https:' }), WORKER_PRODUCCION);
});

test('el estado inicial no tiene nota ni fuentes', () => {
  const estado = crearEstadoInicial();
  assert.equal(estado.nota, null);
  assert.deepEqual(estado.fuentes, []);
  assert.equal(estado.tab, 'monitor');
});

test('valida titulo y cuerpo antes de llamar a la IA', () => {
  assert.equal(validarEntradaReformular({ titulo: 'Corto', contenido: 'x'.repeat(100) }).ok, false);
  assert.equal(validarEntradaReformular({ titulo: 'Un título correcto', contenido: 'x'.repeat(100) }).ok, true);
});

test('el payload conserva origen y fuentes verificadas', () => {
  const payload = construirPayloadReformular({
    titulo: 'Título original',
    contenido: 'Cuerpo original',
    contexto: 'Dato extra',
    estilo: 'formal',
    origen: { url: 'https://losandes.com.ar/nota', medio: 'Los Andes', titulo: 'Original' },
    fuentes: [{ titulo: 'F', url: 'https://uno.com/1', medio: 'UNO' }],
  });
  assert.equal(payload.fuenteUrl, 'https://losandes.com.ar/nota');
  assert.equal(payload.fuenteMedio, 'Los Andes');
  assert.equal(payload.fuentes.length, 1);
});

test('fuentesSeguras descarta esquemas peligrosos y duplicados', () => {
  const fuentes = fuentesSeguras([
    { titulo: 'Uno', url: 'https://uno.com/1', medio: 'UNO' },
    { titulo: 'Otra', url: 'https://uno.com/1/', medio: 'UNO' },
    { titulo: 'Mala', url: 'javascript:alert(1)', medio: 'X' },
    { titulo: 'Dos', url: 'https://dos.com/2', medio: 'Dos' },
    { titulo: 'Tres', url: 'https://tres.com/3', medio: 'Tres' },
    { titulo: 'Cuatro', url: 'https://cuatro.com/4', medio: 'Cuatro' },
  ]);
  assert.equal(fuentes.length, 3);
  assert.equal(fuentes[0].url, 'https://uno.com/1');
});

test('los errores se traducen a mensajes accionables', () => {
  assert.match(mensajeError('respuesta_incompleta'), /cortó/i);
  assert.match(mensajeError('modelo_no_disponible'), /modelo/i);
  assert.match(mensajeError('sin_fuentes_verificadas'), /fuente/i);
  assert.match(mensajeError('otro'), /error/i);
});

test('la etiqueta del modelo incluye el tiempo en segundos', () => {
  assert.equal(etiquetaModelo({ modelo: 'gemini-3.8-flash', latenciaMs: 4200 }), 'gemini-3.8-flash · 4,2 s');
  assert.equal(etiquetaModelo({}), '');
});

test('el resumen de nota cuenta párrafos y caracteres', () => {
  const resumen = resumenNota({ titular: 'T', cuerpo: 'Uno.\n\nDos.\n\nTres.', categoria: 'Policiales' });
  assert.equal(resumen.parrafos, 3);
  assert.equal(resumen.caracteres, 13);
  assert.equal(resumen.categoria, 'Policiales');
});

test('normalizarSalud marca degradado si falta KV o AI', () => {
  assert.equal(normalizarSalud({ ok: true, kv: true, ai: true, keys: 1 }).estado, 'ok');
  assert.equal(normalizarSalud({ ok: true, kv: false, ai: true, keys: 1 }).estado, 'degradado');
  assert.equal(normalizarSalud(null).estado, 'sin_datos');
});

test('los hashtags salen con numeral, sin duplicados y sin espacios', () => {
  assert.deepEqual(normalizarHashtags(['Policiales', '#Policiales', ' #Justicia ', 'Derechos Humanos']), ['#Policiales', '#Justicia', '#DerechosHumanos']);
  assert.deepEqual(normalizarHashtags([]), []);
  assert.deepEqual(normalizarHashtags(null), []);
});

test('el borrador sobrevive a serializar y deserializar', () => {
  const estado = crearEstadoInicial();
  estado.titulo = 'Título';
  estado.contenido = 'Cuerpo';
  const vuelta = deserializarBorrador(serializarBorrador(estado));
  assert.equal(vuelta.titulo, 'Título');
  assert.equal(vuelta.contenido, 'Cuerpo');
  assert.equal(deserializarBorrador('no es json'), null);
});
