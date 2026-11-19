// efemerides/efemerides.mjs — fetch + estados + canvas + export PNG
import { hoyArgentina, normalizarPayload, extraerCopysRespuesta, construirModeloPlaca, itemsVisiblesCopys, validarHechoPropio, emojiIconoEf, etiquetaCategoria } from './placa-model.mjs';

const WORKER_URL = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
const ANCHO = 1080;
const ALTO = 1080;
const TIMEOUT_MS = 45000;
const TIMEOUT_COPYS_MS = 55000;
const REINTENTOS = 1;
const PAUSA_REINTENTO_MS = 1500;
const COLOR = {
  fondo: '#0F1520', dorado: '#C8A24A', crema: '#F5F1E6',
  regla: 'rgba(245,241,230,.25)', atenuado: 'rgba(245,241,230,.78)', ampliado: 'rgba(245,241,230,.72)',
};
const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

const $ = (id) => document.getElementById(id);
const ui = {
  cargando: $('estadoCargando'), error: $('estadoError'), lista: $('placaLista'),
  msgError: $('mensajeError'), reintentar: $('btnReintentar'), descargar: $('btnDescargar'),
  copiar: $('btnCopiar'), fecha: $('fechaInput'), canvas: $('placa'),
  copys: $('btnCopys'), copysPanel: $('copysPanel'), copysTitulo: $('copysTitulo'),
  copysGrid: $('copysGrid'),
  copysWhats: $('copysWhats'), copysIg: $('copysIg'),
  copiarWhats: $('btnCopiarWhats'), copiarIg: $('btnCopiarIg'),
  copysError: $('copysError'), copysReintentar: $('btnCopysReintentar'),
  editor: $('editorPlaca'), editorLista: $('editorLista'), editorCount: $('editorCount'),
  pocosHechos: $('pocosHechos'), respaldo: $('respaldo'),
  restablecer: $('btnRestablecer'), formAgregar: $('formAgregar'),
  bancoPanel: $('bancoPanel'), btnBanco: $('btnBanco'), bancoCount: $('bancoCount'),
  bancoListaWrap: $('bancoListaWrap'), bancoLista: $('bancoLista'), bancoVacio: $('bancoVacio'),
  altaAño: $('altaAño'), altaTitulo: $('altaTitulo'), altaResumen: $('altaResumen'),
  altaAmpliado: $('altaAmpliado'), altaIcono: $('altaIcono'), altaError: $('altaError'),
  tycPanel: $('tycPanel'), btnTyc: $('btnTyc'), tycUrl: $('tycUrl'), tycLista: $('tycLista'),
  tycVacio: $('tycVacio'), tycError: $('tycError'), tycMeta: $('tycMeta'),
  tycFuenteLink: $('tycFuenteLink'),
  tycFiltros: document.querySelectorAll('.tyc-filtro'),
};

let fechaActual = hoyArgentina();
let logoImg = null;
let itemsPlaca = [];      // hechos visibles/ocultos + propios; la destacada es el primer visible
let itemsOriginales = []; // snapshot del servidor para RESTABLECER
let editado = false;
let candidatosWikipedia = []; // extras del GET más allá de los 6 de la placa
let placaEnRespaldo = false;  // true cuando el worker sirvió última buena (meta.fallback)
let idsBancoAgregados = new Set();
let idsTycUsados = new Set();
let bancoPool = [];
let bancoListLoaded = false;
let localSeq = 0;
const nuevoIdLocal = () => { localSeq += 1; return `local-${Date.now().toString(36)}-${localSeq}`; };

const asset = (ruta) => new URL(ruta, import.meta.url).href;

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

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
  ui.copiar.disabled = cual !== 'lista';
  ui.copys.disabled = cual !== 'lista';
}

const CARAS = [
  ['Inter', '../assets/Inter-Variable.woff2', '100 900'],
  ['Oswald', '../assets/Oswald-Variable.woff2', '200 700'],
];

function cargarFuentes() {
  return Promise.all(CARAS.map(async ([nombre, ruta, peso]) => {
    const face = new FontFace(nombre, `url(${asset(ruta)}) format('woff2')`, { weight: peso });
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
  if (logoImg && document.fonts.check('600 20px Oswald') && document.fonts.check('500 20px Inter')) return;
  let ultimoError = null;
  for (let intento = 0; intento < 2; intento += 1) {
    try { await Promise.all([cargarFuentes(), cargarLogo()]); return; }
    catch (err) { ultimoError = err; }
  }
  throw ultimoError || new Error('No se pudieron cargar los recursos');
}

// ¿Un texto repite AGREGADO/BAJADA? Normaliza y detecta igualdad o contenido parcial.
// Evita pintar tres veces la misma frase en la placa cuando el "resumen" es el crudo.
const normalizarTextoEf = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
// restoVisibleEf: devuelve la parte de `textoCompleto` que EXCEDE al prefijo ya
// visible (`yaVisto`), comparando palabra a palabra normalizada. Si el texto
// diverge pronto (hecho curado/manual), devuelve `textoCompleto` entero.
const restoVisibleEf = (textoCompleto, yaVisto) => {
  const completo = String(textoCompleto || '').trim();
  if (!completo) return '';
  const visto = String(yaVisto || '').trim();
  if (!visto) return completo;
  const nw = normalizarTextoEf(visto).split(' ').filter(Boolean);
  if (!nw.length) return completo;
  const palabras = completo.split(/\s+/);
  let i = 0, jv = 0;
  while (i < palabras.length && jv < nw.length) {
    const w = normalizarTextoEf(palabras[i]);
    if (!w) { i += 1; continue; }
    if (w === nw[jv]) { i += 1; jv += 1; continue; }
    break;
  }
  if (jv < Math.ceil(nw.length * 0.9)) return completo; // divergió pronto: no era el prefijo
  return palabras.slice(i).join(' ').trim();
};

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

// Título de fila COMPLETO: encoge la fuente hasta que entre en una línea
// (mínimo 15px); sólo por debajo de eso recorta con "…".
function tituloFila(ctx, texto, maxAncho, fontBase) {
  const t = String(texto || '');
  for (let f = fontBase; f >= 12.5; f -= 1.5) {
    ctx.font = `600 ${f}px Inter`;
    if (ctx.measureText(t).width <= maxAncho) return t;
  }
  let s = t;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxAncho) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
}

function chip(ctx, texto, x, y) {
  ctx.font = '600 20px Oswald';
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
  ctx.font = '600 46px Oswald';
  ctx.textAlign = 'right';
  ctx.fillText(etiquetaFecha(modelo.fecha || fechaActual), ANCHO - 64, 62);
  ctx.textAlign = 'left';

  ctx.fillStyle = COLOR.dorado;
  ctx.fillRect(64, 140, ANCHO - 128, 4);

  let y = 160;
  ctx.fillStyle = COLOR.dorado;
  ctx.font = '700 150px Oswald';
  const añoHero = modelo.hero.añoTexto || modelo.hero.año;
  ctx.fillText(añoHero, 64, y);
  const cajaAño = ctx.measureText(añoHero);
  y += Math.round(cajaAño.actualBoundingBoxAscent + cajaAño.actualBoundingBoxDescent) + 14;
  ctx.fillStyle = COLOR.crema;
  ctx.font = '600 42px Inter';
  for (const linea of envolver(ctx, modelo.hero.titulo, ANCHO - 128)) { ctx.fillText(linea, 64, y); y += 50; }
  y += 2;
  const bajadaHero = restoVisibleEf(modelo.hero.resumen, modelo.hero.titulo);
  if (bajadaHero) {
    ctx.fillStyle = COLOR.atenuado;
    ctx.font = '500 28px Inter';
    for (const linea of envolver(ctx, bajadaHero, ANCHO - 128)) { ctx.fillText(linea, 64, y); y += 34; }
    y += 4;
  }
  ctx.font = '400 22px Inter';
  ctx.fillStyle = COLOR.ampliado;
  const ampliadoHero = restoVisibleEf(restoVisibleEf(modelo.hero.ampliado, modelo.hero.titulo), bajadaHero);
  if (ampliadoHero) {
    for (const linea of envolver(ctx, ampliadoHero, ANCHO - 128).slice(0, 4)) { ctx.fillText(linea, 64, y); y += 28; }
  }
  y += 8;
  y += chip(ctx, modelo.hero.categoria, 64, y) + 10;

  ctx.fillStyle = COLOR.regla;
  ctx.fillRect(64, y, ANCHO - 128, 2);
  y += 14;

  const yPie = ALTO - 84;
  const filas = modelo.rows.slice(0, 5);
  const altoFila = Math.min(100, Math.floor((yPie - y) / filas.length));
  // El resumen siempre se muestra completo en hasta 2 líneas: nunca se recorta con "…".
  const nivel = altoFila >= 88 ? 0 : altoFila >= 78 ? 1 : 2;
  const fTitulo = [25, 24, 22][nivel];
  const fRes = [19, 17, 16][nivel];
  const lhRes = [22, 19, 17][nivel];
  const yRes = [30, 28, 26][nivel];
  const yCat = [72, 64, 58][nivel];
  const fCat = [15, 14, 14][nivel];
  for (const fila of filas) {
    ctx.fillStyle = COLOR.dorado;
    ctx.font = `600 ${Math.min(40, Math.round(altoFila * 0.55))}px Oswald`;
    ctx.fillText(fila.filaTexto || fila.año, 64, y + 2);
    const xTexto = 200;
    ctx.fillStyle = COLOR.crema;
    ctx.fillText(tituloFila(ctx, fila.titulo, ANCHO - xTexto - 128, fTitulo), xTexto, y + 2);
    const restoFila = restoVisibleEf(fila.ampliado || fila.resumen, fila.titulo);
    if (restoFila) {
      ctx.fillStyle = COLOR.atenuado;
      ctx.font = `400 ${fRes}px Inter`;
      for (const [k, linea] of envolver(ctx, restoFila, ANCHO - xTexto - 128).slice(0, 2).entries()) {
        ctx.fillText(linea, xTexto, y + yRes + k * lhRes);
      }
    }
    ctx.fillStyle = COLOR.dorado;
    ctx.font = `600 ${fCat}px Oswald`;
    ctx.fillText(fila.categoria, xTexto, y + yCat);
    y += altoFila;
  }

  ctx.fillStyle = COLOR.regla;
  ctx.fillRect(64, yPie + 10, ANCHO - 128, 2);
  ctx.fillStyle = COLOR.atenuado;
  ctx.font = '500 18px Inter';
  ctx.fillText(modelo.verificada ? 'FUENTE: WIKIPEDIA · VERIFICADA' : 'FUENTE: WIKIPEDIA', 64, yPie + 26);
  ctx.fillStyle = COLOR.crema;
  ctx.font = '600 18px Oswald';
  ctx.textAlign = 'center';
  ctx.fillText('WWW.MEDIAMENDOZA.COM', ANCHO / 2, yPie + 26);
  ctx.textAlign = 'left';
  const etiqueta = modelo.total > modelo.totalMostrados
    ? `${modelo.totalMostrados} DE ${modelo.total} HECHOS DEL DÍA`
    : `${modelo.totalMostrados} HECHOS DEL DÍA`;
  ctx.fillStyle = COLOR.dorado;
  ctx.font = '600 20px Oswald';
  ctx.textAlign = 'right';
  ctx.fillText(etiqueta, ANCHO - 64, yPie + 24);
  ctx.textAlign = 'left';
}

function placaBlob() {
  return new Promise((resolver) => ui.canvas.toBlob(resolver, 'image/png'));
}

async function exportarPNG() {
  const blob = await placaBlob();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `efemerides-${fechaActual}.png`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

let feedbackTimer = null;
function feedbackCopiar(texto) {
  ui.copiar.textContent = texto;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { ui.copiar.textContent = 'COPIAR PNG'; }, 2000);
}

async function copiarPNG() {
  try {
    if (!('ClipboardItem' in window) || !navigator.clipboard?.write) {
      feedbackCopiar('COPIAR NO DISPONIBLE');
      return;
    }
    const blob = await placaBlob();
    if (!blob) throw new Error('sin blob');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    feedbackCopiar('¡COPIADA!');
  } catch {
    feedbackCopiar('NO SE PUDO COPIAR');
  }
}

function ocultarCopysError() {
  ui.copysError.hidden = true;
  ui.copysReintentar.hidden = true;
  ui.copysGrid.hidden = false;
}

function resetearCopys() {
  ui.copysPanel.hidden = true;
  ocultarCopysError();
  ui.copys.textContent = 'COPYS REDES';
  ui.copysWhats.value = '';
  ui.copysIg.value = '';
}

async function pedirCopysPost(fecha) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_COPYS_MS);
  try {
    const res = await fetch(`${WORKER_URL}/placas/v2/efemerides/copys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({ fecha, items: itemsVisiblesCopys(itemsPlaca) }),
    });
    const raw = await res.json().catch(() => null);
    const modelo = extraerCopysRespuesta(raw);
    if (!modelo.ok) throw new Error(modelo.error);
    return modelo;
  } finally {
    clearTimeout(timer);
  }
}

async function pedirCopys(fecha) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_COPYS_MS);
  try {
    const res = await fetch(`${WORKER_URL}/placas/v2/efemerides/copys?fecha=${encodeURIComponent(fecha)}`, { signal: ctrl.signal });
    const raw = await res.json().catch(() => null);
    const modelo = extraerCopysRespuesta(raw);
    if (!modelo.ok) throw new Error(modelo.error);
    return modelo;
  } finally {
    clearTimeout(timer);
  }
}

let feedbackCopysTimer = null;
function feedbackCopiarBoton(boton, texto) {
  boton.textContent = texto;
  clearTimeout(feedbackCopysTimer);
  feedbackCopysTimer = setTimeout(() => { boton.textContent = 'COPIAR'; }, 2000);
}

async function copiarTexto(boton, texto) {
  try {
    if (!navigator.clipboard?.writeText) { feedbackCopiarBoton(boton, 'COPIAR NO DISPONIBLE'); return; }
    await navigator.clipboard.writeText(texto);
    feedbackCopiarBoton(boton, '¡COPIADO!');
  } catch {
    feedbackCopiarBoton(boton, 'NO SE PUDO COPIAR');
  }
}

async function cargarCopys() {
  ocultarCopysError();
  ui.copys.disabled = true;
  ui.copys.textContent = 'GENERANDO…';
  try {
    const copys = editado ? await pedirCopysPost(fechaActual) : await pedirCopys(fechaActual);
    ui.copysWhats.value = copys.whatsapp;
    ui.copysIg.value = copys.instagram;
    ui.copysTitulo.textContent = `COPYS PARA REDES — ${etiquetaFecha(fechaActual)}`;
    ui.copysGrid.hidden = false;
    ocultarCopysError();
    ui.copysPanel.hidden = false;
    ui.copys.textContent = 'COPYS REDES';
    ui.copys.disabled = false;
  } catch (err) {
    const msg = err?.name === 'AbortError'
      ? 'La respuesta tardó demasiado. Reintentá.'
      : (err?.name === 'TypeError' || err?.message === 'Failed to fetch'
          ? 'No se pudo conectar con el servicio. Reintentá.'
          : (err?.message || 'No se pudieron generar los copys.'));
    ui.copys.textContent = 'REINTENTAR';
    ui.copys.disabled = false;
    ui.copysGrid.hidden = true;
    ui.copysError.textContent = `${msg} La placa sigue disponible.`;
    ui.copysError.hidden = false;
    ui.copysReintentar.hidden = false;
    ui.copysPanel.hidden = false;
  }
}

// ── Candidatas TyC Sports (solo revisión, no entra a la placa) ──────────────
let tycItems = [];
let tycFiltro = 'todas';
const idTyc = (i) => `tyc-${i.año}-${String(i.titulo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40)}`;
const tycLlena = () => itemsPlaca.filter(x => !x.oculto).length >= 6;
const crearFilaTyc = (i) => {
  const li = document.createElement('li');
  li.className = 'tyc-fila';
  li.dataset.estado = i.estado;
  const anio = document.createElement('span');
  anio.className = 'tyc-anio';
  anio.textContent = i.año;
  const info = document.createElement('div');
  info.className = 'tyc-info';
  const titulo = document.createElement('span');
  titulo.className = 'tyc-titulo';
  titulo.textContent = i.titulo;
  titulo.title = i.texto || i.titulo;
  const alcance = document.createElement('span');
  alcance.className = 'tyc-alcance';
  alcance.textContent = String(i.alcance || '').toUpperCase();
  info.append(titulo, alcance);
  const estado = document.createElement('span');
  estado.className = 'tyc-estado ' + i.estado;
  estado.textContent = i.estado === 'en-banco' ? 'EN BANCO' : String(i.estado).toUpperCase();
  const enlace = document.createElement('a');
  enlace.className = 'tyc-enlace';
  if (i.fuenteEs) {
    enlace.href = i.fuenteEs;
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.textContent = 'Wikipedia ↗';
  } else {
    enlace.textContent = '—';
  }
  const puedeUsar = (i.estado === 'cruzado' || i.estado === 'en-banco') && !!i.verificado;
  const usarBtn = document.createElement('button');
  usarBtn.type = 'button';
  usarBtn.className = 'chico tyc-usar';
  const yaUsado = idsTycUsados.has(idTyc(i));
  usarBtn.textContent = yaUsado ? '✓ EN LA PLACA' : '+ USAR';
  if (!puedeUsar) {
    if (i.estado === 'candidato') { usarBtn.hidden = true; }
    else { usarBtn.disabled = true; usarBtn.title = 'Actualizá el worker (pegá worker.js en el dashboard) y volvé a consultar'; }
  } else if (yaUsado) {
    usarBtn.disabled = true;
  } else if (tycLlena()) {
    usarBtn.disabled = true;
    usarBtn.title = 'La placa tiene 6 hechos visibles. Ocultá uno para hacer lugar.';
  } else {
    usarBtn.title = i.estado === 'cruzado'
      ? 'Hecho verificado en Wikipedia (es∩en). Agrega los datos verificados a la placa.'
      : 'Hecho curado (Archivo.ar / Media Mendoza). Agrega los datos verificados a la placa.';
    usarBtn.addEventListener('click', () => usarDesdeTyc(i));
  }
  li.append(anio, info, estado, enlace, usarBtn);
  return li;
};
function usarDesdeTyc(i) {
  const id = idTyc(i);
  if (idsTycUsados.has(id) || tycLlena()) return;
  const v = i.verificado;
  if (!v) return;
  itemsPlaca.push({
    id, año: String(v.año || ''), fecha: fechaActual,
    titulo: v.titulo, resumen: v.resumen, ampliado: v.ampliado,
    icono: v.icono, categoria: v.categoria, oculto: false, verificada: true,
    fuente: v.fuente, fuenteUrl: v.fuenteUrl,
  });
  idsTycUsados.add(id);
  editado = true;
  redibujarPlaca();
  renderEditor();
  renderBancoPool();
  renderTyc();
}
const renderTyc = () => {
  ui.tycLista.replaceChildren();
  const vistos = tycItems.filter(i => tycFiltro === 'todas' || i.estado === tycFiltro);
  ui.tycVacio.hidden = tycItems.length > 0;
  for (const i of vistos) ui.tycLista.append(crearFilaTyc(i));
  ui.tycFiltros.forEach(b => b.classList.toggle('activo', b.dataset.f === tycFiltro));
};
async function cargarTyc() {
  ui.tycError.hidden = true;
  ui.tycVacio.hidden = true;
  ui.tycLista.replaceChildren();
  ui.btnTyc.disabled = true;
  ui.btnTyc.textContent = 'CARGANDO…';
  try {
    const urlExtra = ui.tycUrl.value.trim();
    const qs = '?fecha=' + encodeURIComponent(fechaActual) + (urlExtra ? '&url=' + encodeURIComponent(urlExtra) : '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    let res;
    try {
      res = await fetch(WORKER_URL + '/placas/v2/efemerides/tyc' + qs, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
    const raw = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = raw?.error || raw?.message || ('Error ' + res.status);
      throw new Error(typeof msg === 'string' ? msg : 'Error ' + res.status);
    }
    ui.tycFuenteLink.href = raw.articulo;
    ui.tycMeta.textContent = `${raw.meta.hechos} hechos · ${raw.meta.cruzados} cruzados · ${raw.meta.enBanco} en banco · ${raw.meta.candidatos} candidatos`;
    tycItems = raw.items || [];
    renderTyc();
    ui.tycPanel.hidden = false;
  } catch (err) {
    ui.tycPanel.hidden = false;
    ui.tycError.textContent = err?.name === 'AbortError'
      ? 'La respuesta tardó demasiado. Reintentá.'
      : (err?.message || 'No se pudieron traer las candidatas de TyC.');
    ui.tycError.hidden = false;
  } finally {
    ui.btnTyc.disabled = false;
    ui.btnTyc.textContent = 'VER CANDIDATAS TYC';
  }
}
function resetearTyc() {
  tycItems = [];
  tycFiltro = 'todas';
  ui.tycLista.replaceChildren();
  ui.tycError.hidden = true;
  ui.tycVacio.hidden = true;
  ui.tycUrl.value = '';
  ui.tycMeta.textContent = '';
}

async function pedir(fecha) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${WORKER_URL}/placas/v2/efemerides?fecha=${encodeURIComponent(fecha)}`, { signal: ctrl.signal });
    const raw = await res.json().catch(() => null);
    const modelo = normalizarPayload(raw);
    if (!modelo.ok) throw new Error(modelo.error);
    return modelo;
  } finally {
    clearTimeout(timer);
  }
}

async function cargar(fecha) {
  resetearCopys();
  resetearEditor();
  mostrar('cargando');
  for (let intento = 0; intento <= REINTENTOS; intento += 1) {
    try {
      const modelo = await pedir(fecha);
      placaEnRespaldo = modelo.fallback === true;
      itemsOriginales = modelo.items.map(i => ({ ...i, oculto: false }));
      itemsPlaca = itemsOriginales.map(i => ({ ...i }));
      editado = false;
      await garantizarAssets();
      redibujarPlaca();
      ui.editor.hidden = false;
      renderEditor();
      ui.bancoPanel.hidden = false;
      cargarCandidatosWikipedia(modelo.candidatos || []);
      ui.fecha.value = fecha;
      mostrar('lista');
      return;
    } catch (err) {
      if (intento === REINTENTOS) {
        const msg = err?.name === 'AbortError'
          ? 'La respuesta tardó demasiado. Reintentá.'
          : (err?.name === 'TypeError' || err?.message === 'Failed to fetch'
              ? 'No se pudo conectar con el servicio. Reintentá.'
              : (err?.message || 'No se pudieron cargar las efemérides.'));
        mostrar('error', msg);
        return;
      }
      await esperar(PAUSA_REINTENTO_MS);
    }
  }
}

function cargarCandidatosWikipedia(candidatos) {
  const enPlaca = new Set(itemsPlaca.map(i => i.id));
  candidatosWikipedia = (Array.isArray(candidatos) ? candidatos : [])
    .filter(c => c && !enPlaca.has(c.id))
    .map(c => ({
      id: String(c.id || nuevoIdLocal()),
      año: String(c.año || ''), fecha: String(c.fecha || ''),
      titulo: String(c.titulo || ''), resumen: String(c.resumen || ''),
      ampliado: String(c.ampliado || c.resumen || ''),
      icono: c.icono || 'historia', categoria: String(c.categoria || 'HISTORIA'),
      fuente: String(c.fuente || 'Wikipedia'), fuenteUrl: String(c.fuenteUrl || c.url_fuente || ''),
      verificada: c.verificada === true, feria: false,
    }));
}

async function candidatosMendoza(desdeISO) {
  try {
    const res = await fetch(new URL('./efemerides-curadas.json', import.meta.url).href, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const [y, mo, d] = String(desdeISO).split('-').map(Number);
    const inicio = Date.UTC(y, mo - 1, d);
    const fechas = new Set();
    for (let i = 0; i <= 7; i += 1) {
      const dia = new Date(inicio + i * 86400000);
      fechas.add(String(dia.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dia.getUTCDate()).padStart(2, '0'));
    }
    return Object.entries(data || {})
      .filter(([clave, lista]) => fechas.has(clave) && Array.isArray(lista))
      .flatMap(([, lista]) => lista
        .filter(h => h && h.titulo && h.resumen && h.año)
        .map(h => ({ id: `cur-${h.año}-${String(h.titulo)}`, año: String(h.año), fecha: '', titulo: h.titulo, resumen: h.resumen, ampliado: h.texto_ampliado || h.resumen, icono: h.icono || 'historia', categoria: h.fuente === 'ARCHIVO.AR' ? 'ARGENTINA' : 'MENDOZA', fuente: h.fuente || 'Media Mendoza', fuenteUrl: h.fuente === 'ARCHIVO.AR' ? 'https://archivo.ar/efemerides/' : '', feria: false })));
  } catch { return []; }
}

async function candidatosFeriados(desdeISO) {
  try {
    const res = await fetch(`${WORKER_URL}/placas/v2/efemerides/banco?fecha=${encodeURIComponent(desdeISO)}&dias=7`);
    const raw = await res.json().catch(() => null);
    return Array.isArray(raw?.feriados) ? raw.feriados : [];
  } catch { return []; }
}

async function abrirBanco() {
  ui.bancoListaWrap.hidden = false;
  if (bancoListLoaded) { renderBancoPool(); return; }
  bancoListLoaded = true;
  ui.bancoCount.textContent = '…';
  const [feriados, mendoza] = await Promise.all([candidatosFeriados(fechaActual), candidatosMendoza(fechaActual)]);
  bancoPool = [...candidatosWikipedia, ...feriados, ...mendoza];
  renderBancoPool();
}

function renderBancoPool() {
  ui.bancoLista.replaceChildren();
  ui.bancoVacio.hidden = bancoPool.length > 0;
  ui.bancoCount.textContent = bancoPool.length ? `(${bancoPool.length})` : '';
  for (const c of bancoPool) ui.bancoLista.append(crearTarjetaBanco(c));
}

const MESES_ABREV = ['', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function crearTarjetaBanco(c) {
  const li = document.createElement('li');
  li.className = 'banco-card';
  const fuenteCruda = String(c.fuente || 'Wikipedia');
  const fuente = fuenteCruda.toUpperCase();
  const badge = document.createElement('span');
  const esCurada = fuente === 'ARCHIVO.AR' || fuente === 'MEDIA MENDOZA' || fuente === 'MENDOZA';
  badge.className = 'fuente-badge' + (esCurada ? ' mendoza' : '');
  badge.textContent = c.feria
    ? 'EFEMÉRIDE AR'
    : (fuente === 'ARCHIVO.AR' ? 'CURADA AR' : (esCurada ? 'MENDOZA' : fuente));
  const anio = document.createElement('span');
  anio.className = 'banco-anio';
  if (c.año) anio.textContent = c.año;
  else {
    const f = String(c.fecha || '');
    anio.textContent = `${String(Number(f.slice(8, 10)))} ${MESES_ABREV[Number(f.slice(5, 7))] || ''}`.trim();
  }
  const info = document.createElement('div');
  info.className = 'banco-info';
  const titulo = document.createElement('span');
  titulo.className = 'banco-titulo';
  titulo.textContent = c.titulo;
  const resumen = document.createElement('span');
  resumen.className = 'banco-resumen';
  resumen.textContent = c.resumen;
  info.append(titulo, resumen);
  const agregado = idsBancoAgregados.has(c.id);
  const btn = document.createElement('button');
  btn.type = 'button';
  const placaLlena = itemsPlaca.filter(i => !i.oculto).length >= 6;
  btn.className = 'chico' + (agregado || placaLlena ? ' secundario' : '');
  btn.textContent = agregado ? '✓ EN LA PLACA' : '+ AGREGAR';
  btn.disabled = agregado || placaLlena;
  if (btn.disabled && !agregado) btn.title = 'La placa tiene 6 hechos visibles. Ocultá uno para hacer lugar.';
  btn.addEventListener('click', () => agregarDesdeBanco(c));
  li.append(badge, anio, info, btn);
  return li;
}

function agregarDesdeBanco(c) {
  const visibles = itemsPlaca.filter(i => !i.oculto).length;
  if (visibles >= 6 || idsBancoAgregados.has(c.id)) return;
  const hecho = {
    id: `banco-${c.id || nuevoIdLocal()}`,
    año: String(c.año || ''), fecha: String(c.fecha || ''), titulo: String(c.titulo),
    resumen: String(c.resumen), ampliado: String(c.ampliado || c.resumen),
    icono: String(c.icono || 'historia'), categoria: String(c.categoria || 'EFEMÉRIDE ARGENTINA'),
    oculto: false, verificada: c.verificada === true,
    fuente: c.feria ? 'argentinadatos.com' : (String(c.fuente || '').toLowerCase() === 'mendoza' ? 'Media Mendoza' : String(c.fuente || 'Wikipedia')),
    fuenteUrl: String(c.fuenteUrl || c.url_fuente || ''),
  };
  itemsPlaca.push(hecho);
  idsBancoAgregados.add(c.id);
  editado = true;
  redibujarPlaca();
  renderEditor();
  renderBancoPool();
}

function redibujarPlaca() {
  const modelo = construirModeloPlaca(itemsPlaca, fechaActual);
  if (modelo.ok) dibujarPlaca(modelo);
}

function crearBoton(texto, clase, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = clase;
  b.textContent = texto;
  b.addEventListener('click', onClick);
  return b;
}

function crearBadge(texto, clase) {
  const s = document.createElement('span');
  s.className = `badge ${clase}`;
  s.textContent = texto;
  return s;
}

function renderEditor() {
  ui.editorLista.replaceChildren();
  const visibles = itemsPlaca.filter(i => !i.oculto);
  const hero = visibles[0];
  const ocultos = itemsPlaca.length - visibles.length;
  const poco = visibles.length > 0 && visibles.length < 5;
  ui.pocosHechos.hidden = !poco;
  ui.pocosHechos.textContent = poco ? `⚠ SOLO ${visibles.length} HECHO${visibles.length > 1 ? 'S' : ''} VERIFICADO${visibles.length > 1 ? 'S' : ''} PARA ESTA FECHA` : '';
  ui.respaldo.hidden = !placaEnRespaldo;
  ui.respaldo.textContent = placaEnRespaldo ? '⚠ PLACA DE RESPALDO — VERIFICÁ ANTES DE PUBLICAR' : '';
  for (const item of itemsPlaca) {
    const li = document.createElement('li');
    li.className = 'hecho-card' + (item.oculto ? ' oculto' : '');
    const info = document.createElement('div');
    info.className = 'hecho-info';
    const linea = document.createElement('span');
    linea.className = 'hecho-linea';
    linea.append(document.createTextNode(`${emojiIconoEf(item.icono)}`));
    const anio = document.createElement('span');
    anio.className = 'anio';
    anio.textContent = item.año || 'AR';
    linea.append(anio, document.createTextNode(item.titulo));
    info.append(linea);
    const restoCard = restoVisibleEf(item.ampliado || item.resumen, item.titulo);
    if (restoCard) {
      const resumen = document.createElement('span');
      resumen.className = 'hecho-resumen';
      resumen.textContent = restoCard;
      info.append(resumen);
    }
    const fuenteUrl = String(item.fuenteUrl || '').trim();
    if (fuenteUrl) {
      const a = document.createElement('a');
      a.className = 'fuente-link';
      a.href = fuenteUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = 'Abrir la fuente para verificar antes de publicar';
      a.textContent = 'fuente ↗';
      info.append(a);
    }
    const acciones = document.createElement('div');
    acciones.className = 'hecho-acciones';
    if (item.oculto) {
      acciones.append(crearBadge('OCULTO', 'badge-oculto'), crearBoton('MOSTRAR', 'secundario chico', () => onToggleOcultar(item.id)));
    } else {
      if (hero === item) acciones.append(crearBadge('★ DESTACADA', 'badge-destacada'));
      else acciones.append(crearBoton('★ DESTACAR', 'secundario chico', () => onDestacar(item.id)));
      if (visibles.length === 1) {
        const b = crearBoton('OCULTAR', 'chico', () => {});
        b.disabled = true;
        b.title = 'La placa necesita al menos un hecho';
        acciones.append(b);
      } else {
        acciones.append(crearBoton('OCULTAR', 'chico', () => onToggleOcultar(item.id)));
      }
    }
    li.append(info, acciones);
    ui.editorLista.append(li);
  }
  ui.editorCount.textContent = `${itemsPlaca.length} HECHOS${ocultos ? ` · ${ocultos} OCULTO${ocultos > 1 ? 'S' : ''}` : ''}`;
  ui.restablecer.hidden = !editado;
}

function onDestacar(id) {
  const i = itemsPlaca.findIndex(x => x.id === id);
  if (i <= 0) return;
  const [item] = itemsPlaca.splice(i, 1);
  itemsPlaca.unshift(item);
  editado = true;
  redibujarPlaca();
  renderEditor();
  renderBancoPool();
  renderTyc();
}

function onToggleOcultar(id) {
  const item = itemsPlaca.find(x => x.id === id);
  if (!item) return;
  const visibles = itemsPlaca.filter(x => !x.oculto);
  if (!item.oculto && visibles.length === 1) return; // guarda: la placa necesita ≥1
  item.oculto = !item.oculto;
  editado = true;
  redibujarPlaca();
  renderEditor();
  renderBancoPool();
  renderTyc();
}

function onRestablecer() {
  itemsPlaca = itemsOriginales.map(i => ({ ...i, oculto: false }));
  idsBancoAgregados = new Set();
  idsTycUsados = new Set();
  editado = false;
  ui.formAgregar.reset();
  ui.altaError.hidden = true;
  redibujarPlaca();
  renderEditor();
  renderBancoPool();
  renderTyc();
}

function limpiarBanco() {
  candidatosWikipedia = [];
  idsBancoAgregados = new Set();
  idsTycUsados = new Set();
  bancoPool = [];
  bancoListLoaded = false;
  ui.bancoLista.replaceChildren();
  ui.bancoVacio.hidden = true;
  ui.bancoCount.textContent = '';
  ui.bancoListaWrap.hidden = true;
  ui.bancoPanel.hidden = true;
}

function resetearEditor() {
  itemsPlaca = [];
  itemsOriginales = [];
  editado = false;
  placaEnRespaldo = false;
  if (ui.pocosHechos) ui.pocosHechos.hidden = true;
  if (ui.respaldo) ui.respaldo.hidden = true;
  ui.editorLista.replaceChildren();
  ui.editorCount.textContent = '';
  ui.restablecer.hidden = true;
  ui.editor.hidden = true;
  ui.formAgregar.reset();
  ui.altaError.hidden = true;
  resetearTyc();
  limpiarBanco();
}

ui.reintentar.addEventListener('click', () => cargar(fechaActual));
ui.copiar.addEventListener('click', copiarPNG);
ui.copys.addEventListener('click', cargarCopys);
ui.copysReintentar.addEventListener('click', cargarCopys);
ui.copiarWhats.addEventListener('click', () => copiarTexto(ui.copiarWhats, ui.copysWhats.value));
ui.copiarIg.addEventListener('click', () => copiarTexto(ui.copiarIg, ui.copysIg.value));
ui.btnTyc.addEventListener('click', cargarTyc);
ui.tycFiltros.forEach(b => b.addEventListener('click', () => { tycFiltro = b.dataset.f; renderTyc(); }));
ui.fecha.addEventListener('change', () => {
  const v = ui.fecha.value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { fechaActual = v; cargar(v); }
});
ui.descargar.addEventListener('click', exportarPNG);
ui.restablecer.addEventListener('click', onRestablecer);
ui.btnBanco.addEventListener('click', () => {
  if (ui.bancoListaWrap.hidden) abrirBanco(); else ui.bancoListaWrap.hidden = true;
});
ui.formAgregar.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const r = validarHechoPropio({ año: ui.altaAño.value, titulo: ui.altaTitulo.value, resumen: ui.altaResumen.value, ampliado: ui.altaAmpliado.value, icono: ui.altaIcono.value });
  if (!r.ok) { ui.altaError.textContent = r.error; ui.altaError.hidden = false; return; }
  ui.altaError.hidden = true;
  itemsPlaca.push({
    id: nuevoIdLocal(), ...r.hecho,
    categoria: etiquetaCategoria({ icono: r.hecho.icono }),
    verificada: false, fuente: 'Media Mendoza', oculto: false,
  });
  ui.formAgregar.reset();
  ui.altaIcono.value = 'historia';
  editado = true;
  redibujarPlaca();
  renderEditor();
});
cargar(fechaActual);
