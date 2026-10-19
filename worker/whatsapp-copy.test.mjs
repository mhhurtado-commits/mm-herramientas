import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsappPrompt, WA_FIRMA } from './whatsapp-copy.mjs';

const LINKS = { grupo: 'https://chat.whatsapp.com/DgxM0LvX2sYGStslNDBKjL', canal: 'https://whatsapp.com/channel/0029VaJX0cRB4hdIkQu2xg1f' };
const NOTA = { titulo: 'Corte de ruta en Ruta 40', categoria: 'Policial', url: 'https://mm.in/abc',
  body: 'Vecinos cortan la ruta en San Rafael desde las 8. Piden respuestas.', descripcion: '', image: '' };

test('el prompt no delega links de comunidad ni firma al modelo (template con placeholders)', () => {
  const base = `FORMATO "grupo": [emoji] *[CATEGORIA]:* [titular]
[2-3 líneas clave con *negritas*] 👇
🔗 *DETALLES:* 👉 {URL}
*¡Sumate a nuestra comunidad!*
📱 {LINK_GRUPO} 📣 {LINK_CANAL}
*📰 Media Mendoza*`;
  const prompt = buildWhatsappPrompt({ promptBase: base, nota: NOTA, links: LINKS, localidad: 'San Rafael' });
  assert.ok(!prompt.includes('{LINK_GRUPO}'));
  assert.ok(!prompt.includes('{LINK_CANAL}'));
  assert.ok(!prompt.includes('bit.ly/mediamendoza'));
  assert.ok(!prompt.includes('chat.whatsapp.com'));
  assert.ok(prompt.includes('el sistema agrega')); // instrucción determinista presente
  assert.ok(prompt.includes(NOTA.titulo));
});
