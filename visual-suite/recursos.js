/* visual-suite/recursos.js
 * Generación de recursos gráficos para "Publicación Rica"
 * - Iconos SVG vectoriales por categoría (auto desde datos actuales)
 * - Ilustraciones PNG generadas con Canvas (sin dependencias externas)
 * - Descarga individual (SVG / PNG)
 * - Soporta ajuste manual: un prompt opcional se usa como pie/tema en las ilustraciones
 * Expone window.recursos para ser usado desde publicacion.js
 */
(function (global) {
  'use strict';

  var ICON_THEME = {
    'economía': '📈',
    'deportes': '⚽',
    'política': '🗳️',
    'sociedad': '👥',
    'cultura': '🎭',
    'ciencia': '🔬',
    'tecnología': '💡',
    'mapa': '📍',
    'cronologia': '📅',
    'infografia': '🎨'
  };

  function escapeText(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function slug(s) {
    return String(s || 'recurso').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'recurso';
  }

  /* ---- Plantillas SVG ---- */
  function svgIcono(categoria, glyph, label) {
    var g = ICON_THEME[categoria] || glyph || '★';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">' +
      '<defs><style>' +
      '.bg{fill:#a6ce39}.tx{font-family:Inter,Arial,sans-serif;font-size:22px;font-weight:700}' +
      '</style></defs>' +
      '<circle class="bg" cx="24" cy="24" r="22"/>' +
      '<text x="24" y="33" text-anchor="middle" class="tx">' + escapeText(g) + '</text>' +
      (label ? '<title>' + escapeText(label) + '</title>' : '') +
      '</svg>';
  }

  function svgMiniChart(labels, values) {
    var max = Math.max.apply(null, values.map(function (v) { return +v || 0; }).concat([1]));
    var n = labels.length;
    var parts = labels.map(function (lbl, i) {
      var h = ((+values[i] || 0) / max) * 40;
      var x = 6 + i * (88 / n);
      var op = (0.35 + 0.65 * ((+values[i] || 0) / max)).toFixed(2);
      return '<rect x="' + x.toFixed(1) + '" y="' + (44 - h).toFixed(1) + '" width="10" height="' + h.toFixed(1) + '" rx="2" fill="#a6ce39" fill-opacity="' + op + '"/>';
    }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 48" width="120" height="58">' + parts + '</svg>';
  }

  /* ---- Generador de iconos SVG ---- */
  function generarIconosSVG(D) {
    var items = [];
    if (D.chart && D.chart.tipo) {
      var cat = (D.chart.categoria) || 'economía';
      var lbl = D.chart.titulo || (D.chart.labels && D.chart.labels[0]) || 'Gráfico';
      items.push({
        id: 'svg-chart', categoria: cat, tipo: 'icono',
        svg: svgIcono(cat, ICON_THEME['economía'], lbl),
        nombreArchivo: 'icono-grafico-' + slug(lbl) + '.svg'
      });
      if (D.chart.labels && D.chart.labels.length) {
        items.push({
          id: 'svg-chart-mini', categoria: cat, tipo: 'mini',
          svg: svgMiniChart(D.chart.labels, (D.chart.datasets && D.chart.datasets[0] && D.chart.datasets[0].data) || []),
          nombreArchivo: 'mini-grafico-' + slug(lbl) + '.svg'
        });
      }
    }
    if (D.mapa && D.mapa.length) {
      D.mapa.slice(0, 4).forEach(function (m, i) {
        items.push({
          id: 'svg-map-' + i, categoria: 'mapa', tipo: 'icono',
          svg: svgIcono('mapa', '📍', m.title || 'Ubicación'),
          nombreArchivo: 'icono-mapa-' + slug(m.title || ('ub' + i)) + '.svg'
        });
      });
    }
    if (D.timeline && D.timeline.length) {
      items.push({
        id: 'svg-timeline', categoria: 'cronologia', tipo: 'icono',
        svg: svgIcono('cronologia', '📅', 'Cronología (' + D.timeline.length + ')'),
        nombreArchivo: 'icono-cronologia-' + D.timeline.length + '.svg'
      });
    }
    if (D.infografia && D.infografia.lineas && D.infografia.lineas.length) {
      items.push({
        id: 'svg-info', categoria: 'infografia', tipo: 'icono',
        svg: svgIcono('infografia', '🎨', D.infografia.titulo || 'Infografía'),
        nombreArchivo: 'icono-infografia-' + slug(D.infografia.titulo || 'datos') + '.svg'
      });
    }
    return items;
  }

  /* ---- Ilustraciones PNG (Canvas local, sin red) ---- */
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function drawHeader(ctx, w, titulo) {
    ctx.fillStyle = '#16201b';
    roundRect(ctx, 0, 0, w, 90, 0); ctx.fill();
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 86, w, 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px Inter, Arial, sans-serif';
    ctx.fillText('MEDIA MENDOZA', 40, 56);
    if (titulo) {
      ctx.fillStyle = '#16201b';
      ctx.font = '700 26px "DM Serif Display", Georgia, serif';
      ctx.fillText(titulo.slice(0, 42), 40, 140);
    }
  }

  function drawFooter(ctx, w, h, prompt) {
    ctx.fillStyle = '#8c9a90';
    ctx.font = '400 14px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Mediamendoza · Noticias confiables del sur mendocino', 40, h - 28);
    ctx.textAlign = 'right';
    ctx.fillText('www.mediamendoza.com', w - 40, h - 28);
    ctx.textAlign = 'left';
  }
  }

  function pngFromCanvas(c, nombreArchivo) {
    return { id: 'png-' + slug(nombreArchivo), descripcion: nombreArchivo,
      dataUrl: c.toDataURL('image/png'), nombreArchivo: nombreArchivo };
  }

  function generarIlustracionesPNG(D, prompt) {
    var out = [];
    var W = 1000, H = 560;

    // Infografía (tarjeta de datos)
    if (D.infografia && D.infografia.lineas && D.infografia.lineas.length) {
      var c = makeCanvas(W, H); var x = c.getContext('2d');
      var grad = x.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#16201b'); grad.addColorStop(1, '#0a0d12');
      x.fillStyle = grad; x.fillRect(0, 0, W, H);
      x.fillStyle = '#a6ce39'; x.fillRect(0, 0, 10, H);
      x.fillStyle = '#ffffff';
      x.font = '700 34px "DM Serif Display", Georgia, serif';
      x.fillText((D.infografia.titulo || 'Datos clave').slice(0, 40), 50, 80);
      x.font = '600 22px Inter, Arial, sans-serif';
      D.infografia.lineas.slice(0, 5).forEach(function (ln, i) {
        var y = 150 + i * 70;
        x.fillStyle = '#a6ce39'; x.beginPath(); x.arc(64, y - 8, 7, 0, 7); x.fill();
        x.fillStyle = '#e8efe9';
        var txt = ln.length > 70 ? ln.slice(0, 67) + '…' : ln;
        x.fillText(txt, 90, y);
      });
      drawFooter(x, W, H, prompt);
      out.push(pngFromCanvas(c, 'ilustracion-infografia-' + slug(D.infografia.titulo || 'datos') + '.png'));
    }

    // Gráfico (barras)
    if (D.chart && D.chart.labels && D.chart.labels.length) {
      var c2 = makeCanvas(W, H); var g = c2.getContext('2d');
      g.fillStyle = '#f3f5f2'; g.fillRect(0, 0, W, H);
      drawHeader(g, W, D.chart.titulo || 'Gráfico');
      var vals = (D.chart.datasets && D.chart.datasets[0] && D.chart.datasets[0].data) || [];
      var max = Math.max.apply(null, vals.map(function (v) { return +v || 0; }).concat([1]));
      var n = D.chart.labels.length;
      var bx = 90, bw = (W - 180) / n;
      g.font = '600 16px Inter, Arial, sans-serif';
      D.chart.labels.forEach(function (lbl, i) {
        var v = +vals[i] || 0;
        var bh = (v / max) * 280;
        var x0 = bx + i * bw, y0 = 470 - bh;
        g.fillStyle = '#a6ce39'; roundRect(g, x0, y0, bw - 24, bh, 6); g.fill();
        g.fillStyle = '#16201b';
        g.fillText(String(v), x0, y0 - 10);
        g.fillStyle = '#5e6b62';
        var t = String(lbl).slice(0, 10);
        g.fillText(t, x0, 500);
      });
      drawFooter(g, W, H, prompt);
      out.push(pngFromCanvas(c2, 'ilustracion-grafico-' + slug(D.chart.titulo || 'grafico') + '.png'));
    }

    // Mapa (pines sobre fondo estilizado)
    if (D.mapa && D.mapa.length) {
      var c3 = makeCanvas(W, H); var m = c3.getContext('2d');
      m.fillStyle = '#e8efe9'; m.fillRect(0, 0, W, H);
      drawHeader(m, W, 'Ubicaciones');
      m.fillStyle = '#ffffff';
      roundRect(m, 60, 130, W - 120, H - 230, 16); m.fill();
      m.strokeStyle = '#d7e0d8'; m.lineWidth = 2; m.stroke();
      D.mapa.slice(0, 6).forEach(function (mk, i) {
        var px = 140 + (i % 3) * 260;
        var py = 220 + Math.floor(i / 3) * 140;
        m.fillStyle = '#a6ce39';
        m.beginPath(); m.arc(px, py, 16, 0, 7); m.fill();
        m.fillStyle = '#16201b'; m.font = '600 18px Inter, Arial, sans-serif';
        m.fillText((mk.title || 'Ubicación').slice(0, 18), px + 26, py + 6);
      });
      drawFooter(m, W, H, prompt);
      out.push(pngFromCanvas(c3, 'ilustracion-mapa-' + slug((D.mapa[0] && D.mapa[0].title) || 'mapa') + '.png'));
    }

    // Cronología
    if (D.timeline && D.timeline.length) {
      var c4 = makeCanvas(W, H); var t = c4.getContext('2d');
      t.fillStyle = '#ffffff'; t.fillRect(0, 0, W, H);
      drawHeader(t, W, 'Cronología');
      t.strokeStyle = '#a6ce39'; t.lineWidth = 4;
      t.beginPath(); t.moveTo(90, 150); t.lineTo(90, H - 80); t.stroke();
      D.timeline.slice(0, 6).forEach(function (ev, i) {
        var y = 170 + i * 62;
        t.fillStyle = '#a6ce39'; t.beginPath(); t.arc(90, y, 12, 0, 7); t.fill();
        t.fillStyle = '#16201b'; t.font = '700 18px Inter, Arial, sans-serif';
        t.fillText((ev.date || '') + '  ' + (ev.title || '').slice(0, 50), 120, y + 6);
      });
      drawFooter(t, W, H, prompt);
      out.push(pngFromCanvas(c4, 'ilustracion-cronologia-' + D.timeline.length + '.png'));
    }

    return out;
  }

  function descargarBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  }

  function generarPromptPersonalizado(seccion) {
    var prompts = {
      infografia: 'Professional newspaper infographic, clean design, warm colors, highlight data points',
      mapa: 'Modern flat map, minimal borders, palette #a6ce39 and #c9a227, highlight Argentina',
      timeline: 'Timeline graphic with clear icons for each event, white background',
      chart: 'Professional chart with gradient bars, label each value clearly'
    };
    return prompts[seccion] || prompts.infografia;
  }

  global.recursos = {
    generarIconosSVG: generarIconosSVG,
    generarIlustracionesPNG: generarIlustracionesPNG,
    descargarBlob: descargarBlob,
    generarPromptPersonalizado: generarPromptPersonalizado,
    slug: slug
  };
})(typeof window !== 'undefined' ? window : this);
