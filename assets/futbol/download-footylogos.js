const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');

const base = __dirname;
const teamsDir = path.join(base, 'equipos');
const competitionsDir = path.join(base, 'competencias');
fs.mkdirSync(teamsDir, { recursive: true });
fs.mkdirSync(competitionsDir, { recursive: true });

const extraTeams = [
  ['nacional-uru', 'https://www.footylogos.com/es/logos/nacional'],
  ['santos', 'https://www.footylogos.com/es/logos/santos'],
  ['universidad-central-venezuela', 'https://www.footylogos.com/es/logos/universidad-central'],
  ['independiente-medellin', 'https://www.footylogos.com/es/logos/independiente-medellin'],
  ['vasco-da-gama', 'https://www.footylogos.com/es/logos/vasco-da-gama'],
  ['bragantino', 'https://www.footylogos.com/es/logos/rb-bragantino'],
  ['sporting-cristal', 'https://www.footylogos.com/es/logos/sporting-cristal'],
  ['cienciano', 'https://www.footylogos.com/es/logos/cienciano'],
  ['gremio', 'https://www.footylogos.com/es/logos/gremio'],
  ['bolivar', 'https://www.footylogos.com/es/logos/bolivar'],
  ['caracas', 'https://www.footylogos.com/es/logos/caracas'],
  ['santa-fe', 'https://www.footylogos.com/es/logos/independiente-santa-fe'],
  ['ohiggins', 'https://www.footylogos.com/es/logos/ohiggins']
];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MediaMendozaVisualSuite/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location).then(resolve, reject);
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const links = new Map();
  const sourcePages = [
    'https://www.footylogos.com/es/competition/liga-profesional',
    'https://www.footylogos.com/es/competition/copa-libertadores',
    'https://www.footylogos.com/es/country/argentina'
  ];
  for (const sourcePage of sourcePages) {
    await page.goto(sourcePage, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const pageLinks = await page.locator('a[href*="/es/logos/"]').evaluateAll(as => as.map(a => ({ href: a.href, name: (a.innerText || '').trim() })));
    pageLinks.forEach(item => {
      const slug = item.href.split('/').filter(Boolean).pop();
      if (slug && !slug.includes('monocromo') && !['copa-libertadores', 'copa-sudamericana', 'liga-profesional-argentina'].includes(slug) && !links.has(slug)) links.set(slug, item);
    });
  }
  extraTeams.forEach(([key, href]) => { if (!links.has(key)) links.set(key, { href, name: key }); });

  const catalog = { version: 1, actualizado: new Date().toISOString().slice(0, 10), fuentes: { principal: 'https://www.footylogos.com/', referencia: 'https://www.footylogos.com/es/competition/liga-profesional' }, equipos: {}, competencias: {} };
  for (const [slug, item] of links) {
    try {
      await page.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const png = await page.locator('a[href$=".png"]').first().getAttribute('href');
      if (!png) throw new Error('PNG no encontrado');
      const file = `${slug}.png`;
      fs.writeFileSync(path.join(teamsDir, file), await get(png));
      catalog.equipos[slug] = { nombre: item.name || slug, archivo: `assets/futbol/equipos/${file}`, fuente: item.href, estado: 'ok' };
      console.log(`OK ${slug}`);
    } catch (error) {
      catalog.equipos[slug] = { nombre: item.name || slug, archivo: null, fuente: item.href, estado: 'faltante', detalle: error.message };
      console.log(`FALTA ${slug}: ${error.message}`);
    }
  }

  const competitionPages = [
    ['liga-profesional', 'Liga Profesional Argentina', 'https://www.footylogos.com/es/logos/liga-profesional-argentina'],
    ['copa-sudamericana', 'Copa Sudamericana', 'https://www.footylogos.com/es/logos/copa-sudamericana'],
    ['copa-libertadores', 'Copa Libertadores', 'https://www.footylogos.com/es/competition/copa-libertadores']
  ];
  for (const [key, name, href] of competitionPages) {
    try {
      await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const png = await page.locator('a[href$=".png"]').first().getAttribute('href');
      if (!png) throw new Error('PNG no encontrado');
      const file = `${key}.png`;
      fs.writeFileSync(path.join(competitionsDir, file), await get(png));
      catalog.competencias[key] = { nombre: name, archivo: `assets/futbol/competencias/${file}`, fuente: href, estado: 'ok' };
      console.log(`OK ${key}`);
    } catch (error) {
      catalog.competencias[key] = { nombre: name, archivo: null, fuente: href, estado: 'faltante', detalle: error.message };
      console.log(`FALTA ${key}: ${error.message}`);
    }
  }
  fs.writeFileSync(path.join(base, 'catalogo.json'), JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  await browser.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
