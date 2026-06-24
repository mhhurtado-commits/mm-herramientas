// ════════════════════════════════════════════════════════════════════
// PLANTILLAS ESPECIALES FÚTBOL 2026
// ════════════════════════════════════════════════════════════════════

// Agregar estas plantillas al objeto TPLS existente en app.js

const PLANTILLAS_FUTBOL = {
  // Placa de MAÑANA: partidos del día (próximos)
  'futbol-mañana': function(W, H) {
    // Fondo oscuro con banda verde MM inferior
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);
    
    // Banda verde MM en la parte inferior (30%)
    const bandaAlto = Math.round(H * 0.28);
    const g = ctx.createLinearGradient(0, H - bandaAlto, 0, H);
    g.addColorStop(0, 'rgba(166, 206, 57, 0.15)');
    g.addColorStop(1, 'rgba(166, 206, 57, 0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H - bandaAlto, W, bandaAlto);
    
    // Línea divisoria verde MM gruesa
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, H - bandaAlto, W, Math.round(H * 0.025));
    
    // Decoración: líneas verticales sutiles
    ctx.strokeStyle = 'rgba(166, 206, 57, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = (i + 1) * (W / 5);
      ctx.beginPath();
      ctx.moveTo(x, H - bandaAlto);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  },

  // Placa de NOCHE: resultados del día
  'futbol-noche': function(W, H) {
    // Fondo negro puro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    
    // Borde superior verde MM (línea fina)
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(0, 0, W, Math.round(H * 0.015));
    
    // Degradado sutil de abajo (para las goleadores/info)
    const g = ctx.createLinearGradient(0, H * 0.6, 0, H);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(166, 206, 57, 0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    
    // Borde derecho vertical (acento)
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(W - Math.round(W * 0.015), 0, Math.round(W * 0.015), H);
    // Líneas verticales sutiles
    ctx.strokeStyle = 'rgba(166, 206, 57, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = (i + 1) * (W / 5);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  },

  // Placa MINIMALISTA: solo equipos + score centrado
  'futbol-minimalista': function(W, H) {
    // Fondo blanco crema
    ctx.fillStyle = '#f5f9e8';
    ctx.fillRect(0, 0, W, H);
    
    // Rectángulo negro central (donde irá el score)
    const boxH = Math.round(H * 0.6);
    const boxW = Math.round(W * 0.8);
    const boxX = (W - boxW) / 2;
    const boxY = (H - boxH) / 2;
    
    ctx.fillStyle = '#111111';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    
    // Línea verde MM en el borde superior de la caja
    ctx.fillStyle = '#a6ce39';
    ctx.fillRect(boxX, boxY, boxW, Math.round(H * 0.02));
    
    // Línea verde MM en el borde inferior de la caja
    ctx.fillRect(boxX, boxY + boxH - Math.round(H * 0.02), boxW, Math.round(H * 0.02));
  },

  // ── FIFA OFICIAL: Azul profundo con acentos dorados ──
  'futbol-fifa': function(W, H) {
    // Fondo azul marino profundo con degradado
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0b1d3a');
    bg.addColorStop(0.5, '#0f2847');
    bg.addColorStop(1, '#071428');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Acento dorado superior (línea fina)
    const gold = '#c9a84c';
    ctx.fillStyle = gold;
    ctx.fillRect(0, 0, W, Math.round(H * 0.012));

    // Patrón geométrico sutil (líneas diagonales)
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.06)';
    ctx.lineWidth = 1;
    for (let i = -H; i < W + H; i += Math.round(W * 0.08)) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + H, H);
      ctx.stroke();
    }

    // Banda dorada inferior fina
    ctx.fillStyle = gold;
    ctx.fillRect(0, H - Math.round(H * 0.02), W, Math.round(H * 0.02));

    // Degradado inferior sutil
    const g2 = ctx.createLinearGradient(0, H * 0.7, 0, H);
    g2.addColorStop(0, 'rgba(0,0,0,0)');
    g2.addColorStop(1, 'rgba(201,168,76,0.08)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
  },

  // ── CANCHA: Verde césped con líneas de campo ──
  'futbol-cancha': function(W, H) {
    // Fondo verde césped degradado
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a5c2a');
    bg.addColorStop(0.3, '#1e6b30');
    bg.addColorStop(0.7, '#17522a');
    bg.addColorStop(1, '#0f3d1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Textura de césped (franjas verticales sutiles)
    const stripeW = Math.round(W / 12);
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(i * stripeW, 0, stripeW, H);
      }
    }

    // Línea central horizontal (como la mitad de cancha)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = Math.round(W * 0.004);
    ctx.beginPath();
    ctx.moveTo(Math.round(W * 0.05), Math.round(H * 0.5));
    ctx.lineTo(Math.round(W * 0.95), Math.round(H * 0.5));
    ctx.stroke();

    // Círculo central sutil
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.round(W * 0.12), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = Math.round(W * 0.004);
    ctx.stroke();

    // Overlay oscuro en bordes para legibilidad
    const ov = ctx.createLinearGradient(0, 0, 0, H);
    ov.addColorStop(0, 'rgba(0,0,0,0.35)');
    ov.addColorStop(0.3, 'rgba(0,0,0,0.1)');
    ov.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    ov.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = ov;
    ctx.fillRect(0, 0, W, H);
  },

  // ── ATARDECER: Gradiente cálido inspirado en México ──
  'futbol-atardecer': function(W, H) {
    // Degradado cálido de arriba a abajo
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a0a2e');
    bg.addColorStop(0.25, '#2d1b4e');
    bg.addColorStop(0.5, '#6b2d5b');
    bg.addColorStop(0.7, '#b5453a');
    bg.addColorStop(0.85, '#d4763a');
    bg.addColorStop(1, '#e8a84c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Overlay oscuro para legibilidad de texto
    const ov = ctx.createLinearGradient(0, 0, 0, H);
    ov.addColorStop(0, 'rgba(0,0,0,0.3)');
    ov.addColorStop(0.4, 'rgba(0,0,0,0.15)');
    ov.addColorStop(0.8, 'rgba(0,0,0,0.2)');
    ov.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = ov;
    ctx.fillRect(0, 0, W, H);

    // Línea decorativa dorada
    ctx.fillStyle = 'rgba(232,168,76,0.5)';
    ctx.fillRect(0, 0, W, Math.round(H * 0.008));
  },

  // ── CELESTE: Cielo limpio con acentos blancos ──
  'futbol-celeste': function(W, H) {
    // Degradado azul cielo
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a3a6b');
    bg.addColorStop(0.4, '#2a5da8');
    bg.addColorStop(0.7, '#4a8bc9');
    bg.addColorStop(1, '#1a3a6b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Franja blanca central sutil
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, Math.round(H * 0.38), W, Math.round(H * 0.24));

    // Overlay para legibilidad
    const ov = ctx.createLinearGradient(0, 0, 0, H);
    ov.addColorStop(0, 'rgba(0,0,0,0.2)');
    ov.addColorStop(0.5, 'rgba(0,0,0,0.05)');
    ov.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = ov;
    ctx.fillRect(0, 0, W, H);

    // Líneas blancas finas decorativas
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, 0, W, Math.round(H * 0.008));
    ctx.fillRect(0, H - Math.round(H * 0.008), W, Math.round(H * 0.008));
  },

  // ── PREMIUM: Degradado oscuro con acentos metálicos ──
  'futbol-premium': function(W, H) {
    // Degradado profundo
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d0221');
    bg.addColorStop(0.3, '#150734');
    bg.addColorStop(0.6, '#1a0a3e');
    bg.addColorStop(1, '#0a0118');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Efecto de brillo metálico sutil
    const shine = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, W * 0.6);
    shine.addColorStop(0, 'rgba(180,140,80,0.08)');
    shine.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, W, H);

    // Línea dorada superior
    const gold = '#b8860b';
    ctx.fillStyle = gold;
    ctx.fillRect(0, 0, W, Math.round(H * 0.01));
    ctx.fillRect(0, H - Math.round(H * 0.01), W, Math.round(H * 0.01));

    // Borde izquierdo dorado
    ctx.fillRect(0, 0, Math.round(W * 0.01), H);

    // Overlay sutil
    const ov = ctx.createLinearGradient(0, 0, 0, H);
    ov.addColorStop(0, 'rgba(0,0,0,0.15)');
    ov.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = ov;
    ctx.fillRect(0, 0, W, H);
  },
};

// Exportar las plantillas para agregarlas
function agregarPlantillasFutbol() {
  if (typeof TPLS !== 'undefined') {
    Object.assign(TPLS, PLANTILLAS_FUTBOL);
    console.log('✅ Plantillas Fútbol agregadas');
  }
}

// Llamar al cargar
agregarPlantillasFutbol();