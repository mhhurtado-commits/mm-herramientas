// Ajustes visuales de la pestaña Reformular.
// Van acá y no en index.html porque ese archivo todavía no se puede editar
// (contiene la contraseña en texto plano). Cuando el bloque entre al HTML,
// estas reglas se mueven allá y este módulo se borra.

export const AJUSTES_VISUALES = `
/* La portada: marco, recorte y crédito. Sin esto la imagen sale a tamaño natural. */
.ref-portada { position: relative; margin: 0 0 8px; border-radius: 8px; overflow: hidden; border: 1px solid var(--line2); background: var(--surface2); }
.ref-portada img { width: 100%; display: block; max-height: 170px; object-fit: cover; }
#ref-img-original .ref-portada img { max-height: 140px; }
.ref-portada-chip { position: absolute; bottom: 6px; right: 6px; background: rgba(0, 0, 0, .72); color: #fff; font-size: 9px; padding: 3px 8px; border-radius: 4px; font-style: normal; }

/* Alternativas como tiras, no como tarjetas grandes. */
.ref-miniaturas { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 6px; }
.ref-miniatura { padding: 0; border: 2px solid var(--line2); border-radius: 6px; overflow: hidden; background: var(--surface2); cursor: pointer; width: 52px; height: 40px; }
.ref-miniatura.activa { border-color: var(--v); }
.ref-miniatura img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* El bloque de imagen no compite con los paneles. */
#ref-imagen-section .red-panel { padding: 12px; gap: 10px; }
#ref-img-original { min-height: 0 !important; }
`;

export function aplicarAjustesVisuales(documento = document) {
  if (!documento || !documento.head) return false;
  if (documento.getElementById('mm-ajustes-redaccion-v2')) return false;
  const estilo = documento.createElement('style');
  estilo.id = 'mm-ajustes-redaccion-v2';
  estilo.textContent = AJUSTES_VISUALES;
  documento.head.appendChild(estilo);
  return true;
}
