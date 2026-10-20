import { normalizeEditorialPackage } from '../shared/editorial-package.mjs';

export const ESTADO_KEY = 'mm-publicar-paquete';

export const SALIDAS_SOLICITADAS = ['placa', 'carrusel', 'reel'];

export function construirPayloadPaquete(nota) {
  return {
    nota: esObjeto(nota) ? nota : {},
    salidas: [...SALIDAS_SOLICITADAS],
  };
}

export function prepararEstado(respuesta = {}) {
  const fuente = esObjeto(respuesta) ? respuesta.paquete : {};
  const { ok, package: paquete, errors } = normalizeEditorialPackage(fuente);
  const warnings = Array.isArray(respuesta.warnings) ? respuesta.warnings.filter(Boolean) : [];
  return { ok, package: paquete, errors, warnings, ia_error: respuesta.ia_error || null };
}

export function validarEstado(estado) {
  return Boolean(estado && estado.ok === true && estado.package?.fuente?.url);
}

export function serializarEstado(estado) {
  return JSON.stringify(estado || {});
}

export function deserializarEstado(texto) {
  if (!texto) return null;
  try {
    const guardado = JSON.parse(texto);
    return prepararEstado({
      paquete: guardado?.package,
      warnings: guardado?.warnings,
      ia_error: guardado?.ia_error,
    });
  } catch {
    return null;
  }
}

export async function leerJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function construirResumen(estado) {
  const paquete = esObjeto(estado?.package) ? estado.package : {};
  const fuente = esObjeto(paquete.fuente) ? paquete.fuente : {};
  const editorial = esObjeto(paquete.editorial) ? paquete.editorial : {};
  return {
    titulo: String(editorial.titulo || fuente.titulo_original || ''),
    seccion: String(editorial.seccion || fuente.categoria || ''),
    datosClave: Array.isArray(editorial.datos_clave) ? editorial.datos_clave.length : 0,
    warnings: Array.isArray(estado?.warnings) ? estado.warnings.filter(Boolean) : [],
    ia_error: estado?.ia_error || null,
  };
}

function esObjeto(valor) {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}
