import test from 'node:test';
import assert from 'node:assert/strict';
import { repararAnioEfemerides } from './worker.js';

const FECHA = '2026-11-14';

test('repararAnioEfemerides: conserva el año cuando ya difiere del de la fecha', () => {
  assert.equal(repararAnioEfemerides({ anio: '1894', titulo: 'X', resumen: 'Y', texto_ampliado: '' }, FECHA), '1894');
});

test('repararAnioEfemerides: repara el año de la fecha con el del texto ampliado', () => {
  const item = {
    anio: '2026',
    titulo: 'Nacimiento de Samuel Eichelbaum',
    resumen: 'Se conmemora el nacimiento del escritor.',
    texto_ampliado: 'El 14 de noviembre de 1894 nació en Argentina Samuel Eichelbaum.',
  };
  assert.equal(repararAnioEfemerides(item, FECHA), '1894');
});

test('repararAnioEfemerides: usa el resumen si el texto ampliado no trae año', () => {
  const item = {
    anio: '2026',
    titulo: 'Default con el Banco Mundial',
    resumen: 'Se recuerda el default con el Banco Mundial en 2002.',
    texto_ampliado: '',
  };
  assert.equal(repararAnioEfemerides(item, FECHA), '2002');
});

test('repararAnioEfemerides: año -1 del modelo se repara con el texto o se descarta', () => {
  assert.equal(repararAnioEfemerides({ anio: '-1', titulo: 'X', resumen: 'Y', texto_ampliado: '' }, FECHA), '');
  assert.equal(repararAnioEfemerides({ anio: '-1', titulo: 'X', resumen: 'Y', texto_ampliado: 'Ocurrió en 1913.' }, FECHA), '1913');
});

test('repararAnioEfemerides: descarta cuando el año es el de la fecha y el texto no trae otro', () => {
  const item = { anio: '2026', titulo: 'Hecho de hoy', resumen: 'Sin año en el texto.', texto_ampliado: '' };
  assert.equal(repararAnioEfemerides(item, FECHA), '');
});

test('repararAnioEfemerides: años fuera de rango no se aceptan aunque vengan del modelo', () => {
  assert.equal(repararAnioEfemerides({ anio: '2100', titulo: 'X', resumen: 'Y', texto_ampliado: '' }, FECHA), '');
  assert.equal(repararAnioEfemerides({ anio: '1499', titulo: 'X', resumen: 'Y', texto_ampliado: '' }, FECHA), '');
});

test('repararAnioEfemerides: acepta el campo año si el modelo no trae anio', () => {
  assert.equal(repararAnioEfemerides({ año: '1784', titulo: 'X', resumen: 'Y', texto_ampliado: '' }, FECHA), '1784');
});

test('repararAnioEfemerides: prefiere el año del texto ampliado sobre el del resumen', () => {
  const item = {
    anio: '2026',
    titulo: 'Nacimiento de Mario Roberto Álvarez',
    resumen: 'Aniversario del natalicio del arquitecto, ocurrido en 1913.',
    texto_ampliado: 'Nacido el 14 de noviembre de 1913, Mario Roberto Álvarez fue uno de los arquitectos más influyentes.',
  };
  assert.equal(repararAnioEfemerides(item, FECHA), '1913');
});
