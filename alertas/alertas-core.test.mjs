import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAlertReport, normalizeNivel, validarEnFuente, buildWhatsAppCaption, emptyReport, ALERTAS_SYSTEM_PROMPT } from './alertas-core.mjs';

const PARTE1 = `Reporte Meteorológico
Informa el Sr. Marcelo Peña de Radar San Rafael-AEMSA:
-La tormenta comienza a afectar con lluvia fuerte y granizo a Calle Larga, Atuel Norte y Villa Atuel. Sigue desplazándose hacia el este, y podría afectar más tarde a Las Aguaditas, Real del Padre y el sector norte de Jaime Prats.
-Otra tormenta con granizo comienza a cruzar la Ruta 144 a la altura del Desvío. Se desplaza al este, con dirección al Cañón del Atuel y Valle Grande.`;
const PARTE2 = `-Atención para Valle Grande en 5-10 minutos. Estaría llegando al Embalse una tormenta con precipitación de lluvia fuerte y granizo.`;

test('prompt del sistema documenta el contrato JSON', () => {
  assert.match(ALERTAS_SYSTEM_PROMPT, /SOLO/);
  assert.match(ALERTAS_SYSTEM_PROMPT, /celdas/);
  assert.match(ALERTAS_SYSTEM_PROMPT, /eta/);
  assert.match(ALERTAS_SYSTEM_PROMPT, /gris/);
  assert.match(ALERTAS_SYSTEM_PROMPT, /violeta/);
});

test('normalizeNivel: niveles válidos y fallback naranja', () => {
  assert.equal(normalizeNivel('rojo'), 'rojo');
  assert.equal(normalizeNivel('ROJO'), 'rojo');
  assert.equal(normalizeNivel('Amarillo'), 'amarillo');
  assert.equal(normalizeNivel('gris'), 'gris');
  assert.equal(normalizeNivel('BLANCO'), 'blanco');
  assert.equal(normalizeNivel('Azul'), 'azul');
  assert.equal(normalizeNivel('violeta'), 'violeta');
  assert.equal(normalizeNivel('huracán'), 'naranja');
  assert.equal(normalizeNivel(''), 'naranja');
});

test('emptyReport es estable y vacío', () => {
  const r = emptyReport();
  assert.equal(r.nivel, 'naranja');
  assert.deepEqual(r.celdas, []);
  assert.equal(r.eta, null);
});

test('normaliza respuesta válida: 2 celdas ordenadas, dirección este, eta con minutos 10', () => {
  const data = normalizeAlertReport({
    titular: 'Tormentas con granizo al este.',
    fuente: 'Radar San Rafael-AEMSA · Marcelo Peña',
    hora: '11:00', fecha: '17/11', nivel: 'naranja', direccion: 'este',
    celdas: [
      { etiqueta: 'ahora', zonas: 'Calle Larga, Atuel Norte y Villa Atuel', detalle: 'lluvia fuerte y granizo', hacia: 'este' },
      { etiqueta: 'ruta', zonas: 'Ruta 144 a la altura del Desvío → Cañón del Atuel, Valle Grande', detalle: 'tormenta con granizo', hacia: 'este' },
    ],
    eta: { lugar: 'Valle Grande · Embalse', detalle: 'lluvia fuerte y granizo', minutos: 10 },
  });
  assert.equal(data.titular, 'Tormentas con granizo al este'); // sin punto final
  assert.equal(data.celdas.length, 2);
  assert.equal(data.celdas[0].etiqueta, 'ahora');
  assert.equal(data.celdas[1].etiqueta, 'ruta');
  assert.equal(data.eta.minutos, 10);
  assert.equal(data.direccion, 'este');
});

test('parte sin eta: eta === null y caption sin línea de ETA', () => {
  const data = normalizeAlertReport({ titular: 'Tormentas al este', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [{ etiqueta: 'ahora', zonas: 'Villa Atuel', detalle: 'granizo', hacia: 'este' }], eta: null });
  assert.equal(data.eta, null);
  const caption = buildWhatsAppCaption(data);
  assert.doesNotMatch(caption, /5–10|llegada en/);
});

test('validarEnFuente descarta dirección no presente en el parte', () => {
  const data = normalizeAlertReport({ titular: 'Tormentas al oeste', fuente: 'Radar', nivel: 'naranja', direccion: 'oeste', celdas: [], eta: null });
  assert.equal(validarEnFuente(data, PARTE1).direccion, '');
});

test('validarEnFuente descarta ETA cuyo lugar no aparece', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [], eta: { lugar: 'Bariloche', detalle: 'granizo', minutos: 5 } });
  assert.equal(validarEnFuente(data, PARTE1).eta, null);
});

test('validarEnFuente mantiene ETA compuesto cuando cada componente aparece en el parte', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [], eta: { lugar: 'Valle Grande · Embalse', detalle: 'granizo', minutos: 10 } });
  assert.equal(validarEnFuente(data, PARTE1 + '\n' + PARTE2).eta.minutos, 10);
});

test('validarEnFuente descarta ETA compuesto si algún componente no aparece', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [], eta: { lugar: 'Valle Grande · Bariloche', detalle: 'granizo', minutos: 5 } });
  assert.equal(validarEnFuente(data, PARTE1 + '\n' + PARTE2).eta, null);
});

test('validarEnFuente descarta ETA con lugar vacío', () => {
  const data = { titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: '', celdas: [], eta: { lugar: '', detalle: 'granizo', minutos: 5 } };
  assert.equal(validarEnFuente(data, PARTE2).eta, null);
});

test('caption: omite viñetas inventadas si no hay celdas y mantiene encabezado fijo', () => {
  const data = normalizeAlertReport({ titular: 'Alerta de tormentas', fuente: 'Radar', nivel: 'naranja', direccion: '', celdas: [], eta: null });
  const caption = buildWhatsAppCaption(data);
  assert.match(caption, /^⚡ ALERTA \| Media Mendoza/);
  assert.doesNotMatch(caption, /• /);
});

test('validarEnFuente descarta zonas no presentes en el parte (cadena vacía, nunca inventada)', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [{ etiqueta: 'ahora', zonas: 'Bariloche, Villa Gesell', detalle: 'granizo', hacia: 'este' }], eta: null });
  assert.equal(validarEnFuente(data, PARTE1).celdas[0].zonas, '');
});

test('caption: sin titular, encabezado fijo queda y no se imprime línea de titular', () => {
  const data = normalizeAlertReport({ titular: '', fuente: 'Radar', nivel: 'naranja', direccion: '', celdas: [{ etiqueta: 'ahora', zonas: 'Villa Atuel', detalle: 'granizo', hacia: 'este' }], eta: null });
  const caption = buildWhatsAppCaption(data);
  assert.match(caption, /^⚡ ALERTA \| Media Mendoza\n• Ahora: Villa Atuel/);
});

test('normalizeAlertReport tolera garbage/undefined (no throw)', () => {
  assert.deepEqual(normalizeAlertReport(''), emptyReport());
  assert.deepEqual(normalizeAlertReport(undefined), emptyReport());
  assert.deepEqual(normalizeAlertReport({ celdas: 'nope' }).celdas, []);
});
