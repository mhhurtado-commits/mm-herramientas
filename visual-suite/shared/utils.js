// ============================================================
// Visual Suite — Utilidades Compartidas
// ============================================================

const VS_Utils = {
  // ── HTML Escaping ──
  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  },

  // ── Hex to RGBA ──
  hexToRgba(hex, alpha) {
    const h = String(hex).replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  },

  // ── Clipboard Copy ──
  copiarAlPortapapeles(texto, mensajeExito) {
    if (!texto || !texto.trim()) return toast('No hay contenido para copiar');
    try {
      navigator.clipboard?.writeText(texto);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast(mensajeExito || '✅ Copiado al portapapeles');
  },

  // ── Canvas Text Wrapping ──
  wrapText(ctx, text, maxW, maxLines) {
    if (!text || maxW <= 0) return [];
    const words = String(text).split(/\s+/).filter(w => w.length > 0);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (cur && ctx.measureText(test).width > maxW) {
        lines.push(cur);
        cur = w;
        if (maxLines && lines.length >= maxLines - 1) break;
      } else {
        cur = test;
      }
    }
    if (cur && (!maxLines || lines.length < maxLines)) lines.push(cur);
    if (lines.length) {
      const usedWords = lines.join(' ').split(/\s+/).length;
      if (usedWords < words.length && lines.length) {
        let last = lines[lines.length - 1];
        lines[lines.length - 1] = last.length > 3 ? last.slice(0, -1) + '…' : last;
      }
    }
    return lines.filter(l => l.trim().length > 0);
  },

  // ── Canvas Dot Grid ──
  drawDotGrid(ctx, W, H, color, spacing, radius) {
    ctx.fillStyle = color;
    const r = radius || 1.2;
    for (let x = spacing; x < W; x += spacing) {
      for (let y = spacing; y < H; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  // ── Canvas Data Bar ──
  drawDataBar(ctx, x, y, w, h, pct, color) {
    const r = h / 2;
    ctx.fillStyle = VS_Utils.hexToRgba(color, 0.15);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.fillStyle = VS_Utils.hexToRgba(color, 0.85);
    ctx.beginPath();
    ctx.roundRect(x, y, Math.min(w, w * pct), h, r);
    ctx.fill();
  },

  // ── Split "Label: Value" ──
  splitLinea(line) {
    const idx = line.indexOf(':');
    if (idx > 0 && idx < line.length - 1) {
      return { label: line.slice(0, idx + 1), value: line.slice(idx + 1).trim(), hasColon: true };
    }
    return { label: '', value: line, hasColon: false };
  },

  // ── Draw Logo on Canvas ──
  dibujarLogo(ctx, W, H, overrides) {
    const ls = window.logoState;
    if (!ls || !ls.loaded || !ls.visible || !ls.img) return;
    const o = overrides || {};
    const lx = (o.x != null ? o.x : ls.x) * W;
    const ly = (o.y != null ? o.y : ls.y) * H;
    const lw = (o.w != null ? o.w : ls.w) * W;
    const ar = ls.ar || (ls.img.naturalHeight / ls.img.naturalWidth);
    const lh = lw * ar;
    ctx.drawImage(ls.img, lx, ly, lw, lh);
  },

  // ── Export Canvas to PNG (High-Res) ──
  async exportCanvasToPNG(canvas, renderFn, nombreBase, scale) {
    await document.fonts.ready;
    const s = scale || 3;
    const ow = canvas.width, oh = canvas.height;
    canvas.width = ow * s;
    canvas.height = oh * s;
    const ctx = canvas.getContext('2d');
    ctx.scale(s, s);
    renderFn(ctx, ow, oh);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      mostrarExportPreview(url, nombreBase);
      canvas.width = ow;
      canvas.height = oh;
    }, 'image/png', 1);
  },

  // ── Detect emoji from text (merges infographics + timeline logic) ──
  detectarEmoji(texto) {
    const t = (texto || '').toLowerCase();
    if (t.includes('⚽') || t.includes('gol') || t.includes('fútbol') || t.includes('mundial') || t.includes('messi')) return '⚽';
    if (t.includes('$') || t.includes('peso') || t.includes('dólar') || t.includes('inflación') || t.includes('%')) return '💰';
    if (t.includes('📈') || t.includes('ipc') || t.includes('economía') || t.includes('pbi') || t.includes('precio')) return '📈';
    if (t.includes('elección') || t.includes('presidente') || t.includes('gobierno') || t.includes('ley')) return '🏛';
    if (t.includes('año') || t.includes('fecha') || t.match(/^\d{4}/)) return '📅';
    if (t.includes('persona') || t.includes('habitante') || t.includes('población')) return '👥';
    if (t.includes('argentina') || t.includes('mendoza') || t.includes('país') || t.includes('provincia')) return '📍';
    if (t.includes('total') || t.includes('suma') || t.includes('acumulado')) return '📊';
    if (t.includes('copa') || t.includes('título') || t.includes('campeón') || t.includes('medalla')) return '🏆';
    if (t.includes('acuerdo') || t.includes('tratado') || t.includes('paz') || t.includes('cumbre')) return '🤝';
    if (t.includes('terremoto') || t.includes('inundación') || t.includes('clima') || t.includes('temporal')) return '🌊';
    if (t.includes('vacuna') || t.includes('salud') || t.includes('hospital') || t.includes('pandemia')) return '🏥';
    if (t.includes('cine') || t.includes('música') || t.includes('concierto') || t.includes('show')) return '🎭';
    if (t.includes('premio') || t.includes('reconocimiento') || t.includes('galardón')) return '🎖';
    if (t.includes('n°') || t.includes('número') || t.includes('ranking') || t.includes('puesto')) return '#️⃣';
    return '▸';
  },

  // ── Load JSON from file input ──
  cargarArchivoJSON(input, targetTextareaId, parseFn) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const ta = document.getElementById(targetTextareaId);
      if (ta) ta.value = e.target.result;
      parseFn();
    };
    reader.onerror = () => toast('No se pudo leer el archivo');
    reader.readAsText(file);
  }
};

// Expose globally
window.VS_Utils = VS_Utils;
