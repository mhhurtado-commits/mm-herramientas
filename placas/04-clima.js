// ════════════════════════════════════════════════════════════════════
// MÓDULO CLIMA - PLACAS DINÁMICAS
// API: Open-Meteo (gratuita, sin API key)
// ════════════════════════════════════════════════════════════════════

// Función para obtener fondo dinámico basado en clima y hora del día (estilo widget Android vibrante)
function getFondoDinamico(esDia, codigoClima) {
  const fondos = {
    // DÍA - Gradientes vibrantes estilo widget Android
    diaDespejado: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#1E88E5');
        g.addColorStop(0.5, '#42A5F5');
        g.addColorStop(1, '#64B5F6');
        return g;
      },
      sol: true
    },
    diaParcial: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#5C9CE5');
        g.addColorStop(0.5, '#7EB3E8');
        g.addColorStop(1, '#A5CAE8');
        return g;
      },
      sol: true,
      nube: true
    },
    diaNublado: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#607D8B');
        g.addColorStop(0.5, '#78909C');
        g.addColorStop(1, '#90A4AE');
        return g;
      },
      nube: true
    },
    diaLluvia: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#455A64');
        g.addColorStop(0.5, '#546E7A');
        g.addColorStop(1, '#607D8B');
        return g;
      },
      lluvia: true
    },
    diaLluviaFuerte: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#37474F');
        g.addColorStop(0.5, '#455A64');
        g.addColorStop(1, '#546E7A');
        return g;
      },
      lluvia: true
    },
    diaTormenta: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#2C3E50');
        g.addColorStop(0.5, '#34495E');
        g.addColorStop(1, '#4A5568');
        return g;
      },
      tormenta: true
    },
    diaNieve: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#B0BEC5');
        g.addColorStop(0.5, '#CFD8DC');
        g.addColorStop(1, '#ECEFF1');
        return g;
      },
      nieve: true
    },
    diaNiebla: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#90A4AE');
        g.addColorStop(0.5, '#B0BEC5');
        g.addColorStop(1, '#CFD8DC');
        return g;
      },
      niebla: true
    },
    
    // NOCHE - Gradientes oscuros vibrantes estilo widget Android
    nocheDespejado: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0D1B2A');
        g.addColorStop(0.3, '#1B263B');
        g.addColorStop(0.6, '#2C3E50');
        g.addColorStop(1, '#34495E');
        return g;
      },
      luna: true
    },
    nocheParcial: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#1A1A2E');
        g.addColorStop(0.4, '#2D3047');
        g.addColorStop(1, '#3D405B');
        return g;
      },
      luna: true,
      nube: true
    },
    nocheNublado: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#16213E');
        g.addColorStop(0.5, '#1F2A44');
        g.addColorStop(1, '#2A3B55');
        return g;
      },
      nube: true
    },
    nocheLluvia: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0F1C2E');
        g.addColorStop(0.4, '#1A2D42');
        g.addColorStop(1, '#243B55');
        return g;
      },
      lluvia: true
    },
    nocheTormenta: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0A0A14');
        g.addColorStop(0.4, '#151525');
        g.addColorStop(1, '#1F1F35');
        return g;
      },
      tormenta: true
    },
    nocheNieve: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#37474F');
        g.addColorStop(0.5, '#455A64');
        g.addColorStop(1, '#546E7A');
        return g;
      },
      nieve: true
    },
    nocheNiebla: {
      grad: (ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#2C3E50');
        g.addColorStop(0.5, '#34495E');
        g.addColorStop(1, '#3D4F61');
        return g;
      },
      niebla: true
    }
  };
  
  // Determinar tipo de clima
  let tipoClima = 'despejado';
  if (codigoClima === 0) tipoClima = 'despejado';
  else if (codigoClima === 1 || codigoClima === 2) tipoClima = 'parcial';
  else if (codigoClima === 3) tipoClima = 'nublado';
  else if (codigoClima === 45 || codigoClima === 48) tipoClima = 'niebla';
  else if (codigoClima >= 51 && codigoClima <= 57) tipoClima = 'lluvia';
  else if (codigoClima >= 61 && codigoClima <= 67) tipoClima = 'lluvia';
  else if (codigoClima >= 71 && codigoClima <= 77) tipoClima = 'nieve';
  else if (codigoClima >= 80 && codigoClima <= 82) tipoClima = 'lluviaFuerte';
  else if (codigoClima >= 85 && codigoClima <= 86) tipoClima = 'nieve';
  else if (codigoClima >= 95) tipoClima = 'tormenta';
  else if (codigoClima >= 80) tipoClima = 'lluviaFuerte';
  
  const clave = (esDia ? 'dia' : 'noche') + tipoClima.charAt(0).toUpperCase() + tipoClima.slice(1);
  return fondos[clave] || fondos[(esDia ? 'dia' : 'noche') + 'Despejado'];
}

// Función para dibujar fondo dinámico con efectos visuales
function dibujarFondoDinamico(ctx, W, H, esDia, codigoClima) {
  const config = getFondoDinamico(esDia, codigoClima);
  
  // Aplicar gradiente base
  ctx.fillStyle = config.grad(ctx, W, H);
  ctx.fillRect(0, 0, W, H);
  
  // Efectos adicionales según el clima
  if (config.sol) {
    // Sol radiante (esquina superior derecha)
    const solX = W * 0.85;
    const solY = H * 0.12;
    const solR = Math.min(W, H) * 0.08;
    
    // Halo del sol
    const halo = ctx.createRadialGradient(solX, solY, solR * 0.5, solX, solY, solR * 3);
    halo.addColorStop(0, 'rgba(255, 235, 59, 0.3)');
    halo.addColorStop(0.5, 'rgba(255, 235, 59, 0.1)');
    halo.addColorStop(1, 'rgba(255, 235, 59, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    
    // Núcleo del sol
    ctx.fillStyle = '#FFD54F';
    ctx.shadowColor = '#FFD54F';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(solX, solY, solR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  if (config.luna) {
    // Luna creciente (esquina superior derecha)
    const lunaX = W * 0.85;
    const lunaY = H * 0.12;
    const lunaR = Math.min(W, H) * 0.05;
    
    // Halo de luna
    const halo = ctx.createRadialGradient(lunaX, lunaY, lunaR * 0.5, lunaX, lunaY, lunaR * 4);
    halo.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    
    // Luna
    ctx.fillStyle = '#E8EAF6';
    ctx.shadowColor = '#C5CAE9';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(lunaX, lunaY, lunaR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Estrellas
    const estrellas = [
      { x: 0.15, y: 0.1, s: 2 },
      { x: 0.25, y: 0.2, s: 1.5 },
      { x: 0.08, y: 0.25, s: 2.5 },
      { x: 0.35, y: 0.08, s: 1 },
      { x: 0.45, y: 0.15, s: 2 },
      { x: 0.12, y: 0.35, s: 1.5 },
      { x: 0.55, y: 0.25, s: 1 },
      { x: 0.65, y: 0.1, s: 2 },
    ];
    
    ctx.fillStyle = '#FFFFFF';
    estrellas.forEach(e => {
      ctx.beginPath();
      ctx.arc(W * e.x, H * e.y, lunaR * e.s * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  if (config.nube) {
    // Nubes decorativas sutiles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    const nubes = [
      { x: 0.1, y: 0.08, w: W * 0.12, h: H * 0.04 },
      { x: 0.3, y: 0.15, w: W * 0.08, h: H * 0.03 },
      { x: 0.6, y: 0.05, w: W * 0.1, h: H * 0.035 },
    ];
    nubes.forEach(n => {
      ctx.beginPath();
      ctx.ellipse(W * n.x + n.w/2, H * n.y + n.h/2, n.w/2, n.h/2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  if (config.lluvia) {
    // Líneas de lluvia sutiles
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H * 0.6;
      const len = 10 + Math.random() * 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + len);
      ctx.stroke();
    }
  }
  
  if (config.nieve) {
    // Copos de nieve sutiles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H * 0.7;
      const r = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  if (config.tormenta) {
    // Efecto de tormenta más dramático
    ctx.fillStyle = 'rgba(50, 30, 80, 0.3)';
    ctx.fillRect(0, 0, W, H);
    
    // Rayos ocasionales
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const x = W * (0.2 + Math.random() * 0.6);
      const y = 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 20, y + H * 0.15);
      ctx.lineTo(x + 10, y + H * 0.15);
      ctx.lineTo(x - 10, y + H * 0.35);
      ctx.stroke();
    }
  }
}

// Variables de estado para el clima
let climaData = null;
let climaCiudad = 'San Rafael'; // Ciudad por defecto
let climaLoading = false;
let climaAlerta = ''; // Alerta manual
let climaMostrarActual = true; // Mostrar datos actuales
let climaMostrarPronostico = true; // Mostrar pronóstico extendido
let climaCiudadesMultiples = []; // Para múltiples ciudades [{nombre, data}, ...]
let climaTipoPlaca = 'combinado'; // 'combinado' (nuevo), 'extendido' o 'diario'

// Asegurar que la variable esté disponible globalmente
window.climaTipoPlaca = climaTipoPlaca;
window.climaCiudad = climaCiudad;
window.climaAlerta = climaAlerta;
window.climaMostrarActual = climaMostrarActual;
window.climaMostrarPronostico = climaMostrarPronostico;
window.climaCiudadesMultiples = climaCiudadesMultiples;
window.climaData = climaData;
window.climaLoading = climaLoading;

// Mapeo de códigos WMO a descripciones en español
const WMO_CODES = {
  0: { desc: 'Despejado', type: 'sun' },
  1: { desc: 'Mayormente despejado', type: 'sun-cloud' },
  2: { desc: 'Parcialmente nublado', type: 'sun-cloud' },
  3: { desc: 'Nublado', type: 'cloud' },
  45: { desc: 'Niebla', type: 'fog' },
  48: { desc: 'Niebla escarchada', type: 'fog' },
  51: { desc: 'Llovizna ligera', type: 'rain-light' },
  53: { desc: 'Llovizna moderada', type: 'rain-light' },
  55: { desc: 'Llovizna densa', type: 'rain' },
  61: { desc: 'Lluvia ligera', type: 'rain' },
  63: { desc: 'Lluvia moderada', type: 'rain' },
  65: { desc: 'Lluvia fuerte', type: 'rain-heavy' },
  71: { desc: 'Nieve ligera', type: 'snow' },
  73: { desc: 'Nieve moderada', type: 'snow' },
  75: { desc: 'Nieve fuerte', type: 'snow-heavy' },
  80: { desc: 'Chubascos ligeros', type: 'rain-light' },
  81: { desc: 'Chubascos moderados', type: 'rain' },
  82: { desc: 'Chubascos violentos', type: 'rain-heavy' },
  95: { desc: 'Tormenta eléctrica', type: 'storm' },
  96: { desc: 'Tormenta con granizo ligero', type: 'storm' },
  99: { desc: 'Tormenta con granizo fuerte', type: 'storm' }
};

// Dibujar iconos de clima profesionales en el canvas
function dibujarIconoClima(ctx, x, y, size, type) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 100;
  ctx.scale(scale, scale);
  
  switch(type) {
    case 'sun':
      // Sol brillante
      ctx.fillStyle = '#FFD93D';
      ctx.shadowColor = '#FFD93D';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Rayos del sol
      ctx.strokeStyle = '#FFD93D';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for(let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 32, Math.sin(angle) * 32);
        ctx.lineTo(Math.cos(angle) * 45, Math.sin(angle) * 45);
        ctx.stroke();
      }
      break;
      
    case 'sun-cloud':
      // Nube
      ctx.fillStyle = '#E8E8E8';
      ctx.beginPath();
      ctx.arc(-15, 10, 20, 0, Math.PI * 2);
      ctx.arc(10, 5, 25, 0, Math.PI * 2);
      ctx.arc(30, 15, 18, 0, Math.PI * 2);
      ctx.fill();
      
      // Sol detrás
      ctx.fillStyle = '#FFD93D';
      ctx.shadowColor = '#FFD93D';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(-25, -15, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
      
    case 'cloud':
      // Nube
      ctx.fillStyle = '#B8C4CE';
      ctx.beginPath();
      ctx.arc(-20, 5, 25, 0, Math.PI * 2);
      ctx.arc(5, 0, 30, 0, Math.PI * 2);
      ctx.arc(30, 10, 22, 0, Math.PI * 2);
      ctx.fill();
      
      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.arc(-20, 15, 20, 0, Math.PI * 2);
      ctx.arc(5, 12, 25, 0, Math.PI * 2);
      ctx.arc(25, 18, 18, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'fog':
      // Niebla con líneas
      ctx.strokeStyle = 'rgba(200,200,200,0.8)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      for(let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-40, i * 12);
        ctx.lineTo(40, i * 12);
        ctx.stroke();
      }
      break;
      
    case 'rain-light':
      // Nube
      ctx.fillStyle = '#9CA3AF';
      ctx.beginPath();
      ctx.arc(-15, 0, 22, 0, Math.PI * 2);
      ctx.arc(8, -5, 28, 0, Math.PI * 2);
      ctx.arc(28, 5, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Gotas de lluvia
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for(let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 15, 20);
        ctx.lineTo(i * 15 - 5, 35);
        ctx.stroke();
      }
      break;
      
    case 'rain':
      // Nube más oscura
      ctx.fillStyle = '#6B7280';
      ctx.beginPath();
      ctx.arc(-15, 0, 22, 0, Math.PI * 2);
      ctx.arc(8, -5, 28, 0, Math.PI * 2);
      ctx.arc(28, 5, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Más gotas
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for(let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 12, 20);
        ctx.lineTo(i * 12 - 5, 38);
        ctx.stroke();
      }
      break;
      
    case 'rain-heavy':
      // Nube oscura
      ctx.fillStyle = '#4B5563';
      ctx.beginPath();
      ctx.arc(-15, 0, 22, 0, Math.PI * 2);
      ctx.arc(8, -5, 28, 0, Math.PI * 2);
      ctx.arc(28, 5, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Muchas gotas
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for(let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 10, 20);
        ctx.lineTo(i * 10 - 6, 40);
        ctx.stroke();
      }
      break;
      
    case 'snow':
      // Nube
      ctx.fillStyle = '#9CA3AF';
      ctx.beginPath();
      ctx.arc(-15, -5, 22, 0, Math.PI * 2);
      ctx.arc(8, -10, 28, 0, Math.PI * 2);
      ctx.arc(28, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Copos de nieve
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 5;
      for(let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(i * 15, 25, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      break;
      
    case 'snow-heavy':
      // Nube oscura
      ctx.fillStyle = '#6B7280';
      ctx.beginPath();
      ctx.arc(-15, -5, 22, 0, Math.PI * 2);
      ctx.arc(8, -10, 28, 0, Math.PI * 2);
      ctx.arc(28, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Muchos copos
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 5;
      for(let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(i * 12, 25, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(i * 12 + 6, 38, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      break;
      
    case 'storm':
      // Nube oscura
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.arc(-15, -5, 22, 0, Math.PI * 2);
      ctx.arc(8, -10, 28, 0, Math.PI * 2);
      ctx.arc(28, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Rayo
      ctx.fillStyle = '#FBBF24';
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(5, 15);
      ctx.lineTo(-5, 30);
      ctx.lineTo(0, 30);
      ctx.lineTo(-8, 45);
      ctx.lineTo(10, 25);
      ctx.lineTo(3, 25);
      ctx.lineTo(8, 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Gotas
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(15, 35);
      ctx.stroke();
      break;
  }
  
  ctx.restore();
}

// Coordenadas de ciudades de Mendoza (prioridad sur de Mendoza)
const CIUDADES_ARG = {
  // Sur de Mendoza (prioridad)
  'San Rafael': { lat: -34.6185, lon: -68.3295 },
  'General Alvear': { lat: -34.9333, lon: -67.7167 },
  'Malargüe': { lat: -35.5019, lon: -69.5875 },
  // Resto de la provincia
  'Mendoza': { lat: -32.8895, lon: -68.8458 },
  'San Juan': { lat: -31.5375, lon: -68.5364 },
  'San Luis': { lat: -33.3013, lon: -66.3366 },
  'Neuquén': { lat: -38.9516, lon: -68.0591 }
};

// Actualizar estado visual de la UI de clima
function actualizarUIEstadoClima() {
  const btn = document.getElementById('btn-actualizar-clima');
  if (btn) {
    btn.textContent = climaLoading ? '⏳ Cargando...' : '🔄 Actualizar';
    btn.disabled = climaLoading;
  }
  // Actualizar variable global
  window.climaLoading = climaLoading;
}

// Agregar ciudad extra a la lista
async function agregarCiudadExtra() {
  const select = document.getElementById('selClimaCiudadExtra');
  const ciudad = select.value;
  
  if (!ciudad) return;
  
  // Verificar si ya está en la lista
  if (climaCiudadesMultiples.find(c => c.nombre === ciudad)) {
    mostrarToast('Esta ciudad ya está en la lista');
    return;
  }
  
  // Verificar si es la ciudad principal
  if (ciudad === climaCiudad) {
    mostrarToast('Esta ciudad ya es la principal');
    return;
  }
  
  try {
    const coords = CIUDADES_ARG[ciudad];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&timezone=America/Argentina/Mendoza`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    climaCiudadesMultiples.push({
      nombre: ciudad,
      actual: {
        temp: Math.round(data.current.temperature_2m),
        codigo: data.current.weather_code,
        tipo: WMO_CODES[data.current.weather_code]?.type || 'sun'
      }
    });
    
    // Actualizar variable global
    window.climaCiudadesMultiples = climaCiudadesMultiples;
    
    actualizarListaCiudadesExtra();
    render();
    mostrarToast(`${ciudad} agregada`);
    
  } catch (error) {
    console.error('Error al agregar ciudad:', error);
    mostrarToast('Error al agregar ciudad');
  }
  
  select.value = '';
}

// Eliminar ciudad extra de la lista
function eliminarCiudadExtra(index) {
  climaCiudadesMultiples.splice(index, 1);
  
  // Actualizar variable global
  window.climaCiudadesMultiples = climaCiudadesMultiples;
  
  actualizarListaCiudadesExtra();
  render();
}

// Obtener datos del clima desde Open-Meteo API
async function obtenerClima(ciudad) {
  climaLoading = true;
  // Actualizar variable global
  window.climaLoading = climaLoading;
  actualizarUIEstadoClima();
  
  try {
    const coords = CIUDADES_ARG[ciudad] || CIUDADES_ARG['Mendoza'];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,precipitation,visibility,uv_index,is_day,cloud_cover&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&hourly=temperature_2m,weather_code,precipitation_probability&timezone=America/Argentina/Mendoza`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const getPeriodo = (startIdx) => {
      let maxTemp = -999;
      let maxProb = 0;
      let midCode = data.hourly.weather_code[startIdx + 3];
      for (let j = startIdx; j < startIdx + 6; j++) {
        if (data.hourly.temperature_2m[j] > maxTemp) maxTemp = data.hourly.temperature_2m[j];
        if (data.hourly.precipitation_probability[j] > maxProb) maxProb = data.hourly.precipitation_probability[j];
      }
      return {
        temp: Math.round(maxTemp),
        codigo: midCode,
        tipo: WMO_CODES[midCode]?.type || 'sun',
        probLluvia: maxProb
      };
    };
    
    climaData = {
      ciudad: ciudad,
      actual: {
        temp: Math.round(data.current.temperature_2m),
        humedad: data.current.relative_humidity_2m,
        viento: Math.round(data.current.wind_speed_10m),
        codigo: data.current.weather_code,
        descripcion: WMO_CODES[data.current.weather_code]?.desc || 'Desconocido',
        tipo: WMO_CODES[data.current.weather_code]?.type || 'sun',
        presion: Math.round(data.current.surface_pressure),
        precipitacion: data.current.precipitation,
        visibilidad: Math.round(data.current.visibility / 1000),
        uv: Math.round(data.current.uv_index),
        nubosidad: data.current.cloud_cover,
        esDia: data.current.is_day
      },
      pronostico: data.daily.time.slice(0, 5).map((fecha, i) => ({
        fecha: new Date(fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        codigo: data.daily.weather_code[i],
        tipo: WMO_CODES[data.daily.weather_code[i]]?.type || 'sun',
        probLluvia: data.daily.precipitation_probability_max[i],
        uvMax: Math.round(data.daily.uv_index_max[i]),
        amanecer: new Date(data.daily.sunrise[i]).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        atardecer: new Date(data.daily.sunset[i]).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      })),
      diario: [
        { nombre: 'Madrugada', ...getPeriodo(0) },
        { nombre: 'Mañana', ...getPeriodo(6) },
        { nombre: 'Tarde', ...getPeriodo(12) },
        { nombre: 'Noche', ...getPeriodo(18) }
      ]
    };
    
    climaCiudad = ciudad;
    // Actualizar variables globales
    window.climaCiudad = climaCiudad;
    window.climaData = climaData;
    
    mostrarToast(`Clima actualizado: ${ciudad}`);
    
    // Inicializar logo si no está inicializado
    if (S.logoImg && (!ELS.logo || ELS.logo.x === null)) {
      const fmt = FMTS[S.fmt];
      const W = fmt.w, H = fmt.h;
      const bandaAlto = Math.round(H * 0.15);
      const logoH = bandaAlto * 0.7;
      const logoW = Math.round(logoH * (S.logoImg.width / S.logoImg.height));
      ELS.logo = { x: 20, y: (bandaAlto - logoH) / 2, w: logoW, h: logoH, visible: true };
    }
    
    // Si estamos en modo clima, renderizar
    if (S.mode === 'clima') {
      render();
    }
    
  } catch (error) {
    console.error('Error al obtener clima:', error);
    mostrarToast('Error al cargar el clima. Intentá nuevamente.');
  } finally {
    climaLoading = false;
    // Actualizar variable global
    window.climaLoading = climaLoading;
    actualizarUIEstadoClima();
  }
}

// Actualizar la lista visual de ciudades extra
function actualizarListaCiudadesExtra() {
  const lista = document.getElementById('listaCiudadesExtra');
  if (!lista) return;
  
  if (climaCiudadesMultiples.length === 0) {
    lista.innerHTML = '';
    return;
  }
  
  lista.innerHTML = climaCiudadesMultiples.map((c, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--surface2);border-radius:4px;margin-bottom:4px">
      <span>${c.nombre}: ${c.actual.temp}°</span>
      <button onclick="eliminarCiudadExtra(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem">×</button>
    </div>
  `).join('');
  
  // Actualizar variable global
  window.climaCiudadesMultiples = climaCiudadesMultiples;
}

// Renderizar la placa de clima en el canvas
function renderClima(W, H) {
  // Sincronizar todas las variables con sus equivalentes globales
  climaTipoPlaca = window.climaTipoPlaca || climaTipoPlaca;
  climaCiudad = window.climaCiudad || climaCiudad;
  climaAlerta = window.climaAlerta || climaAlerta;
  climaMostrarActual = window.climaMostrarActual !== undefined ? window.climaMostrarActual : climaMostrarActual;
  climaMostrarPronostico = window.climaMostrarPronostico !== undefined ? window.climaMostrarPronostico : climaMostrarPronostico;
  climaCiudadesMultiples = window.climaCiudadesMultiples || climaCiudadesMultiples;
  climaData = window.climaData || climaData;
  climaLoading = window.climaLoading || climaLoading;
  
  // Determinar qué tipo de visualización usar basado en la variable global
  if (climaTipoPlaca === 'combinado') {
    // Usar la visualización combinada que muestra actual + evolución diaria
    renderClimaCombinado(W, H);
  } else if (climaTipoPlaca === 'diario') {
    // Mostrar solo evolución diaria (como estaba previamente)
    if (!climaData) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, W, H);
      
      ctx.fillStyle = '#a6ce39';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cargando clima...', W / 2, H / 2);
      
      ctx.fillStyle = '#888';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Seleccioná una ciudad y hacé clic en "Actualizar"', W / 2, H / 2 + 30);
      return;
    }
    
    const { actual, ciudad, diario } = climaData;
    
    // Fondo base oscuro para toda la placa
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    // --- CABECERA (HEADER) ---
    const headerH = Math.round(H * 0.12);
    const bandaGrad = ctx.createLinearGradient(0, 0, 0, headerH);
    bandaGrad.addColorStop(0, '#8fb82d');
    bandaGrad.addColorStop(0.5, '#a6ce39');
    bandaGrad.addColorStop(1, '#c8e87a');
    ctx.fillStyle = bandaGrad;
    ctx.fillRect(0, 0, W, headerH);
    
    // Logo del diario (centrado verticalmente en el header)
    if (S.logoImg && ELS.logo && ELS.logo.visible) {
      const logo = ELS.logo;
      const logoW = logo.w || Math.round(W * 0.2);
      const logoH = logo.h || Math.round(logoW * (S.logoImg.height / S.logoImg.width));
      const logoX = logo.x !== null ? logo.x : 25;
      const logoY = logo.y !== null ? logo.y : (headerH - logoH) / 2;
      ctx.drawImage(S.logoImg, logoX, logoY, logoW, logoH);
    }
    
    // Textos del Header
    const rightPad = 25;
    ctx.textAlign = 'right';
    
    // Ciudad
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 36px BebasNeue, sans-serif';
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 2;
    const cityY = headerH * 0.45;
    ctx.fillText(ciudad.toUpperCase(), W - rightPad, cityY);
    ctx.shadowBlur = 0;
    
    // Fecha y Actualización en una sola línea
    const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    const dateStr = (hoy.charAt(0).toUpperCase() + hoy.slice(1)) + ` | Actualizado: ${hora}`;
    ctx.fillText(dateStr, W - rightPad, headerH * 0.75);

    // --- CONTENIDO PRINCIPAL (Evolución Diaria) ---
    const padding = 25;
    const mainY = headerH + padding;
    const mainH = H - headerH - padding * 2;
    
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(padding, mainY, W - padding * 2, mainH, 20);
    ctx.fill();
    
    ctx.font = 'bold 24px BebasNeue, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a6ce39';
    ctx.fillText('EVOLUCIÓN DIARIA', W / 2, mainY + 40);
    
    const periodoWidth = (W - padding * 2 - 20) / 4; // 4 periodos
    const itemsY = mainY + (mainH / 2) + 15;
    
    // Mostrar los 4 periodos del día
    diario.forEach((periodo, i) => {
      const centerX = padding + i * periodoWidth + periodoWidth / 2 + 5;
      ctx.textAlign = 'center';
      
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(periodo.nombre.toUpperCase(), centerX, itemsY - 60);
      
      dibujarIconoClima(ctx, centerX, itemsY - 20, 55, periodo.tipo);
      
      ctx.font = 'bold 32px BebasNeue, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${periodo.temp}°`, centerX, itemsY + 25);
      
      if (periodo.probLluvia > 0) {
        ctx.fillStyle = '#60A5FA';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(`💧 ${periodo.probLluvia}%`, centerX, itemsY + 45);
      }
    });
    
    // Alerta mejorada
    if (climaAlerta && climaAlerta.trim()) {
      const alertaW = W - 50;
      const alertaH = 50;
      const alertaY = H - alertaH - 10;
      const padding = 20;
      
      // Sombra de la alerta
      ctx.shadowColor = 'rgba(220, 53, 69, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      
      // Fondo rojo brillante con gradiente
      const alertaGrad = ctx.createLinearGradient(25, alertaY, 25, alertaY + alertaH);
      alertaGrad.addColorStop(0, '#DC3545');
      alertaGrad.addColorStop(0.5, '#E63946');
      alertaGrad.addColorStop(1, '#DC3545');
      ctx.fillStyle = alertaGrad;
      ctx.beginPath();
      ctx.roundRect(25, alertaY, alertaW, alertaH, 12);
      ctx.fill();
      
      // Borde blanco brillante
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Icono de advertencia
      const iconX = 25 + padding + 20;
      const iconY = alertaY + alertaH / 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️', iconX, iconY + 8);
      
      // Texto de la alerta
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      let alertaTexto = climaAlerta.toUpperCase();
      
      // Calcular el ancho disponible para el texto
      const textoX = iconX + 35;
      const maxTextoAncho = alertaW - (textoX - 25) - padding;
      
      // Ajustar tamaño de fuente si el texto es largo
      let fontSize = 18;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      while (ctx.measureText(alertaTexto).width > maxTextoAncho && fontSize > 12) {
        fontSize--;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      }
      
      ctx.fillText(alertaTexto, textoX, iconY + 7);
      ctx.shadowBlur = 0;
    }
  } else {
    // Mantener la funcionalidad original para 'extendido' (pronóstico 5 días)
    if (!climaData) {
      // Mostrar mensaje para cargar datos
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, W, H);
      
      ctx.fillStyle = '#a6ce39';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cargando clima...', W / 2, H / 2);
      
      ctx.fillStyle = '#888';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Seleccioná una ciudad y hacé clic en "Actualizar"', W / 2, H / 2 + 30);
      return;
    }
    
    const { actual, pronostico, ciudad } = climaData;
    
    // Fondo base oscuro para toda la placa
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    // --- SECCIONES PROPORCIONALES ---
    const headerH = Math.round(H * 0.12);
    const footerH = Math.round(H * 0.35);
    const mainY = headerH;
    const mainH = H - headerH - footerH;

    // --- 1. CABECERA (HEADER) ---
    const bandaGrad = ctx.createLinearGradient(0, 0, 0, headerH);
    bandaGrad.addColorStop(0, '#8fb82d');
    bandaGrad.addColorStop(0.5, '#a6ce39');
    bandaGrad.addColorStop(1, '#c8e87a');
    ctx.fillStyle = bandaGrad;
    ctx.fillRect(0, 0, W, headerH);
    
    // Logo del diario (centrado verticalmente en el header)
    if (S.logoImg && ELS.logo && ELS.logo.visible) {
      const logo = ELS.logo;
      const logoW = logo.w || Math.round(W * 0.2);
      const logoH = logo.h || Math.round(logoW * (S.logoImg.height / S.logoImg.width));
      const logoX = logo.x !== null ? logo.x : 25;
      const logoY = logo.y !== null ? logo.y : (headerH - logoH) / 2;
      ctx.drawImage(S.logoImg, logoX, logoY, logoW, logoH);
    }
    
    // Textos del Header
    const rightPad = 25;
    ctx.textAlign = 'right';
    
    // Ciudad
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 36px BebasNeue, sans-serif';
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 2;
    const cityY = headerH * 0.45;
    ctx.fillText(ciudad.toUpperCase(), W - rightPad, cityY);
    ctx.shadowBlur = 0;
    
    // Fecha y Actualización en una sola línea
    const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    const dateStr = (hoy.charAt(0).toUpperCase() + hoy.slice(1)) + ` | Actualizado: ${hora}`;
    ctx.fillText(dateStr, W - rightPad, headerH * 0.75);

    // --- 2. CONTENIDO PRINCIPAL ---
    const padding = 25;
    const panelW = (W - padding * 3) / 2; // Dos columnas
    const leftX = padding;
    const rightX = leftX + panelW + padding;
    const panelY = mainY + 20;
    const panelH = mainH - 40;

    // TARJETA IZQUIERDA (Clima Actual) - Fondo dinámico vibrante estilo widget Android
    const config = getFondoDinamico(actual.esDia, actual.codigo);
    
    // Clip para el fondo solo en esta tarjeta
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(leftX, panelY, panelW, panelH, 20);
    ctx.clip();
    
    // Fondo dinámico vibrante
    ctx.fillStyle = config.grad(ctx, panelW, panelH);
    ctx.fillRect(leftX, panelY, panelW, panelH);
    
    ctx.restore();
    
    // Borde sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(leftX, panelY, panelW, panelH, 20);
    ctx.stroke();
    
    const centerX = leftX + panelW / 2;
    
    // Distribuir elementos verticalmente
    const iconY = panelY + panelH * 0.28;
    const tempY = panelY + panelH * 0.60;
    
    dibujarIconoClima(ctx, centerX, iconY, 110, actual.tipo);
    
    ctx.font = 'bold 120px BebasNeue, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(`${actual.temp}°`, centerX, tempY);
    ctx.shadowBlur = 0;
    
    ctx.font = 'bold 26px BebasNeue, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.letterSpacing = '1px';
    ctx.fillText(actual.descripcion.toUpperCase(), centerX, tempY + 55);
    ctx.letterSpacing = '0';
    
    const sensacion = actual.temp - Math.round(actual.viento / 10);
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`Sensación térmica: ${sensacion}°`, centerX, tempY + 85);
    
    // Alerta mejorada
    if (climaAlerta && climaAlerta.trim()) {
      const alertaW = panelW - 40;
      const alertaH = 50;
      const alertaY = panelY + panelH - alertaH - 20;
      const padding = 15;
      
      // Sombra de la alerta
      ctx.shadowColor = 'rgba(220, 53, 69, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      
      // Fondo rojo brillante con gradiente
      const alertaGrad = ctx.createLinearGradient(centerX - alertaW/2, alertaY, centerX - alertaW/2, alertaY + alertaH);
      alertaGrad.addColorStop(0, '#DC3545');
      alertaGrad.addColorStop(0.5, '#E63946');
      alertaGrad.addColorStop(1, '#DC3545');
      ctx.fillStyle = alertaGrad;
      ctx.beginPath();
      ctx.roundRect(centerX - alertaW/2, alertaY, alertaW, alertaH, 10);
      ctx.fill();
      
      // Borde blanco brillante
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Icono de advertencia
      const iconX = centerX - alertaW/2 + padding + 15;
      const iconY = alertaY + alertaH / 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️', iconX, iconY + 8);
      
      // Texto de la alerta
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      let alertaTexto = climaAlerta.toUpperCase();
      
      // Calcular el ancho disponible para el texto
      const textoX = iconX + 30;
      const maxTextoAncho = alertaW - (textoX - (centerX - alertaW/2)) - padding;
      
      // Ajustar tamaño de fuente si el texto es largo
      let fontSize = 15;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      while (ctx.measureText(alertaTexto).width > maxTextoAncho && fontSize > 11) {
        fontSize--;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      }
      
      ctx.fillText(alertaTexto, textoX, iconY + 6);
      ctx.shadowBlur = 0;
    }
    
    // PANEL DERECHO (Dashboard de métricas)
    if (climaMostrarActual) {
      const boxGap = 15;
      const boxH = (panelH - boxGap * 2) / 3;
      
      const dibujarMetrica = (y, titulo, valor, unidad, drawIconFunc) => {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.roundRect(rightX, y, panelW, boxH, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        const midY = y + boxH / 2;
        
        // Icono a la izquierda
        ctx.save();
        ctx.translate(rightX + 40, midY);
        drawIconFunc();
        ctx.restore();
        
        // Textos
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(titulo, rightX + 90, midY - 10);
        
        ctx.font = 'bold 42px BebasNeue, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(valor, rightX + 90, midY + 28);
        const valWidth = ctx.measureText(valor).width; // Medir usando la fuente grande
        
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(unidad, rightX + 90 + valWidth + 8, midY + 24);
      };
      
      // 1. Viento
      dibujarMetrica(panelY, 'VIENTO', `${actual.viento}`, 'km/h', () => {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.moveTo(-15, 5); ctx.lineTo(15, 5); ctx.lineTo(5, -5);
        ctx.lineTo(15, 5); ctx.lineTo(5, 15); ctx.fill();
      });
      
      // 2. Humedad
      dibujarMetrica(panelY + boxH + boxGap, 'HUMEDAD', `${actual.humedad}`, '%', () => {
        ctx.fillStyle = 'rgba(100,180,255,0.8)';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.bezierCurveTo(-12, 0, -12, 10, 0, 10);
        ctx.bezierCurveTo(12, 10, 12, 0, 0, -10);
        ctx.fill();
      });
      
      // 3. Índice UV
      dibujarMetrica(panelY + (boxH + boxGap) * 2, 'ÍNDICE UV', `${actual.uv}`, 'UVI', () => {
        ctx.fillStyle = '#fdb813';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fdb813';
        ctx.lineWidth = 2;
        for(let i=0; i<8; i++) {
          let angle = i * Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle)*11, Math.sin(angle)*11);
          ctx.lineTo(Math.cos(angle)*15, Math.sin(angle)*15);
          ctx.stroke();
        }
      });
    }
    
    // --- 3. PIE DE PLACA (FOOTER) ---
    const footerY = H - footerH;
    
    const drawLine = (y) => {
      const lineaGrad = ctx.createLinearGradient(0, y, W, y);
      lineaGrad.addColorStop(0, '#8fb82d');
      lineaGrad.addColorStop(0.5, '#a6ce39');
      lineaGrad.addColorStop(1, '#c8e87a');
      ctx.fillStyle = lineaGrad;
      ctx.fillRect(0, y, W, 4);
    };
    
    if (climaMostrarPronostico && climaCiudadesMultiples.length === 0) {
      // Solo pronóstico (ocupa todo el footer)
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, footerY, W, footerH);
      drawLine(footerY);
      
      ctx.font = 'bold 20px BebasNeue, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a6ce39';
      ctx.letterSpacing = '2px';
      ctx.fillText('PRONÓSTICO 5 DÍAS', 25, footerY + 35);
      ctx.letterSpacing = '0';
      
      const diaWidth = (W - 50) / 5;
      const itemsY = footerY + (footerH / 2) + 15;
      
      pronostico.forEach((dia, i) => {
        const centerX = 25 + i * diaWidth + diaWidth / 2;
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(dia.fecha.toUpperCase(), centerX, itemsY - 50);
        
        dibujarIconoClima(ctx, centerX, itemsY - 15, 45, dia.tipo);
        
        ctx.font = 'bold 24px BebasNeue, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${dia.tempMax}°`, centerX, itemsY + 20);
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(`${dia.tempMin}°`, centerX, itemsY + 38);
        
        if (dia.probLluvia > 0) {
          ctx.fillStyle = '#60A5FA';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillText(`💧 ${dia.probLluvia}%`, centerX, itemsY + 56);
        }
      });
      
    } else if (climaCiudadesMultiples.length > 0) {
      // Dividir footer en dos: Pronóstico arriba, Ciudades abajo
      const halfH = footerH / 2;
      const pronosticoY = footerY;
      const ciudadesY = footerY + halfH;
      
      // --- MITAD PRONÓSTICO ---
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, pronosticoY, W, halfH);
      drawLine(pronosticoY);
      
      ctx.font = 'bold 16px BebasNeue, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a6ce39';
      ctx.letterSpacing = '1px';
      ctx.fillText('PRONÓSTICO 5 DÍAS', 25, pronosticoY + 25);
      
      const diaWidth = (W - 50) / 5;
      const pItemsY = pronosticoY + halfH / 2 + 10;
      pronostico.forEach((dia, i) => {
        const centerX = 25 + i * diaWidth + diaWidth / 2;
        ctx.textAlign = 'center';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(dia.fecha.toUpperCase(), centerX, pItemsY - 20);
        
        dibujarIconoClima(ctx, centerX - 25, pItemsY + 10, 30, dia.tipo);
        
        ctx.textAlign = 'left';
        ctx.font = 'bold 20px BebasNeue, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${dia.tempMax}°`, centerX + 5, pItemsY + 5);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`${dia.tempMin}°`, centerX + 5, pItemsY + 20);
        
        if (dia.probLluvia > 0) {
          ctx.fillStyle = '#60A5FA';
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.fillText(`💧 ${dia.probLluvia}%`, centerX + 5, pItemsY + 35);
        }
      });
      
      // --- MITAD CIUDADES ---
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, ciudadesY, W, halfH);
      drawLine(ciudadesY);
      
      ctx.font = 'bold 16px BebasNeue, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a6ce39';
      ctx.letterSpacing = '1px';
      ctx.fillText('OTRAS CIUDADES', 25, ciudadesY + 25);
      
      const ciudadWidth = (W - 50) / climaCiudadesMultiples.length;
      const cItemsY = ciudadesY + halfH / 2 + 10;
      climaCiudadesMultiples.forEach((c, i) => {
        const centerX = 25 + i * ciudadWidth + ciudadWidth / 2;
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(c.nombre.toUpperCase(), centerX, cItemsY - 20);
        
        dibujarIconoClima(ctx, centerX - 25, cItemsY + 10, 30, c.actual.tipo);
        
        ctx.textAlign = 'left';
        ctx.font = 'bold 24px BebasNeue, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${c.actual.temp}°`, centerX + 5, cItemsY + 15);
      });
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// NUEVA PLANTILLA CLIMA COMBINADA - Tiempo actual + Evolución Diaria
// ════════════════════════════════════════════════════════════════════

function renderClimaCombinado(W, H) {
  if (!climaData) {
    // Mostrar mensaje para cargar datos
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);
    
    ctx.fillStyle = '#a6ce39';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cargando clima...', W / 2, H / 2);
    
    ctx.fillStyle = '#888';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Seleccioná una ciudad y hacé clic en "Actualizar"', W / 2, H / 2 + 30);
    return;
  }
  
  const { actual, ciudad, diario } = climaData;
  
  // Fondo base oscuro para toda la placa
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, W, H);

  // --- SECCIONES PROPORCIONALES ---
  const headerH = Math.round(H * 0.12);
  const footerH = Math.round(H * 0.40); // Más espacio para mostrar evolución diaria
  const mainY = headerH;
  const mainH = H - headerH - footerH;

  // --- 1. CABECERA (HEADER) ---
  const bandaGrad = ctx.createLinearGradient(0, 0, 0, headerH);
  bandaGrad.addColorStop(0, '#8fb82d');
  bandaGrad.addColorStop(0.5, '#a6ce39');
  bandaGrad.addColorStop(1, '#c8e87a');
  ctx.fillStyle = bandaGrad;
  ctx.fillRect(0, 0, W, headerH);
  
  // Logo del diario (centrado verticalmente en el header)
  if (S.logoImg && ELS.logo && ELS.logo.visible) {
    const logo = ELS.logo;
    const logoW = logo.w || Math.round(W * 0.2);
    const logoH = logo.h || Math.round(logoW * (S.logoImg.height / S.logoImg.width));
    const logoX = logo.x !== null ? logo.x : 25;
    const logoY = logo.y !== null ? logo.y : (headerH - logoH) / 2;
    ctx.drawImage(S.logoImg, logoX, logoY, logoW, logoH);
  }
  
  // Textos del Header
  const rightPad = 25;
  ctx.textAlign = 'right';
  
  // Ciudad
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 36px BebasNeue, sans-serif';
  ctx.shadowColor = 'rgba(255,255,255,0.3)';
  ctx.shadowBlur = 2;
  const cityY = headerH * 0.45;
  ctx.fillText(ciudad.toUpperCase(), W - rightPad, cityY);
  ctx.shadowBlur = 0;
  
  // Fecha y Actualización en una sola línea
  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillStyle = '#ffffff';
  const dateStr = (hoy.charAt(0).toUpperCase() + hoy.slice(1)) + ` | Actualizado: ${hora}`;
  ctx.fillText(dateStr, W - rightPad, headerH * 0.75);

  // --- 2. CONTENIDO PRINCIPAL (Clima Actual) ---
  const padding = 25;
  const panelW = (W - padding * 3) / 2; // Dos columnas
  const leftX = padding;
  const rightX = leftX + panelW + padding;
  const panelY = mainY + 20;
  const panelH = mainH - 40;

  // TARJETA IZQUIERDA (Clima Actual) - Fondo dinámico vibrante estilo widget Android
  const config = getFondoDinamico(actual.esDia, actual.codigo);
  
  // Clip para el fondo solo en esta tarjeta
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(leftX, panelY, panelW, panelH, 20);
  ctx.clip();
  
  // Fondo dinámico vibrante
  ctx.fillStyle = config.grad(ctx, panelW, panelH);
  ctx.fillRect(leftX, panelY, panelW, panelH);
  
  ctx.restore();
  
  // Borde sutil
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(leftX, panelY, panelW, panelH, 20);
  ctx.stroke();
  
  const centerX = leftX + panelW / 2;
  
  // Distribuir elementos verticalmente
  const iconY = panelY + panelH * 0.28;
  const tempY = panelY + panelH * 0.60;
  
  dibujarIconoClima(ctx, centerX, iconY, 110, actual.tipo);
  
  ctx.font = 'bold 120px BebasNeue, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(`${actual.temp}°`, centerX, tempY);
  ctx.shadowBlur = 0;
  
  ctx.font = 'bold 26px BebasNeue, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.letterSpacing = '1px';
  ctx.fillText(actual.descripcion.toUpperCase(), centerX, tempY + 55);
  
  const sensacion = actual.temp - Math.round(actual.viento / 10);
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(`Sensación térmica: ${sensacion}°`, centerX, tempY + 85);
  
  // PANEL DERECHO (Dashboard de métricas)
  if (climaMostrarActual) {
    const boxGap = 15;
    const boxH = (panelH - boxGap * 2) / 3;
    
    const dibujarMetrica = (y, titulo, valor, unidad, drawIconFunc) => {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.roundRect(rightX, y, panelW, boxH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      const midY = y + boxH / 2;
      
      // Icono a la izquierda
      ctx.save();
      ctx.translate(rightX + 40, midY);
      drawIconFunc();
      ctx.restore();
      
      // Textos
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(titulo, rightX + 90, midY - 10);
      
      ctx.font = 'bold 42px BebasNeue, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(valor, rightX + 90, midY + 28);
      const valWidth = ctx.measureText(valor).width; // Medir usando la fuente grande
      
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(unidad, rightX + 90 + valWidth + 8, midY + 24);
    };
    
    // 1. Viento
    dibujarMetrica(panelY, 'VIENTO', `${actual.viento}`, 'km/h', () => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.moveTo(-15, 5); ctx.lineTo(15, 5); ctx.lineTo(5, -5);
      ctx.lineTo(15, 5); ctx.lineTo(5, 15); ctx.fill();
    });
    
    // 2. Humedad
    dibujarMetrica(panelY + boxH + boxGap, 'HUMEDAD', `${actual.humedad}`, '%', () => {
      ctx.fillStyle = 'rgba(100,180,255,0.8)';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.bezierCurveTo(-12, 0, -12, 10, 0, 10);
      ctx.bezierCurveTo(12, 10, 12, 0, 0, -10);
      ctx.fill();
    });
    
    // 3. Índice UV
    dibujarMetrica(panelY + (boxH + boxGap) * 2, 'ÍNDICE UV', `${actual.uv}`, 'UVI', () => {
      ctx.fillStyle = '#fdb813';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fdb813';
      ctx.lineWidth = 2;
      for(let i=0; i<8; i++) {
        let angle = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle)*11, Math.sin(angle)*11);
        ctx.lineTo(Math.cos(angle)*15, Math.sin(angle)*15);
        ctx.stroke();
      }
    });
  }
  
  // --- 3. PIE DE PLACA (FOOTER) - Evolución Diaria ---
  const footerY = H - footerH;
  
  const drawLine = (y) => {
    const lineaGrad = ctx.createLinearGradient(0, y, W, y);
    lineaGrad.addColorStop(0, '#8fb82d');
    lineaGrad.addColorStop(0.5, '#a6ce39');
    lineaGrad.addColorStop(1, '#c8e87a');
    ctx.fillStyle = lineaGrad;
    ctx.fillRect(0, y, W, 4);
  };
  
  // Evolución Diaria (Madrugada, Mañana, Tarde, Noche)
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, footerY, W, footerH);
  drawLine(footerY);
  
  ctx.font = 'bold 20px BebasNeue, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#a6ce39';
  ctx.letterSpacing = '2px';
  ctx.fillText('EVOLUCIÓN DIARIA', 25, footerY + 35);
  ctx.letterSpacing = '0';
  
  const periodoWidth = (W - 50) / 4;
  const itemsY = footerY + (footerH / 2) + 15;
  
  // Mostrar los 4 periodos del día
  diario.forEach((periodo, i) => {
    const centerX = 25 + i * periodoWidth + periodoWidth / 2;
    ctx.textAlign = 'center';
    
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(periodo.nombre.toUpperCase(), centerX, itemsY - 50);
    
    dibujarIconoClima(ctx, centerX, itemsY - 15, 45, periodo.tipo);
    
    ctx.font = 'bold 24px BebasNeue, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${periodo.temp}°`, centerX, itemsY + 20);
    
    if (periodo.probLluvia > 0) {
      ctx.fillStyle = '#60A5FA';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`💧 ${periodo.probLluvia}%`, centerX, itemsY + 38);
    }
  });
  
  // Alerta si existe - MÁS GRANDE Y LLAMATIVA
  if (climaAlerta && climaAlerta.trim()) {
    const alertaW = W - 50;
    const alertaH = 55;
    const alertaY = footerY + footerH - alertaH - 10;
    const padding = 20;
    
    // Sombra de la alerta
    ctx.shadowColor = 'rgba(220, 53, 69, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    // Fondo rojo brillante con gradiente
    const alertaGrad = ctx.createLinearGradient(25, alertaY, 25, alertaY + alertaH);
    alertaGrad.addColorStop(0, '#DC3545');
    alertaGrad.addColorStop(0.5, '#E63946');
    alertaGrad.addColorStop(1, '#DC3545');
    ctx.fillStyle = alertaGrad;
    ctx.beginPath();
    ctx.roundRect(25, alertaY, alertaW, alertaH, 12);
    ctx.fill();
    
    // Borde blanco brillante
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Icono de advertencia
    const iconX = 25 + padding + 20;
    const iconY = alertaY + alertaH / 2;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️', iconX, iconY + 8);
    
    // Texto de la alerta
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 3;
    let alertaTexto = climaAlerta.toUpperCase();
    
    // Calcular el ancho disponible para el texto
    const textoX = iconX + 35;
    const maxTextoAncho = alertaW - (textoX - 25) - padding;
    
    // Ajustar tamaño de fuente si el texto es largo
    let fontSize = 18;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    while (ctx.measureText(alertaTexto).width > maxTextoAncho && fontSize > 12) {
      fontSize--;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    }
    
    ctx.fillText(alertaTexto, textoX, iconY + 7);
    ctx.shadowBlur = 0;
  }
}

// Inicializar el módulo
function initClimaModule() {
  // Asegurarse de que todas las variables estén disponibles globalmente
  window.climaTipoPlaca = window.climaTipoPlaca || climaTipoPlaca;
  window.climaCiudad = window.climaCiudad || climaCiudad;
  window.climaAlerta = window.climaAlerta || climaAlerta;
  window.climaMostrarActual = window.climaMostrarActual !== undefined ? window.climaMostrarActual : climaMostrarActual;
  window.climaMostrarPronostico = window.climaMostrarPronostico !== undefined ? window.climaMostrarPronostico : climaMostrarPronostico;
  window.climaCiudadesMultiples = window.climaCiudadesMultiples || climaCiudadesMultiples;
  window.climaData = window.climaData || climaData;
  window.climaLoading = window.climaLoading || climaLoading;
  
  // Cargar clima por defecto al iniciar (San Rafael como prioridad)
  obtenerClima('San Rafael');
}

// Exponer funciones globalmente
window.obtenerClima = obtenerClima;
window.renderClima = renderClima;
window.initClimaModule = initClimaModule;
window.agregarCiudadExtra = agregarCiudadExtra;
window.eliminarCiudadExtra = eliminarCiudadExtra;

// Actualizar la variable global cuando cambie
window.climaTipoPlaca = climaTipoPlaca;
window.climaCiudad = climaCiudad;
window.climaAlerta = climaAlerta;
window.climaMostrarActual = climaMostrarActual;
window.climaMostrarPronostico = climaMostrarPronostico;