// ============================================================
// Visual Suite — Módulo de Gráficos (Chart.js)
// ============================================================

let chartInstance = null;
let chartRenderToken = 0;
function normalizarTituloGrafico(value) {
  const title = String(value || '').replace(/\s+/g, ' ').trim();
  if (!title) return 'Gráfico';
  if (title.length <= 48) return title;
  const shortened = title.slice(0, 47).replace(/\s+\S*$/, '').trim();
  return `${shortened}\u2026`;
}

function obtenerPreviewAspectRatio(formato) {
  return ({ square: '1 / 1', landscape: '16 / 9', portrait: '4 / 5', story: '9 / 16' })[formato] || '1 / 1';
}

function obtenerEstiloGrafico(type, count) {
  const points = Math.max(1, Number(count) || 1);
  const isLine = type === 'line';
  const isRadial = type === 'pie' || type === 'doughnut' || type === 'polarArea';
  return {
    fill: isLine,
    borderWidth: isRadial ? 2 : 3,
    borderRadius: type === 'bar' ? 10 : 0,
    pointRadius: isLine ? Math.max(5, Math.min(8, 12 - points / 2)) : 0,
    pointHoverRadius: isLine ? 9 : 0,
    tension: isLine ? 0.34 : 0
  };
}
const TIPO_NOMBRE = {
  bar: 'Barras', line: 'Líneas', pie: 'Torta',
  doughnut: 'Donut', radar: 'Radar', polarArea: 'Área Polar'
};

function calcularGraficoLayout(W, H, formato) {
  const headerH = typeof VS_CanvasHelpers !== 'undefined' && VS_CanvasHelpers.plateHeaderHeight
    ? VS_CanvasHelpers.plateHeaderHeight(W, H) : Math.round(H * 0.15);
  const M = Math.round(Math.min(W, H) * 0.055);
  const contentTop = headerH + Math.round(H * 0.035);
  const footerH = Math.round(H * 0.05);
  const bottom = H - footerH - M;
  const card = { x: M, y: contentTop, w: W - M * 2, h: bottom - contentTop };
  const chartSafeArea = { ...card };
  const inner = Math.round(Math.min(W, H) * 0.025);
  return {
    headerH,
    footerH,
    card,
    chartSafeArea,
    chart: {
      x: chartSafeArea.x + inner,
      y: chartSafeArea.y + inner,
      w: chartSafeArea.w - inner * 2,
      h: chartSafeArea.h - inner * 2
    },
    formato
  };
}

const bgPlugin = {
  id: 'customBg',
  beforeDraw: (chart) => {
    const bg = document.getElementById('chartBgColor').value;
    const ctx = chart.canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, chart.canvas.width, chart.canvas.height);
    ctx.restore();
  }
};

// Plugin para mostrar valores en barras y segmentos
const labelPlugin = {
  id: 'dataLabels',
  afterDraw: (chart) => {
    const ctx = chart.ctx;
    const type = chart.config.type;
    const isPie = type === 'pie' || type === 'doughnut' || type === 'polarArea';
    const textColor = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#000';

    chart.data.datasets.forEach((ds, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((el, j) => {
        const val = ds.data[j];
        if (val === undefined || val === null) return;
        const text = String(val);
        ctx.save();

        if (isPie) {
          const arc = el;
          const angle = (arc.startAngle + arc.endAngle) / 2;
          const radius = arc.outerRadius * 0.65;
          const x = arc.x + Math.cos(angle) * radius;
          const y = arc.y + Math.sin(angle) * radius;
          ctx.fillStyle = '#fff';
          ctx.font = `bold 16px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
        } else {
          ctx.fillStyle = textColor;
          ctx.font = `bold 16px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const x = el.x;
          const y = Math.min(el.y - 4, chart.chartArea.top + 8);
          ctx.fillText(text, x, y);
        }

        ctx.restore();
      });
    });
  }
};

if (typeof Chart !== 'undefined') {
  Chart.register(bgPlugin);
  Chart.register(labelPlugin);
}

function initCharts() {
  const fmt = document.getElementById('chartFormat');
  if (fmt && !fmt.value) fmt.value = 'square';
  actualizarGrafico();
}

function cambiarTipoGrafico() {
  document.getElementById('chartTypeBadge').textContent = TIPO_NOMBRE[document.getElementById('chartType').value] || 'Gráfico';
  actualizarGrafico();
}

// Convierte un texto a número tolerando coma o punto decimal (es-AR / en-US).
// "45,5" -> 45.5 · "1.234,5" -> 1234.5 · "45.5" -> 45.5
function parsearNumero(str) {
  if (str == null) return NaN;
  const s = String(str).trim().replace(/\s/g, '');
  if (!s) return NaN;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  let norm = s;
  if (hasComma && hasDot) {
    // Formato 1.234,5 -> quitar separador de miles (.), coma a punto
    norm = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    // Solo coma -> asumir decimal
    norm = s.replace(',', '.');
  }
  const n = parseFloat(norm);
  return isNaN(n) ? NaN : n;
}

// Separa cada línea en { etiqueta, valor } soportando separadores de campo
// ',', ';' o tabulador, y decimales con ',' o '.' (audiencia es-AR).
function parseChartData(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const labels = [];
  const values = [];

  // Detectar separador dominante en las primeras líneas
  const sample = lines.slice(0, 10).join('\n');
  let sep = ',';
  if (sample.includes('\t')) sep = '\t';
  else if (sample.includes(';') && !sample.includes(',')) sep = ';';

  for (const line of lines) {
    const parts = line.split(sep).map(s => s.trim());
    if (parts.length >= 2) {
      const valStr = parts[parts.length - 1];
      const val = parsearNumero(valStr);
      if (isNaN(val)) continue; // ignorar filas no numéricas (ej. encabezados)
      const label = parts.slice(0, parts.length - 1).join(sep === '\t' ? '\t' : ', ').trim();
      labels.push(label);
      values.push(val);
    }
  }
  return { labels, values };
}

function actualizarGrafico() {
  const type = document.getElementById('chartType').value;
  const title = document.getElementById('chartTitle').value || '';
  const rawData = document.getElementById('chartData').value;
  const color1 = document.getElementById('chartColor1').value;
  const color2 = document.getElementById('chartColor2').value;

  const { labels, values } = parseChartData(rawData);
  if (!labels.length) return;

  const source = document.getElementById('chartCanvas');
  if (!source || typeof Chart === 'undefined') return;
  const formatKey = document.getElementById('chartFormat')?.value || 'square';
  const format = (typeof VS_Formats !== 'undefined' && VS_Formats[formatKey]) || { w: 1600, h: 1600 };
  const sourceLayout = calcularGraficoLayout(format.w, format.h, formatKey);
  source.width = sourceLayout.chartSafeArea.w;
  source.height = sourceLayout.chartSafeArea.h;
  const ctx = source.getContext('2d');

  if (chartInstance) chartInstance.destroy();

  const isPolar = type === 'polarArea';
  const isPie = type === 'pie' || type === 'doughnut';

  // Colores del gráfico: respetan los selectores del usuario (color1/color2)
  const alpha = isPie || isPolar ? '0.8' : '0.6';

  const colors = values.map((_, i) => {
    const base = i % 2 === 0 ? color1 : color2;
    if (isPie || isPolar) {
      const hue = (i * 137.5) % 360;
      return `hsl(${hue}, 65%, 55%)`;
    }
    return base;
  });

  // Variables de tema para texto/rejilla (no alteran el color corporativo)
  const textPrimary = getComputedStyle(document.body).getPropertyValue('--text').trim();
  const textSecondary = getComputedStyle(document.body).getPropertyValue('--muted').trim();
  const gridColor = getComputedStyle(document.body).getPropertyValue('--line').trim();
  const gridSoftColor = getComputedStyle(document.body).getPropertyValue('--line3').trim();

  const style = obtenerEstiloGrafico(type, values.length);
  const datasets = [{
    label: title || 'Datos',
    data: values,
    backgroundColor: isPie || isPolar ? colors : colors.map(c => c + (type === 'line' ? '30' : 'b8')),
    borderColor: isPie || isPolar ? '#ffffff' : colors,
    borderWidth: style.borderWidth,
    borderRadius: style.borderRadius,
    borderSkipped: false,
    pointBackgroundColor: colors,
    pointBorderColor: '#ffffff',
    pointRadius: style.pointRadius,
    pointHoverRadius: style.pointHoverRadius,
    pointBorderWidth: type === 'line' ? 3 : 0,
    fill: style.fill,
    tension: style.tension,
    hoverBackgroundColor: color2,
    hoverBorderColor: '#ffffff'
  }];

  chartInstance = new Chart(ctx, {
    type,
    data: { labels, datasets },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 28, right: 22, bottom: 24, left: 22 }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: { display: false },
        legend: {
          display: isPie || isPolar || type === 'radar',
          position: 'bottom',
          labels: {
            color: textSecondary,
            font: { size: 14, weight: '600' },
            padding: 20,
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.datasets.length === 0) return [];
              const dataset = data.datasets[0];
              const labels = data.labels || [];
              return labels.map((label, i) => {
                // Create custom legend with color dot and text
                const style = chart.ctx.createLinearGradient(0, 0, 60, 0);
                if (isPie || isPolar) {
                  style.addColorStop(0, colors[i]);
                  style.addColorStop(1, colors[i]);
                } else {
                  style.addColorStop(0, colors[Math.min(i, colors.length - 1)]);
                  style.addColorStop(1, colors[Math.min(i, colors.length - 1)]);
                }
                return {
                  text: label,
                  fillStyle: style,
                  strokeStyle: colors[Math.min(i, colors.length - 1)],
                  lineWidth: 3,
                  hidden: false,
                  index: i
                };
              });
            }
          },
          align: 'center',
          fullSize: false,
          maxHeight: 60,
          maxWidth: 200
        },
        datalabels: {
          display: false, // We use custom label plugin in labelPlugin below
          anchor: 'center',
          align: 'center',
          color: '#fff',
          font: { weight: 'bold', size: 14 },
          formatter: function(value) {
            return value;
          }
        }
      },
      scales: isPie || isPolar ? {} : {
        x: {
          ticks: {
            color: textSecondary,
            font: { size: 14, weight: '600' },
            pad: 10,
            maxRotation: 45,
            minRotation: 0
          },
          grid: {
            color: gridColor,
            drawBorder: false,
            tickLength: 4
          },
          border: {
            display: false
          },
          suggestedMin: 0
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textSecondary,
            font: { size: 14, weight: '600' },
            pad: 10,
            callback: function(value) {
              return value.toLocaleString();
            }
          },
          grid: {
            color: gridSoftColor,
            drawBorder: false,
            tickLength: 4
          },
          border: {
            display: false
          }
        }
      },
      animation: {
        duration: 0,
        easing: 'easeInOutQuart'
      }
    }
  });
  renderizarPlacaGrafico();
}

function renderizarPlacaGrafico() {
  const canvas = document.getElementById('chartPlateCanvas');
  if (!canvas || !chartInstance) return;
  const fmtKey = document.getElementById('chartFormat')?.value || 'square';
  const fmt = (typeof VS_Formats !== 'undefined' && VS_Formats[fmtKey]) || { w: 1600, h: 1600 };
  const W = fmt.w, H = fmt.h;
  const layout = calcularGraficoLayout(W, H, fmtKey);
  const preview = document.getElementById('chartPlatePreview');
  if (preview) preview.style.aspectRatio = obtenerPreviewAspectRatio(fmtKey);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const token = ++chartRenderToken;
  const bg = document.getElementById('chartBgColor')?.value || '#ffffff';
  const displayTitle = normalizarTituloGrafico(document.getElementById('chartTitle')?.value || 'Gráfico');

  VS_CanvasHelpers.drawPlateBackground(ctx, W, H, { headerRatio: layout.headerH / H });
  VS_CanvasHelpers.drawPlateHeader(ctx, W, H, 'GRÁFICOS', displayTitle, layout.headerH, {
    titleMaxChars: 48,
    titleMinScale: 0.82,
    titleMaxWidth: W * 0.89
  });
  VS_CanvasHelpers.drawPlateLogo(ctx, W, H);

  const image = new Image();
  image.onload = () => {
    if (token !== chartRenderToken) return;
    ctx.fillStyle = bg;
    ctx.fillRect(layout.chartSafeArea.x, layout.chartSafeArea.y, layout.chartSafeArea.w, layout.chartSafeArea.h);
    ctx.drawImage(image, layout.chartSafeArea.x, layout.chartSafeArea.y, layout.chartSafeArea.w, layout.chartSafeArea.h);
    VS_CanvasHelpers.drawFooter(ctx, W, H, false);
  };
  image.onerror = () => toast('No se pudo renderizar el gráfico');
  image.src = chartInstance.toBase64Image();
}

function construirPromptGrafico(tema) {
  return `INSTRUCCIÓN CRÍTICA: buscá en internet datos reales, actuales y verificables sobre el tema indicado. No inventes cifras. Respondé únicamente JSON válido, sin markdown ni explicaciones.

Tema: "${String(tema || '').trim()}"

Devolvé exactamente esta estructura:
{
  "titulo": "título editorial breve",
  "tipo_sugerido": "bar | line | pie | doughnut | radar | polarArea",
  "datos_ordenados": [{"etiqueta": "etiqueta breve", "valor": 123}],
  "fuente": "fuente consultada",
  "razon": "por qué este tipo representa mejor los datos",
  "tratamiento_visual": {"enfoque": "descripción breve", "indice_destacado": 0, "mostrar_valores": true}
}

Reglas editoriales y visuales:
- El campo "titulo" debe tener como máximo 42 caracteres incluyendo espacios.
- Debe ser corto, informativo y publicable en una placa cuadrada; eliminá fechas, aclaraciones entre paréntesis y frases introductorias innecesarias.
- NO uses puntos suspensivos, cortes, abreviaturas confusas ni títulos truncados.
- Elegí el tipo según la relación: evolución temporal = line, comparación = bar, composición = pie o doughnut, múltiples variables = radar, magnitudes radiales = polarArea.
- En "tratamiento_visual", indicá qué dato o categoría conviene destacar y cómo crear jerarquía visual sin alterar los datos.
- Usá entre 5 y 8 datos, con etiquetas breves y valores numéricos comparables.
- Consultá fuentes oficiales o periodísticas reconocidas y escribí el nombre de la fuente.
- Si no hay datos verificados, devolvé únicamente {"error":"No se encontraron datos verificados para este tema"}.`;
}

function generarPromptChart() {
  const tema = document.getElementById('chartTema').value.trim();
  if (!tema) return toast('Ingresá un tema para generar el prompt');

  const tipos = Object.entries(TIPO_NOMBRE).map(([k, v]) => `${k} (${v})`).join(', ');

  const prompt = `INSTRUCCIÓN CRÍTICA: Usá Google Search para encontrar datos reales y actualizados. NO inventes números. Si no encontrás datos verificados para el tema, indicá que no hay datos disponibles en vez de inventar.

Necesito un JSON puro para pegar en un frontend que genera gráficos.

Tema: "${tema}"

Formato requerido:
{
  "titulo": "título descriptivo del gráfico",
  "tipo_sugerido": "bar | line | pie | doughnut | radar | polarArea",
  "datos_ordenados": [{"etiqueta": "etiqueta", "valor": 123}],
  "fuente": "nombre de la fuente oficial de donde sacaste los datos",
  "razon": "breve explicación de por qué este tipo de gráfico funciona mejor"
}

Tipos disponibles: ${tipos}

Reglas estrictas:
- ANTES de generar el JSON, buscá en Google los datos reales del tema
- Usá SOLO datos de fuentes oficiales: INDEC, Banco Mundial, FMI, ministerios, organismos públicos, medios periodísticos reconocidos
- 5 a 10 datos como máximo
- Incluí el campo "fuente" con el nombre de la fuente consultada
- Si el tema es argentino, buscá en INDEC (indec.gob.ar) o fuentes oficiales argentinas
- Si no encontrás datos verificados, devolvé: {"error": "No se encontraron datos verificados para este tema"}
- NUNCA inventes porcentajes, cifras o estadísticas
- Etiquetas claras y descriptivas
- Elegí el tipo de gráfico que mejor represente los datos
- Respondé SOLO el JSON, sin texto antes ni después, ni bloques de código`;

  const optimizedPrompt = construirPromptGrafico(tema);
  const ta = document.getElementById('chartPrompt');
  if (ta) {
    ta.value = optimizedPrompt;
    toast('✅ Prompt generado. Copialo con el botón y pegalo en Gemini Chat.');
  }
}

function copiarPromptChart() {
  const ta = document.getElementById('chartPrompt');
  VS_Utils.copiarAlPortapapeles(ta?.value, '✅ Prompt copiado al portapapeles');
}

async function cargarJSONdeChat() {
  const ta = document.getElementById('chartJson');
  const text = (ta && ta.value || '').trim();
  if (!text) return toast('Pegá el JSON en el cuadro de arriba');

  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return toast('JSON inválido: ' + e.message); }

  if (parsed.titulo) document.getElementById('chartTitle').value = parsed.titulo;
  if (parsed.tipo_sugerido && TIPO_NOMBRE[parsed.tipo_sugerido]) {
    document.getElementById('chartType').value = parsed.tipo_sugerido;
  }
  if (parsed.datos_ordenados && Array.isArray(parsed.datos_ordenados) && parsed.datos_ordenados.length) {
    const lines = parsed.datos_ordenados.map(d => `${d.etiqueta}, ${d.valor || d.value}`).join('\n');
    document.getElementById('chartData').value = lines;
  }
  cambiarTipoGrafico();
  toast(`✅ Gráfico cargado: ${parsed.razon || 'listo'}`);
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', initCharts);

if (typeof module !== 'undefined') {
  module.exports = { calcularGraficoLayout, parseChartData, parsearNumero, normalizarTituloGrafico, obtenerPreviewAspectRatio, obtenerEstiloGrafico, construirPromptGrafico };
}
