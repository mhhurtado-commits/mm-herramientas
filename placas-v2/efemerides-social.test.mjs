import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEfemeridesSocialPrompt, normalizeEfemeridesSocialCopies } from './efemerides-social.mjs';

test('construye los copys usando exactamente las tres efemérides confirmadas', () => {
  const items = [
    { año: '1850', titulo: 'Paso a la Inmortalidad de San Martín', resumen: 'Muere el libertador argentino.' },
    { año: '2005', titulo: 'Debut de Messi en la Selección', resumen: 'Debuta ante Hungría.' },
    { año: '1957', titulo: 'Nacimiento de Ricardo Mollo', resumen: 'Nace el músico argentino.' },
  ];
  const prompt = buildEfemeridesSocialPrompt(items, '2026-08-17');
  assert.match(prompt.userMsg, /Paso a la Inmortalidad de San Martín/);
  assert.match(prompt.userMsg, /Debut de Messi en la Selección/);
  assert.match(prompt.userMsg, /Nacimiento de Ricardo Mollo/);
  assert.doesNotMatch(prompt.userMsg, /otras efemérides|invent/i);
  assert.match(prompt.systemPrompt, /placa/);
  assert.match(prompt.systemPrompt, /carrusel/);
});

test('normaliza respuesta JSON de copys para placa y carrusel', () => {
  const result = normalizeEfemeridesSocialCopies(JSON.stringify({
    placa: { instagram: 'Placa IG', facebook: 'Placa FB' },
    carrusel: { instagram: 'Carrusel IG', facebook: 'Carrusel FB' },
  }));
  assert.deepEqual(result, {
    placa: { instagram: 'Placa IG', facebook: 'Placa FB' },
    carrusel: { instagram: 'Carrusel IG', facebook: 'Carrusel FB' },
  });
});
