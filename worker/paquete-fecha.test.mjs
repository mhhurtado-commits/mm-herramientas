import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlateEditorialPrompt, fechaRedaccionMendoza } from './worker.js';

const NOTA = { title: 'Cambio de frecuencias en el transporte', body: 'El servicio de transporte modificará su recorrido.' };

test('fechaRedaccionMendoza devuelve día y hora local de Mendoza', () => {
  // 2026-11-09 es lunes; 19:29 UTC → 16:29 local (-03:00)
  const fecha = fechaRedaccionMendoza(new Date('2026-11-09T19:29:00Z'));
  assert.match(fecha, /lunes/);
  assert.match(fecha, /09\/11\/2026/);
  assert.match(fecha, /16:29/);
});

test('buildPlateEditorialPrompt inyecta la fecha con reglas para resolver referencias relativas', () => {
  const prompt = buildPlateEditorialPrompt(NOTA, { fecha: 'lunes, 09/11/2026, 16:29' });
  assert.ok(prompt.includes('FECHA Y HORA ACTUAL (hora local Mendoza, Argentina): lunes, 09/11/2026, 16:29'));
  assert.ok(prompt.includes('hoy'), 'debe guiar sobre referencias relativas');
  assert.ok(!prompt.includes('${fecha}'), 'no debe dejar el token sin resolver');
});

test('buildPlateEditorialPrompt sin fecha sigue generando un prompt válido', () => {
  const prompt = buildPlateEditorialPrompt(NOTA);
  assert.ok(!prompt.includes('FECHA Y HORA ACTUAL'));
  assert.ok(prompt.includes('NOTICIA:'));
});
