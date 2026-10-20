import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsappPrompt, normalizeWhatsappCopy, buildCtaComunidad, WA_FIRMA, notaDesdePaquete, buildEditorialPromptBlock } from './whatsapp-copy.mjs';

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

test('elimina links de comunidad inventados y anexa el CTA canónico en grupo', () => {
  const salida = normalizeWhatsappCopy(
    `*SAN RAFAEL:* Corte de ruta\n\n🗓️ Hoy desde las 8 👇\n\n🔗 *MÁS DETALLES:*\n👉 https://mm.in/abc\n\n*¡Sumate a nuestra comunidad!*\n📱 Grupo: https://chat.whatsapp.com/FALSO123\n📻 Canal de difusión: bit.ly/mediamendoza-x\n\n*📰 Media Mendoza*`,
    { tipo: 'grupo', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(!salida.includes('chat.whatsapp.com/FALSO123'));
  assert.ok(!salida.includes('bit.ly/mediamendoza-x'));
  assert.ok(salida.includes(`📱 *Grupo de Noticias:* ${LINKS.grupo}`));
  assert.ok(salida.includes(`📣 *Canal de Difusión:* ${LINKS.canal}`));
  assert.equal(salida.split(WA_FIRMA).length - 1, 1);
  assert.ok(salida.trimEnd().endsWith(WA_FIRMA));
});

test('mensaje de canal termina solo con firma (sin CTA comunidad)', () => {
  const salida = normalizeWhatsappCopy(`*POLICIAL:* Titular\n\n• punto 1\n\n🔗 👉 https://mm.in/abc`,
    { tipo: 'canal', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(!salida.includes('¡Sumate a nuestra comunidad!'));
  assert.ok(salida.trimEnd().endsWith(WA_FIRMA));
});

test('buildCtaComunidad omite la línea del link faltante y nunca inventa URL', () => {
  assert.equal(buildCtaComunidad({}), '');
  assert.ok(!buildCtaComunidad({ grupo: LINKS.grupo }).includes('Canal de Difusión'));
  assert.ok(buildCtaComunidad({ grupo: LINKS.grupo }).startsWith('*¡Sumate a nuestra comunidad!*'));
});

test('corrige URL incorrecta de la nota presente en el texto', () => {
  const salida = normalizeWhatsappCopy(`*TITULAR*\n\n🔗 👉 https://sitio-inventado.com/nota`, { tipo: 'grupo', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(salida.includes('https://mm.in/abc'));
  assert.ok(!salida.includes('sitio-inventado.com'));
});

test('sin URL en la salida, anexa el enlace canónico tras el marcador (o al final)', () => {
  const salida = normalizeWhatsappCopy(`*TITULAR*\n\nkey datos 👇\n\n🔗 *MÁS DETALLES:*`, { tipo: 'grupo', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(salida.includes('🔗 *MÁS DETALLES:*\n👉 https://mm.in/abc') || salida.includes('https://mm.in/abc'));
});

test('filtro de líneas CTA cubre radio emoji y variantes de texto', () => {
  const salida = normalizeWhatsappCopy(
    `*SAN RAFAEL:* Corte de ruta\n\n🔗 👉 https://mm.in/abc\n\n*¡Sumate a nuestra comunidad!*\n📻 Canal de difusión: bit.ly/mediamendoza-x\n📱 *Grupo de Noticias:* https://chat.whatsapp.com/FALSO0`,
    { tipo: 'grupo', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(!salida.includes('📻'));
  assert.ok(!salida.includes('Canal de difusión'));
  assert.ok(salida.includes(`📱 *Grupo de Noticias:* ${LINKS.grupo}`));
  assert.ok(!salida.includes('chat.whatsapp.com/FALSO0'));
});

test('elimina el token {ENLACE} literal copiado del ejemplar y conserva la url canonica', () => {
  const salida = normalizeWhatsappCopy(
    `*SAN RAFAEL:* Corte de ruta\n\n🔗 *MÁS DETALLES:* 👉 {ENLACE}`,
    { tipo: 'grupo', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(!salida.includes('{ENLACE}'));
  assert.ok(salida.includes('https://mm.in/abc'));
  assert.ok(salida.includes('🔗 *MÁS DETALLES:*'));
});

test('el prompt no mete el token {ENLACE} copiable en el ejemplar (texto natural en su lugar)', () => {
  const base = `FORMATO grupo:\n🔗 *DETALLES:* 👉 {URL}`;
  const prompt = buildWhatsappPrompt({ promptBase: base, nota: NOTA, links: LINKS, localidad: 'San Rafael' });
  assert.ok(!prompt.includes('{ENLACE}'));
  assert.ok(prompt.includes('el sistema agrega el enlace'));
});

test('elimina la firma embebida a mitad de linea (sin doble firma)', () => {
  const salida = normalizeWhatsappCopy(
    `*SAN RAFAEL:* Corte de ruta de ${WA_FIRMA} ayer\n\n🔗 👉 https://mm.in/abc`,
    { tipo: 'grupo', url: 'https://mm.in/abc', links: LINKS });
  assert.equal(salida.split(WA_FIRMA).length - 1, 1);
  assert.ok(salida.includes('Corte de ruta de'));
  assert.ok(salida.includes('ayer'));
});

test('elimina variantes de firma sin espacio (Mediamendoza) y deja una sola firma', () => {
  const salidaGrupo = normalizeWhatsappCopy(
    `*SALUD:* Pipi Benítez recibió el alta\n Su hija agradeció al equipo del Hospital Schestakow.\n\n🔗 *Leé la carta completa:*\n👉 https://mm.in/abc\n*📰 Mediamendoza - Noticias confiables del sur mendocino*\n\n*¡Sumate a nuestra comunidad!*`,
    { tipo: 'grupo', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(!salidaGrupo.includes('Mediamendoza'));
  assert.equal(salidaGrupo.split(WA_FIRMA).length - 1, 1);
  assert.ok(salidaGrupo.includes(`📱 *Grupo de Noticias:* ${LINKS.grupo}`));
  const salidaCanal = normalizeWhatsappCopy(
    `*SALUD:* Titular\n\n• punto\n\n🔗 👉 https://mm.in/abc\n*📰 Mediamendoza - Noticias confiables del sur mendocino*\n*📰 Media Mendoza - Noticias confiables del sur mendocino*`,
    { tipo: 'canal', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(!salidaCanal.includes('Mediamendoza'));
  assert.equal(salidaCanal.split(WA_FIRMA).length - 1, 1);
});

test('conserva el interlineado (lineas en blanco) del mensaje de la IA en grupo', () => {
  const ia = `🏥 *SALUD:* La hija del 'Pipi' Benítez agradeció la atención médica tras el alta de su padre
Víctor "Pipi" Benítez regresó a su casa tras dos meses y medio internado.

🔗 *Leé la carta completa:*
👉 https://mm.in/abc
*📰 Mediamendoza - Noticias confiables del sur mendocino*

*¡Sumate a nuestra comunidad!*
📱 Grupo: https://chat.whatsapp.com/FALSO1`;
  const salida = normalizeWhatsappCopy(ia, { tipo: 'grupo', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(salida.includes('internado.\n\n🔗 *Leé la carta completa:*'), 'debe conservar la linea en blanco entre parrafos');
  assert.ok(!salida.includes('\n\n\n'), 'no debe quedar mas de un interlineado');
  assert.ok(!salida.includes('Mediamendoza'));
  assert.equal(salida.split(WA_FIRMA).length - 1, 1);
  assert.ok(salida.includes(`📱 *Grupo de Noticias:* ${LINKS.grupo}`));
});

test('conserva el interlineado en canal y deja una sola firma al final', () => {
  const ia = `🏥 *SALUD:* Titular
Víctor Benítez regresó a su casa tras el alta.

🔗 *Leé todo:*
👉 https://mm.in/abc
*📰 Mediamendoza - Noticias confiables del sur mendocino*
*📰 Media Mendoza - Noticias confiables del sur mendocino*`;
  const salida = normalizeWhatsappCopy(ia, { tipo: 'canal', url: 'https://mm.in/abc', links: LINKS });
  assert.ok(salida.includes('tras el alta.\n\n🔗 *Leé todo:*'), 'debe conservar la linea en blanco entre parrafos');
  assert.ok(!salida.includes('\n\n\n'));
  assert.ok(!salida.includes('Mediamendoza'));
  assert.equal(salida.split(WA_FIRMA).length - 1, 1);
  assert.ok(salida.trimEnd().endsWith(WA_FIRMA));
});

test('los sustitutos dinamicos del prompt usan replacer seguro ($& del titulo no se expande)', () => {
  const nota = { ...NOTA, titulo: 'Corte en Ruta $& por protesta' };
  const prompt = buildWhatsappPrompt({ promptBase: 'TITULO: {TITULO}', nota, links: LINKS, localidad: 'San Rafael' });
  assert.ok(prompt.includes(nota.titulo));
  assert.ok(!prompt.includes('{TITULO}'));
});

test('notaDesdePaquete mapea el paquete canónico a nota (sin scrape)', () => {
  const paquete = {
    tipo: 'noticia_editorial',
    version: 2,
    fuente: {
      url: 'https://mm.in/abc',
      titulo_original: 'Corte de ruta en Ruta 40',
      categoria: 'Policial',
      cuerpo: 'Vecinos cortan la ruta en San Rafael desde las 8.',
      imagen: 'https://img.mm.in/foto.jpg',
      imagenes: ['https://img.mm.in/foto.jpg'],
    },
    editorial: { titulo: 'Corte de ruta', contexto: 'Protesta vecinal', datos_clave: [{ label: 'Horario', value: '8' }], pregunta_social: '¿Afecta tu viaje?' },
  };
  const nota = notaDesdePaquete(paquete, u => `short:${u}`);
  assert.equal(nota.titulo, 'Corte de ruta en Ruta 40');
  assert.equal(nota.categoria, 'Policial');
  assert.equal(nota.body, 'Vecinos cortan la ruta en San Rafael desde las 8.');
  assert.equal(nota.url, 'https://mm.in/abc');
  assert.equal(nota.urlCorta, 'short:https://mm.in/abc');
  assert.equal(nota.descripcion, '');
  assert.equal(nota.image, 'https://img.mm.in/foto.jpg');
  assert.deepEqual(nota.editorial, paquete.editorial);
});

test('notaDesdePaquete: defaults y acortar opcional', () => {
  const nota = notaDesdePaquete({ fuente: {}, editorial: null });
  assert.equal(nota.titulo, '');
  assert.equal(nota.categoria, 'General');
  assert.equal(nota.body, '');
  assert.equal(nota.url, '');
  assert.equal(nota.urlCorta, '');
  assert.equal(nota.image, '');
  assert.deepEqual(nota.editorial, {});
  const sinAcortar = notaDesdePaquete({ fuente: { url: 'https://mm.in/abc', titulo_original: 'T', cuerpo: 'C' } });
  assert.equal(sinAcortar.url, 'https://mm.in/abc');
  assert.equal(sinAcortar.urlCorta, '');
  assert.equal(notaDesdePaquete(null).titulo, '');
});

test('buildEditorialPromptBlock agrega sólo los campos presentes del editorial', () => {
  const bloque = buildEditorialPromptBlock({
    titulo: 'Corte de ruta',
    bajada: '',
    contexto: 'Protesta vecinal en el sur provincial',
    datos_clave: [{ label: 'Horario', value: 'desde las 8' }, { label: '', value: 'Ruta 40' }],
    pregunta_social: '¿Afecta tu viaje?',
  });
  assert.ok(bloque.includes('EDITORIAL:\n'));
  assert.ok(bloque.includes('Título paquete: Corte de ruta'));
  assert.ok(bloque.includes('Contexto: Protesta vecinal en el sur provincial'));
  assert.ok(bloque.includes('Datos clave: Horario: desde las 8 ; Ruta 40'));
  assert.ok(bloque.includes('Pregunta social: ¿Afecta tu viaje?'));
  assert.ok(!bloque.includes('Bajada'));
  assert.equal(buildEditorialPromptBlock({ bajada: '', datos_clave: [] }), '');
  assert.equal(buildEditorialPromptBlock(null), '');
  assert.equal(buildEditorialPromptBlock(undefined), '');
});
