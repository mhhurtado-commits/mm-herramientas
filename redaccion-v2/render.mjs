export function escaparHtml(valor = '') {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function htmlTitulares(titulares = [], angulos = []) {
  const items = (Array.isArray(titulares) ? titulares : []).map((titular, i) => `
    <div class="result-card">
      <div class="result-num">Titular ${i + 1}</div>
      <div class="result-text">${escaparHtml(titular)}</div>
      <div class="result-actions">
        <button class="pill accent" data-copiar="${escaparHtml(titular)}">Copiar</button>
      </div>
    </div>`).join('');
  const angulosHtml = (Array.isArray(angulos) ? angulos : []).map(a => `
    <div class="angulo-item">
      <div class="angulo-nombre">${escaparHtml(a?.nombre)}</div>
      <div class="angulo-desc">${escaparHtml(a?.descripcion)}</div>
    </div>`).join('');
  return `<div style="display:flex;flex-direction:column;gap:10px">${items}
    ${angulosHtml ? `<div class="divider"></div><div class="section-label">Ángulos identificados</div>${angulosHtml}` : ''}
  </div>`;
}

export function htmlFuentes(fuentes = []) {
  const validas = (Array.isArray(fuentes) ? fuentes : [])
    .filter(f => /^https?:\/\//i.test(String(f?.url || '')))
    .slice(0, 3);
  if (!validas.length) return '';
  return `<div class="ref-section-label">Fuentes verificadas</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${validas.map(f => `<a href="${escaparHtml(f.url)}" target="_blank" rel="noopener noreferrer" class="pill" style="justify-content:flex-start;text-transform:none">🔗 ${escaparHtml(f.medio || 'Fuente')} — ${escaparHtml(f.titulo || f.url)}</a>`).join('')}
    </div>`;
}

export function htmlNota(nota = {}) {
  const hashtags = (Array.isArray(nota.hashtags) ? nota.hashtags : [])
    .map(h => `<span class="hashtag" data-copiar="${escaparHtml(h)}">${escaparHtml(h)}</span>`)
    .join('');
  return `<div class="ref-box">
    <div class="ref-ia-badge">✦ Reformulada por IA</div>
    <div><div class="ref-section-label">Categoría sugerida</div><span class="ref-categoria">${escaparHtml(nota.categoria || '—')}</span></div>
    <div><div class="ref-section-label">Titular</div><div class="ref-titulo">${escaparHtml(nota.titular)}</div></div>
    <div><div class="ref-section-label">Cuerpo</div><div class="ref-cuerpo" style="white-space:pre-wrap">${escaparHtml(nota.cuerpo)}</div></div>
    ${hashtags ? `<div><div class="ref-section-label">Hashtags</div><div class="hashtags-row">${hashtags}</div></div>` : ''}
  </div>`;
}

export function htmlNotaGuardada(nota = {}) {
  return `<div class="nota-guardada">
    <div class="nota-guardada-titulo">${escaparHtml(nota.titular)}</div>
    <div class="nota-guardada-meta">
      <span class="nota-guardada-cat">${escaparHtml(nota.categoria || 'Sin categoría')}</span>
      <span class="nota-guardada-fecha">${nota.fecha ? new Date(nota.fecha).toLocaleString('es-AR') : ''}</span>
    </div>
    <div class="nota-guardada-actions">
      <button class="pill" data-copiar="${escaparHtml(nota.cuerpo)}">Copiar cuerpo</button>
      <button class="pill" data-borrar-nota="${escaparHtml(nota.id)}">Eliminar</button>
    </div>
  </div>`;
}

export function htmlNoticiaMonitor(noticia = {}) {
  return `<div class="noticia-card">
    <div class="noticia-fuente-row">
      <span class="fuente-tag">${escaparHtml(noticia.nombre || 'Fuente')}</span>
      <span class="noticia-fecha">${escaparHtml(noticia.pubDate || '')}</span>
    </div>
    <div class="noticia-titulo" data-reformular-url="${escaparHtml(noticia.link || '')}">${escaparHtml(noticia.titulo || '')}</div>
    <div class="noticia-acciones">
      <a class="pill" href="${escaparHtml(noticia.link || '#')}" target="_blank" rel="noopener noreferrer">Abrir ↗</a>
      <button class="pill accent" data-reformular-url="${escaparHtml(noticia.link || '')}">Reformular</button>
    </div>
  </div>`;
}
