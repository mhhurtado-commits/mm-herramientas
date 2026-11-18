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
  restablecer: $('btnRestablecer'), formAgregar: $('formAgregar'),
  altaAño: $('altaAño'), altaTitulo: $('altaTitulo'), altaResumen: $('altaResumen'),
  altaAmpliado: $('altaAmpliado'), altaIcono: $('altaIcono'), altaError: $('altaError'),
};

let fechaActual = hoyArgentina();
let logoImg = null;
let itemsPlaca = [];      // hechos visibles/ocultos + propios; la destacada es el primer visible
let itemsOriginales = []; // snapshot del servidor para RESTABLECER
let editado = false;
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
  ctx.fillText(modelo.hero.año, 64, y);
  const cajaAño = ctx.measureText(modelo.hero.año);
  y += Math.round(cajaAño.actualBoundingBoxAscent + cajaAño.actualBoundingBoxDescent) + 14;
  ctx.fillStyle = COLOR.crema;
  ctx.font = '600 42px Inter';
  for (const linea of envolver(ctx, modelo.hero.titulo, ANCHO - 128)) { ctx.fillText(linea, 64, y); y += 50; }
  y += 2;
  ctx.fillStyle = COLOR.atenuado;
  ctx.font = '500 28px Inter';
  for (const linea of envolver(ctx, modelo.hero.resumen, ANCHO - 128)) { ctx.fillText(linea, 64, y); y += 34; }
  y += 4;
  ctx.font = '400 22px Inter';
  ctx.fillStyle = COLOR.ampliado;
  for (const linea of envolver(ctx, modelo.hero.ampliado, ANCHO - 128).slice(0, 4)) { ctx.fillText(linea, 64, y); y += 28; }
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
    ctx.fillText(fila.año, 64, y + 2);
    const xTexto = 200;
    ctx.fillStyle = COLOR.crema;
    ctx.font = `600 ${fTitulo}px Inter`;
    ctx.fillText(unaLinea(ctx, fila.titulo, ANCHO - xTexto - 128), xTexto, y + 2);
    ctx.fillStyle = COLOR.atenuado;
    ctx.font = `400 ${fRes}px Inter`;
    for (const [k, linea] of envolver(ctx, fila.resumen, ANCHO - xTexto - 128).slice(0, 2).entries()) {
      ctx.fillText(linea, xTexto, y + yRes + k * lhRes);
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
      itemsOriginales = modelo.items.map(i => ({ ...i, oculto: false }));
      itemsPlaca = itemsOriginales.map(i => ({ ...i }));
      editado = false;
      await garantizarAssets();
      redibujarPlaca();
      ui.editor.hidden = false;
      renderEditor();
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
    anio.textContent = item.año;
    linea.append(anio, document.createTextNode(item.titulo));
    const resumen = document.createElement('span');
    resumen.className = 'hecho-resumen';
    resumen.textContent = item.resumen;
    info.append(linea, resumen);
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
}

function onRestablecer() {
  itemsPlaca = itemsOriginales.map(i => ({ ...i, oculto: false }));
  editado = false;
  ui.formAgregar.reset();
  ui.altaError.hidden = true;
  redibujarPlaca();
  renderEditor();
}

function resetearEditor() {
  itemsPlaca = [];
  itemsOriginales = [];
  editado = false;
  ui.editorLista.replaceChildren();
  ui.editorCount.textContent = '';
  ui.restablecer.hidden = true;
  ui.editor.hidden = true;
  ui.formAgregar.reset();
  ui.altaError.hidden = true;
}

ui.reintentar.addEventListener('click', () => cargar(fechaActual));
ui.copiar.addEventListener('click', copiarPNG);
ui.copys.addEventListener('click', cargarCopys);
ui.copysReintentar.addEventListener('click', cargarCopys);
ui.copiarWhats.addEventListener('click', () => copiarTexto(ui.copiarWhats, ui.copysWhats.value));
ui.copiarIg.addEventListener('click', () => copiarTexto(ui.copiarIg, ui.copysIg.value));
ui.fecha.addEventListener('change', () => {
  const v = ui.fecha.value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { fechaActual = v; cargar(v); }
});
ui.descargar.addEventListener('click', exportarPNG);
ui.restablecer.addEventListener('click', onRestablecer);
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
