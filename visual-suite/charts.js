// ============================================================
// Visual Suite — Módulo de Gráficos (Chart.js)
// ============================================================

let chartInstance = null;
const TIPO_NOMBRE = {
  bar: 'Barras', line: 'Líneas', pie: 'Torta',
  doughnut: 'Donut', radar: 'Radar', polarArea: 'Área Polar'
};

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
          ctx.font = `bold 13px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
        } else {
          ctx.fillStyle = textColor;
          ctx.font = `bold 12px "Inter", sans-serif`;
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

Chart.register(bgPlugin);
Chart.register(labelPlugin);

function initCharts() {
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

  const ctx = document.getElementById('chartCanvas').getContext('2d');

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

  const datasets = [{
    label: title || 'Datos',
    data: values,
    backgroundColor: isPie || isPolar ? colors : colors.map(c => c + '33'),
    borderColor: isPie || isPolar ? '#ffffff' : colors,
    borderWidth: 1,
    pointBackgroundColor: colors,
    pointBorderColor: '#ffffff',
    pointRadius: type === 'line' ? 3 : 0,
    pointHoverRadius: type === 'line' ? 5 : 0,
    fill: type === 'line',
    tension: type === 'line' ? 0.3 : 0,
    hoverBackgroundColor: color2,
    hoverBorderColor: '#ffffff'
  }];

  chartInstance = new Chart(ctx, {
    type,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: !!title,
          text: title,
          color: textPrimary,
          font: { family: "'BebasNeue', sans-serif", size: 20, weight: '600' }
        },
        legend: {
          display: isPie || isPolar || type === 'radar',
          position: 'bottom',
          labels: {
            color: textSecondary,
            font: { size: 12, weight: '500' },
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
            font: { size: 11, weight: '500' },
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
            font: { size: 11, weight: '500' },
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
      responsivePlugin: false,
      animation: {
        duration: 500,
        easing: 'easeInOutQuart'
      }
    }
  });
}

async function generarGraficoConIA() {
  const btn = document.querySelector('#panel-charts .vs-btn-primary + .vs-btn-secondary');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Pensando...'; }

  const rawData = document.getElementById('chartData').value;
  const tipoActual = document.getElementById('chartType').value;

  const prompt = `Sos un asistente de visualización de datos para un diario digital.
Datos crudos del usuario:
${rawData}

Tipo de gráfico actual: ${tipoActual} (${TIPO_NOMBRE[tipoActual]})

Respondé SOLO con JSON sin backticks ni markdown:
{
  "titulo": "título sugerido para el gráfico",
  "tipo_sugerido": "bar|line|pie|doughnut|radar|polarArea",
  "datos_ordenados": [{"etiqueta": "...", "valor": 123}],
  "razon": "breve explicación de por qué este gráfico funciona mejor"
}`;

  const result = await apiPost('/visual/generar', { prompt, datos: rawData });
  if (btn) { btn.disabled = false; btn.textContent = '🤖 Sugerir con IA'; }

  if (result && result.ok) {
    try {
      const parsed = JSON.parse(result.texto);
      if (parsed.titulo) document.getElementById('chartTitle').value = parsed.titulo;
      if (parsed.tipo_sugerido && TIPO_NOMBRE[parsed.tipo_sugerido]) {
        document.getElementById('chartType').value = parsed.tipo_sugerido;
      }
      if (parsed.datos_ordenados) {
        const newData = parsed.datos_ordenados.map(d => `${d.etiqueta}, ${d.valor}`).join('\n');
        document.getElementById('chartData').value = newData;
      }
      cambiarTipoGrafico();
      toast(`IA sugirió: ${parsed.razon || 'gráfico optimizado'}`);
    } catch (e) {
      toast('Error al interpretar sugerencia IA');
    }
  } else {
    toast('No se pudo obtener sugerencia (modo offline)');
  }
}

document.addEventListener('DOMContentLoaded', initCharts);
