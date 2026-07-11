import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);
const APP = '/visual-suite';
const PORT = 8195;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = APP + '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
await page.goto(`http://localhost:${PORT}${APP}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
await page.evaluate(() => cambiarTab('timeline'));
await page.waitForTimeout(200);

const IPC = [
  {"mes":"Enero","periodo":"2026-01","ipc_mensual_porcentaje":3.2,"ipc_acumulado_porcentaje":3.2,"tipo_dato":"oficial"},
  {"mes":"Febrero","periodo":"2026-02","ipc_mensual_porcentaje":2.4,"ipc_acumulado_porcentaje":5.7,"tipo_dato":"oficial"},
  {"mes":"Marzo","periodo":"2026-03","ipc_mensual_porcentaje":3.5,"ipc_acumulado_porcentaje":9.4,"tipo_dato":"oficial"},
  {"mes":"Abril","periodo":"2026-04","ipc_mensual_porcentaje":2.6,"ipc_acumulado_porcentaje":12.3,"tipo_dato":"oficial"},
  {"mes":"Mayo","periodo":"2026-05","ipc_mensual_porcentaje":2.1,"ipc_acumulado_porcentaje":14.7,"tipo_dato":"oficial"},
  {"mes":"Junio","periodo":"2026-06","ipc_mensual_porcentaje":2.0,"ipc_acumulado_porcentaje":17.0,"tipo_dato":"proyectado"},
  {"mes":"Julio","periodo":"2026-07","ipc_mensual_porcentaje":1.9,"ipc_acumulado_porcentaje":19.2,"tipo_dato":"proyectado"}
];
const MESSI = [
  {"id":1,"fecha":"2026-06-16","fase":"Fase de Grupos","rival":"Argelia","minuto":"17'","tipo":"Jugada (Zurda)","marcador":"1-0"},
  {"id":8,"fecha":"2026-07-07","fase":"Octavos de Final","rival":"Egipto","minuto":"83'","tipo":"Jugada (Zurda)","marcador":"2-2"}
];
const GENERICO = [
  {"fecha":"2026-03-10","titulo":"Se lanza el satélite","descripcion":"Órbita baja, uso civil","categoria":"ciencia"},
  {"fecha":"2026-09-22","titulo":"Cumbre climática","descripcion":"Acuerdo regional","pais":"Argentina"}
];

async function cargarYExportar(arr, nombre) {
  await page.evaluate(() => { if (typeof cerrarExportPreview === 'function') cerrarExportPreview(); document.getElementById('exportPreview').classList.remove('show'); timelineEvents.length = 0; });
  await page.waitForTimeout(200);
  await page.fill('#tlJson', JSON.stringify(arr));
  await page.click('#btnTlJson');
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => ({
    count: document.getElementById('tlCount').textContent,
    items: timelineEvents.map(e => ({ date: e.date, title: e.title, desc: e.desc }))
  }));
  const exp = await page.evaluate(() => new Promise(resolve => {
    document.getElementById('exportPreview').classList.remove('show');
    exportarTimeline();
    const t0 = Date.now();
    const iv = setInterval(() => {
      const shown = document.getElementById('exportPreview').classList.contains('show');
      if (shown || Date.now() - t0 > 6000) { clearInterval(iv); resolve(shown); }
    }, 150);
  }));
  console.log(`\n=== ${nombre} ===`);
  console.log('count:', info.count);
  console.log('primer item:', JSON.stringify(info.items[0]));
  console.log('último item:', JSON.stringify(info.items[info.items.length-1]));
  console.log('export preview:', exp);
}

await cargarYExportar(IPC, 'IPC (mensual, periodo YYYY-MM)');
await cargarYExportar(MESSI, 'Messi (fecha YYYY-MM-DD)');
await cargarYExportar(GENERICO, 'Genérico (titulo/descripcion)');

console.log('\nERRORES:', errors.length ? JSON.stringify(errors, null, 2) : 'NINGUNO');
await browser.close();
server.close();
