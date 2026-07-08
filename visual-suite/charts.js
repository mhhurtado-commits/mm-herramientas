// ============================================================
// Visual Suite — Módulo de Gráficos (Chart.js)
// ============================================================

let chartInstance = null;
const TIPO_NOMBRE = {
  bar: 'Barras', line: 'Líneas', pie: 'Torta',
  doughnut: 'Donut', radar: 'Radar', polarArea: 'Área Polar'
};

// Plugin global para fondo del canvas
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

Chart.register(bgPlugin);

function initCharts() {
  actualizarGrafico();
}

function cambiarTipoGrafico() {
  document.getElementById('chartTypeBadge').textContent = TIPO_NOMBRE[document.getElementById('chartType').value] || 'Gráfico';
  actualizarGrafico();
}

function parseChartData(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const labels = [];
  const values = [];
  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      labels.push(parts[0]);
      values.push(parseFloat(parts[1]) || 0);
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

  const alpha = isPie || isPolar ? '0.8' : '0.6';
  const colors = values.map((_, i) => {
    const base = i % 2 === 0 ? color1 : color2;
    if (isPie || isPolar) {
      const hue = (i * 137.5) % 360;
      return `hsl(${hue}, 65%, 55%)`;
    }
    return base;
  });

  const datasets = [{
    label: title || 'Datos',
    data: values,
    backgroundColor: isPie || isPolar ? colors : colors.map(c => c + alpha),
    borderColor: isPie || isPolar ? '#ffffff' : colors,
    borderWidth: isPie || isPolar ? 2 : 2,
    pointBackgroundColor: colors,
    pointBorderColor: '#ffffff',
    pointRadius: type === 'line' ? 4 : 0,
    fill: type === 'line',
    tension: type === 'line' ? 0.3 : 0
  }];

  chartInstance = new Chart(ctx, {
    type,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: !!title,
          text: title,
          color: getComputedStyle(document.body).getPropertyValue('--text').trim(),
          font: { family: "'BebasNeue', sans-serif", size: 20 }
        },
        legend: {
          display: isPie || isPolar || type === 'radar',
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.body).getPropertyValue('--muted').trim(),
            font: { size: 11 }
          }
        },
        customBg: true
      },
      scales: isPie || isPolar ? {} : {
        x: {
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue('--dim').trim(),
            font: { size: 10 }
          },
          grid: { color: getComputedStyle(document.body).getPropertyValue('--line').trim() }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue('--dim').trim(),
            font: { size: 10 }
          },
          grid: { color: getComputedStyle(document.body).getPropertyValue('--line').trim() }
        }
      }
    }
  });
}

// ── IA para sugerir gráfico ──
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
