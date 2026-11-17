# Alertas de Tormentas (`/alertas/`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una herramienta estática en `alertas/` que toma el parte meteorológico pegado por el redactor y genera una placa PNG de alerta de tormentas (1:1, 4:5, 9:16) + caption de WhatsApp, sin tocar `placas-v2` ni el worker.

**Architecture:** Vanilla HTML/CSS/JS (ESM), sin build ni dependencias. `alertas-core.mjs` puro (modelo + prompt IA + validadores + caption) testeado con `node --test`; `renderer.mjs` puro de canvas; `app.mjs` única puerta al DOM/red; `index.html` estructura + estilos + gate.

**Tech Stack:** Cloudflare Pages (estático), `<canvas>` 2D, `fetch` al worker `mm-herramientas-worker` (`POST /social/generar {systemPrompt, userMsg}`), Node 24 + `node --test`.

## Global Constraints

- Ruta pública: `alertas/index.html` (`/alertas/`), **sin** tarjeta en `index.html` del hub; `/placas-v2/` **intacto**; `worker/worker.js` **sin cambios**.
- Sin dependencias, sin bundler, sin `package.json`. ESM (`type="module"`).
- PNG: **1600×1600 (1:1)**, **1350×1688 (4:5)**, **1080×1920 (9:16)**.
- Colores: fondo `#10130f/#0a0c09`, panel `rgba(245,197,24,.08)`, yellow `#f5c518`, red `#c0392b`, text `#f5f5ec`, dim `#a7a896`.
- Tipografía: `Arial Black`/`Arial` (titulares), `Inter` (cuerpo; ya cargada por `style.css`).
- Caption fija `⚡ ALERTA | Media Mendoza`. Hora: ahora del navegador (editable). Fecha: `DD/MM`.
- Regla editorial: **no inventar** ETA/dirección/nivel que no estén en el parte; campos sin dato → `null`/vacío, nunca placeholder inventado.
- Gate de contraseña idéntico a la suite: `PROTECT_PASSWORD = "tomyjerry2008"`, `mm_auth` en localStorage, 7 días.
- EOL LF en el repo; no normalizar; no tocar cambios preexistentes (`visual-suite/`, `worker/worker.js`, `.wrangler/`, `docs/superpowers/...` previos).
- Verificación mínima: `node --check alertas/*.mjs` y `node --test --test-isolation=none ... alertas/*.test.mjs` con Node 24.
- Commits solo de archivos propios (`alertas/`, el plan, el spec ya commiteado).

## Contratos entre tareas

- `alertas-core.mjs` exporta: `ALERTAS_SYSTEM_PROMPT` (string), `normalizeNivel(raw): ('gris'|'blanco'|'azul'|'verde'|'amarillo'|'naranja'|'rojo'|'violeta')`, `emptyReport(): Object`, `normalizeAlertReport(raw): Object`, `validarEnFuente(data, texto): Object`, `buildWhatsAppCaption(data): string`.
- Forma normalizada (`data`): `{ titular, fuente, hora, fecha, nivel, direccion, celdas: [{etiqueta:'ahora'|'ruta'|'siguiente', zonas, detalle, hacia}], eta: {lugar, detalle, minutos}|null }`.
- `renderer.mjs` exporta: `FORMATS = { '1:1': {width,height,scale}, '4:5': ..., '9:16': ... }`, `renderAlertasPlaca(ctx, data, formatKey, logoImg|null)`.
- `app.mjs` exporta: `WORKER` constante y manejadores; depende solo de DOM + los dos anteriores.

---

### Task 1: Core puro + tests (TDD)

**Files:**
- Create: `alertas/alertas-core.mjs`
- Create: `alertas/alertas-core.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces: las exports de `alertas-core.mjs` listadas en "Contratos entre tareas".

- [ ] **Step 1: Escribir el test que falla** (`alertas/alertas-core.test.mjs`):

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAlertReport, normalizeNivel, validarEnFuente, buildWhatsAppCaption, emptyReport, ALERTAS_SYSTEM_PROMPT } from './alertas-core.mjs';

const PARTE1 = `Reporte Meteorológico
Informa el Sr. Marcelo Peña de Radar San Rafael-AEMSA:
-La tormenta comienza a afectar con lluvia fuerte y granizo a Calle Larga, Atuel Norte y Villa Atuel. Sigue desplazándose hacia el este, y podría afectar más tarde a Las Aguaditas, Real del Padre y el sector norte de Jaime Prats.
-Otra tormenta con granizo comienza a cruzar la Ruta 144 a la altura del Desvío. Se desplaza al este, con dirección al Cañón del Atuel y Valle Grande.`;
const PARTE2 = `-Atención para Valle Grande en 5-10 minutos. Estaría llegando al Embalse una tormenta con precipitación de lluvia fuerte y granizo.`;

test('prompt del sistema documenta el contrato JSON', () => {
  assert.match(ALERTAS_SYSTEM_PROMPT, /SOLO/);
  assert.match(ALERTAS_SYSTEM_PROMPT, /celdas/);
  assert.match(ALERTAS_SYSTEM_PROMPT, /eta/);
  assert.match(ALERTAS_SYSTEM_PROMPT, /gris/);
  assert.match(ALERTAS_SYSTEM_PROMPT, /violeta/);
});

test('normalizeNivel: niveles válidos y fallback naranja', () => {
  assert.equal(normalizeNivel('rojo'), 'rojo');
  assert.equal(normalizeNivel('ROJO'), 'rojo');
  assert.equal(normalizeNivel('Amarillo'), 'amarillo');
  assert.equal(normalizeNivel('gris'), 'gris');
  assert.equal(normalizeNivel('BLANCO'), 'blanco');
  assert.equal(normalizeNivel('Azul'), 'azul');
  assert.equal(normalizeNivel('violeta'), 'violeta');
  assert.equal(normalizeNivel('huracán'), 'naranja');
  assert.equal(normalizeNivel(''), 'naranja');
});

test('emptyReport es estable y vacío', () => {
  const r = emptyReport();
  assert.equal(r.nivel, 'naranja');
  assert.deepEqual(r.celdas, []);
  assert.equal(r.eta, null);
});

test('normaliza respuesta válida: 2 celdas ordenadas, dirección este, eta con minutos 10', () => {
  const data = normalizeAlertReport({
    titular: 'Tormentas con granizo al este.',
    fuente: 'Radar San Rafael-AEMSA · Marcelo Peña',
    hora: '11:00', fecha: '17/11', nivel: 'naranja', direccion: 'este',
    celdas: [
      { etiqueta: 'ahora', zonas: 'Calle Larga, Atuel Norte y Villa Atuel', detalle: 'lluvia fuerte y granizo', hacia: 'este' },
      { etiqueta: 'ruta', zonas: 'Ruta 144 a la altura del Desvío → Cañón del Atuel, Valle Grande', detalle: 'tormenta con granizo', hacia: 'este' },
    ],
    eta: { lugar: 'Valle Grande · Embalse', detalle: 'lluvia fuerte y granizo', minutos: 10 },
  });
  assert.equal(data.titular, 'Tormentas con granizo al este'); // sin punto final
  assert.equal(data.celdas.length, 2);
  assert.equal(data.celdas[0].etiqueta, 'ahora');
  assert.equal(data.celdas[1].etiqueta, 'ruta');
  assert.equal(data.eta.minutos, 10);
  assert.equal(data.direccion, 'este');
});

test('parte sin eta: eta === null y caption sin línea de ETA', () => {
  const data = normalizeAlertReport({ titular: 'Tormentas al este', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [{ etiqueta: 'ahora', zonas: 'Villa Atuel', detalle: 'granizo', hacia: 'este' }], eta: null });
  assert.equal(data.eta, null);
  const caption = buildWhatsAppCaption(data);
  assert.doesNotMatch(caption, /5–10|llegada en/);
});

test('validarEnFuente descarta dirección no presente en el parte', () => {
  const data = normalizeAlertReport({ titular: 'Tormentas al oeste', fuente: 'Radar', nivel: 'naranja', direccion: 'oeste', celdas: [], eta: null });
  assert.equal(validarEnFuente(data, PARTE1).direccion, '');
});

test('validarEnFuente descarta ETA cuyo lugar no aparece', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [], eta: { lugar: 'Bariloche', detalle: 'granizo', minutos: 5 } });
  assert.equal(validarEnFuente(data, PARTE1).eta, null);
});

test('validarEnFuente mantiene ETA compuesto cuando cada componente aparece en el parte', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [], eta: { lugar: 'Valle Grande · Embalse', detalle: 'granizo', minutos: 10 } });
  assert.equal(validarEnFuente(data, PARTE1 + '\\n' + PARTE2).eta.minutos, 10);
});

test('validarEnFuente descarta ETA compuesto si algún componente no aparece', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [], eta: { lugar: 'Valle Grande · Bariloche', detalle: 'granizo', minutos: 5 } });
  assert.equal(validarEnFuente(data, PARTE1 + '\\n' + PARTE2).eta, null);
});

test('validarEnFuente descarta ETA con lugar vacío', () => {
  const data = { titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: '', celdas: [], eta: { lugar: '', detalle: 'granizo', minutos: 5 } };
  assert.equal(validarEnFuente(data, PARTE2).eta, null);
});

test('caption: omite viñetas inventadas si no hay celdas y mantiene encabezado fijo', () => {
  const data = normalizeAlertReport({ titular: 'Alerta de tormentas', fuente: 'Radar', nivel: 'naranja', direccion: '', celdas: [], eta: null });
  const caption = buildWhatsAppCaption(data);
  assert.match(caption, /^⚡ ALERTA \| Media Mendoza/);
  assert.doesNotMatch(caption, /• /);
});

test('validarEnFuente descarta zonas no presentes en el parte (cadena vacía, nunca inventada)', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [{ etiqueta: 'ahora', zonas: 'Bariloche, Villa Gesell', detalle: 'granizo', hacia: 'este' }], eta: null });
  assert.equal(validarEnFuente(data, PARTE1).celdas[0].zonas, '');
});

test('caption: sin titular, encabezado fijo queda y no se imprime línea de titular', () => {
  const data = normalizeAlertReport({ titular: '', fuente: 'Radar', nivel: 'naranja', direccion: '', celdas: [{ etiqueta: 'ahora', zonas: 'Villa Atuel', detalle: 'granizo', hacia: 'este' }], eta: null });
  const caption = buildWhatsAppCaption(data);
  assert.match(caption, /^⚡ ALERTA \| Media Mendoza\n• Ahora: Villa Atuel/);
});

test('etiquetas duplicadas de la IA se reasignan a slots libres (ahora/ruta/siguiente)', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [
    { etiqueta: 'ahora', zonas: 'Calle Larga', detalle: 'granizo', hacia: 'este' },
    { etiqueta: 'ahora', zonas: 'Ruta 144', detalle: 'granizo', hacia: 'este' },
    { etiqueta: 'ahora', zonas: 'Las Aguaditas', detalle: 'lluvia', hacia: 'este' },
  ], eta: null });
  assert.deepEqual(data.celdas.map((c) => c.etiqueta), ['ahora', 'ruta', 'siguiente']);
  assert.deepEqual(data.celdas.map((c) => c.zonas), ['Calle Larga', 'Ruta 144', 'Las Aguaditas']);
});

test('validarEnFuente divide zonas también por → y recupera contenido verificable', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: 'este', celdas: [{ etiqueta: 'ahora', zonas: 'Ruta 144 a la altura del Desvío → Cañón del Atuel, Bariloche', detalle: 'granizo', hacia: 'este' }], eta: null });
  assert.deepEqual(validarEnFuente(data, PARTE1).celdas[0].zonas, 'Ruta 144 a la altura del Desvío, Cañón del Atuel');
});

test('normalizeAlertReport: hora/fecha con formato inválido quedan vacías', () => {
  const data = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: '', celdas: [], eta: null, hora: '19 hs.', fecha: '17 de noviembre' });
  assert.equal(data.hora, '');
  assert.equal(data.fecha, '');
  const ok = normalizeAlertReport({ titular: 'T', fuente: 'Radar', nivel: 'naranja', direccion: '', celdas: [], eta: null, hora: '19:05', fecha: '17/11' });
  assert.equal(ok.hora, '19:05');
  assert.equal(ok.fecha, '17/11');
});

test('normalizeAlertReport tolera garbage/undefined (no throw)', () => {
  assert.deepEqual(normalizeAlertReport(''), emptyReport());
  assert.deepEqual(normalizeAlertReport(undefined), emptyReport());
  assert.deepEqual(normalizeAlertReport({ celdas: 'nope' }).celdas, []);
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `node --test --test-isolation=none alertas/alertas-core.test.mjs`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `alertas/alertas-core.mjs` mínimo** (contrato exacto):

```js
// alertas-core.mjs — modelo del parte meteorológico, prompt IA, validador, caption. Sin DOM.

export const ALERTAS_SYSTEM_PROMPT = `Sos editor de servicio de Media Mendoza. Recibís el parte meteorológico tal cual llega y devolvés JSON válido SIN backticks ni markdown:
{ "titular": "TORMENTAS CON GRANIZO AL ESTE", "fuente": "Radar San Rafael-AEMSA · Marcelo Peña", "hora": "11:00", "nivel": "naranja", "direccion": "este", "celdas": [{ "etiqueta": "ahora", "zonas": "Calle Larga, Atuel Norte y Villa Atuel", "detalle": "lluvia fuerte y granizo", "hacia": "este" }], "eta": { "lugar": "Valle Grande · Embalse", "detalle": "lluvia fuerte y granizo", "minutos": 10 } }

Reglas:
- titular: 2–5 palabras MAYÚSCULAS, el hecho principal, sin punto final.
- fuente: organismo/persona que emite; si no aparece, "Mediamendoza". Sin incluir firma ni ubicación del redactor si no aparece.
- hora: hora de emisión del parte en HH:MM; si no aparece, "".
- nivel: UNO de gris|blanco|azul|verde|amarillo|naranja|rojo|violeta: gris = sin alerta, tiempo tranquilo; blanco = informativo, sin severidad; azul = vigilancia, tormenta posible; verde = alerta leve; amarillo = alerta moderada; naranja = alerta fuerte; rojo = alerta severa; violeta = alerta máxima, más allá del rojo. Si no se puede inferir, naranja.
- direccion: este|oeste|norte|sur cuando el parte marca desplazamiento; si no hay, "".
- celdas: UN ítem por viñeta del parte (máx. 3). etiqueta: "ahora" si dice "comienza a afectar/ya está", "ruta" si dice "cruza/se desplaza hacia", "siguiente" si dice "más tarde/podría"/o no tiene sección clara. zonas = localidades/calles AFECTADAS texto exacto del parte. detalle = fenómeno (lluvia fuerte / granizo / lluvia). hacia = dirección del ítem o "".
- eta: SOLO si el parte anuncia llegada en MINUTOS a un lugar: { "lugar": ..., "detalle": ..., "minutos": N }. Si no, eta: null.
- PROHIBIDO inventar calles, mezclar datos entre viñetas o crear ETA/dirección que el texto no tenga.
Respondé SOLO JSON.`;

const NIVELES = ['gris', 'blanco', 'azul', 'verde', 'amarillo', 'naranja', 'rojo', 'violeta'];
const ETIQUETAS = new Set(['ahora', 'ruta', 'siguiente']);

export function normalizeNivel(raw) {
  const nivel = String(raw || '').trim().toLowerCase();
  return NIVELES.includes(nivel) ? nivel : 'naranja';
}

export function emptyReport() {
  return { titular: '', fuente: '', hora: '', fecha: '', nivel: 'naranja', direccion: '', celdas: [], eta: null };
}

const limpiaTitulo = (s) => String(s || '').trim().replace(/\s+/g, ' ').replace(/\.+$/, '');
const limpia = (s) => String(s || '').trim().replace(/\s+/g, ' ');
const canon = (s) => limpia(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const FORMATO_HORA = /^\d{1,2}:\d{2}$/;
const FORMATO_FECHA = /^\d{1,2}\/\d{1,2}$/;
const DIRECCIONES = ['este', 'oeste', 'norte', 'sur'];

export function normalizeAlertReport(raw) {
  if (!raw || typeof raw !== 'object') return emptyReport();
  const out = {
    titular: limpiaTitulo(raw.titular),
    fuente: limpia(raw.fuente),
    hora: FORMATO_HORA.test(limpia(raw.hora)) ? limpia(raw.hora) : '',
    fecha: FORMATO_FECHA.test(limpia(raw.fecha)) ? limpia(raw.fecha) : '',
    nivel: normalizeNivel(raw.nivel),
    direccion: limpia(raw.direccion).toLowerCase(),
    celdas: [],
    eta: null,
  };
  if (!DIRECCIONES.includes(out.direccion)) out.direccion = '';
  const celdas = Array.isArray(raw.celdas) ? raw.celdas.slice(0, 3) : [];
  // Unicidad de etiquetas en orden de aparición: duplicadas → siguiente slot libre (ahora→ruta→siguiente)
  const usados = new Set();
  out.celdas = celdas.map((c) => {
    let etiqueta = ETIQUETAS.has(String(c?.etiqueta || '').toLowerCase()) ? String(c.etiqueta).toLowerCase() : 'ahora';
    if (usados.has(etiqueta)) etiqueta = ['ahora', 'ruta', 'siguiente'].find((e) => !usados.has(e)) || etiqueta;
    usados.add(etiqueta);
    return {
      etiqueta,
      zonas: limpia(c?.zonas),
      detalle: limpia(c?.detalle),
      hacia: limpia(c?.hacia).toLowerCase(),
    };
  });
  const eta = raw.eta && typeof raw.eta === 'object' ? raw.eta : null;
  const minutos = eta ? Number(eta.minutos) : NaN;
  if (eta && limpia(eta.lugar) && Number.isFinite(minutos)) {
    out.eta = { lugar: limpia(eta.lugar), detalle: limpia(eta.detalle), minutos };
  }
  return out;
}

export function validarEnFuente(data, texto) {
  const fuente = canon(texto || '');
  const limpio = { ...data, celdas: [], eta: null };
  if (DIRECCIONES.includes(canon(data.direccion || '')) && fuente.includes(canon(data.direccion))) {
    limpio.direccion = data.direccion;
  } else {
    limpio.direccion = '';
  }
  for (const c of data.celdas || []) {
    const zonas = String(c.zonas || '').replace(/->/g, '→').split(/[,;→]/).map((t) => t.trim()).filter(Boolean);
    const presentes = zonas.filter((t) => fuente.includes(canon(t)));
    const zonasFinal = presentes.length ? presentes.join(', ') : '';
    const haciaFinal = c.hacia && fuente.includes(canon(c.hacia)) ? c.hacia : '';
    limpio.celdas.push({ ...c, zonas: zonasFinal, hacia: haciaFinal });
  }
  const tokensLugar = (s) => canon(s).split(/[,;·|–—\-/()&]/).map((t) => t.trim()).filter(Boolean);
  const etaTokens = data.eta ? tokensLugar(data.eta.lugar) : [];
  if (data.eta && etaTokens.length && etaTokens.every((t) => fuente.includes(t))) limpio.eta = data.eta;
  return limpio;
}

export function buildWhatsAppCaption(data) {
  const titulos = { ahora: 'Ahora', ruta: 'En ruta', siguiente: 'Próximo' };
  const lineas = ['⚡ ALERTA | Media Mendoza'];
  if (data.titular) lineas.push(data.titular);
  for (const c of data.celdas || []) {
    if (!c.zonas) continue;
    const dir = c.hacia ? ` → ${String(c.hacia).toUpperCase()}` : '';
    lineas.push(`• ${titulos[c.etiqueta] || 'Zona'}: ${c.zonas}${dir} — ${c.detalle}`);
  }
  if (data.eta) lineas.push(`• ${data.eta.lugar}: llegada en ${data.eta.minutos} min — ${data.eta.detalle}`);
  lineas.push(`Fuente: ${data.fuente || 'Mediamendoza'} · mediamendoza.com`);
  return lineas.join('\n');
}
```

- [ ] **Step 4: Correr tests, verde**

Run: `node --test --test-isolation=none alertas/alertas-core.test.mjs`
Expected: 17 tests pass.

- [ ] **Step 5: Commit**

```powershell
cd "C:\Users\Miguel\Documents\New project"
git add alertas/alertas-core.mjs alertas/alertas-core.test.mjs
git commit -m "feat(alertas): modelo del parte, prompt IA, validador y caption"
```

---

### Task 2: Scaffold `alertas/index.html` (gate + layout + estilos)

**Files:**
- Create: `alertas/index.html`

**Interfaces:**
- Consumes: `../style.css` variables.
- Produces: DOM consumido por `app.mjs` (ids) y por `renderer.mjs` (canvas). Ids: `reporteText`, `generarBtn`, `loading`, `errorBanner`, `formatoToggle` (botones `[data-formato]`), `plateCanvas`, `descargarPngBtn`, `copiarPngBtn`, `actualizarBtn`, `titularInput`, `fuenteInput`, `horaInput`, `fechaInput`, `nivelSelect`, `direccionInput`, `celda-ahora-zonas|detalle|hacia`, `celda-ruta-zonas|detalle|hacia`, `celda-siguiente-zonas|detalle|hacia`, `eta-lugar|detalle|minutos`, `captionText`, `copiarCaptionBtn`, `toast` (div. toast).

- [ ] **Step 1: Crear el esqueleto completo de la página**

`alertas/index.html` debe contener (patrón `whatsapp/index.html` y `redaccion-v2/index.html` del suite):

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Alertas de Tormentas — Media Mendoza</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
<link rel="icon" type="image/png" href="../assets/logo-cuadrado.png">
<style>
/* Registro propio de la herramienta: grid 2 columnas, tema oscuro por defecto */
:root { --alertas-accent:#f5c518; }
.alertas-main{padding-top:var(--header-h);padding-bottom:var(--footer-h);max-width:1200px;margin:0 auto;padding:20px;display:grid;grid-template-columns:minmax(320px,400px) 1fr;gap:16px;align-items:start}
@media(max-width:960px){.alertas-main{grid-template-columns:1fr}}
.panel{background:var(--surface);border:1px solid var(--line2);border-radius:var(--radius-xl);padding:16px;display:flex;flex-direction:column;gap:12px}
.panel.accent{border-top:3px solid var(--alertas-accent)}
textarea,input,select{background:var(--surface2);border:1px solid var(--line2);border-radius:var(--radius);color:var(--text);font-family:var(--font-body);font-size:13px;padding:10px 12px;outline:none}
textarea:focus,input:focus,select:focus{border-color:var(--alertas-accent)}
label{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);font-weight:700}
.btn{background:var(--alertas-accent);color:#141414;border:none;border-radius:var(--radius);padding:12px 18px;font-family:var(--font-body);font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
.btn-secondary{background:transparent;color:var(--text);border:1px solid var(--line2)}
.btn:disabled{opacity:.4;cursor:not-allowed}
.error-banner{background:#c0392b;color:#fff;padding:10px 12px;border-radius:var(--radius);font-size:12px;line-height:1.5}
.loading{font-size:12px;color:var(--dim)}
.format-toggle{display:flex;gap:6px}
.format-btn{background:transparent;border:1px solid var(--line2);color:var(--dim);border-radius:var(--radius);padding:8px 12px;cursor:pointer;font-weight:700}
.format-btn.active{background:var(--alertas-accent);border-color:var(--alertas-accent);color:#141414}
canvas#plateCanvas{width:100%;max-height:78vh;background:#0a0c09;border-radius:var(--radius-lg);border:1px solid var(--line)}
.fld-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
fieldset{border:1px solid var(--line2);border-radius:var(--radius);padding:8px 10px;display:flex;flex-direction:column;gap:8px}
legend{font-size:9px;letter-spacing:1.5px;color:var(--alertas-accent);font-weight:800}
.caption-box textarea{width:100%;min-height:150px;font-size:12px}
.toast{position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:var(--alertas-accent);color:#141414;padding:10px 16px;border-radius:var(--radius);font-size:12px;font-weight:700;display:none;z-index:400}
.toast.show{display:block}
</style>
</head>
<body>
<div class="login-overlay" id="loginOverlay"> … modal idéntico al suite … </div>
<div class="content-protected" id="protectedContent">
<header class="mm-header"> … marca + label "Alertas" + status Conectado … </header>
<div class="alertas-main">
  <section class="panel accent">
    <h1 style="font-size:22px">⚡ Alertas de Tormentas</h1>
    <label for="reporteText">Pegá el reporte meteorológico</label>
    <textarea id="reporteText" rows="12" placeholder="Reporte Meteorológico&#10;Informa el Sr. ... tal cual llegó por WhatsApp"></textarea>
    <div class="loading" id="loading" hidden>Recibiendo el parte, estructurando…</div>
    <div class="error-banner" id="errorBanner" hidden></div>
    <button class="btn" id="generarBtn">Generar alerta</button>
    <p class="contexto-hint">…regla editorial: nada afirmado que no traiga el parte…</p>
  </section>
  <section class="panel">
    <div class="format-toggle" id="formatoToggle">
      <button class="format-btn" data-formato="1:1">1:1</button>
      <button class="format-btn active" data-formato="4:5">4:5</button>
      <button class="format-btn" data-formato="9:16">9:16</button>
    </div>
    <canvas id="plateCanvas" width="1350" height="1688"></canvas>
    <div style="display:flex;gap:8px"><button class="btn" id="descargarPngBtn">Descargar PNG</button><button class="btn btn-secondary" id="copiarPngBtn">Copiar PNG</button></div>
    <form id="alertasForm" class="fld-grid" style="width:100%">
      <div style="grid-column:1/-1"><label for="titularInput">Titular</label><input id="titularInput" style="width:100%"></div>
      <div style="grid-column:1/-1"><label for="fuenteInput">Fuente</label><input id="fuenteInput" style="width:100%"></div>
      <div><label for="fechaInput">Fecha</label><input id="fechaInput" placeholder="17/11"></div>
      <div><label for="horaInput">Hora</label><input id="horaInput" placeholder="11:00"></div>
      <div><label for="nivelSelect">Nivel</label><select id="nivelSelect"><option>gris</option><option>blanco</option><option>azul</option><option>verde</option><option>amarillo</option><option selected>naranja</option><option>rojo</option><option>violeta</option></select></div>
      <div><label for="direccionInput">Dirección</label><input id="direccionInput" placeholder="este / oeste / norte / sur"></div>
      <fieldset style="grid-column:1/-1"><legend>AHORA</legend>
        <input id="celda-ahora-zonas" placeholder="Zonas"><input id="celda-ahora-detalle" placeholder="Detalle (fenómeno)"><input id="celda-ahora-hacia" placeholder="hacia (este / '')">
      </fieldset>
      <fieldset style="grid-column:1/-1"><legend>EN RUTA</legend>
        <input id="celda-ruta-zonas" placeholder="Zonas"><input id="celda-ruta-detalle" placeholder="Detalle"><input id="celda-ruta-hacia" placeholder="hacia">
      </fieldset>
      <fieldset style="grid-column:1/-1"><legend>PRÓXIMO</legend>
        <input id="celda-siguiente-zonas" placeholder="Zonas"><input id="celda-siguiente-detalle" placeholder="Detalle"><input id="celda-siguiente-hacia" placeholder="hacia">
      </fieldset>
      <fieldset style="grid-column:1/-1"><legend>LLEGADA (opcional)</legend>
        <input id="eta-lugar" placeholder="Lugar (Valle Grande · Embalse)"><input id="eta-detalle" placeholder="Detalle (lluvia fuerte y granizo)"><input id="eta-minutos" type="number" min="1" placeholder="Minutos">
      </fieldset>
      <div style="grid-column:1/-1;display:flex;justify-content:flex-end"><button type="button" class="btn" id="actualizarBtn">Actualizar placa</button></div>
    </form>
    <div class="caption-box"><label for="captionText">Caption WhatsApp / Instagram</label><textarea id="captionText"></textarea><button class="btn btn-secondary" id="copiarCaptionBtn">Copiar caption</button></div>
  </section>
</div>
<script>/* gate idéntico al suite: PROTECT_PASSWORD, verificarSesion, verificarPassword, mm-auth 7 días, Enter envía */</script>
<script type="module" src="app.mjs"></script>
</div>
<div class="toast" id="toast"></div>
</body>
</html>
```

Notas de implementación:
- Copiar el bloque del gate desde `whatsapp/index.html` líneas ~589–652 tal cual (cambia solo el `<script>` marca/label “Alertas”).
- El `<canvas>` empieza como 4:5 (app lo sobreescribe al elegir formato).

- [ ] **Step 2: Verificación visual manual**

Run: `cd "C:\Users\Miguel\Documents\New project"; python -m http.server 8123` (o `npx serve .`). Abrir `http://localhost:8123/alertas/` con Playwright/browser; comprobar gate (`Acceso restringido` → password `tomyjerry2008`) y que aparecen las dos columnas.

Expected: página protegida por gate, sin errores de consola 404 (logo/ assets ruta correcta).

- [ ] **Step 3: Commit**

```powershell
cd "C:\Users\Miguel\Documents\New project"
git add alertas/index.html
git commit -m "feat(alertas): scaffold de la página (gate + layout)"
```

---

### Task 3: Renderer canvas puro (`renderer.mjs`)

**Files:**
- Create: `alertas/renderer.mjs`

**Interfaces:**
- Consumes: `data` con la forma de `alertas-core` (Tarea 1).
- Produces: `FORMATS: { '1:1'|'4:5'|'9:16': {width, height} }`, `renderAlertasPlaca(ctx, data, formatKey, logoImg?): void`.

- [ ] **Step 1: Implementar el renderizador completo**

```js
// alertas/renderer.mjs — dibuja la placa en canvas. Sin DOM; ctx se recibe como argumento.

export const FORMATS = {
  '1:1': { width: 1600, height: 1600 },
  '4:5': { width: 1350, height: 1688 },
  '9:16': { width: 1080, height: 1920 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const probe = current + ' ' + words[i];
    if (ctx.measureText(probe).width <= maxWidth) current = probe;
    else { lines.push(current); current = words[i]; }
  }
  lines.push(current);
  return lines;
}

const ETIQUETA_LABEL = { ahora: 'AFECTANDO AHORA', ruta: 'EN RUTA', siguiente: 'PRÓXIMO' };

export function renderAlertasPlaca(ctx, data, formatKey = '4:5', logoImg = null) {
  const cfg = FORMATS[formatKey] || FORMATS['4:5'];
  const W = cfg.width, H = cfg.height;
  const pad = Math.round(W * 0.042);

  // Fondo vertical oscuro
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#10130f');
  bg.addColorStop(1, '#0a0c09');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Borde exterior amarillo redondeado
  ctx.lineWidth = Math.max(3, Math.round(W * 0.0032));
  ctx.strokeStyle = '#f5c518';
  roundRect(ctx, pad * 0.4, pad * 0.4, W - pad * 0.8, H - pad * 0.8, W * 0.02);
  ctx.stroke();

  // Header: chip ALERTA + logo/wordmark + fecha·hora
  const chipW = Math.round(W * 0.155), chipH = Math.round(W * 0.036), chipY = pad;
  ctx.fillStyle = '#f5c518';
  roundRect(ctx, pad, chipY, chipW, chipH, chipH * 0.18);
  ctx.fill();
  ctx.fillStyle = '#141414';
  ctx.font = `900 ${Math.round(W * 0.0185)}px 'Arial Black', Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('ALERTA', pad + chipW / 2, chipY + chipH / 2 + 1);

  if (logoImg) {
    const logoH = Math.round(chipH * 1.5);
    const logoW = Math.round(logoH * (logoImg.width / logoImg.height));
    ctx.drawImage(logoImg, W - pad - logoW, chipY + chipH / 2 - logoH / 2, logoW, logoH);
  } else {
    ctx.fillStyle = '#f5f5ec';
    ctx.font = `800 ${Math.round(W * 0.0135)}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('MEDIA MENDOZA', W - pad, chipY + chipH / 2 + 1);
  }
  ctx.fillStyle = '#a7a896';
  ctx.font = `600 ${Math.round(W * 0.0125)}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`${data.fecha || ''} · ${data.hora || ''}`, W - pad, chipY + chipH + W * 0.014);

  // Titular
  let y = chipY + chipH + W * 0.035;
  ctx.fillStyle = '#f5f5ec';
  ctx.font = `900 ${Math.round(W * 0.056)}px 'Arial Black', Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleText = String(data.titular || '').toUpperCase(); // sin titular → no se dibuja nada (nunca un rótulo inventado)
  for (const line of wrapLines(ctx, titleText, W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += W * 0.058;
  }

  // Byline fuente
  y += W * 0.006;
  ctx.fillStyle = '#f5c518';
  ctx.font = `700 ${Math.round(W * 0.0135)}px Inter, Arial, sans-serif`;
  for (const line of wrapLines(ctx, (data.fuente || '').toUpperCase(), W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += W * 0.018;
  }

  // Bloques de zona dinámicos (1–3)
  const gap = Math.round(W * 0.016);
  const padV = Math.round(W * 0.0135);
  const labelH = Math.round(W * 0.020);
  const bodyFS = Math.round(W * 0.0245);
  const bodyLH = Math.round(W * 0.031);
  const leftBar = Math.max(4, Math.round(W * 0.004));

  for (const celda of data.celdas || []) {
    if (!celda.zonas) continue;
    const towardPill = celda.hacia ? Math.round(W * 0.088) : 0;
    const bodyMax = W - pad * 2 - padV * 2 - towardPill - (towardPill ? Math.round(W * 0.014) : 0);
    ctx.font = `500 ${bodyFS}px Inter, Arial, sans-serif`;
    const bodyLines = wrapLines(ctx, `${celda.zonas} — ${celda.detalle}`, bodyMax);
    const blockH = padV * 2 + labelH + bodyLines.length * bodyLH + Math.round(W * 0.004);
    if (y + blockH > H - pad * 1.6) break; // nunca overflow

    // Panel
    ctx.fillStyle = 'rgba(245,197,24,.08)';
    roundRect(ctx, pad, y, W - pad * 2, blockH, W * 0.008);
    ctx.fill();
    // Barra izquierda
    ctx.fillStyle = '#f5c518';
    ctx.fillRect(pad, y + W * 0.010, leftBar, blockH - W * 0.020);
    // Etiqueta
    ctx.fillStyle = '#f5c518';
    ctx.font = `800 ${Math.round(W * 0.0125)}px Inter, Arial, sans-serif`;
    ctx.fillText(ETIQUETA_LABEL[celda.etiqueta] || 'ZONA', pad + padV, y + padV + labelH * 0.55);
    // Cuerpo
    ctx.fillStyle = '#f5f5ec';
    let lineY = y + padV + labelH + bodyLH * 0.75;
    ctx.font = `500 ${bodyFS}px Inter, Arial, sans-serif`;
    for (const line of bodyLines) {
      ctx.fillText(line, pad + padV, lineY);
      lineY += bodyLH;
    }
    // Pill dirección
    if (celda.hacia) {
      const pillW = Math.round(W * 0.078), pillH = Math.round(W * 0.026);
      const pillX = W - pad - padV - pillW, pillY = y + blockH / 2 - pillH / 2;
      ctx.fillStyle = '#f5c518';
      roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.fillStyle = '#141414';
      ctx.font = `800 ${Math.round(W * 0.0125)}px Inter, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`→ ${String(celda.hacia).toUpperCase()}`, pillX + pillW / 2, pillY + pillH / 2 + 1);
      ctx.textAlign = 'left';
    }
    y += blockH + gap;
  }

  // Banner ETA (solo si eta != null)
  if (data.eta) {
    const etaText = `⚡ ${data.eta.lugar}: llegada en ${data.eta.minutos} min — ${data.eta.detalle}`;
    const etaFont = Math.round(W * 0.0175);
    ctx.font = `800 ${etaFont}px Inter, Arial, sans-serif`;
    const etaLines = wrapLines(ctx, etaText, W - pad * 2 - Math.round(W * 0.032)).slice(0, 3);
    const lineH = W * 0.023;
    const etaH = Math.round(etaLines.length * lineH + W * 0.017);
    const footTop = H - Math.round(pad * 1.6) - Math.round(W * 0.021);
    const etaTop = Math.min(y, Math.max(Math.round(pad * 1.15), footTop - etaH));
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, pad, etaTop, W - pad * 2, etaH, W * 0.008);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    let etaY = etaTop + lineH * 0.78;
    for (const line of etaLines) {
      ctx.fillText(line, pad + Math.round(W * 0.016), etaY);
      etaY += lineH;
    }
  }

  // Footer
  const footY = H - Math.round(pad * 0.78);
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, footY - W * 0.021);
  ctx.lineTo(W - pad, footY - W * 0.021);
  ctx.stroke();
  ctx.fillStyle = '#f5f5ec';
  ctx.font = `800 ${Math.round(W * 0.016)}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('MEDIA MENDOZA', pad, footY);
  ctx.fillStyle = '#a7a896';
  ctx.font = `400 ${Math.round(W * 0.0125)}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`mediamendoza.com · ${data.fecha || ''} · ${data.hora || ''}`, W - pad, footY);
  ctx.textAlign = 'left';
}
```

- [ ] **Step 2: Sintaxis válida**

Run: `node --check alertas/renderer.mjs`
Expected: sin output (0).

- [ ] **Step 3: Commit**

```powershell
cd "C:\Users\Miguel\Documents\New project"
git add alertas/renderer.mjs
git commit -m "feat(alertas): renderer canvas de la placa (1:1, 4:5, 9:16)"
```

---

### Task 4: Wiring de la aplicación (`app.mjs`)

**Files:**
- Create: `alertas/app.mjs`

**Interfaces:**
- Consumes: `alertas-core.mjs` (Tarea 1), `renderer.mjs` (Tarea 3), ids del DOM (Tarea 2).
- Produces: comportamiento completo de la app (gate ya resuelto por inline script en `index.html`).

- [ ] **Step 1: Implementar `alertas/app.mjs`**

```js
const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
import { ALERTAS_SYSTEM_PROMPT, normalizeAlertReport, validarEnFuente, buildWhatsAppCaption, emptyReport, normalizeNivel } from './alertas-core.mjs';
import { FORMATS, renderAlertasPlaca } from './renderer.mjs';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const toastEl = $('#toast');
const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(() => toastEl.classList.remove('show'), 2600); };

const hoyCorto = () => new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
const horaCorta = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };

const state = { data: emptyReport(), format: '4:5', logoImg: null };

// ─── Logo Media Mendoza ────────────────────────────────────────
function cargarLogo() {
  const img = new Image();
  img.onload = () => { state.logoImg = img; render(); };
  img.onerror = () => { state.logoImg = null; };
  img.src = '../assets/logo.png';
}

// ─── Formulario ⇄ modelo ───────────────────────────────────────
function setField(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ''; }
function getField(id) { return (document.getElementById(id)?.value || '').trim(); }
const ETIQUETA_ID = { ahora: 'celda-ahora', ruta: 'celda-ruta', siguiente: 'celda-siguiente' };

function poblarFormulario(d) {
  setField('titularInput', d.titular); setField('fuenteInput', d.fuente); setField('fechaInput', d.fecha); setField('horaInput', d.hora);
  const sel = document.getElementById('nivelSelect'); if (sel) sel.value = normalizeNivel(d.nivel);
  setField('direccionInput', d.direccion);
  for (const [etiqueta, prefix] of Object.entries(ETIQUETA_ID)) {
    const c = (d.celdas || []).find((x) => x.etiqueta === etiqueta) || { zonas: '', detalle: '', hacia: '' };
    setField(`${prefix}-zonas`, c.zonas); setField(`${prefix}-detalle`, c.detalle); setField(`${prefix}-hacia`, c.hacia);
  }
  setField('eta-lugar', d.eta?.lugar || ''); setField('eta-detalle', d.eta?.detalle || ''); setField('eta-minutos', d.eta?.minutos ?? '');
  actualizarCaption(d);
}

function recolectarFormulario() {
  const d = { titular: getField('titularInput'), fuente: getField('fuenteInput'), fecha: getField('fechaInput'), hora: getField('horaInput'), nivel: normalizeNivel(getField('nivelSelect')), direccion: getField('direccionInput').toLowerCase(), celdas: [], eta: null };
  for (const [etiqueta, prefix] of Object.entries(ETIQUETA_ID)) {
    const zonas = getField(`${prefix}-zonas`);
    if (zonas) d.celdas.push({ etiqueta, zonas, detalle: getField(`${prefix}-detalle`), hacia: getField(`${prefix}-hacia`).toLowerCase() });
  }
  const lugar = getField('eta-lugar');
  const minutos = Number(getField('eta-minutos'));
  // Sin minutos válidos no se inventa un ETA: la línea/banner se omite (regla editorial).
  if (lugar && Number.isFinite(minutos) && minutos > 0) d.eta = { lugar, detalle: getField('eta-detalle'), minutos };
  return d;
}

// Reescribe el caption solo si sigue intacto el último generado por la app;
// si el redactor lo editó a mano, su edición se respeta.
let lastCaption = '';
function actualizarCaption(d) {
  const captionEl = document.getElementById('captionText');
  if (!captionEl) return;
  const next = buildWhatsAppCaption(d || state.data);
  if (captionEl.value === '' || captionEl.value === lastCaption) captionEl.value = next;
  lastCaption = next;
}

// ─── Render + export ───────────────────────────────────────────
function render() {
  const canvas = document.getElementById('plateCanvas');
  if (!canvas) return;
  const cfg = FORMATS[state.format];
  canvas.width = cfg.width; canvas.height = cfg.height;
  const ctx = canvas.getContext('2d');
  renderAlertasPlaca(ctx, state.data, state.format, state.logoImg);
  actualizarCaption(state.data);
}

function descargarPng() {
  const canvas = document.getElementById('plateCanvas');
  canvas.toBlob((blob) => {
    if (!blob) return toast('No se pudo generar el PNG.');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `alerta-tormentas-${stamp()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
}

async function copiarPng() {
  const canvas = document.getElementById('plateCanvas');
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('PNG copiado.');
  } catch { toast('No se pudo copiar; descargá el PNG.'); }
}

function mostrarError(msg) {
  const el = document.getElementById('errorBanner');
  if (!el) return;
  el.hidden = false;
  el.textContent = msg;
}

// ─── Llamada al worker ──────────────────────────────────────────
async function solicitarEstructura(texto) {
  const resp = await fetch(`${WORKER}/social/generar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt: ALERTAS_SYSTEM_PROMPT, userMsg: texto }),
  });
  const payload = await resp.json().catch(() => null);
  if (!payload) throw new Error('El worker no devolvió JSON.');
  if (!resp.ok || payload?.ok === false) throw new Error(payload?.error || 'El worker rechazó el parte.');
  let result = payload.result;
  if (result === null || result === undefined) throw new Error('El worker no devolvió datos.');
  if (typeof result === 'string') {
    try { result = JSON.parse(result); } catch { throw new Error('La IA no devolvió JSON válido.'); }
  }
  return result;
}

async function generar() {
  const texto = document.getElementById('reporteText').value.trim();
  if (!texto) { toast('Pegá el reporte primero.'); return; }
  const btn = document.getElementById('generarBtn');
  btn.disabled = true;
  document.getElementById('loading').hidden = false;
  document.getElementById('errorBanner').hidden = true;
  try {
    const raw = await solicitarEstructura(texto);
    let data = normalizeAlertReport(raw);
    data = validarEnFuente(data, texto);
    if (!data.fecha) data.fecha = hoyCorto();
    if (!data.hora) data.hora = horaCorta();
    state.data = data;
    poblarFormulario(data);
    render();
  } catch (err) {
    mostrarError(`No se pudo estructurar el parte con IA (${err.message}). Completá a mano y generá igual.`);
    // El form no conserva datos rancios de un parte anterior bajo el banner de error.
    const limpio = { ...emptyReport(), fecha: hoyCorto(), hora: horaCorta() };
    state.data = limpio;
    poblarFormulario(limpio);
    render();
  } finally {
    document.getElementById('loading').hidden = true;
    btn.disabled = false;
  }
}

// ─── Wiring ─────────────────────────────────────────────────────
function syncFromForm() {
  state.data = recolectarFormulario();
  render();
}

document.getElementById('generarBtn').addEventListener('click', generar);
document.getElementById('actualizarBtn').addEventListener('click', syncFromForm);
document.getElementById('descargarPngBtn').addEventListener('click', descargarPng);
document.getElementById('copiarPngBtn').addEventListener('click', copiarPng);
document.getElementById('copiarCaptionBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(document.getElementById('captionText').value); toast('Caption copiado.'); } catch { toast('No se pudo copiar el caption.'); }
});
$$('#formatoToggle [data-formato]').forEach((btn) => btn.addEventListener('click', () => {
  state.format = btn.dataset.formato;
  $$('#formatoToggle [data-formato]').forEach((b) => b.classList.toggle('active', b === btn));
  render();
}));
$$('#alertasForm input, #alertasForm select').forEach((el) => el.addEventListener('input', syncFromForm));

// ─── Init ───────────────────────────────────────────────────────
document.getElementById('reporteText').addEventListener('input', (e) => {
  document.getElementById('generarBtn').disabled = !e.target.value.trim();
});
const initial = { ...emptyReport(), fecha: hoyCorto(), hora: horaCorta() };
state.data = initial;
poblarFormulario(initial);
cargarLogo();
render();
// Re-render cuando Inter termine de cargar (la primera pintura puede caer en fallback Arial).
if (document.fonts?.ready) document.fonts.ready.then(() => render());
document.getElementById('generarBtn').disabled = true;
```

- [ ] **Step 2: Sintaxis válida**

Run: `node --check alertas/app.mjs`
Expected: sin output (0).

- [ ] **Step 3: Commit**

```powershell
cd "C:\Users\Miguel\Documents\New project"
git add alertas/app.mjs
git commit -m "feat(alertas): wiring de generación, formulario, export PNG y caption"
```

---

### Task 5: Verificación End-to-End y entrega

**Files:** ninguno (valida lo creado en Tasks 1–4).

- [ ] **Step 1: Servir el repo y probar el flujo real**

```powershell
cd "C:\Users\Miguel\Documents\New project"
python -m http.server 8123
```

Abrir `http://localhost:8123/alertas/`:
1. `Acceso restringido` → contraseña `tomyjerry2008` → entra.
2. Pegar el parte del Radar San Rafael-AEMSA (partes 1 y 2 del spec) en el textarea.
3. Click **Generar alerta** → aparecen 2 bloques (AFECTANDO AHORA / EN RUTA) con `→ ESTE`, pill amarillo, byline `RADAR SAN RAFAEL-AEMSA · MARCELO PEÑA` y banner rojo `Valle Grande · llegar en …` (o con `llegada en 5–10 min`, según salida de la IA) **solo si el parte lo trae**.
4. Cambiar formato 1:1 / 4:5 / 9:16 → canvas re-renderiza con las medidas exactas (1600×1600, 1350×1688, 1080×1920).
5. **Descargar PNG** → archivo `alerta-tormentas-*.png` visualmente idéntico al preview, sin overflow de texto.
6. **Copiar caption** → texto en portapapeles con el formato `⚡ ALERTA | Media Mendoza`.

- [ ] **Step 2: Camino offline/manual**

Con el worker caído o sin red: click **Generar alerta** → banner rojo "No se pudo estructurar… completá a mano"; rellenar campos a mano; **Actualizar placa** produce PNG igual; caption se actualiza en vivo al tipear.

- [ ] **Step 3: Verificación formal de la suite**

```powershell
cd "C:\Users\Miguel\Documents\New project"
node --check alertas/alertas-core.mjs
node --check alertas/renderer.mjs
node --check alertas/app.mjs
node --test --test-isolation=none shared/editorial-package.test.mjs shared/editorial-taxonomy.test.mjs shared/spinner-contract.test.mjs worker/*.test.mjs placas-v2/*.test.mjs carousel/*.test.mjs reels/*.test.mjs whatsapp/*.test.mjs publicar/*.test.mjs redaccion/*.test.mjs redaccion-v2/*.test.mjs visual-suite/*.test.js video-vertical/*.test.mjs alertas/*.test.mjs
node --check worker/worker.js
```

Expected: tests verdes (incluye los 17 tests de Task 1); `worker/worker.js` sin cambios (`git status` no lo lista).

- [ ] **Step 4: Comprobar que no tocaste archivos ajenos**

Run: `git status --porcelain`
Expected: solo `alertas/`, `docs/superpowers/plans/2026-11-17-alertas-tormentas.md` y (nada más propio); `visual-suite/`, `worker/worker.js`, `.wrangler/` intactos e indesejados.

- [ ] **Step 5: Commit del plan**

```powershell
cd "C:\Users\Miguel\Documents\New project"
git add docs/superpowers/plans/2026-11-17-alertas-tormentas.md
git commit -m "docs: plan de implementación de /alertas/"
```

## Acceptance Criteria

- [ ] `/alertas/` carga tras password y no hay tarjeta en el hub.
- [ ] El parte del Radar San Rafael-AEMSA produce placa renderizada con 2 celdas y ETA detectada solo si está en el texto.
- [ ] Los 3 formatos exportan PNG a sus dimensiones exactas.
- [ ] Caption incluye `⚡ ALERTA | Media Mendoza`, fuentes y solo viñetas reales.
- [ ] `node --test alertas/*.test.mjs` verde; resto de la suite verde; `worker/worker.js` sin modificar.

## Self-Review (para quien ejecuta)

1. **Cobertura del spec:** ruta/sin tarjeta (Task 2), salida 3 tamaños (Tasks 2–4), worker sin cambios (Task 4 STEP 3 idéntico a placas-v2), formulario editable (Task 4), caption WhatsApp (Tasks 1, 4), nivel IA+editable (Tasks 1, 4), bloques dinámicos (Tasks 1, 3), hora del navegador editable (Tasks 2, 4), logo + mediamendoza.com (Tasks 3, 4, cargarLogo), gate (Task 2), honestidad ETA (Tasks 1, 3). Cubierto.
2. **Placeholders:** ninguno; todos los pasos muestran código y comandos.
3. **Consistencia de tipos/firmas:** `renderAlertasPlaca(ctx,data,formatKey,logoImg)`; `normalizeAlertReport(raw)`; `validarEnFuente(data, texto)`; `buildWhatsAppCaption(data)`; `FORMATS[key].width/height`. Coherente entre Tarea 1 y 4.

<!-- PLAN-END -->
