// efemerides/efemerides.mjs — fetch + estados + canvas + export PNG
import { hoyArgentina, normalizarPayload } from './placa-model.mjs';

const WORKER_URL = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const ANCHO = 1080;
const ALTO = 1080;
const COLOR = {
  fondo: '#0F1520', dorado: '#C8A24A', crema: '#F5F1E6',
  regla: 'rgba(245,241,230,.25)', atenuado: 'rgba(245,241,230,.78)', ampliado: 'rgba(245,241,230,.72)',
};
const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

const $ = (id) => document.getElementById(id);
const ui = {
  cargando: $('estadoCargando'), error: $('estadoError'), lista: $('placaLista'),
  msgError: $('mensajeError'), reintentar: $('btnReintentar'), descargar: $('btnDescargar'),
  fecha: $('fechaInput'), canvas: $('placa'),
};

let fechaActual = hoyArgentina();
let logoImg = null;

const asset = (ruta) => new URL(ruta, import.meta.url).href;

const etiquetaFecha = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return (y && m && d) ? `${d} DE ${MESES[m - 1]} DE ${y}` : '';
};

function mostrar(cual, mensaje) {
  ui.cargando.hidden = cual !== 'cargando';
  ui.error.hidden = cual !== 'error';
  ui.lista.hidden = cual !== 'lista';
  if (mensaje) ui.msgError.textContent = mensaje;
  ui.descargar.disabled = cual !== 'lista';
}

function cargarFuentes() {
  return Promise.all([['BebasNeue', '../assets/BebasNeue-Regular.ttf'], ['Economica', '../assets/Economica-Regular.ttf']]
    .map(async ([nombre, ruta]) => {
      const face = new FontFace(nombre, `url(${asset(ruta)})`);
      await face.load();
      document.fonts.add(face);
    }));
}

function cargarLogo() {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => { logoImg = img; resolver(); };
    img.onerror = () => rechazar(new Error('No se pudo cargar el logo'));
    img.src = asset('../assets/logo.png');
  });
}

async function garantizarAssets() {
  if (logoImg && document.fonts.check('20px BebasNeue') && document.fonts.check('20px Economica')) return;
  let ultimoError = null;
  for (let intento = 0; intento < 2; intento += 1) {
    try { await Promise.all([cargarFuentes(), cargarLogo()]); return; }
    catch (err) { ultimoError = err; }
  }
  throw ultimoError || new Error('No se pudieron cargar los recursos');
}

function envolver(ctx, texto, maxAncho) {
  const lineas = [];
  let linea = '';
  for (const p of String(texto).split(/\s+/).filter(Boolean)) {
    const prueba = linea ? `${linea} ${p}` : p;
    if (ctx.measureText(prueba).width <= maxAncho) linea = prueba;
    else { if (linea) lineas.push(linea); linea = p; }
  }
  if (linea) lineas.push(linea);
  return lineas;
}

function unaLinea(ctx, texto, maxAncho) {
  if (ctx.measureText(texto).width <= maxAncho) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxAncho) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function chip(ctx, texto, x, y) {
  ctx.font = '22px BebasNeue';
  const w = Math.ceil(ctx.measureText(texto).width) + 40;
  ctx.strokeStyle = COLOR.dorado;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, 38);
  ctx.fillStyle = COLOR.dorado;
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, x + 20, y + 21);
  ctx.textBaseline = 'top';
  return 38;
}

function dibujarPlaca(modelo) {
  const ctx = ui.canvas.getContext('2d');
  ctx.fillStyle = COLOR.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const logoH = 64;
  const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight));
  ctx.drawImage(logoImg, 64, 44, logoW, logoH);
  ctx.fillStyle = COLOR.dorado;
  ctx.font = '52px BebasNeue';
  ctx.textAlign = 'right';
  ctx.fillText(etiquetaFecha(modelo.fecha || fechaActual), ANCHO - 64, 62);
  ctx.textAlign = 'left';

  ctx.fillStyle = COLOR.dorado;
  ctx.fillRect(64, 140, ANCHO - 128, 4);

  let y = 160;
  ctx.fillStyle = COLOR.dorado;
  ctx.font = '150px BebasNeue';
  ctx.fillText(modelo.hero.año, 64, y);
  y += 108;
  ctx.fillStyle = COLOR.crema;
  ctx.font = '44px Economica';
  for (const linea of envolver(ctx, modelo.hero.titulo, ANCHO - 128)) { ctx.fillText(linea, 64, y); y += 44; }
  y += 2;
  ctx.fillStyle = COLOR.atenuado;
  ctx.font = '30px Economica';
  for (const linea of envolver(ctx, modelo.hero.resumen, ANCHO - 128)) { ctx.fillText(linea, 64, y); y += 34; }
  y += 4;
  ctx.font = '24px Economica';
  ctx.fillStyle = COLOR.ampliado;
  for (const linea of envolver(ctx, modelo.hero.ampliado, ANCHO - 128).slice(0, 4)) { ctx.fillText(linea, 64, y); y += 30; }
  y += 8;
  y += chip(ctx, modelo.hero.categoria, 64, y) + 10;

  ctx.fillStyle = COLOR.regla;
  ctx.fillRect(64, y, ANCHO - 128, 2);
  y += 14;

  const yPie = ALTO - 84;
  const filas = modelo.rows.slice(0, 5);
  const altoFila = Math.min(96, Math.floor((yPie - y) / filas.length));
  const conResumen = altoFila >= 76;
  for (const fila of filas) {
    ctx.fillStyle = COLOR.dorado;
    ctx.font = `${Math.min(44, Math.round(altoFila * 0.62))}px BebasNeue`;
    ctx.fillText(fila.año, 64, y + 4);
    const xTexto = 200;
    ctx.fillStyle = COLOR.crema;
    ctx.font = '27px Economica';
    ctx.fillText(unaLinea(ctx, fila.titulo, ANCHO - xTexto - 128), xTexto, y + 4);
    if (conResumen) {
      ctx.fillStyle = COLOR.atenuado;
      ctx.font = '21px Economica';
      ctx.fillText(unaLinea(ctx, fila.resumen, ANCHO - xTexto - 128), xTexto, y + 38);
    }
    ctx.fillStyle = COLOR.dorado;
    ctx.font = '17px BebasNeue';
    ctx.fillText(fila.categoria, xTexto, y + (conResumen ? 60 : 34));
    y += altoFila;
  }

  ctx.fillStyle = COLOR.regla;
  ctx.fillRect(64, yPie + 10, ANCHO - 128, 2);
  ctx.fillStyle = COLOR.atenuado;
  ctx.font = '19px Economica';
  ctx.fillText(modelo.verificada ? 'FUENTE: WIKIPEDIA · VERIFICADA' : 'FUENTE: WIKIPEDIA', 64, yPie + 26);
  const etiqueta = modelo.total > modelo.totalMostrados
    ? `${modelo.totalMostrados} DE ${modelo.total} HECHOS DEL DÍA`
    : `${modelo.totalMostrados} HECHOS DEL DÍA`;
  ctx.fillStyle = COLOR.dorado;
  ctx.font = '22px BebasNeue';
  ctx.textAlign = 'right';
  ctx.fillText(etiqueta, ANCHO - 64, yPie + 24);
  ctx.textAlign = 'left';
}

function exportarPNG() {
  ui.canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `efemerides-${fechaActual}.png`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}

async function cargar(fecha) {
  mostrar('cargando');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${WORKER_URL}/placas/v2/efemerides?fecha=${encodeURIComponent(fecha)}`, { signal: ctrl.signal });
    const raw = await res.json().catch(() => null);
    const modelo = normalizarPayload(raw);
    if (!modelo.ok) throw new Error(modelo.error);
    await garantizarAssets();
    dibujarPlaca(modelo);
    ui.fecha.value = fecha;
    mostrar('lista');
  } catch (err) {
    const msg = err?.name === 'AbortError'
      ? 'La respuesta tardó demasiado. Reintentá.'
      : (err?.message || 'No se pudieron cargar las efemérides.');
    mostrar('error', msg);
  } finally {
    clearTimeout(timer);
  }
}

ui.reintentar.addEventListener('click', () => cargar(fechaActual));
ui.fecha.addEventListener('change', () => {
  const v = ui.fecha.value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { fechaActual = v; cargar(v); }
});
ui.descargar.addEventListener('click', exportarPNG);
cargar(fechaActual);
