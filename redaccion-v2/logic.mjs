export const WORKER_PRODUCCION = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
export const CLAVE_BORRADOR = 'mm-redaccion-v2-borrador';

export function resolverApiBase({ hostname = '', protocol = '' } = {}) {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:8787';
  return WORKER_PRODUCCION;
}

export function crearEstadoInicial() {
  return {
    tab: 'monitor',
    subtab: 'redactar',
    ideas: '',
    titulo: '',
    contenido: '',
    contexto: '',
    estilo: 'formal',
    origen: null,
    fuentes: [],
    nota: null,
    titulares: [],
    angulos: [],
    imagen: '',
    portadaEleccion: '',
    salud: null,
    cargando: false,
    error: '',
    warnings: [],
    modelo: '',
    latenciaMs: 0,
  };
}

export function validarEntradaReformular({ titulo = '', contenido = '' } = {}) {
  const errors = [];
  if (String(titulo).trim().length < 8) errors.push('titulo_corto');
  if (String(contenido).trim().length < 80) errors.push('cuerpo_corto');
  return { ok: errors.length === 0, errors };
}

export function fuentesSeguras(fuentes = []) {
  const vistas = new Set();
  const salida = [];
  for (const fuente of Array.isArray(fuentes) ? fuentes : []) {
    const url = String(fuente?.url || '').trim();
    if (!/^https?:\/\//i.test(url)) continue;
    const clave = url.replace(/\/$/, '');
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    salida.push({
      titulo: String(fuente?.titulo || '').trim(),
      url,
      medio: String(fuente?.medio || '').trim(),
    });
    if (salida.length === 3) break;
  }
  return salida;
}

// Imágenes de la nota original: sólo http(s), sin repetir y con tope.
export function imagenesSeguras(lista = [], maximo = 8) {
  const vistas = new Set();
  const salida = [];
  for (const item of Array.isArray(lista) ? lista : []) {
    const url = String(item || '').trim();
    if (!/^https?:\/\//i.test(url)) continue;
    const clave = url.replace(/\/+$/, '');
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    salida.push(url);
    if (salida.length >= maximo) break;
  }
  return salida;
}

// Decide qué imagen va de portada: la que eligió el usuario, si no la original
// de la nota, y si no la generada con IA.
export function elegirPortada({ origen = {}, generada = '', eleccion = '' } = {}) {
  const elegida = String(eleccion || '').trim();
  const original = String(origen?.imagen || '').trim();
  const ia = String(generada || '').trim();
  if (/^https?:\/\//i.test(elegida)) {
    return { url: elegida, origen: /^data:/.test(ia) && elegida === ia ? 'ia' : 'original' };
  }
  if (/^https?:\/\//i.test(original)) return { url: original, origen: 'original' };
  if (elegida && /^data:image\//i.test(elegida)) return { url: elegida, origen: 'ia' };
  if (/^data:image\//i.test(ia)) return { url: ia, origen: 'ia' };
  return { url: '', origen: '' };
}

// Las imágenes de otros medios suelen bloquear el hotlink: se muestran por el proxy.
export function urlProxyImagen(url = '', base = WORKER_PRODUCCION) {
  const limpia = String(url || '').trim();
  if (!/^https?:\/\//i.test(limpia)) return limpia;
  return `${base}/?image=${encodeURIComponent(limpia)}`;
}

export function construirPayloadReformular(estado = {}) {
  const origen = estado.origen || {};
  return {
    titulo: String(estado.titulo || '').trim(),
    contenido: String(estado.contenido || '').trim(),
    contexto: String(estado.contexto || '').trim(),
    estilo: String(estado.estilo || 'formal'),
    fuenteUrl: String(origen.url || '').trim(),
    fuenteMedio: String(origen.medio || '').trim(),
    fuenteTitulo: String(origen.titulo || '').trim(),
    fuentes: fuentesSeguras(estado.fuentes),
  };
}

const MENSAJES = {
  respuesta_incompleta: 'La respuesta se cortó por límite de tokens. Probá con un texto más corto.',
  modelo_no_disponible: 'El modelo no está disponible en este momento. Reintentá en unos minutos.',
  sin_api_keys: 'No hay claves de Gemini configuradas.',
  json_invalido: 'La IA devolvió un formato inválido. Reintentá.',
  bloqueado_por_seguridad: 'La IA bloqueó la respuesta por seguridad.',
  validacion: 'La nota no pasó la validación mínima. Revisá el texto original.',
  sin_fuentes_verificadas: 'No se encontraron fuentes verificadas para esta nota.',
  sin_resultados: 'No se encontraron fuentes para este título.',
  rate_limit: 'Demasiadas solicitudes. Esperá un minuto.',
};

export function mensajeError(codigo = '') {
  return MENSAJES[codigo] || `Error: ${codigo || 'desconocido'}`;
}

export function etiquetaModelo({ modelo = '', latenciaMs = 0 } = {}) {
  if (!modelo) return '';
  const segundos = (Number(latenciaMs) || 0) / 1000;
  return segundos > 0 ? `${modelo} · ${segundos.toFixed(1).replace('.', ',')} s` : modelo;
}

export function resumenNota(nota = {}) {
  const cuerpo = String(nota.cuerpo || '');
  return {
    titular: String(nota.titular || ''),
    categoria: String(nota.categoria || ''),
    parrafos: cuerpo.split(/\n\s*\n/).filter(Boolean).length,
    caracteres: cuerpo.replace(/\s/g, '').length,
    hashtags: Array.isArray(nota.hashtags) ? nota.hashtags.length : 0,
  };
}

export function normalizarSalud(salud) {
  if (!salud || typeof salud !== 'object') return { estado: 'sin_datos', texto: 'Sin estado', detalle: '' };
  if (salud.ok && salud.kv && salud.ai && Number(salud.keys) > 0) {
    return { estado: 'ok', texto: 'IA conectada', detalle: etiquetaModelo({ modelo: salud.modelos?.primario }) };
  }
  const faltantes = [];
  if (!salud.kv) faltantes.push('KV');
  if (!salud.ai) faltantes.push('AI');
  if (!Number(salud.keys)) faltantes.push('claves');
  return { estado: 'degradado', texto: 'Degradado', detalle: faltantes.join(', ') };
}

export function normalizarHashtags(valor) {
  const vistos = new Set();
  const salida = [];
  for (const item of Array.isArray(valor) ? valor : []) {
    const limpio = String(item || '').trim().replace(/^#+/, '').replace(/\s+/g, '');
    if (!limpio) continue;
    const etiqueta = '#' + limpio;
    const clave = etiqueta.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(etiqueta);
    if (salida.length === 8) break;
  }
  return salida;
}

export function serializarBorrador(estado = {}) {
  return JSON.stringify({
    ideas: estado.ideas || '',
    subtab: estado.subtab || 'redactar',
    titulo: estado.titulo || '',
    contenido: estado.contenido || '',
    contexto: estado.contexto || '',
    estilo: estado.estilo || 'formal',
    portadaEleccion: estado.portadaEleccion || '',
    origen: estado.origen || null,
    fuentes: fuentesSeguras(estado.fuentes),
    // No persistir la imagen en localStorage: puede superar la cuota de 5 MB.
    nota: estado.nota ? { ...estado.nota, imagen: '' } : null,
  });
}

export function deserializarBorrador(texto) {
  if (!texto) return null;
  try {
    const data = JSON.parse(texto);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export function formatearFechaMonitor(fechaRaw = '') {
  const limpia = String(fechaRaw || '').trim();
  if (!limpia) return '';
  const d = new Date(limpia);
  if (Number.isNaN(d.getTime())) return limpia;
  try {
    return d.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Mendoza',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return d.toLocaleDateString('es-AR');
  }
}
