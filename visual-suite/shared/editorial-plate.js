/*
 * Visual Suite · Editorial SVG renderer
 * One self-contained SVG is used for the preview and the exported PNG. This
 * deliberately keeps editorial layouts independent from the legacy canvases.
 */
(function (root) {
  'use strict';

  const EDITORIAL_FORMATS = {
    square: { width: 1600, height: 1600, ratio: '1 / 1' },
    portrait: { width: 1350, height: 1688, ratio: '4 / 5' }
  };
  const PALETTE = {
    ink: '#101d16', paper: '#f4f6ef', green: '#a8d432', lime: '#c7eb67',
    teal: '#17664d', navy: '#10233d', sky: '#66c7dd', muted: '#607068',
    white: '#ffffff', line: '#d6ddd3', coral: '#ed6f5d', gold: '#e6b84a'
  };

  const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const clean = value => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  const clip = (value, max) => {
    const text = clean(value);
    if (text.length <= max) return text;
    const shortened = text.slice(0, Math.max(1, max - 1)).replace(/\s+\S*$/, '').trim();
    return `${shortened || text.slice(0, max - 1)}…`;
  };
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const fmt = value => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(number(value));

  function getFormat(format) { return EDITORIAL_FORMATS[format] || EDITORIAL_FORMATS.square; }
  function getEditorialLayout(format) {
    const frame = getFormat(format);
    const portrait = format === 'portrait';
    const headerH = portrait ? 222 : 214;
    const footerH = portrait ? 94 : 88;
    const gutter = portrait ? 68 : 76;
    return {
      width: frame.width, height: frame.height, gutter,
      header: { top: 0, bottom: headerH, height: headerH },
      content: { top: headerH + (portrait ? 48 : 42), bottom: frame.height - footerH - 34 },
      footer: { top: frame.height - footerH, bottom: frame.height, height: footerH }
    };
  }
  function fitEditorialTitle(value, format) {
    const max = format === 'portrait' ? 38 : 42;
    const text = clip(value || 'Sin título', max);
    const length = text.length;
    const base = format === 'portrait' ? 62 : 68;
    return { text, fontSize: Math.max(54, Math.round(base - Math.max(0, length - 24) * 0.76)) };
  }
  function buildForecastSlots(periods, format) {
    const frame = getFormat(format); const gutter = format === 'portrait' ? 62 : 72;
    const gap = format === 'portrait' ? 18 : 20;
    const count = Math.max(1, periods.length);
    const width = (frame.width - gutter * 2 - gap * (count - 1)) / count;
    return periods.map((period, index) => ({ ...period, x: gutter + index * (width + gap), width }));
  }
  function buildChartGeometry(labels, values, format) {
    const layout = getEditorialLayout(format);
    const W = layout.width, H = layout.height, g = layout.gutter;
    const plot = { x: g + 42, y: layout.content.top + 110, width: W - g * 2 - 78, height: layout.content.bottom - layout.content.top - 182 };
    const min = Math.min(0, ...values.map(number)); const max = Math.max(1, ...values.map(number));
    const range = Math.max(1, max - min);
    const step = labels.length > 1 ? plot.width / (labels.length - 1) : 0;
    const points = values.map((value, index) => ({
      x: plot.x + step * index,
      y: plot.y + plot.height - ((number(value) - min) / range) * plot.height,
      value: number(value), label: labels[index] || ''
    }));
    return { layout, plot, labels: { top: layout.content.top + 12, bottom: plot.y - 20 }, min, max, points };
  }

  function svgDefs(seed) {
    return `<defs>
      <linearGradient id="${seed}-paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#edf2e9"/></linearGradient>
      <linearGradient id="${seed}-green" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bfe55a"/><stop offset="1" stop-color="#75a928"/></linearGradient>
      <linearGradient id="${seed}-dark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101d16"/><stop offset="1" stop-color="#173c2d"/></linearGradient>
      <pattern id="${seed}-dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#a8d432" opacity=".18"/></pattern>
      <filter id="${seed}-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#152417" flood-opacity=".15"/></filter>
    </defs>`;
  }
  function header(model, layout, seed) {
    const title = fitEditorialTitle(model.title, model.format);
    const label = clean(model.section || 'VISUAL') || 'VISUAL';
    return `<rect width="${layout.width}" height="${layout.header.height}" fill="url(#${seed}-dark)"/>
      <rect width="${layout.width}" height="${layout.header.height}" fill="url(#${seed}-dots)"/>
      <rect y="${layout.header.height - 6}" width="${layout.width}" height="6" fill="#a8d432"/>
      <text x="${layout.gutter}" y="62" fill="#a8d432" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="800" letter-spacing="1">MEDIAMENDOZA · ${esc(label)}</text>
      <text x="${layout.gutter}" y="${layout.header.height - 36}" fill="#fff" font-family="DM Serif Display, Georgia, serif" font-size="${title.fontSize}" font-weight="400">${esc(title.text)}</text>
      <g transform="translate(${layout.width - layout.gutter - 312} 34)"><path d="M0 34 C18 4 29 4 34 30 C39 7 56 8 58 34" fill="none" stroke="#a8d432" stroke-width="11" stroke-linecap="round"/><text x="67" y="43" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="34" font-style="italic" font-weight="800">mediamendoza</text><path d="M67 57 H300" stroke="#ffffff" opacity=".45" stroke-width="3"/></g>`;
  }
  function footer(layout, source) {
    const y = layout.footer.top;
    return `<line x1="${layout.gutter}" x2="${layout.width - layout.gutter}" y1="${y + 15}" y2="${y + 15}" stroke="#bfcabf"/>
      <text x="${layout.gutter}" y="${y + 55}" fill="#607068" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="600">${esc(clip(source || 'Mediamendoza · Noticias confiables del sur mendocino', 66))}</text>
      <text x="${layout.width - layout.gutter}" y="${y + 55}" text-anchor="end" fill="#607068" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="700">www.mediamendoza.com</text>`;
  }
  function shell(model, content) {
    const layout = getEditorialLayout(model.format);
    const seed = `vs${String(model.section || 'plate').replace(/\W/g, '')}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" role="img" aria-label="${esc(model.title)}">
      ${svgDefs(seed)}<rect width="${layout.width}" height="${layout.height}" fill="url(#${seed}-paper)"/>
      ${header(model, layout, seed)}${content(layout, seed)}${footer(layout, model.source)}</svg>`;
  }
  function linePath(points) { return points.map((p, index) => `${index ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '); }
  function chartContent(model, type) {
    return (layout, seed) => {
      const labels = (model.labels || []).slice(0, 8).map(label => clip(label, 12));
      const values = (model.values || []).slice(0, 8).map(number);
      const geo = buildChartGeometry(labels, values, model.format);
      const colors = ['#a8d432','#17664d','#66c7dd','#e6b84a','#ed6f5d','#9256d8','#f28d46','#4c7aaa'];
      const W = layout.width;
      const card = `<rect x="${layout.gutter}" y="${layout.content.top}" width="${W - layout.gutter * 2}" height="${layout.content.bottom - layout.content.top}" rx="32" fill="#ffffff" filter="url(#${seed}-shadow)"/>`;
      if (!values.length) return `${card}<text x="${W / 2}" y="${layout.content.top + 200}" text-anchor="middle" font-family="Inter,Arial" font-size="30" fill="#607068">Cargá datos para visualizar el gráfico</text>`;
      if (type === 'pie' || type === 'doughnut' || type === 'polarArea') {
        const total = values.reduce((sum, value) => sum + Math.max(value, 0), 0) || 1;
        let angle = -Math.PI / 2; const cx = W * .43; const cy = layout.content.top + (layout.content.bottom - layout.content.top) * .52; const r = Math.min(W, layout.content.bottom - layout.content.top) * .28;
        const slices = values.map((value, i) => { const end = angle + Math.PI * 2 * Math.max(value, 0) / total; const large = end - angle > Math.PI ? 1 : 0; const p1 = [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]; const p2 = [cx + r * Math.cos(end), cy + r * Math.sin(end)]; const d = `M ${cx} ${cy} L ${p1[0]} ${p1[1]} A ${r} ${r} 0 ${large} 1 ${p2[0]} ${p2[1]} Z`; const item = `<path d="${d}" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="4"/>`; angle = end; return item; }).join('');
        const hole = type === 'doughnut' ? `<circle cx="${cx}" cy="${cy}" r="${r * .48}" fill="#fff"/><text x="${cx}" y="${cy - 8}" text-anchor="middle" font-family="Inter,Arial" font-size="22" font-weight="700" fill="#607068">TOTAL</text><text x="${cx}" y="${cy + 36}" text-anchor="middle" font-family="Inter,Arial" font-size="32" font-weight="800" fill="#101d16">${esc(fmt(total))}</text>` : '';
        const legend = labels.map((label, i) => `<rect x="${W * .69}" y="${layout.content.top + 90 + i * 62}" width="20" height="20" rx="5" fill="${colors[i % colors.length]}"/><text x="${W * .69 + 34}" y="${layout.content.top + 108 + i * 62}" font-family="Inter,Arial" font-size="23" font-weight="700" fill="#26362c">${esc(clip(label, 21))} · ${esc(fmt(values[i]))}</text>`).join('');
        return `${card}${slices}${hole}${legend}`;
      }
      const grid = Array.from({ length: 5 }, (_, i) => { const y = geo.plot.y + geo.plot.height * i / 4; const val = geo.max - (geo.max - geo.min) * i / 4; return `<line x1="${geo.plot.x}" x2="${geo.plot.x + geo.plot.width}" y1="${y}" y2="${y}" stroke="#dfe7db"/><text x="${geo.plot.x - 18}" y="${y + 7}" text-anchor="end" font-family="Inter,Arial" font-size="20" font-weight="600" fill="#607068">${esc(fmt(val))}</text>`; }).join('');
      const labelsMarkup = geo.points.map(p => `<text x="${p.x}" y="${geo.plot.y + geo.plot.height + 44}" text-anchor="middle" font-family="Inter,Arial" font-size="22" font-weight="700" fill="#43554a">${esc(clip(p.label, 10))}</text><text x="${p.x}" y="${geo.labels.bottom}" text-anchor="middle" font-family="Inter,Arial" font-size="25" font-weight="800" fill="#101d16">${esc(fmt(p.value))}</text>`).join('');
      if (type === 'bar') {
        const barW = Math.min(110, geo.plot.width / Math.max(values.length, 1) * .58);
        const bars = geo.points.map((p, i) => { const h = geo.plot.y + geo.plot.height - p.y; return `<rect x="${p.x - barW / 2}" y="${p.y}" width="${barW}" height="${h}" rx="${barW / 2}" fill="url(#${seed}-green)" opacity="${i === values.indexOf(Math.max(...values)) ? 1 : .78}"/>`; }).join('');
        return `${card}${grid}${bars}${labelsMarkup}`;
      }
      const path = linePath(geo.points); const area = `${path} L ${geo.points[geo.points.length - 1].x} ${geo.plot.y + geo.plot.height} L ${geo.points[0].x} ${geo.plot.y + geo.plot.height} Z`;
      const dots = geo.points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="12" fill="#a8d432" stroke="#fff" stroke-width="5"/>`).join('');
      return `${card}${grid}<path d="${area}" fill="#a8d432" opacity=".18"/><path d="${path}" fill="none" stroke="#87b821" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labelsMarkup}`;
    };
  }
  function metricContent(model) {
    return (layout, seed) => {
      const maxItems = model.format === 'portrait' ? 4 : 6;
      const items = (model.items || []).slice(0, maxItems); const columns = model.format === 'portrait' ? 1 : 2;
      const gap = 28; const cardW = (layout.width - layout.gutter * 2 - gap * (columns - 1)) / columns; const rows = Math.max(1, Math.ceil(items.length / columns)); const cardH = Math.max(190, Math.min(380, (layout.content.bottom - layout.content.top - gap * (rows - 1)) / rows));
      return items.map((item, i) => { const x = layout.gutter + (i % columns) * (cardW + gap); const y = layout.content.top + Math.floor(i / columns) * (cardH + gap); const labelY = y + cardH * .27; const valueY = y + cardH * .58; const noteY = y + cardH * .81; const valueSize = Math.min(64, Math.max(42, cardH * .24)); return `<g filter="url(#${seed}-shadow)"><rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="28" fill="#fff"/><rect x="${x}" y="${y}" width="12" height="${cardH}" rx="6" fill="#a8d432"/></g><text x="${x + 42}" y="${labelY}" font-family="Inter,Arial" font-size="28" font-weight="700" fill="#607068">${esc(clip(item.label, 32))}</text><text x="${x + 42}" y="${valueY}" font-family="Inter,Arial" font-size="${valueSize}" font-weight="800" fill="#101d16">${esc(clip(item.value, 18))}</text><text x="${x + 42}" y="${noteY}" font-family="Inter,Arial" font-size="25" font-weight="600" fill="#82ae22">${esc(clip(item.note, 54))}</text>`; }).join('');
    };
  }
  function timelineContent(model) {
    return (layout, seed) => {
      const events = (model.events || []).slice(0, 6); const center = layout.width / 2; const available = layout.content.bottom - layout.content.top; const step = events.length > 1 ? available / (events.length - 1) : 0;
      return `<line x1="${center}" y1="${layout.content.top + 35}" x2="${center}" y2="${layout.content.bottom - 35}" stroke="#a8d432" stroke-width="8"/>${events.map((event, i) => { const y = layout.content.top + step * i; const right = i % 2 === 1; const cardW = layout.width * .39; const x = right ? center + 48 : center - cardW - 48; return `<circle cx="${center}" cy="${y + 92}" r="16" fill="#fff" stroke="#a8d432" stroke-width="8"/><g filter="url(#${seed}-shadow)"><rect x="${x}" y="${y}" width="${cardW}" height="184" rx="26" fill="#fff"/><rect x="${x}" y="${y}" width="10" height="184" rx="5" fill="#a8d432"/></g><text x="${x + 34}" y="${y + 46}" font-family="Inter,Arial" font-size="24" font-weight="800" fill="#94bd26">${esc(clip(event.date || event.fecha, 24))}</text><text x="${x + 34}" y="${y + 94}" font-family="Inter,Arial" font-size="31" font-weight="800" fill="#101d16">${esc(clip(event.title || event.titulo, 34))}</text><text x="${x + 34}" y="${y + 136}" font-family="Inter,Arial" font-size="21" font-weight="500" fill="#607068">${esc(clip(event.description || event.descripcion, 66))}</text>`; }).join('')}`;
    };
  }
  function render(model) {
    const type = model.type || 'chart';
    const content = type === 'metrics' ? metricContent(model) : type === 'timeline' ? timelineContent(model) : chartContent(model, model.chartType || 'bar');
    return shell(model, content);
  }
  function mount(target, model) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) return null;
    node.classList.add('vs-editorial-plate'); node.innerHTML = render(model);
    return node.querySelector('svg');
  }
  async function exportPNG(model) {
    await (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());
    const frame = getFormat(model.format); const svg = render(model);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob);
    try {
      const image = new Image(); await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      const canvas = document.createElement('canvas'); canvas.width = frame.width; canvas.height = frame.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, frame.width, frame.height);
      return await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
    } finally { URL.revokeObjectURL(url); }
  }
  function metricModel(section, title, source, items, format) {
    return { format: ['square', 'portrait'].includes(format) ? format : 'square', section, title, source, type: 'metrics', items };
  }
  function climateModel(data, format) {
    const actual = data?.actual || {};
    const days = Array.isArray(data?.days) ? data.days.slice(0, 4) : [];
    return metricModel('CLIMA', data?.ciudad || 'Pronóstico', `SMN · ${data?.fuente || 'Servicio Meteorológico Nacional'}`,
      [{ label: actual.description || 'Ahora', value: actual.temp != null ? `${actual.temp}°` : '—', note: actual.feelsLike != null ? `Sensación ${actual.feelsLike}°` : 'Datos oficiales' },
        { label: 'Humedad y viento', value: `${actual.humidity ?? '—'}%`, note: actual.wind != null ? `${actual.wind} km/h ${actual.windDirection || ''}` : 'Sin dato de viento' },
        ...days.map(day => ({ label: day.fecha || day.nombre || 'Pronóstico', value: day.min != null || day.max != null ? `${day.min ?? '—'}° / ${day.max ?? '—'}°` : '—', note: (day.periodos || day.periods || []).map(p => p.nombre || p.label).filter(Boolean).slice(0, 2).join(' · ') || 'Pronóstico SMN' }))], format);
  }
  function footballModel(data, matches, format) {
    const items = (matches || data?.partidos || []).slice(0, 6).map(match => ({ label: `${match.hora || '—'} · ${match.competicion || 'Fútbol'}`, value: `${clip(match.local, 16)} vs ${clip(match.visitante, 16)}`, note: match.estado || 'Programado' }));
    return metricModel('FÚTBOL', data?.titulo || 'Partidos de hoy', data?.fuente || 'Mediamendoza · Agenda deportiva', items, format);
  }
  function infographicModel(data, format) {
    const blocks = Array.isArray(data?.bloques) ? data.bloques : [];
    const items = blocks.slice(0, 6).map(block => ({ label: block.etiqueta || block.titulo || block.tipo || 'Dato', value: block.valor || (block.items || []).map(item => item.valor).join(' · ') || '—', note: block.detalle || block.texto || (block.items || []).map(item => item.nombre).join(' · ') }));
    return metricModel('INFOGRAFÍA', data?.titulo || 'Infografía', data?.fuente || 'Mediamendoza', items, format);
  }
  function efemeridesModel(data, format) {
    const items = (data || []).filter(item => !item?._separator).slice(0, 6).map(item => ({ label: item.titulo || item.nombre || item.fecha || 'Efeméride', value: item.anio || item.año || item.fecha || '—', note: item.descripcion || item.detalle || '' }));
    return metricModel('EFEMÉRIDES', 'Efemérides del día', 'Mediamendoza · Archivo histórico', items, format);
  }
  const api = { EDITORIAL_FORMATS, getFormat, getEditorialLayout, fitEditorialTitle, buildForecastSlots, buildChartGeometry, render, mount, exportPNG, metricModel, climateModel, footballModel, infographicModel, efemeridesModel, clean, clip };
  if (typeof module !== 'undefined') module.exports = api;
  root.VS_EditorialPlate = api;
})(typeof window !== 'undefined' ? window : globalThis);
