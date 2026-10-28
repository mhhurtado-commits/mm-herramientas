// Fuente de la nota por imagen: se sueltan fotos y se extrae el texto.
// La UI se monta desde acá porque index.html todavía no se puede editar.

export const MAX_IMAGENES = 5;

export function textoParaCuerpo(actual = '', nuevo = '') {
  const previo = String(actual || '').trim();
  const agregado = String(nuevo || '').trim();
  if (!agregado) return previo;
  return previo ? `${previo}\n\n---\n\n${agregado}` : agregado;
}

export function tituloSiFalta(actual = '', sugerido = '') {
  const titulo = String(actual || '').trim();
  if (titulo) return titulo;
  return String(sugerido || '').trim();
}

export function mensajeExtraccion(data = {}) {
  const total = Number(data?.imagenes_procesadas) || 0;
  if (!total) return 'No se pudo extraer texto de las imágenes';
  const errores = Array.isArray(data?.errores) ? data.errores.length : 0;
  const base = total === 1 ? '✓ 1 imagen procesada' : `✓ ${total} imágenes procesadas`;
  return errores ? `${base} · ${errores} con error` : base;
}

const MARCADO = `
  <div class="imagen-drop-zone" id="ref-imagen-zona" style="padding:16px">
    <div class="imagen-drop-zone-icon" style="font-size:1.4rem">📤</div>
    <div class="imagen-drop-zone-text" style="font-size:11px">Arrastrá imágenes acá o <strong>hacé clic para elegir</strong></div>
    <div class="imagen-drop-zone-text" style="font-size:9px;color:var(--dim)">JPG, PNG o WebP · hasta ${MAX_IMAGENES}</div>
  </div>
  <input type="file" id="ref-imagen-input" accept="image/*" multiple style="display:none">
  <div id="ref-imagen-previews" class="imagen-previews"></div>
  <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
    <button type="button" class="mm-btn mm-btn-primary" id="btn-procesar-imagen" disabled style="font-size:11px;padding:7px 14px">
      <span class="mm-spinner" id="spin-procesar-imagen" style="display:none"></span>
      <span id="btn-procesar-imagen-text">Extraer texto</span>
    </button>
    <span id="ref-imagen-status" style="font-size:10px;color:var(--dim)"></span>
  </div>
`;

export function montarFuenteImagen({ documento = document, extraer, aplicar, alCambiar } = {}) {
  if (!documento || documento.getElementById('ref-fuente-img-section')) return null;
  const botonUrl = documento.getElementById('ref-fuente-url');
  const seccionUrl = documento.getElementById('ref-fuente-url-section');
  if (!botonUrl || !seccionUrl || !botonUrl.parentNode || !seccionUrl.parentNode) return null;

  const boton = documento.createElement('button');
  boton.type = 'button';
  boton.className = 'red-subtab';
  boton.id = 'ref-fuente-img';
  boton.textContent = '📷 Imágenes';
  botonUrl.parentNode.insertBefore(boton, botonUrl.nextSibling);
  boton.addEventListener('click', () => { if (typeof alCambiar === 'function') alCambiar('img'); });

  const seccion = documento.createElement('div');
  seccion.id = 'ref-fuente-img-section';
  seccion.style.display = 'none';
  seccion.innerHTML = MARCADO;
  seccionUrl.parentNode.insertBefore(seccion, seccionUrl.nextSibling);

  const zona = documento.getElementById('ref-imagen-zona');
  const input = documento.getElementById('ref-imagen-input');
  const previews = documento.getElementById('ref-imagen-previews');
  const botonProcesar = documento.getElementById('btn-procesar-imagen');
  const textoBoton = documento.getElementById('btn-procesar-imagen-text');
  const spinner = documento.getElementById('spin-procesar-imagen');
  const status = documento.getElementById('ref-imagen-status');

  let archivos = [];

  const decir = (texto, ok = true) => {
    if (!status) return;
    status.textContent = texto;
    status.style.color = ok ? 'var(--dim)' : 'var(--red)';
  };

  function pintar() {
    if (previews) {
      previews.querySelectorAll('img[src^="blob:"]').forEach(img => {
        try { URL.revokeObjectURL(img.src); } catch { /* nada */ }
      });
      previews.innerHTML = '';
      archivos.forEach(archivo => {
        const caja = documento.createElement('div');
        caja.className = 'imagen-preview';
        const img = documento.createElement('img');
        let url = '';
        try {
          if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') url = URL.createObjectURL(archivo);
        } catch { url = ''; }
        if (url) img.src = url;
        img.alt = archivo.name || 'imagen';
        caja.appendChild(img);
        previews.appendChild(caja);
      });
    }
    if (botonProcesar) botonProcesar.disabled = archivos.length === 0;
  }

  function cargar(lista) {
    const validas = [...(lista || [])]
      .filter(archivo => archivo && String(archivo.type || '').startsWith('image/'))
      .slice(0, MAX_IMAGENES);
    archivos = validas;
    pintar();
    if (!validas.length) decir('Sólo imágenes JPG, PNG o WebP', false);
    else decir(`${validas.length} imagen${validas.length === 1 ? '' : 'es'} lista${validas.length === 1 ? '' : 's'}`);
  }

  zona?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', () => cargar(input.files));
  zona?.addEventListener('dragover', evento => { evento.preventDefault(); zona.classList.add('dragover'); });
  zona?.addEventListener('dragleave', () => zona.classList.remove('dragover'));
  zona?.addEventListener('drop', evento => {
    evento.preventDefault();
    zona.classList.remove('dragover');
    cargar(evento.dataTransfer?.files);
  });

  botonProcesar?.addEventListener('click', async () => {
    if (!archivos.length) return;
    botonProcesar.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (textoBoton) textoBoton.textContent = 'Extrayendo...';
    decir('Enviando imágenes…');
    try {
      const data = await extraer(archivos);
      aplicar(data);
      decir(mensajeExtraccion(data), Boolean(data?.imagenes_procesadas));
      archivos = [];
      pintar();
    } catch (err) {
      decir('✗ ' + (err?.message || 'No se pudo extraer el texto'), false);
    } finally {
      if (spinner) spinner.style.display = 'none';
      if (textoBoton) textoBoton.textContent = 'Extraer texto';
      if (botonProcesar) botonProcesar.disabled = archivos.length === 0;
    }
  });

  return { boton, seccion };
}
