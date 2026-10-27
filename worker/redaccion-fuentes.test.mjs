import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsearRss, resolverLinkBing, deduplicarFuentes, construirConsultas,
  verificarFuente, seleccionarFuentes,
} from './redaccion-fuentes.mjs';

const RSS = `<?xml version="1.0"?><rss><channel>
<item>
  <title><![CDATA[Una nota &amp; de prueba]]></title>
  <link>https://losandes.com.ar/policiales/123-nota</link>
  <pubDate>Tue, 27 Oct 2026 10:00:00 GMT</pubDate>
  <source>Los Andes</source>
</item>
<item>
  <title>Otra nota</title>
  <link>https://www.bing.com/news/apiclick.aspx?url=https%3A%2F%2Fwww.uno.com.ar%2Fnota%2F9&amp;c=1</link>
  <pubDate>Tue, 27 Oct 2026 09:00:00 GMT</pubDate>
  <News:Source>UNO</News:Source>
</item>
</channel></rss>`;

test('parsea RSS con CDATA, entidades y link de Bing', () => {
  const items = parsearRss(RSS);
  assert.equal(items.length, 2);
  assert.equal(items[0].titulo, 'Una nota & de prueba');
  assert.equal(items[0].url, 'https://losandes.com.ar/policiales/123-nota');
  assert.equal(items[0].medio, 'Los Andes');
  assert.equal(items[1].url, 'https://www.uno.com.ar/nota/9');
  assert.equal(items[1].medio, 'UNO');
});

test('resuelve el redirect de Bing solo cuando corresponde', () => {
  assert.equal(
    resolverLinkBing('https://www.bing.com/news/apiclick.aspx?url=https%3A%2F%2Fejemplo.com%2Fa'),
    'https://ejemplo.com/a',
  );
  assert.equal(resolverLinkBing('https://ejemplo.com/a'), 'https://ejemplo.com/a');
  assert.equal(resolverLinkBing('no es url'), 'no es url');
});

test('deduplica por URL y limpia parámetros de seguimiento', () => {
  const items = deduplicarFuentes([
    { titulo: 'A', url: 'https://ejemplo.com/nota?utm_source=x', medio: 'Uno' },
    { titulo: 'B', url: 'https://ejemplo.com/nota/', medio: 'Dos' },
    { titulo: 'C', url: 'https://ejemplo.com/otra', medio: 'Tres' },
  ]);
  assert.equal(items.length, 2);
  assert.equal(items[0].url, 'https://ejemplo.com/nota');
});

test('construye como máximo dos consultas y recorta títulos largos', () => {
  const consultas = construirConsultas({ titulo: 'Título | Sección', localidad: 'San Rafael' });
  assert.deepEqual(consultas, ['Título', 'Título San Rafael']);
  assert.ok(construirConsultas({ titulo: 'x'.repeat(300) })[0].length <= 120);
});

test('verifica solo respuestas HTML exitosas', async () => {
  const ok = async () => new Response('<html><body><article>Nota</article></body></html>', { status: 200, headers: { 'content-type': 'text/html' } });
  const notFound = async () => new Response('no', { status: 404, headers: { 'content-type': 'text/html' } });
  const imagen = async () => new Response('x', { status: 200, headers: { 'content-type': 'image/jpeg' } });
  assert.equal(await verificarFuente('https://ejemplo.com/a', ok), true);
  assert.equal(await verificarFuente('https://ejemplo.com/b', notFound), false);
  assert.equal(await verificarFuente('https://ejemplo.com/c', imagen), false);
});

test('selecciona hasta 3 fuentes verificadas y excluye el origen', async () => {
  const fetchFalso = async (url) => new Response(`<html><body><article>${url}</article></body></html>`, { status: 200, headers: { 'content-type': 'text/html' } });
  const candidatos = [
    { titulo: 'Origen', url: 'https://origen.com/nota', medio: 'Origen' },
    { titulo: 'Uno', url: 'https://uno.com/1', medio: 'UNO' },
    { titulo: 'Dos', url: 'https://dos.com/2', medio: 'Dos' },
    { titulo: 'Tres', url: 'https://tres.com/3', medio: 'Tres' },
    { titulo: 'Cuatro', url: 'https://cuatro.com/4', medio: 'Cuatro' },
  ];
  const fuentes = await seleccionarFuentes(candidatos, { fetchImpl: fetchFalso, origenUrl: 'https://origen.com/nota' });
  assert.deepEqual(fuentes.map(f => f.titulo), ['Uno', 'Dos', 'Tres']);
});
