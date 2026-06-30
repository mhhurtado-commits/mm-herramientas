// ════════════════════════════════════════════════════════════════════
// MÓDULO CLIMA - PLACAS DINÁMICAS
// API: Open-Meteo (gratuita, sin API key)
// ════════════════════════════════════════════════════════════════════

// Fondo procedimental, sin fotos externas
function getClimateBackdropType(codigoClima) {
  if (codigoClima === 0) return 'sun';
  if (codigoClima === 1 || codigoClima === 2) return 'sun-cloud';
  if (codigoClima === 3) return 'cloud';
  if (codigoClima === 45 || codigoClima === 48) return 'fog';
  if (codigoClima >= 51 && codigoClima <= 57) return 'rain-light';
  if (codigoClima >= 61 && codigoClima <= 67) return 'rain';
  if (codigoClima >= 71 && codigoClima <= 77) return 'snow';
  if (codigoClima >= 80 && codigoClima <= 82) return 'rain-heavy';
  if (codigoClima >= 85 && codigoClima <= 86) return 'snow';
  if (codigoClima >= 95) return 'storm';
  return 'sun';
}

const mostrarToast = window.showToast || window.mostrarToast || function(msg) {
  console.log(msg);
};

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

function makeSeededRandom(seedValue) {
  let seed = 0;
  const seedText = String(seedValue || 'clima');
  for (let i = 0; i < seedText.length; i++) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return function nextRandom() {
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function paintClimateTexture(ctx, x, y, w, h, actual) {
  const rand = makeSeededRandom(`${actual.tipo}-${actual.codigo}-${actual.esDia ? 'd' : 'n'}-${actual.temp}`);
  const isNight = !actual.esDia;
  const type = actual.tipo || 'cloud';
  const isFrost = actual.codigo === 48;

  if (isNight) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 46; i++) {
      const starX = x + rand() * w;
      const starY = y + rand() * h * 0.9;
      const starR = 0.6 + rand() * 1.6;
      ctx.globalAlpha = 0.35 + rand() * 0.55;
      ctx.beginPath();
      ctx.arc(starX, starY, starR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (type === 'sun' || type === 'sun-cloud') {
    const glowX = x + w * (isNight ? 0.72 : 0.74);
    const glowY = y + h * 0.18;
    const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(w, h) * 0.52);
    glow.addColorStop(0, actual.esDia ? 'rgba(255,223,99,0.42)' : 'rgba(255,244,180,0.22)');
    glow.addColorStop(0.45, 'rgba(255,223,99,0.12)');
    glow.addColorStop(1, 'rgba(255,223,99,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);
  }

  if (type === 'cloud' || type === 'sun-cloud') {
    ctx.fillStyle = actual.esDia ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.07)';
    const cloudBands = [
      { px: 0.08, py: 0.18, pw: 0.34, ph: 0.12 },
      { px: 0.56, py: 0.12, pw: 0.28, ph: 0.10 },
      { px: 0.22, py: 0.34, pw: 0.42, ph: 0.14 },
    ];
    cloudBands.forEach(cloud => {
      ctx.beginPath();
      ctx.ellipse(x + w * cloud.px, y + h * cloud.py, w * cloud.pw, h * cloud.ph, -0.15, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (type === 'fog' || isFrost) {
    const fog = ctx.createLinearGradient(x, y + h * 0.2, x, y + h);
    fog.addColorStop(0, 'rgba(255,255,255,0)');
    fog.addColorStop(0.5, isFrost ? 'rgba(220,245,255,0.12)' : 'rgba(240,245,255,0.09)');
    fog.addColorStop(1, isFrost ? 'rgba(205,235,255,0.28)' : 'rgba(220,230,240,0.22)');
    ctx.fillStyle = fog;
    ctx.fillRect(x, y, w, h);
  }

  if (isFrost) {
    ctx.fillStyle = 'rgba(220, 245, 255, 0.14)';
    for (let i = 0; i < 12; i++) {
      const frostX = x + rand() * w;
      const frostY = y + rand() * h * 0.75;
      const frostSize = 1 + rand() * 2;
      ctx.beginPath();
      ctx.arc(frostX, frostY, frostSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (type === 'rain' || type === 'rain-light' || type === 'rain-heavy') {
    ctx.strokeStyle = type === 'rain-heavy' ? 'rgba(170, 200, 255, 0.22)' : 'rgba(170, 200, 255, 0.14)';
    ctx.lineWidth = type === 'rain-heavy' ? 2 : 1;
    for (let i = 0; i < 32; i++) {
      const dropX = x + rand() * w;
      const dropY = y + rand() * h * 0.9;
      const dropLen = 10 + rand() * 26;
      ctx.beginPath();
      ctx.moveTo(dropX, dropY);
      ctx.lineTo(dropX - 4, dropY + dropLen);
      ctx.stroke();
    }
  }

  if (type === 'snow' || type === 'snow-heavy') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 30; i++) {
      const flakeX = x + rand() * w;
      const flakeY = y + rand() * h * 0.88;
      const flakeR = 0.9 + rand() * 2.4;
      ctx.beginPath();
      ctx.arc(flakeX, flakeY, flakeR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (type === 'storm') {
    const stormGlow = ctx.createLinearGradient(x, y, x, y + h);
    stormGlow.addColorStop(0, 'rgba(70, 40, 110, 0.22)');
    stormGlow.addColorStop(1, 'rgba(15, 15, 25, 0.28)');
    ctx.fillStyle = stormGlow;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(255, 245, 180, 0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const boltX = x + w * (0.22 + rand() * 0.52);
      ctx.beginPath();
      ctx.moveTo(boltX, y + h * 0.05);
      ctx.lineTo(boltX - 18, y + h * 0.24);
      ctx.lineTo(boltX + 10, y + h * 0.24);
      ctx.lineTo(boltX - 8, y + h * 0.40);
      ctx.stroke();
    }
  }
}

function paintClimateCardBackdrop(ctx, x, y, w, h, actual) {
  const rand = makeSeededRandom(`backdrop-${actual.codigo}-${actual.esDia ? 'd' : 'n'}-${actual.temp}`);
  const type = getClimateBackdropType(actual.codigo);
  const isNight = !actual.esDia;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.clip();

  const ahora = new Date();
  const horaActual = ahora.getHours() + ahora.getMinutes() / 60;
  let nearSunset = false, nearSunrise = false;
  if (actual.amanecer && actual.atardecer) {
    const [amH, amM] = actual.amanecer.split(':').map(Number);
    const [atH, atM] = actual.atardecer.split(':').map(Number);
    const am = amH + amM / 60, at = atH + atM / 60;
    nearSunrise = Math.abs(horaActual - am) < 1;
    nearSunset = Math.abs(horaActual - at) < 1;
  }

  const sky = ctx.createLinearGradient(x, y, x, y + h);
  if (isNight) {
    if (nearSunrise) {
      sky.addColorStop(0, '#0b1026'); sky.addColorStop(0.3, '#1a1240');
      sky.addColorStop(0.55, '#4a2060'); sky.addColorStop(0.75, '#c06040');
      sky.addColorStop(1, '#1a0f18');
    } else {
      sky.addColorStop(0, '#0b1026'); sky.addColorStop(0.42, '#1a1240');
      sky.addColorStop(1, '#07090f');
    }
  } else if (type === 'storm' || type === 'rain-heavy') {
    sky.addColorStop(0, '#2a3a52'); sky.addColorStop(0.45, '#1e2840');
    sky.addColorStop(1, '#0f1520');
  } else if (type === 'fog') {
    sky.addColorStop(0, '#8a9db0'); sky.addColorStop(0.45, '#6b8096');
    sky.addColorStop(1, '#4a5c6a');
  } else if (type === 'snow') {
    sky.addColorStop(0, '#c8d8ec'); sky.addColorStop(0.45, '#90a9c2');
    sky.addColorStop(1, '#53637a');
  } else if (type === 'cloud' || type === 'sun-cloud') {
    sky.addColorStop(0, '#6a8db8'); sky.addColorStop(0.48, '#4a6a8a');
    sky.addColorStop(1, '#2a3a4a');
  } else {
    sky.addColorStop(0, '#4da6ff'); sky.addColorStop(0.45, '#2277cc');
    sky.addColorStop(1, '#0d3060');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  const horizon = ctx.createLinearGradient(x, y + h * 0.5, x, y + h);
  if (isNight) {
    if (nearSunrise) {
      horizon.addColorStop(0, 'rgba(200, 120, 60, 0.2)'); horizon.addColorStop(0.5, 'rgba(80, 40, 80, 0.2)');
      horizon.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    } else {
      horizon.addColorStop(0, 'rgba(150, 80, 180, 0.18)'); horizon.addColorStop(0.6, 'rgba(50, 25, 80, 0.2)');
      horizon.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    }
  } else if (type === 'storm' || type === 'rain-heavy') {
    horizon.addColorStop(0, 'rgba(255,255,255,0.04)'); horizon.addColorStop(1, 'rgba(0,0,0,0.5)');
  } else {
    horizon.addColorStop(0, 'rgba(255,255,255,0.1)'); horizon.addColorStop(1, 'rgba(0,0,0,0.35)');
  }
  ctx.fillStyle = horizon;
  ctx.fillRect(x, y, w, h);

  // Capa glassmorphism: fondo semitransparente con gradiente sutil
  const glass = ctx.createRadialGradient(x + w * 0.3, y + h * 0.2, 0, x + w * 0.5, y + h * 0.5, Math.max(w, h) * 0.7);
  glass.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  glass.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
  glass.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
  ctx.fillStyle = glass;
  ctx.fillRect(x, y, w, h);

  if (isNight) {
    const moonX = x + w * 0.77;
    const moonY = y + h * 0.18;
    const moonR = Math.min(w, h) * 0.055;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 5);
    moonGlow.addColorStop(0, 'rgba(230,240,255,0.2)');
    moonGlow.addColorStop(1, 'rgba(230,240,255,0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#edf1ff';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0b1026';
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.35, moonY - moonR * 0.08, moonR * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    for (let i = 0; i < 42; i++) {
      const starX = x + rand() * w;
      const starY = y + rand() * h * 0.72;
      const starR = 0.5 + rand() * 1.8;
      ctx.globalAlpha = 0.35 + rand() * 0.65;
      ctx.beginPath();
      ctx.arc(starX, starY, starR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    const sunX = x + w * 0.76;
    const sunY = y + h * 0.2;
    const sunR = Math.min(w, h) * 0.055;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 6);
    sunGlow.addColorStop(0, 'rgba(255,226,120,0.35)');
    sunGlow.addColorStop(0.35, 'rgba(255,216,100,0.15)');
    sunGlow.addColorStop(1, 'rgba(255,216,100,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#ffd84d';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,216,77,0.75)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * sunR * 1.35, sunY + Math.sin(angle) * sunR * 1.35);
      ctx.lineTo(sunX + Math.cos(angle) * sunR * 2.0, sunY + Math.sin(angle) * sunR * 2.0);
      ctx.stroke();
    }
  }

  if (type === 'cloud' || type === 'sun-cloud' || type === 'rain' || type === 'rain-light' || type === 'rain-heavy' || type === 'storm' || type === 'fog') {
    const cloudCount = type === 'storm' ? 6 : type === 'fog' ? 4 : 3;
    for (let i = 0; i < cloudCount; i++) {
      const baseX = x + w * (0.08 + rand() * 0.82);
      const baseY = y + h * (0.12 + rand() * 0.28);
      const cloudW = w * (0.2 + rand() * 0.24);
      const cloudH = h * (0.05 + rand() * 0.06);
      const alpha = type === 'fog' ? 0.14 : type === 'storm' ? 0.18 : 0.12;
      ctx.fillStyle = isNight ? `rgba(220,230,255,${alpha})` : `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, cloudW * 0.45, cloudH * 0.55, -0.18, 0, Math.PI * 2);
      ctx.ellipse(baseX + cloudW * 0.24, baseY - cloudH * 0.1, cloudW * 0.34, cloudH * 0.48, -0.18, 0, Math.PI * 2);
      ctx.ellipse(baseX - cloudW * 0.18, baseY + cloudH * 0.05, cloudW * 0.28, cloudH * 0.42, -0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (type === 'rain' || type === 'rain-light' || type === 'rain-heavy' || type === 'storm') {
    ctx.strokeStyle = type === 'rain-heavy' || type === 'storm' ? 'rgba(160,195,255,0.24)' : 'rgba(160,195,255,0.14)';
    ctx.lineWidth = type === 'rain-heavy' || type === 'storm' ? 2 : 1;
    const rainCount = type === 'rain-heavy' || type === 'storm' ? 36 : 22;
    for (let i = 0; i < rainCount; i++) {
      const rx = x + rand() * w;
      const ry = y + rand() * h * 0.85;
      const len = 10 + rand() * 24;
      const tilt = -3 + rand() * 2;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + tilt, ry + len);
      ctx.stroke();
    }
  }

  if (type === 'snow') {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 36; i++) {
      const sx = x + rand() * w;
      const sy = y + rand() * h * 0.86;
      const sr = 0.9 + rand() * 2.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  if (type === 'fog') {
    const mist = ctx.createLinearGradient(x, y + h * 0.25, x, y + h);
    mist.addColorStop(0, 'rgba(255,255,255,0)');
    mist.addColorStop(0.5, 'rgba(240,248,255,0.1)');
    mist.addColorStop(1, 'rgba(230,240,255,0.22)');
    ctx.fillStyle = mist;
    ctx.fillRect(x, y, w, h);
  }

  if (type === 'storm') {
    ctx.fillStyle = 'rgba(25, 12, 50, 0.2)';
    ctx.fillRect(x, y, w, h);
    ctx.shadowColor = 'rgba(255, 245, 180, 0.5)';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(255, 245, 180, 0.2)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 2; i++) {
      const boltX = x + w * (0.22 + rand() * 0.52);
      ctx.beginPath();
      ctx.moveTo(boltX, y + h * 0.05);
      ctx.lineTo(boltX - 18, y + h * 0.24);
      ctx.lineTo(boltX + 10, y + h * 0.24);
      ctx.lineTo(boltX - 8, y + h * 0.4);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  const vignette = ctx.createRadialGradient(x + w * 0.5, y + h * 0.42, Math.min(w, h) * 0.22, x + w * 0.5, y + h * 0.45, Math.max(w, h) * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.6, 'rgba(0,0,0,0.06)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(x, y, w, h);

  const bottomSilhouette = ctx.createLinearGradient(x, y + h * 0.6, x, y + h);
  bottomSilhouette.addColorStop(0, 'rgba(0,0,0,0)');
  bottomSilhouette.addColorStop(1, 'rgba(0,0,0,0.58)');
  ctx.fillStyle = bottomSilhouette;
  ctx.fillRect(x, y, w, h);

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.stroke();
  ctx.restore();
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
// 'type' puede ser 'sun', 'moon', 'sun-cloud', 'cloud', 'fog', 'rain-light', 'rain', 'rain-heavy', 'snow', 'snow-heavy', 'storm'
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

// Mapeo de códigos SMN (nativos) a descripciones
const SMN_CODES = {
  3: { desc: 'Despejado', type: 'sun' },
  19: { desc: 'Algo nublado', type: 'sun-cloud' },
  25: { desc: 'Parcialmente nublado', type: 'sun-cloud' },
  37: { desc: 'Mayormente nublado', type: 'cloud' },
  43: { desc: 'Nublado', type: 'cloud' },
  74: { desc: 'Chaparrones', type: 'rain' },
  77: { desc: 'Lluvias y nevadas', type: 'snow' },
  79: { desc: 'Nevadas', type: 'snow' },
  95: { desc: 'Tormenta', type: 'storm' },
  96: { desc: 'Tormenta con granizo', type: 'storm' },
  99: { desc: 'Tormenta severa', type: 'storm' }
};

// Función para obtener el tipo de clima según la hora del día
function getTipoClimaPorHora(tipoBase, nombrePeriodo, esDia) {
  // Si es de noche o madrugada, usar variante moon para tipos claros
  if (!esDia) {
    if (tipoBase === 'sun') return 'moon';
    if (tipoBase === 'sun-cloud') return 'moon-cloud';
    if (tipoBase === 'cloud') return 'moon-cloud';
  }
  return tipoBase;
}

// Función para determinar si es de día basándose en amanecer/atardecer
function esDeDia(amanecer, atardecer) {
  const ahora = new Date();
  const horaActual = ahora.getHours() + ahora.getMinutes() / 60;

  try {
    const [amH, amM] = amanecer.split(':').map(Number);
    const [atH, atM] = atardecer.split(':').map(Number);
    const horaAmanecer = amH + amM / 60;
    const horaAtardecer = atH + atM / 60;
    return horaActual >= horaAmanecer && horaActual <= horaAtardecer;
  } catch (e) {
    // Si hay error, asumir es de día
    return true;
  }
}

// Mapeo de códigos SMN a códigos WMO equivalentes
const SMN_TO_WMO = {
  3: 0,    // Despejado
  19: 2,   // Algo nublado
  25: 2,   // Parcialmente nublado
  37: 3,   // Mayormente nublado
  43: 3,   // Nublado
  74: 81,  // Chaparrones
  77: 71,  // Lluvias y nevadas
  79: 75,  // Nevadas
  95: 95,  // Tormenta
  96: 96,  // Tormenta con granizo
  99: 99   // Tormenta severa
};

// Función para convertir código SMN a WMO
function mapearCodigoSMNaWMO(smnCode) {
  return SMN_TO_WMO[smnCode] || 0; // Default a despejado si no está mapeado
}

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

// Obtener datos del clima desde SMN (via Worker) con fallback a Open-Meteo
async function obtenerClima(ciudad) {
  climaLoading = true;
  // Actualizar variable global
  window.climaLoading = climaLoading;
  actualizarUIEstadoClima();

  try {
    // Intentar obtener datos del Worker SMN primero
    const workerUrl = 'https://mm-herramientas-worker.mhhurtado.workers.dev/smn/weather?ciudad=' + encodeURIComponent(ciudad);
    const smnResponse = await fetch(workerUrl);
    const smnData = await smnResponse.json();

    if (smnData.ok && smnData.data && smnData.data.weather) {
      // Procesar datos SMN
      const weather = smnData.data.weather;
      const forecast = smnData.data.forecast;
      const sun = smnData.data.sun;
      const warning = smnData.data.warning;
      const georef = smnData.data.georef;

      const wmoCode = mapearCodigoSMNaWMO(weather.weather.id);
      const wmoInfo = WMO_CODES[wmoCode] || WMO_CODES[0];

      // Datos del sol (amanecer/atardecer)
      const solData = smnData.sun || {};
      const amanecer = solData.sunrise || '06:00';
      const atardecer = solData.sunset || '18:00';

      // Detectar si es de día basándose en la hora actual vs amanecer/atardecer
      const ahora = new Date();
      const [amH, amM] = amanecer.split(':').map(Number);
      const [atH, atM] = atardecer.split(':').map(Number);
      const horaActual = ahora.getHours() + ahora.getMinutes() / 60;
      const horaAmanecer = amH + amM / 60;
      const horaAtardecer = atH + atM / 60;
      const esDia = horaActual >= horaAmanecer && horaActual <= horaAtardecer;

      climaData = {
        ciudad: ciudad,
        actual: {
          temp: parseFloat(weather.temperature.toFixed(1)), // 1 decimal como en SMN
          sensacionTermica: parseFloat(weather.feels_like.toFixed(1)), // 1 decimal
          humedad: weather.humidity,
          viento: Math.round(weather.wind.speed),
          vientoDireccion: weather.wind.direction || '',
          vientoDeg: weather.wind.deg || 0,
          vientoRafaMax: weather.wind.gust || null,
          codigo: wmoCode,
          descripcion: wmoInfo.desc,
          tipo: wmoInfo.type,
          presion: Math.round(weather.pressure),
          precipitacion: 0,
          visibilidad: weather.visibility ? `${weather.visibility} km` : 'N/D',
          visibilidadValor: weather.visibility,
          uv: 0,
          nubosidad: 0,
          esDia: esDia,
          amanecer: amanecer,
          atardecer: atardecer,
          // Datos de estación
          estacion: weather.station_id || null,
          ubicacion: weather.location?.name || ciudad
        },
        pronostico: forecast.forecast
          .filter(dia => dia.temp_max !== null && dia.temp_min !== null) // Filtrar días sin datos
          .slice(0, 7)
          .map((dia, i) => {
          const wmoCodePron = mapearCodigoSMNaWMO(dia.weather?.id || dia.night?.weather?.id || dia.afternoon?.weather?.id || 3);
          const wmoInfoPron = WMO_CODES[wmoCodePron] || WMO_CODES[0];
          // Usar el período más representativo del día para el icono
          const periodoIcono = dia.afternoon || dia.night || dia.morning || dia;
          const probLluvia = periodoIcono.rain_prob_range
            ? Math.round((periodoIcono.rain_prob_range[0] + periodoIcono.rain_prob_range[1]) / 2)
            : 0;
          const rafagas = periodoIcono.gust_range
            ? Math.round((periodoIcono.gust_range[0] + periodoIcono.gust_range[1]) / 2)
            : null;
          const fecha = new Date(dia.date);
          const hoy = new Date();
          const esHoy = fecha.toDateString() === hoy.toDateString();
          return {
            fecha: esHoy ? 'Hoy' : fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
            fechaCompleta: dia.date,
            tempMax: dia.temp_max !== null ? Math.round(dia.temp_max) : null,
            tempMin: dia.temp_min !== null ? Math.round(dia.temp_min) : null,
            codigo: wmoCodePron,
            tipo: wmoInfoPron.type,
            descripcion: periodoIcono.weather?.description || wmoInfoPron.desc,
            probLluvia: probLluvia,
            rafagas: rafagas,
            visibilidad: periodoIcono.visibility || 'Buena',
            humedadMin: dia.humidity_min,
            humedadMax: dia.humidity_max,
            amanecer: amanecer,
            atardecer: atardecer
          };
        }),
        diario: [
          // Procesar los 4 períodos del día actual con todos los datos
          ...(forecast.forecast[0]?.early_morning ? [{
            nombre: 'Madrugada',
            temp: Math.round(forecast.forecast[0].early_morning.temperature),
            codigo: mapearCodigoSMNaWMO(forecast.forecast[0].early_morning.weather?.id || 3),
            tipo: WMO_CODES[mapearCodigoSMNaWMO(forecast.forecast[0].early_morning.weather?.id || 3)]?.type || 'moon',
            descripcion: forecast.forecast[0].early_morning.weather?.description || 'Nublado',
            probLluvia: Math.round((forecast.forecast[0].early_morning.rain_prob_range[0] + forecast.forecast[0].early_morning.rain_prob_range[1]) / 2),
            vientoVelocidad: forecast.forecast[0].early_morning.wind?.speed_range
              ? Math.round((forecast.forecast[0].early_morning.wind.speed_range[0] + forecast.forecast[0].early_morning.wind.speed_range[1]) / 2)
              : null,
            vientoDireccion: forecast.forecast[0].early_morning.wind?.direction || '',
            rafagas: forecast.forecast[0].early_morning.gust_range
              ? Math.round((forecast.forecast[0].early_morning.gust_range[0] + forecast.forecast[0].early_morning.gust_range[1]) / 2)
              : null,
            visibilidad: forecast.forecast[0].early_morning.visibility || 'Buena',
            lluvia6h: forecast.forecast[0].early_morning.rain06h || 0
          }] : []),
          ...(forecast.forecast[0]?.morning ? [{
            nombre: 'Mañana',
            temp: Math.round(forecast.forecast[0].morning.temperature),
            codigo: mapearCodigoSMNaWMO(forecast.forecast[0].morning.weather?.id || 3),
            tipo: WMO_CODES[mapearCodigoSMNaWMO(forecast.forecast[0].morning.weather?.id || 3)]?.type || 'sun',
            descripcion: forecast.forecast[0].morning.weather?.description || 'Nublado',
            probLluvia: Math.round((forecast.forecast[0].morning.rain_prob_range[0] + forecast.forecast[0].morning.rain_prob_range[1]) / 2),
            vientoVelocidad: forecast.forecast[0].morning.wind?.speed_range
              ? Math.round((forecast.forecast[0].morning.wind.speed_range[0] + forecast.forecast[0].morning.wind.speed_range[1]) / 2)
              : null,
            vientoDireccion: forecast.forecast[0].morning.wind?.direction || '',
            rafagas: forecast.forecast[0].morning.gust_range
              ? Math.round((forecast.forecast[0].morning.gust_range[0] + forecast.forecast[0].morning.gust_range[1]) / 2)
              : null,
            visibilidad: forecast.forecast[0].morning.visibility || 'Buena',
            lluvia6h: forecast.forecast[0].morning.rain06h || 0
          }] : []),
          ...(forecast.forecast[0]?.afternoon ? [{
            nombre: 'Tarde',
            temp: Math.round(forecast.forecast[0].afternoon.temperature),
            codigo: mapearCodigoSMNaWMO(forecast.forecast[0].afternoon.weather?.id || 3),
            tipo: WMO_CODES[mapearCodigoSMNaWMO(forecast.forecast[0].afternoon.weather?.id || 3)]?.type || 'sun',
            descripcion: forecast.forecast[0].afternoon.weather?.description || 'Nublado',
            probLluvia: Math.round((forecast.forecast[0].afternoon.rain_prob_range[0] + forecast.forecast[0].afternoon.rain_prob_range[1]) / 2),
            vientoVelocidad: forecast.forecast[0].afternoon.wind?.speed_range
              ? Math.round((forecast.forecast[0].afternoon.wind.speed_range[0] + forecast.forecast[0].afternoon.wind.speed_range[1]) / 2)
              : null,
            vientoDireccion: forecast.forecast[0].afternoon.wind?.direction || '',
            rafagas: forecast.forecast[0].afternoon.gust_range
              ? Math.round((forecast.forecast[0].afternoon.gust_range[0] + forecast.forecast[0].afternoon.gust_range[1]) / 2)
              : null,
            visibilidad: forecast.forecast[0].afternoon.visibility || 'Buena',
            lluvia6h: forecast.forecast[0].afternoon.rain06h || 0
          }] : []),
          ...(forecast.forecast[0]?.night ? [{
            nombre: 'Noche',
            temp: Math.round(forecast.forecast[0].night.temperature),
            codigo: mapearCodigoSMNaWMO(forecast.forecast[0].night.weather?.id || 3),
            tipo: WMO_CODES[mapearCodigoSMNaWMO(forecast.forecast[0].night.weather?.id || 3)]?.type || 'moon',
            descripcion: forecast.forecast[0].night.weather?.description || 'Nublado',
            probLluvia: Math.round((forecast.forecast[0].night.rain_prob_range[0] + forecast.forecast[0].night.rain_prob_range[1]) / 2),
            vientoVelocidad: forecast.forecast[0].night.wind?.speed_range
              ? Math.round((forecast.forecast[0].night.wind.speed_range[0] + forecast.forecast[0].night.wind.speed_range[1]) / 2)
              : null,
            vientoDireccion: forecast.forecast[0].night.wind?.direction || '',
            rafagas: forecast.forecast[0].night.gust_range
              ? Math.round((forecast.forecast[0].night.gust_range[0] + forecast.forecast[0].night.gust_range[1]) / 2)
              : null,
            visibilidad: forecast.forecast[0].night.visibility || 'Buena',
            lluvia6h: forecast.forecast[0].night.rain06h || 0
          }] : [])
        ],
        alertas: warning ? {
          nivel: warning.level || null,
          areaId: warning.area_id || null,
          actualizado: warning.updated || null
        } : null
      };

      climaCiudad = ciudad;
      window.climaCiudad = climaCiudad;
      window.climaData = climaData;
      mostrarToast(`Clima actualizado (SMN): ${ciudad}`);

      // Inicializar logo si no está inicializado
      if (S.logoImg && (!ELS.logo || ELS.logo.x === null)) {
        const fmt = FMTS[S.fmt];
        const W = fmt.w, H = fmt.h;
        const bandaAlto = Math.round(H * 0.15);
        const logoH = bandaAlto * 0.7;
        const logoW = Math.round(logoH * (S.logoImg.width / S.logoImg.height));
        ELS.logo = { x: 20, y: (bandaAlto - logoH) / 2, w: logoW, h: logoH, visible: true };
      }

      if (S.mode === 'clima') {
        render();
      }
      return;
    }
  } catch (e) {
    console.log('SMN no disponible, usando Open-Meteo fallback:', e);
  }

  // Fallback a Open-Meteo si SMN falla
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
        descripcion: WMO_CODES[midCode]?.desc || 'Desconocido',
        probLluvia: maxProb
      };
    };

    // Detectar si es de día basándose en is_day de Open-Meteo
    const esDiaOM = data.current.is_day === 1;
    const amanecerOM = new Date(data.daily.sunrise[0]).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const atardecerOM = new Date(data.daily.sunset[0]).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    climaData = {
      ciudad: ciudad,
      actual: {
        temp: Math.round(data.current.temperature_2m),
        sensacionTermica: Math.round(data.current.apparent_temperature || data.current.temperature_2m),
        humedad: data.current.relative_humidity_2m,
        viento: Math.round(data.current.wind_speed_10m),
        vientoDireccion: '', // Open-Meteo no proporciona dirección en current
        vientoDeg: 0,
        vientoRafaMax: data.current.wind_gusts_10m ? Math.round(data.current.wind_gusts_10m) : null,
        codigo: data.current.weather_code,
        descripcion: WMO_CODES[data.current.weather_code]?.desc || 'Desconocido',
        tipo: WMO_CODES[data.current.weather_code]?.type || (esDiaOM ? 'sun' : 'moon'),
        presion: Math.round(data.current.surface_pressure),
        precipitacion: data.current.precipitation || 0,
        visibilidad: data.current.visibility ? `${Math.round(data.current.visibility / 1000)} km` : 'N/D',
        visibilidadValor: data.current.visibility ? Math.round(data.current.visibility / 1000) : null,
        uv: Math.round(data.current.uv_index || 0),
        nubosidad: data.current.cloud_cover || 0,
        esDia: esDiaOM,
        amanecer: amanecerOM,
        atardecer: atardecerOM,
        // Datos de ubicación (aproximados)
        estacion: null,
        ubicacion: ciudad
      },
      pronostico: data.daily.time.slice(0, 7).map((fecha, i) => ({
        fecha: new Date(fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
        fechaCompleta: fecha,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        codigo: data.daily.weather_code[i],
        tipo: WMO_CODES[data.daily.weather_code[i]]?.type || 'sun',
        descripcion: WMO_CODES[data.daily.weather_code[i]]?.desc || 'Desconocido',
        probLluvia: data.daily.precipitation_probability_max[i] || 0,
        rafagas: null, // Open-Meteo no proporciona ráfagas en daily
        visibilidad: 'Variable',
        humedadMin: null,
        humedadMax: null,
        amanecer: new Date(data.daily.sunrise[i]).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        atardecer: new Date(data.daily.sunset[i]).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      })),
      diario: [
        { nombre: 'Madrugada', ...getPeriodo(0), vientoDireccion: '', rafagas: null, visibilidad: 'Variable', lluvia6h: 0 },
        { nombre: 'Mañana', ...getPeriodo(6), vientoDireccion: '', rafagas: null, visibilidad: 'Variable', lluvia6h: 0 },
        { nombre: 'Tarde', ...getPeriodo(12), vientoDireccion: '', rafagas: null, visibilidad: 'Variable', lluvia6h: 0 },
        { nombre: 'Noche', ...getPeriodo(18), vientoDireccion: '', rafagas: null, visibilidad: 'Variable', lluvia6h: 0 }
      ]
    };

    climaCiudad = ciudad;
    window.climaCiudad = climaCiudad;
    window.climaData = climaData;
    mostrarToast(`Clima actualizado (Open-Meteo): ${ciudad}`);

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
    paintFullClimateBackground(ctx, W, H, actual);

    const pad = Math.round(Math.min(W, H) * 0.035);
    const accentH = Math.max(4, Math.round(H * 0.005));

    // Header
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, W, accentH);
    const headerH = Math.round(H * 0.095);
    if (S.logoImg && ELS.logo && ELS.logo.visible) {
      const logo = ELS.logo;
      const logoW = logo.w || Math.round(W * 0.18);
      const logoH = logo.h || Math.round(logoW * (S.logoImg.height / S.logoImg.width));
      const logoX = logo.x !== null ? logo.x : pad;
      const logoY = logo.y !== null ? logo.y : accentH + Math.round((headerH - accentH - logoH) / 2);
      ctx.drawImage(S.logoImg, logoX, logoY, logoW, logoH);
    }
    ctx.textAlign = 'right';
    const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = (hoy.charAt(0).toUpperCase() + hoy.slice(1));
    ctx.font = 'bold 34px BebasNeue, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(ciudad.toUpperCase(), W - pad, accentH + Math.round(headerH * 0.52));
    ctx.shadowBlur = 0;
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(dateStr + ' | ' + hora, W - pad, accentH + Math.round(headerH * 0.82));

    // Main content: 4 period cards
    const mainY = headerH + Math.round(H * 0.04);
    const mainH = H - mainY - (climaAlerta && climaAlerta.trim() ? Math.round(H * 0.09) : Math.round(H * 0.025));

    ctx.font = `bold ${Math.round(H * 0.026)}px BebasNeue, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a6ce39';
    ctx.letterSpacing = '3px';
    ctx.fillText('EVOLUCIÓN DIARIA', W / 2, mainY + Math.round(H * 0.04));
    ctx.letterSpacing = '0';

    const periodW = Math.round((W - pad * 2) / 4);
    const itemsY = mainY + Math.round(H * 0.08);

    diario.forEach((periodo, i) => {
      const cx = pad + i * periodW + periodW / 2;
      const cy = itemsY;

      ctx.font = `bold ${Math.round(H * 0.02)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(periodo.nombre.toUpperCase(), cx, cy);

      dibujarIconoClima(ctx, cx, cy + Math.round(H * 0.1), Math.round(H * 0.09), periodo.tipo);

      ctx.font = `bold ${Math.round(H * 0.048)}px BebasNeue, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${periodo.temp}°`, cx, cy + Math.round(H * 0.22));

      if (periodo.probLluvia > 0) {
        ctx.font = `${Math.round(H * 0.016)}px Inter, sans-serif`;
        ctx.fillStyle = '#60A5FA';
        ctx.fillText(`${periodo.probLluvia}%`, cx, cy + Math.round(H * 0.28));
      }
    });

    // Alert
    if (climaAlerta && climaAlerta.trim()) {
      const alertaH = Math.round(H * 0.07);
      const alertaY = H - alertaH - Math.round(H * 0.015);
      const alertaPad = Math.round(H * 0.02);
      ctx.save();
      ctx.shadowColor = 'rgba(220, 53, 69, 0.6)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 4;
      const alertaGrad = ctx.createLinearGradient(pad, alertaY, pad, alertaY + alertaH);
      alertaGrad.addColorStop(0, '#DC3545');
      alertaGrad.addColorStop(0.5, '#E63946');
      alertaGrad.addColorStop(1, '#DC3545');
      ctx.fillStyle = alertaGrad;
      ctx.beginPath();
      ctx.roundRect(pad, alertaY, W - pad * 2, alertaH, 10);
      ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.font = `bold ${Math.round(H * 0.02)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 3;
      const alertaTexto = climaAlerta.toUpperCase();
      const maxW = (W - pad * 2) - alertaPad * 2;
      let fs = Math.round(H * 0.02);
      ctx.font = `bold ${fs}px Inter, sans-serif`;
      while (ctx.measureText(alertaTexto).width > maxW && fs > Math.round(H * 0.014)) { fs--; ctx.font = `bold ${fs}px Inter, sans-serif`; }
      ctx.fillText('⚠️  ' + alertaTexto, pad + alertaPad, alertaY + Math.round(alertaH * 0.62));
      ctx.shadowBlur = 0;
    }
  } else {
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

    const { actual, pronostico, ciudad } = climaData;
    paintFullClimateBackground(ctx, W, H, actual);

    const pad = Math.round(Math.min(W, H) * 0.035);
    const accentH = Math.max(4, Math.round(H * 0.005));

    // Header
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, W, accentH);
    const headerH = Math.round(H * 0.095);
    if (S.logoImg && ELS.logo && ELS.logo.visible) {
      const logo = ELS.logo;
      const logoW = logo.w || Math.round(W * 0.18);
      const logoH = logo.h || Math.round(logoW * (S.logoImg.height / S.logoImg.width));
      const logoX = logo.x !== null ? logo.x : pad;
      const logoY = logo.y !== null ? logo.y : accentH + Math.round((headerH - accentH - logoH) / 2);
      ctx.drawImage(S.logoImg, logoX, logoY, logoW, logoH);
    }
    ctx.textAlign = 'right';
    const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = (hoy.charAt(0).toUpperCase() + hoy.slice(1));
    ctx.font = 'bold 34px BebasNeue, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(ciudad.toUpperCase(), W - pad, accentH + Math.round(headerH * 0.52));
    ctx.shadowBlur = 0;
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(dateStr + ' | ' + hora, W - pad, accentH + Math.round(headerH * 0.82));

    // Hero section
    const heroY = headerH + Math.round(H * 0.025);
    const heroH = Math.round(H * 0.28);
    const iconSize = Math.round(Math.min(W, H) * 0.14);
    const iconX = Math.round(W / 2);
    const iconY = heroY + Math.round(heroH * 0.3);
    dibujarIconoClima(ctx, iconX, iconY, iconSize, actual.tipo);

    const tempSize = Math.round(Math.min(W, H) * 0.15);
    ctx.font = `bold ${tempSize}px BebasNeue, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    const tempY = iconY + Math.round(iconSize * 0.65);
    ctx.fillText(`${actual.temp}°`, iconX, tempY);
    ctx.shadowBlur = 0;

    const sensacion = actual.sensacionTermica !== undefined ? actual.sensacionTermica : actual.temp - Math.round(actual.viento / 10);
    ctx.font = `${Math.round(H * 0.016)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`Sensación térmica ${sensacion}°`, iconX, tempY + Math.round(H * 0.04));

    // Metrics row
    const metricsY = heroY + heroH + Math.round(H * 0.015);
    const metricsH = Math.round(H * 0.12);
    const cardGap = Math.round(W * 0.015);
    const cardW = Math.round((W - pad * 2 - cardGap * 3) / 4);

    const metricas = [
      { label: 'VIENTO', value: `${actual.viento}`, unit: ' km/h', icon: (c, x, y) => {
        c.fillStyle = 'rgba(200, 220, 255, 0.9)';
        c.beginPath(); c.moveTo(x-10, y+4); c.lineTo(x+10, y+4); c.lineTo(x+3, y-4);
        c.lineTo(x+10, y+4); c.lineTo(x+3, y+10); c.fill();
      }, color: 'rgba(160, 195, 255, 0.15)' },
      { label: 'HUMEDAD', value: `${actual.humedad}`, unit: '%', icon: (c, x, y) => {
        c.fillStyle = 'rgba(100, 200, 255, 0.9)';
        c.beginPath(); c.moveTo(x, y-8); c.bezierCurveTo(x-10, y, x-10, y+8, x, y+8);
        c.bezierCurveTo(x+10, y+8, x+10, y, x, y-8); c.fill();
      }, color: 'rgba(100, 200, 255, 0.15)' },
      { label: 'VISIBILIDAD', value: `${actual.visibilidadValor || 0}`, unit: ' km', icon: (c, x, y) => {
        c.fillStyle = 'rgba(150, 220, 150, 0.9)';
        c.beginPath(); c.arc(x, y, 8, 0, Math.PI*2); c.fill();
        c.strokeStyle = 'rgba(150, 220, 150, 0.4)'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 13, 0, Math.PI*2); c.stroke();
      }, color: 'rgba(150, 220, 150, 0.15)' },
      { label: 'SOL', value: actual.amanecer || '--:--', unit: '', icon: (c, x, y) => {
        c.fillStyle = '#ffcc33';
        c.beginPath(); c.arc(x, y, 8, 0, Math.PI*2); c.fill();
        c.strokeStyle = 'rgba(255, 204, 51, 0.5)'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 13, 0, Math.PI*2); c.stroke();
      }, color: 'rgba(255, 204, 51, 0.15)' },
    ];

    const iconCircleR = Math.round(cardH * 0.32);
    metricas.forEach((m, i) => {
      const cx = pad + i * (cardW + cardGap) + cardW / 2;
      const cy = metricsY + metricsH / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx - cardW / 2, metricsY, cardW, metricsH, 12);
      const glass = ctx.createLinearGradient(cx - cardW / 2, metricsY, cx + cardW / 2, metricsY);
      glass.addColorStop(0, 'rgba(255,255,255,0.03)');
      glass.addColorStop(0.5, 'rgba(255,255,255,0.06)');
      glass.addColorStop(1, 'rgba(255,255,255,0.03)');
      ctx.fillStyle = glass; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy - iconCircleR * 0.3, iconCircleR, 0, Math.PI * 2);
      ctx.fillStyle = m.color; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      m.icon(ctx, cx, cy - iconCircleR * 0.3);
      ctx.font = `bold ${Math.round(H * 0.03)}px BebasNeue, sans-serif`;
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
      ctx.fillText(m.value + m.unit, cx, cy + iconCircleR * 0.4);
      ctx.font = `${Math.round(H * 0.013)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(m.label, cx, cy + iconCircleR * 1.1);
    });

    // Footer section
    const footerY = metricsY + metricsH + Math.round(H * 0.025);
    const footerH = H - footerY - (climaAlerta && climaAlerta.trim() ? Math.round(H * 0.09) : Math.round(H * 0.015));

    if (climaMostrarPronostico && climaCiudadesMultiples.length === 0) {
      ctx.font = `bold ${Math.round(H * 0.02)}px BebasNeue, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a6ce39';
      ctx.letterSpacing = '3px';
      ctx.fillText('PRONÓSTICO 7 DÍAS', W / 2, footerY + Math.round(H * 0.035));
      ctx.letterSpacing = '0';

      const diaWidth = Math.round((W - pad * 2) / 7);
      const itemsY = footerY + Math.round(H * 0.06);

      pronostico.forEach((dia, i) => {
        const cx = pad + i * diaWidth + diaWidth / 2;
        ctx.font = `bold ${Math.round(H * 0.015)}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.textAlign = 'center';
        ctx.fillText(dia.fecha.toUpperCase(), cx, itemsY);
        dibujarIconoClima(ctx, cx, itemsY + Math.round(H * 0.07), Math.round(H * 0.055), dia.tipo);
        ctx.font = `bold ${Math.round(H * 0.028)}px BebasNeue, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${dia.tempMax}°`, cx, itemsY + Math.round(H * 0.14));
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `bold ${Math.round(H * 0.015)}px Inter, sans-serif`;
        ctx.fillText(`${dia.tempMin}°`, cx, itemsY + Math.round(H * 0.18));
        if (dia.probLluvia > 0) {
          ctx.fillStyle = '#60A5FA';
          ctx.font = `${Math.round(H * 0.013)}px Inter, sans-serif`;
          ctx.fillText(`${dia.probLluvia}%`, cx, itemsY + Math.round(H * 0.22));
        }
      });
    } else if (climaCiudadesMultiples.length > 0) {
      const halfH = Math.round(footerH / 2);
      const fcY1 = footerY;
      const fcY2 = footerY + halfH;

      ctx.font = `bold ${Math.round(H * 0.017)}px BebasNeue, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a6ce39';
      ctx.letterSpacing = '2px';
      ctx.fillText('PRONÓSTICO 7 DÍAS', W / 2, fcY1 + Math.round(H * 0.03));
      ctx.letterSpacing = '0';

      const diaWidth = Math.round((W - pad * 2) / 7);
      const pItemsY = fcY1 + Math.round(H * 0.05);
      pronostico.forEach((dia, i) => {
        const cx = pad + i * diaWidth + diaWidth / 2;
        ctx.font = `bold ${Math.round(H * 0.013)}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.textAlign = 'center';
        ctx.fillText(dia.fecha.toUpperCase(), cx, pItemsY);
        dibujarIconoClima(ctx, cx, pItemsY + Math.round(H * 0.05), Math.round(H * 0.04), dia.tipo);
        ctx.font = `bold ${Math.round(H * 0.022)}px BebasNeue, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${dia.tempMax}°`, cx, pItemsY + Math.round(H * 0.1));
      });

      ctx.font = `bold ${Math.round(H * 0.017)}px BebasNeue, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a6ce39';
      ctx.letterSpacing = '2px';
      ctx.fillText('OTRAS CIUDADES', W / 2, fcY2 + Math.round(H * 0.03));
      ctx.letterSpacing = '0';

      const cWidth = Math.round((W - pad * 2) / climaCiudadesMultiples.length);
      const cItemsY = fcY2 + Math.round(H * 0.05);
      climaCiudadesMultiples.forEach((c, i) => {
        const cx = pad + i * cWidth + cWidth / 2;
        ctx.font = `bold ${Math.round(H * 0.014)}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(c.nombre.toUpperCase(), cx, cItemsY);
        dibujarIconoClima(ctx, cx, cItemsY + Math.round(H * 0.05), Math.round(H * 0.04), c.actual.tipo);
        ctx.font = `bold ${Math.round(H * 0.026)}px BebasNeue, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${c.actual.temp}°`, cx, cItemsY + Math.round(H * 0.11));
      });
    }

    // Alert
    if (climaAlerta && climaAlerta.trim()) {
      const alertaH = Math.round(H * 0.07);
      const alertaY = H - alertaH - Math.round(H * 0.015);
      const alertaPad = Math.round(H * 0.02);
      ctx.save();
      ctx.shadowColor = 'rgba(220, 53, 69, 0.6)';
      ctx.shadowBlur = 15; ctx.shadowOffsetY = 4;
      const alertaGrad = ctx.createLinearGradient(pad, alertaY, pad, alertaY + alertaH);
      alertaGrad.addColorStop(0, '#DC3545'); alertaGrad.addColorStop(0.5, '#E63946'); alertaGrad.addColorStop(1, '#DC3545');
      ctx.fillStyle = alertaGrad;
      ctx.beginPath();
      ctx.roundRect(pad, alertaY, W - pad * 2, alertaH, 10);
      ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.font = `bold ${Math.round(H * 0.02)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 3;
      const alertaTexto = climaAlerta.toUpperCase();
      const maxW = (W - pad * 2) - alertaPad * 2;
      let fs = Math.round(H * 0.02);
      ctx.font = `bold ${fs}px Inter, sans-serif`;
      while (ctx.measureText(alertaTexto).width > maxW && fs > Math.round(H * 0.014)) { fs--; ctx.font = `bold ${fs}px Inter, sans-serif`; }
      ctx.fillText('⚠️  ' + alertaTexto, pad + alertaPad, alertaY + Math.round(alertaH * 0.62));
      ctx.shadowBlur = 0;
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// FONDO DINÁMICO COMPLETO PARA LA PLACA DE CLIMA
// Aplica efectos visuales según día/noche y tipo de clima
// ════════════════════════════════════════════════════════════════════

function paintFullClimateBackground(ctx, W, H, actual) {
  const rand = makeSeededRandom(`fullbg-${actual.codigo}-${actual.esDia ? 'd' : 'n'}-${actual.temp}`);
  const type = getClimateBackdropType(actual.codigo);
  const isNight = !actual.esDia;

  // Determinar proximidad al amanecer/atardecer para colores cálidos
  const ahora = new Date();
  const horaActual = ahora.getHours() + ahora.getMinutes() / 60;
  let nearSunset = false, nearSunrise = false;
  if (actual.amanecer && actual.atardecer) {
    const [amH, amM] = actual.amanecer.split(':').map(Number);
    const [atH, atM] = actual.atardecer.split(':').map(Number);
    const am = amH + amM / 60, at = atH + atM / 60;
    nearSunrise = Math.abs(horaActual - am) < 1;
    nearSunset = Math.abs(horaActual - at) < 1;
  }

  ctx.save();

  // ── Gradiente base del cielo ──
  const sky = ctx.createLinearGradient(0, 0, 0, H);

  if (isNight) {
    if (nearSunrise) {
      sky.addColorStop(0, '#0b1026'); sky.addColorStop(0.15, '#151030');
      sky.addColorStop(0.35, '#4a2060'); sky.addColorStop(0.55, '#c06040');
      sky.addColorStop(0.7, '#e89040'); sky.addColorStop(1, '#1a0f18');
    } else {
      sky.addColorStop(0, '#0b1026'); sky.addColorStop(0.25, '#151030');
      sky.addColorStop(0.55, '#1a1240'); sky.addColorStop(1, '#07090f');
    }
  } else if (type === 'storm' || type === 'rain-heavy') {
    sky.addColorStop(0, '#2a3a52'); sky.addColorStop(0.15, '#1e2840');
    sky.addColorStop(0.4, '#253550'); sky.addColorStop(0.7, '#1a2638');
    sky.addColorStop(1, '#0f1520');
  } else if (type === 'fog') {
    sky.addColorStop(0, '#8a9db0'); sky.addColorStop(0.15, '#7a8fa4');
    sky.addColorStop(0.4, '#6b8096'); sky.addColorStop(0.7, '#5a6c7e');
    sky.addColorStop(1, '#4a5c6a');
  } else if (type === 'snow') {
    sky.addColorStop(0, '#d0dff0'); sky.addColorStop(0.2, '#b8cce0');
    sky.addColorStop(0.45, '#a0b8cc'); sky.addColorStop(0.7, '#8898a8');
    sky.addColorStop(1, '#708090');
  } else if (type === 'cloud') {
    sky.addColorStop(0, '#6a8db8'); sky.addColorStop(0.2, '#5a7aa0');
    sky.addColorStop(0.45, '#4a6a8a'); sky.addColorStop(0.7, '#3a5270');
    sky.addColorStop(1, '#2a3a4a');
  } else if (type === 'sun-cloud') {
    if (nearSunset) {
      sky.addColorStop(0, '#7db8e8'); sky.addColorStop(0.15, '#8a9acc');
      sky.addColorStop(0.35, '#d09050'); sky.addColorStop(0.55, '#e8a040');
      sky.addColorStop(0.8, '#c07030'); sky.addColorStop(1, '#1a3a5a');
    } else {
      sky.addColorStop(0, '#7db8e8'); sky.addColorStop(0.2, '#5a9acc');
      sky.addColorStop(0.5, '#4a7aaa'); sky.addColorStop(0.75, '#3a5a8a');
      sky.addColorStop(1, '#1a3a5a');
    }
  } else if (type === 'rain' || type === 'rain-light') {
    sky.addColorStop(0, '#4a6080'); sky.addColorStop(0.15, '#3a5070');
    sky.addColorStop(0.4, '#304560'); sky.addColorStop(0.7, '#253550');
    sky.addColorStop(1, '#1a2840');
  } else {
    if (nearSunset) {
      sky.addColorStop(0, '#4da6ff'); sky.addColorStop(0.15, '#6a80cc');
      sky.addColorStop(0.35, '#d08040'); sky.addColorStop(0.55, '#f0a030');
      sky.addColorStop(0.75, '#c07030'); sky.addColorStop(1, '#0d3060');
    } else {
      sky.addColorStop(0, '#4da6ff'); sky.addColorStop(0.15, '#3a99ee');
      sky.addColorStop(0.35, '#3388dd'); sky.addColorStop(0.55, '#2277cc');
      sky.addColorStop(0.75, '#1a5a9a'); sky.addColorStop(1, '#0d3060');
    }
  }

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // ── Efecto de horizonte (brillo en el horizonte) ──
  const horizon = ctx.createLinearGradient(0, H * 0.35, 0, H);
  if (isNight) {
    if (nearSunrise) {
      horizon.addColorStop(0, 'rgba(220, 120, 60, 0.2)');
      horizon.addColorStop(0.25, 'rgba(180, 80, 40, 0.15)');
      horizon.addColorStop(0.5, 'rgba(80, 30, 80, 0.2)');
      horizon.addColorStop(1, 'rgba(10, 5, 20, 0.6)');
    } else {
      horizon.addColorStop(0, 'rgba(150, 80, 180, 0.12)');
      horizon.addColorStop(0.25, 'rgba(80, 40, 100, 0.18)');
      horizon.addColorStop(0.5, 'rgba(40, 20, 60, 0.25)');
      horizon.addColorStop(1, 'rgba(10, 5, 20, 0.5)');
    }
  } else if (type === 'storm') {
    horizon.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    horizon.addColorStop(0.5, 'rgba(100, 80, 120, 0.1)');
    horizon.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  } else if (type === 'fog' || type === 'snow') {
    horizon.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    horizon.addColorStop(0.4, 'rgba(220, 230, 240, 0.15)');
    horizon.addColorStop(1, 'rgba(180, 190, 200, 0.25)');
  } else {
    let glowColor;
    if (nearSunset) {
      glowColor = 'rgba(255, 180, 60, 0.35)';
    } else {
      glowColor = type === 'sun' || type === 'sun-cloud' ? 'rgba(255, 220, 100, 0.25)' : 'rgba(255, 255, 255, 0.18)';
    }
    horizon.addColorStop(0, glowColor);
    horizon.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
    horizon.addColorStop(0.6, 'rgba(255, 255, 255, 0.03)');
    horizon.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  }
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, W, H);

  // ── Capa atmosférica (neblina tenue en horizonte) ──
  if (!isNight && type !== 'storm' && type !== 'rain-heavy' && type !== 'fog') {
    const haze = ctx.createLinearGradient(0, H * 0.35, 0, H * 0.7);
    const hazeColor = nearSunset ? 'rgba(200, 140, 80, 0.08)' : 'rgba(200, 220, 255, 0.06)';
    haze.addColorStop(0, hazeColor);
    haze.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Sol o Luna ──
  if (isNight) {
    const moonX = W * 0.82;
    const moonY = H * 0.15;
    const moonR = Math.min(W, H) * 0.06;

    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 6);
    moonGlow.addColorStop(0, 'rgba(240, 245, 255, 0.25)');
    moonGlow.addColorStop(0.3, 'rgba(200, 210, 240, 0.12)');
    moonGlow.addColorStop(0.6, 'rgba(200, 210, 240, 0.04)');
    moonGlow.addColorStop(1, 'rgba(200, 210, 240, 0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#edf1ff';
    ctx.shadowColor = '#c5cae9';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = nearSunrise ? '#4a2060' : '#0b1026';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.35, moonY - moonR * 0.08, moonR * 0.88, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      const starX = rand() * W;
      const starY = rand() * H * 0.75;
      const starR = 0.5 + rand() * 2.2;
      ctx.globalAlpha = 0.2 + rand() * 0.8;
      ctx.beginPath();
      ctx.arc(starX, starY, starR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (type !== 'storm' && type !== 'rain-heavy') {
    const sunX = nearSunset ? W * 0.22 : W * 0.78;
    const sunY = nearSunset ? H * 0.65 : H * 0.18;
    const sunR = Math.min(W, H) * (nearSunset ? 0.08 : 0.07);

    const glowMultiplier = nearSunset ? 7 : 5;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * glowMultiplier);
    if (nearSunset) {
      sunGlow.addColorStop(0, 'rgba(255, 200, 80, 0.5)');
      sunGlow.addColorStop(0.3, 'rgba(255, 150, 50, 0.2)');
      sunGlow.addColorStop(0.6, 'rgba(255, 100, 30, 0.08)');
      sunGlow.addColorStop(1, 'rgba(255, 100, 30, 0)');
    } else {
      sunGlow.addColorStop(0, 'rgba(255, 230, 100, 0.35)');
      sunGlow.addColorStop(0.3, 'rgba(255, 220, 80, 0.15)');
      sunGlow.addColorStop(0.6, 'rgba(255, 200, 60, 0.05)');
      sunGlow.addColorStop(1, 'rgba(255, 200, 60, 0)');
    }
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, W, H);

    const sunColor = nearSunset ? '#ff9944' : '#ffd84d';
    const shadowColor = nearSunset ? '#ff7722' : '#ffc107';
    ctx.fillStyle = sunColor;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = nearSunset ? 35 : 25;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = nearSunset ? 'rgba(255, 180, 80, 0.5)' : 'rgba(255, 220, 80, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const rayCount = nearSunset ? 12 : 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = i * Math.PI * 2 / rayCount + (nearSunset ? 0.3 : 0);
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * sunR * (nearSunset ? 1.1 : 1.3), sunY + Math.sin(angle) * sunR * (nearSunset ? 1.1 : 1.3));
      ctx.lineTo(sunX + Math.cos(angle) * sunR * (nearSunset ? 1.5 : 1.9), sunY + Math.sin(angle) * sunR * (nearSunset ? 1.5 : 1.9));
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // ── Nubes decorativas ──
  if (type === 'cloud' || type === 'sun-cloud' || type === 'rain' || type === 'rain-light' ||
      type === 'rain-heavy' || type === 'storm' || type === 'fog') {
    const cloudCount = type === 'storm' ? 8 : type === 'fog' ? 5 : 4;
    for (let i = 0; i < cloudCount; i++) {
      const baseX = rand() * W * 1.2 - W * 0.1;
      const baseY = H * (0.08 + rand() * 0.32);
      const cloudW = W * (0.18 + rand() * 0.28);
      const cloudH = H * (0.04 + rand() * 0.07);
      const alpha = type === 'fog' ? 0.18 : type === 'storm' ? 0.22 : 0.14;

      const cloudColor = isNight ? `rgba(200, 210, 230, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
      ctx.fillStyle = cloudColor;
      ctx.beginPath();
      const cx = baseX + cloudW * 0.4, cy = baseY;
      const cw = cloudW * 0.38, ch = cloudH * 0.5;
      ctx.ellipse(cx, cy, cw, ch, -0.12, 0, Math.PI * 2);
      ctx.ellipse(cx + cw * 0.6, cy - ch * 0.15, cw * 0.5, ch * 0.55, -0.12, 0, Math.PI * 2);
      ctx.ellipse(cx - cw * 0.4, cy + ch * 0.08, cw * 0.35, ch * 0.45, -0.12, 0, Math.PI * 2);
      ctx.ellipse(cx + cw * 1.0, cy + ch * 0.12, cw * 0.3, ch * 0.4, -0.12, 0, Math.PI * 2);
      ctx.fill();

      if (type !== 'storm') {
        ctx.fillStyle = isNight ? `rgba(220, 230, 245, ${alpha * 0.6})` : `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(cx + cw * 0.2, cy - ch * 0.25, cw * 0.25, ch * 0.3, -0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Efecto de lluvia ──
  if (type === 'rain' || type === 'rain-light' || type === 'rain-heavy' || type === 'storm') {
    const rainAlpha = type === 'rain-heavy' || type === 'storm' ? 0.2 : 0.14;
    const rainCount = type === 'rain-heavy' || type === 'storm' ? 60 : 40;
    const lineW = type === 'rain-heavy' || type === 'storm' ? 2 : 1.5;

    for (let g = 0; g < 4; g++) {
      const groupX = g * W / 4;
      ctx.strokeStyle = `rgba(160, 195, 255, ${rainAlpha * (0.7 + rand() * 0.6)})`;
      ctx.lineWidth = lineW * (0.8 + rand() * 0.4);
      const countInGroup = Math.round(rainCount / 4);
      for (let i = 0; i < countInGroup; i++) {
        const rx = groupX + rand() * (W / 4);
        const ry = rand() * H * 0.9;
        const len = 12 + rand() * 32;
        const tilt = -4 + rand() * 2;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + tilt, ry + len);
        ctx.stroke();
      }
    }
  }

  // ── Copos de nieve ──
  if (type === 'snow') {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 6;
    for (let i = 0; i < 50; i++) {
      const sx = rand() * W;
      const sy = rand() * H * 0.9;
      const sr = 1 + rand() * 3.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + rand() * 0.4})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // ── Tormenta: rayos ──
  if (type === 'storm') {
    ctx.fillStyle = 'rgba(25, 10, 45, 0.3)';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 2; i++) {
      const boltX = W * (0.12 + rand() * 0.76);
      ctx.shadowColor = 'rgba(255, 245, 180, 0.6)';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = 'rgba(255, 250, 220, 0.4)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(boltX, H * 0.03);
      const segments = 3 + Math.floor(rand() * 3);
      let bx = boltX, by = H * 0.03;
      for (let s = 0; s < segments; s++) {
        bx += (rand() - 0.5) * 40;
        by += H * (0.08 + rand() * 0.08);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();

      ctx.shadowBlur = 30;
      ctx.strokeStyle = 'rgba(255, 250, 220, 0.15)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(boltX, H * 0.03);
      bx = boltX; by = H * 0.03;
      for (let s = 0; s < segments; s++) {
        bx += (rand() - 0.5) * 40;
        by += H * (0.08 + rand() * 0.08);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // ── Vignette (sombra en bordes) ──
  const vignette = ctx.createRadialGradient(W * 0.5, H * 0.42, Math.min(W, H) * 0.25, W * 0.5, H * 0.42, Math.max(W, H) * 0.88);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.5, 'rgba(0, 0, 0, 0.06)');
  vignette.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

// ════════════════════════════════════════════════════════════════════
// NUEVA PLANTILLA CLIMA COMBINADA - Tiempo actual + Evolución Diaria
// ════════════════════════════════════════════════════════════════════

function renderClimaCombinado(W, H) {
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

  // Fondo dinámico
  paintFullClimateBackground(ctx, W, H, actual);

  const pad = Math.round(Math.min(W, H) * 0.035);
  const accentH = Math.max(4, Math.round(H * 0.005));

  // ═══ 1. HEADER — acento verde + logo + ciudad/fecha ═══
  const headerH = Math.round(H * 0.095);

  // Línea de acento verde superior
  ctx.fillStyle = '#a6ce39';
  ctx.fillRect(0, 0, W, accentH);

  // Logo
  if (S.logoImg && ELS.logo && ELS.logo.visible) {
    const logo = ELS.logo;
    const logoW = logo.w || Math.round(W * 0.18);
    const logoH = logo.h || Math.round(logoW * (S.logoImg.height / S.logoImg.width));
    const logoX = logo.x !== null ? logo.x : pad;
    const logoY = logo.y !== null ? logo.y : accentH + Math.round((headerH - accentH - logoH) / 2);
    ctx.drawImage(S.logoImg, logoX, logoY, logoW, logoH);
  }

  // Ciudad + fecha
  ctx.textAlign = 'right';
  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = (hoy.charAt(0).toUpperCase() + hoy.slice(1));

  ctx.font = 'bold 34px BebasNeue, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 4;
  ctx.fillText(ciudad.toUpperCase(), W - pad, accentH + Math.round(headerH * 0.52));
  ctx.shadowBlur = 0;

  ctx.font = '500 13px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(dateStr + ' | ' + hora, W - pad, accentH + Math.round(headerH * 0.82));

  // ═══ 2. HERO — temperatura + icono + descripción ═══
  const heroY = headerH + Math.round(H * 0.025);
  const heroH = Math.round(H * 0.36);

  // Icono grande
  const iconSize = Math.round(Math.min(W, H) * 0.16);
  const iconX = Math.round(W / 2);
  const iconY = heroY + Math.round(heroH * 0.28);
  dibujarIconoClima(ctx, iconX, iconY, iconSize, actual.tipo);

  // Temperatura
  const tempSize = Math.round(Math.min(W, H) * 0.18);
  ctx.font = `bold ${tempSize}px BebasNeue, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  const tempY = iconY + Math.round(iconSize * 0.65);
  ctx.fillText(`${actual.temp}°`, iconX, tempY);
  ctx.shadowBlur = 0;

  // Description pill
  const descPillW = Math.round(W * 0.32);
  const descPillH = Math.round(H * 0.032);
  const descPillX = iconX - descPillW / 2;
  const descPillY = tempY + Math.round(H * 0.04);
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.roundRect(descPillX, descPillY, descPillW, descPillH, 999);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `bold ${Math.round(H * 0.018)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(actual.descripcion.toUpperCase(), iconX, descPillY + Math.round(descPillH * 0.68));
  ctx.restore();

  // Sensación térmica
  const sensacion = actual.sensacionTermica !== undefined ? actual.sensacionTermica : actual.temp - Math.round(actual.viento / 10);
  ctx.font = `${Math.round(H * 0.018)}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText(`Sensación térmica ${sensacion}°`, iconX, descPillY + descPillH + Math.round(H * 0.03));

  // ═══ 3. MÉTRICAS — 4 cards horizontales ═══
  const metricsY = heroY + heroH + Math.round(H * 0.015);
  const metricsH = Math.round(H * 0.14);
  const cardGap = Math.round(W * 0.015);
  const cardW = Math.round((W - pad * 2 - cardGap * 3) / 4);

  const metricas = [
    { label: 'VIENTO', value: `${actual.viento}`, unit: 'km/h', icon: (ctx, x, y) => {
      ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
      ctx.beginPath(); ctx.moveTo(x-10, y+4); ctx.lineTo(x+10, y+4); ctx.lineTo(x+3, y-4);
      ctx.lineTo(x+10, y+4); ctx.lineTo(x+3, y+10); ctx.fill();
    }, color: 'rgba(160, 195, 255, 0.15)' },
    { label: 'HUMEDAD', value: `${actual.humedad}`, unit: '%', icon: (ctx, x, y) => {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
      ctx.beginPath(); ctx.moveTo(x, y-8);
      ctx.bezierCurveTo(x-10, y, x-10, y+8, x, y+8);
      ctx.bezierCurveTo(x+10, y+8, x+10, y, x, y-8); ctx.fill();
    }, color: 'rgba(100, 200, 255, 0.15)' },
    { label: 'VISIBILIDAD', value: `${actual.visibilidadValor || 0}`, unit: 'km', icon: (ctx, x, y) => {
      ctx.fillStyle = 'rgba(150, 220, 150, 0.9)';
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(150, 220, 150, 0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI*2); ctx.stroke();
    }, color: 'rgba(150, 220, 150, 0.15)' },
    { label: 'SOL', value: actual.amanecer || '--:--', unit: '', icon: (ctx, x, y) => {
      ctx.fillStyle = '#ffcc33';
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 204, 51, 0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI*2); ctx.stroke();
    }, color: 'rgba(255, 204, 51, 0.15)' },
  ];

  const iconCircleR = Math.round(cardH * 0.3);
  metricas.forEach((m, i) => {
    const cx = pad + i * (cardW + cardGap) + cardW / 2;
    const cy = metricsY + metricsH / 2;

    // Glass card
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx - cardW / 2, metricsY, cardW, metricsH, 12);
    const glass = ctx.createLinearGradient(cx - cardW / 2, metricsY, cx + cardW / 2, metricsY);
    glass.addColorStop(0, 'rgba(255,255,255,0.03)');
    glass.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    glass.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Icon circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy - iconCircleR * 0.3, iconCircleR, 0, Math.PI * 2);
    ctx.fillStyle = m.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    m.icon(ctx, cx, cy - iconCircleR * 0.3);

    // Value
    ctx.font = `bold ${Math.round(H * 0.036)}px BebasNeue, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(m.value + m.unit, cx, cy + iconCircleR * 0.4);

    // Label
    ctx.font = `${Math.round(H * 0.014)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(m.label, cx, cy + iconCircleR * 1.1);
  });

  // ═══ 4. DIVISOR con "EVOLUCIÓN DIARIA" ═══
  const divY = metricsY + metricsH + Math.round(H * 0.02);
  ctx.fillStyle = 'rgba(166, 206, 57, 0.4)';
  ctx.fillRect(pad, divY, W - pad * 2, 1);

  ctx.font = `bold ${Math.round(H * 0.022)}px BebasNeue, sans-serif`;
  ctx.fillStyle = '#a6ce39';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('EVOLUCIÓN DIARIA', W / 2, divY + Math.round(H * 0.045));
  ctx.letterSpacing = '0';

  // ═══ 5. PRONÓSTICO — 4 periodos ═══
  const fcY = divY + Math.round(H * 0.06);
  const fcH = H - fcY - (climaAlerta && climaAlerta.trim() ? Math.round(H * 0.1) : Math.round(H * 0.015));
  const periodW = Math.round((W - pad * 2) / 4);

  diario.forEach((periodo, i) => {
    const cx = pad + i * periodW + periodW / 2;
    const cy = fcY + fcH / 2;

    // Period name
    ctx.font = `bold ${Math.round(H * 0.02)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(periodo.nombre.toUpperCase(), cx, cy - fcH * 0.25);

    // Icon
    dibujarIconoClima(ctx, cx, cy - fcH * 0.02, Math.round(fcH * 0.35), periodo.tipo);

    // Temperature
    ctx.font = `bold ${Math.round(H * 0.042)}px BebasNeue, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${periodo.temp}°`, cx, cy + fcH * 0.3);

    // Rain probability
    if (periodo.probLluvia > 0) {
      ctx.font = `${Math.round(H * 0.016)}px Inter, sans-serif`;
      ctx.fillStyle = '#60A5FA';
      ctx.fillText(`${periodo.probLluvia}%`, cx, cy + fcH * 0.42);
    }
  });

  // ═══ 6. ALERTA ═══
  if (climaAlerta && climaAlerta.trim()) {
    const alertaH = Math.round(H * 0.07);
    const alertaY = H - alertaH - Math.round(H * 0.015);
    const alertaPad = Math.round(H * 0.02);

    ctx.save();
    ctx.shadowColor = 'rgba(220, 53, 69, 0.6)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;
    const alertaGrad = ctx.createLinearGradient(pad, alertaY, pad, alertaY + alertaH);
    alertaGrad.addColorStop(0, '#DC3545');
    alertaGrad.addColorStop(0.5, '#E63946');
    alertaGrad.addColorStop(1, '#DC3545');
    ctx.fillStyle = alertaGrad;
    ctx.beginPath();
    ctx.roundRect(pad, alertaY, W - pad * 2, alertaH, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.round(H * 0.02)}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 3;
    const alertaTexto = climaAlerta.toUpperCase();
    const maxW = (W - pad * 2) - alertaPad * 2;
    let fs = Math.round(H * 0.02);
    ctx.font = `bold ${fs}px Inter, sans-serif`;
    while (ctx.measureText(alertaTexto).width > maxW && fs > Math.round(H * 0.014)) {
      fs--; ctx.font = `bold ${fs}px Inter, sans-serif`;
    }
    ctx.fillText('⚠️  ' + alertaTexto, pad + alertaPad, alertaY + Math.round(alertaH * 0.62));
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
