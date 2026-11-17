// alertas-core.mjs — modelo del parte meteorológico, prompt IA, validador, caption. Sin DOM.

export const ALERTAS_SYSTEM_PROMPT = `Sos editor de servicio de Media Mendoza. Recibís el parte meteorológico tal cual llega y devolvés JSON válido SIN backticks ni markdown:
{ "titular": "TORMENTAS CON GRANIZO AL ESTE", "fuente": "Radar San Rafael-AEMSA · Marcelo Peña", "hora": "11:00", "nivel": "naranja", "direccion": "este", "celdas": [{ "etiqueta": "ahora", "zonas": "Calle Larga, Atuel Norte y Villa Atuel", "detalle": "lluvia fuerte y granizo", "hacia": "este" }], "eta": { "lugar": "Valle Grande · Embalse", "detalle": "lluvia fuerte y granizo", "minutos": 10 } }

Reglas:
- titular: 2–5 palabras MAYÚSCULAS, el hecho principal, sin punto final.
- fuente: organismo/persona que emite; si no aparece, "Mediamendoza". Sin incluir firma ni ubicación del redactor si no aparece.
- hora: hora de emisión del parte en HH:MM; si no aparece, "".
- nivel: UNO de verde|amarillo|naranja|rojo. Si no se puede inferir, naranja.
- direccion: este|oeste|norte|sur cuando el parte marca desplazamiento; si no hay, "".
- celdas: UN ítem por viñeta del parte (máx. 3). etiqueta: "ahora" si dice "comienza a afectar/ya está", "ruta" si dice "cruza/se desplaza hacia", "siguiente" si dice "más tarde/podría"/o no tiene sección clara. zonas = localidades/calles AFECTADAS texto exacto del parte. detalle = fenómeno (lluvia fuerte / granizo / lluvia). hacia = dirección del ítem o "".
- eta: SOLO si el parte anuncia llegada en MINUTOS a un lugar: { "lugar": ..., "detalle": ..., "minutos": N }. Si no, eta: null.
- PROHIBIDO inventar calles, mezclar datos entre viñetas o crear ETA/dirección que el texto no tenga.
Respondé SOLO JSON.`;

const NIVELES = ['verde', 'amarillo', 'naranja', 'rojo'];
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
const DIRECCIONES = ['este', 'oeste', 'norte', 'sur'];

export function normalizeAlertReport(raw) {
  if (!raw || typeof raw !== 'object') return emptyReport();
  const base = emptyReport();
  const out = {
    titular: limpiaTitulo(raw.titular),
    fuente: limpia(raw.fuente),
    hora: limpia(raw.hora),
    fecha: limpia(raw.fecha),
    nivel: normalizeNivel(raw.nivel),
    direccion: limpia(raw.direccion).toLowerCase(),
    celdas: [],
    eta: null,
  };
  if (!DIRECCIONES.includes(out.direccion)) out.direccion = '';
  const celdas = Array.isArray(raw.celdas) ? raw.celdas.slice(0, 3) : [];
  out.celdas = celdas.map((c) => ({
    etiqueta: ETIQUETAS.has(String(c?.etiqueta || '').toLowerCase()) ? String(c.etiqueta).toLowerCase() : 'ahora',
    zonas: limpia(c?.zonas),
    detalle: limpia(c?.detalle),
    hacia: limpia(c?.hacia).toLowerCase(),
  }));
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
    const zonas = String(c.zonas || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    const presentes = zonas.filter((t) => fuente.includes(canon(t)));
    const zonasFinal = presentes.length ? presentes.join(', ') : 'Mendoza';
    const haciaFinal = c.hacia && fuente.includes(canon(c.hacia)) ? c.hacia : '';
    limpio.celdas.push({ ...c, zonas: zonasFinal, hacia: haciaFinal });
  }
  if (data.eta && fuente.includes(canon(data.eta.lugar))) limpio.eta = data.eta;
  return limpio;
}

export function buildWhatsAppCaption(data) {
  const titulos = { ahora: 'Ahora', ruta: 'En ruta', siguiente: 'Próximo' };
  const lineas = ['⚡ ALERTA | Media Mendoza', data.titular || 'TORMENTAS EN LA ZONA'];
  for (const c of data.celdas || []) {
    if (!c.zonas) continue;
    const dir = c.hacia ? ` → ${String(c.hacia).toUpperCase()}` : '';
    lineas.push(`• ${titulos[c.etiqueta] || 'Zona'}: ${c.zonas}${dir} — ${c.detalle}`);
  }
  if (data.eta) lineas.push(`• ${data.eta.lugar}: llegada en ${data.eta.minutos} min — ${data.eta.detalle}`);
  lineas.push(`Fuente: ${data.fuente || 'Mediamendoza'} · mediamendoza.com`);
  return lineas.join('\n');
}
