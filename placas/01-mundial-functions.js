// ════════════════════════════════════════════════════════════════════
// MODO FÚTBOL 2026 - FUNCIONES MUNDIALISTAS (CORREGIDO)
// Obtiene API key desde el WORKER, no desde localStorage
// ════════════════════════════════════════════════════════════════════

const MUNDIAL_CONFIG = {
  competitionId: 2000,
  apiUrl: 'https://api.football-data.org/v4',
  season: 2026,
  timezone: 'America/Argentina/Buenos_Aires',
  workerUrl: 'https://mm-herramientas-worker.mhhurtado.workers.dev', // Cambiar si es necesario
};

const BANDERAS_PAISES = {
  'Argentina': '🇦🇷', 'Brazil': '🇧🇷', 'France': '🇫🇷', 'Germany': '🇩🇪',
  'Spain': '🇪🇸', 'Italy': '🇮🇹', 'England': '🇬🇧', 'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Poland': '🇵🇱',
  'Uruguay': '🇺🇾', 'Mexico': '🇲🇽', 'Colombia': '🇨🇴', 'Chile': '🇨🇱',
  'Peru': '🇵🇪', 'Ecuador': '🇪🇨', 'Paraguay': '🇵🇾', 'Venezuela': '🇻🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Greece': '🇬🇷', 'Czech Republic': '🇨🇿',
  'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Serbia': '🇷🇸', 'Ukraine': '🇺🇦',
  'Denmark': '🇩🇰', 'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Finland': '🇫🇮',
  'Iceland': '🇮🇸', 'Ireland': '🇮🇪', 'Scotland': '🇬🇧', 'Wales': '🇬🇧',
  'Turkey': '🇹🇷', 'Russia': '🇷🇺', 'Israel': '🇮🇱', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'Korea Republic': '🇰🇷', 'Korea': '🇰🇷', 'China PR': '🇨🇳', 'China': '🇨🇳', 'Australia': '🇦🇺', 'New Zealand': '🇳🇿',
  'Saudi Arabia': '🇸🇦', 'United Arab Emirates': '🇦🇪', 'UAE': '🇦🇪', 'Iran': '🇮🇷', 'Iraq': '🇮🇶',
  'Morocco': '🇲🇦', 'Egypt': '🇪🇬', 'Nigeria': '🇳🇬', 'Senegal': '🇸🇳',
  'Ghana': '🇬🇭', 'Cameroon': '🇨🇲', 'Tunisia': '🇹🇳', 'Algeria': '🇩🇿',
  'Costa Rica': '🇨🇷', 'Panama': '🇵🇦', 'Honduras': '🇭🇳', 'Jamaica': '🇯🇲',
  'Canada': '🇨🇦', 'United States': '🇺🇸', 'USA': '🇺🇸', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳',
  'Malaysia': '🇲🇾', 'Singapore': '🇸🇬', 'Indonesia': '🇮🇩', 'Philippines': '🇵🇭',
  'Czechia': '🇨🇿', 'CZE': '🇨🇿', 'North Korea': '🇰🇵', 'DPR Korea': '🇰🇵',
  'Ivory Coast': '🇨🇮', "Côte d'Ivoire": '🇨🇮', 'DR Congo': '🇨🇩',
  'South Africa': '🇿🇦', 'Burkina Faso': '🇧🇫', 'Cape Verde': '🇨🇻',
  'Equatorial Guinea': '🇬🇶', 'Sierra Leone': '🇸🇱',
  'Bosnia and Herzegovina': '🇧🇦', 'Bosnia-Herzegovina': '🇧🇦', 'Trinidad and Tobago': '🇹🇹',
  'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮', 'North Macedonia': '🇲🇰',
  'Qatar': '🇶🇦', 'Jordan': '🇯🇴', 'Lebanon': '🇱🇧', 'India': '🇮🇳',
  'Tanzania': '🇹🇿', 'Kenya': '🇰🇪', 'Zambia': '🇿🇲', 'Angola': '🇦🇴',
  'Mozambique': '🇲🇿', 'Madagascar': '🇲🇬', 'Mali': '🇲🇱', 'Guinea': '🇬🇳',
  'Haiti': '🇭🇹', 'Dominican Republic': '🇩🇴', 'Guatemala': '🇬🇹', 'El Salvador': '🇸🇻',
  'Bolivia': '🇧🇴', 'Fiji': '🇫🇯', 'Cuba': '🇨🇺',
  'Uzbekistan': '🇺🇿', 'Uzbekistán': '🇺🇿',
  'Curacao': '🇨🇼', 'Curaçao': '🇨🇼', 'Curazao': '🇨🇼',
  'Chequia': '🇨🇿',
  'Democratic Republic of Congo': '🇨🇩', 'Congo DR': '🇨🇩', 'RD Congo': '🇨🇩',
  'Bosnia y Herzegovina': '🇧🇦',
};

function getBandera(pais) {
  return BANDERAS_PAISES[pais] || '⚽';
}

function traducirPais(nombre) {
  const map = {
    'Argentina': 'Argentina', 'Brazil': 'Brasil', 'France': 'Francia', 'Germany': 'Alemania',
    'Spain': 'España', 'Italy': 'Italia', 'England': 'Inglaterra', 'Portugal': 'Portugal',
    'Netherlands': 'Países Bajos', 'Belgium': 'Bélgica', 'Croatia': 'Croacia', 'Poland': 'Polonia',
    'Uruguay': 'Uruguay', 'Mexico': 'México', 'Colombia': 'Colombia', 'Chile': 'Chile',
    'Peru': 'Perú', 'Ecuador': 'Ecuador', 'Paraguay': 'Paraguay', 'Venezuela': 'Venezuela',
    'Switzerland': 'Suiza', 'Austria': 'Austria', 'Greece': 'Grecia', 'Czech Republic': 'Chequia',
    'Czechia': 'Chequia', 'CZE': 'Chequia',
    'Hungary': 'Hungría', 'Romania': 'Rumania', 'Serbia': 'Serbia', 'Ukraine': 'Ucrania',
    'Denmark': 'Dinamarca', 'Sweden': 'Suecia', 'Norway': 'Noruega', 'Finland': 'Finlandia',
    'Iceland': 'Islandia', 'Ireland': 'Irlanda', 'Turkey': 'Turquía', 'Russia': 'Rusia',
    'Israel': 'Israel', 'Japan': 'Japón', 'South Korea': 'Corea del Sur', 'Korea Republic': 'Corea del Sur',
    'Korea': 'Corea del Sur', 'China PR': 'China', 'China': 'China',
    'Australia': 'Australia', 'New Zealand': 'Nueva Zelanda', 'Saudi Arabia': 'Arabia Saudita',
    'United Arab Emirates': 'Emiratos Árabes', 'UAE': 'Emiratos Árabes',
    'Iran': 'Irán', 'Iraq': 'Irak',
    'Morocco': 'Marruecos', 'Egypt': 'Egipto', 'Nigeria': 'Nigeria', 'Senegal': 'Senegal',
    'Ghana': 'Ghana', 'Cameroon': 'Camerún', 'Tunisia': 'Túnez', 'Algeria': 'Argelia',
    'Costa Rica': 'Costa Rica', 'Panama': 'Panamá', 'Honduras': 'Honduras', 'Jamaica': 'Jamaica',
    'Canada': 'Canadá', 'United States': 'Estados Unidos', 'USA': 'Estados Unidos',
    'Thailand': 'Tailandia',
    'Vietnam': 'Vietnam', 'Malaysia': 'Malasia', 'Singapore': 'Singapur',
    'Indonesia': 'Indonesia', 'Philippines': 'Filipinas',
    'North Korea': 'Corea del Norte', 'DPR Korea': 'Corea del Norte',
    'Ivory Coast': 'Costa de Marfil', "Côte d'Ivoire": 'Costa de Marfil',
    'DR Congo': 'RD Congo', 'Democratic Republic of Congo': 'RD Congo', 'Congo DR': 'RD Congo',
    'South Africa': 'Sudáfrica', 'Burkina Faso': 'Burkina Faso',
    'Cape Verde': 'Cabo Verde', 'Equatorial Guinea': 'Guinea Ecuatorial',
    'Sierra Leone': 'Sierra Leona', 'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
    'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
    'Trinidad and Tobago': 'Trinidad y Tobago',
    'Wales': 'Gales', 'Scotland': 'Escocia', 'Northern Ireland': 'Irlanda del Norte',
    'Slovakia': 'Eslovaquia', 'Slovenia': 'Eslovenia', 'North Macedonia': 'Macedonia del Norte',
    'Albania': 'Albania', 'Montenegro': 'Montenegro', 'Kosovo': 'Kosovo',
    'Georgia': 'Georgia', 'Armenia': 'Armenia', 'Azerbaijan': 'Azerbaiyán',
    'Kazakhstan': 'Kazajistán', 'Uzbekistan': 'Uzbekistán',
    'Qatar': 'Qatar', 'Bahrain': 'Baréin', 'Oman': 'Omán', 'Kuwait': 'Kuwait',
    'Jordan': 'Jordania', 'Lebanon': 'Líbano', 'Syria': 'Siria', 'Palestine': 'Palestina',
    'India': 'India', 'Pakistan': 'Pakistán', 'Bangladesh': 'Bangladés',
    'Nepal': 'Nepal', 'Sri Lanka': 'Sri Lanka', 'Myanmar': 'Myanmar',
    'Cambodia': 'Camboya', 'Laos': 'Laos',
    'Tanzania': 'Tanzania', 'Kenya': 'Kenia', 'Uganda': 'Uganda',
    'Ethiopia': 'Etiopía', 'Mali': 'Mali', 'Zambia': 'Zambia',
    'Zimbabwe': 'Zimbabue', 'Mozambique': 'Mozambique', 'Angola': 'Angola',
    'Togo': 'Togo', 'Benin': 'Benín', 'Guinea': 'Guinea',
    'Gabon': 'Gabón', 'Congo': 'Congo', 'Madagascar': 'Madagascar',
    'Mauritius': 'Mauricio', 'Rwanda': 'Ruanda', 'Burundi': 'Burundi',
    'Cuba': 'Cuba', 'Haiti': 'Haití', 'Dominican Republic': 'Rep. Dominicana',
    'Guatemala': 'Guatemala', 'El Salvador': 'El Salvador', 'Nicaragua': 'Nicaragua',
    'Bolivia': 'Bolivia', 'Guyana': 'Guyana', 'Suriname': 'Surinam',
    'Fiji': 'Fiji', 'Papua New Guinea': 'Papúa Nueva Guinea',
    'Solomon Islands': 'Islas Salomón', 'Tahiti': 'Tahití',
    'Curacao': 'Curazao', 'Curaçao': 'Curazao',
    // ── Variantes en portugués/francés/otras APIs ──
    'Turquie': 'Turquía', 'Turkiye': 'Turquía', 'Türkiye': 'Turquía',
    'Marrocos': 'Marruecos', 'Maroc': 'Marruecos',
    'Haïti': 'Haití', 'Haïti': 'Haití',
    'Irã': 'Irán', 'Irán': 'Irán',
    'Estados Unidos da América': 'Estados Unidos', 'États-Unis': 'Estados Unidos',
    'United States of America': 'Estados Unidos',
    'Suíça': 'Suiza', 'Schweiz': 'Suiza',
    'Canadá': 'Canadá', 'Canada': 'Canadá',
    'Catar': 'Qatar',
    'Bósnia e Herzegovina': 'Bosnia y Herzegovina', 'Bósnia': 'Bosnia y Herzegovina',
    'Paraguai': 'Paraguay', 'Uruguai': 'Uruguay', 'Equador': 'Ecuador',
    'Colômbia': 'Colombia', 'Argentina': 'Argentina',
    'Austrália': 'Australia', 'Nova Zelândia': 'Nueva Zelanda',
    'Arábia Saudita': 'Arabia Saudita', 'Japão': 'Japão',
    'Coreia do Sul': 'Corea del Sur', 'Coreia do Norte': 'Corea del Norte',
    'Escócia': 'Escocia', 'País de Gales': 'Gales', 'Gales': 'Gales',
    'Dinamarca': 'Dinamarca', 'Suécia': 'Suecia', 'Noruega': 'Noruega',
    'Finlândia': 'Finlandia', 'Islândia': 'Islandia',
    'Bélgica': 'Bélgica', 'Holanda': 'Países Bajos', 'Países Baixos': 'Países Bajos',
    'Polónia': 'Polonia', 'Croácia': 'Croacia', 'Sérvia': 'Serbia',
    'Eslováquia': 'Eslovaquia', 'Eslovénia': 'Eslovenia',
    'Hungria': 'Hungría', 'Roménia': 'Rumania', 'Ucrânia': 'Ucrania',
    'Áustria': 'Austria', 'Grécia': 'Grecia',
    'Nigéria': 'Nigeria', 'Camarões': 'Camerún', 'Argélia': 'Argelia',
    'Tunísia': 'Túnez', 'Egito': 'Egipto', 'Senegal': 'Senegal',
    'Costa do Marfim': 'Costa de Marfil', 'África do Sul': 'Sudáfrica',
    'Cabo Verde': 'Cabo Verde',
  };
  return map[nombre] || nombre;
}

function formatearHora(isoString) {
  try {
    const fecha = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: MUNDIAL_CONFIG.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(fecha);
  } catch (e) {
    return '??:??';
  }
}

// ── Deduplicar partidos del lado cliente (defensa extra ante duplicados de APIs) ──
function deduplicarPartidos(partidos) {
  if (!partidos || partidos.length <= 1) return partidos;
  const norm = (n) => (typeof traducirPais === 'function' ? traducirPais(n) : n).toLowerCase().trim();
  const result = [];
  partidos.forEach(p => {
    const pLocal = norm(p.local);
    const pVis = norm(p.visitante);
    const yaExiste = result.some(r => {
      const rLocal = norm(r.local);
      const rVis = norm(r.visitante);
      // Coincidencia directa (local-visitante o visitante-local)
      if (pLocal === rLocal && pVis === rVis) return true;
      if (pLocal === rVis && pVis === rLocal) return true;
      // Coincidencia por hora cercana (<90min) + al menos un equipo igual
      try {
        const tP = new Date(p.horaUTC).getTime();
        const tR = new Date(r.horaUTC).getTime();
        if (Math.abs(tP - tR) < 90 * 60 * 1000 && (pLocal === rLocal || pVis === rVis)) return true;
      } catch(e) {}
      return false;
    });
    if (!yaExiste) result.push(p);
  });
  return result;
}

function formatearFecha(isoString) {
  try {
    const fecha = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: MUNDIAL_CONFIG.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(fecha);
  } catch (e) {
    return isoString;
  }
}

function obtenerFechaArgentina() {
  try {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: MUNDIAL_CONFIG.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // sv-SE locale uses YYYY-MM-DD format
    return formatter.format(new Date());
  } catch (e) {
    // Fallback: restar 3 horas a UTC
    const ahora = new Date();
    const arHoy = new Date(ahora.getTime() - (3 * 60 * 60 * 1000));
    return arHoy.toISOString().split('T')[0];
  }
}

// ── NUEVA FUNCIÓN: Obtener API key desde el worker ──
async function obtenerApiKeyDelWorker() {
  try {
    // El worker devuelve la API key en una ruta protegida
    // Por ahora, la obtenemos desde el endpoint de diagnóstico
    // o podemos crear un nuevo endpoint en el worker específicamente para esto
    
    // OPCIÓN 1: Si el worker tiene un endpoint para obtener la key
    // const res = await fetch(`${MUNDIAL_CONFIG.workerUrl}/api/config/football-key`);
    // if (!res.ok) throw new Error('No se pudo obtener la API key');
    // const data = await res.json();
    // return data.apiKey;
    
    // OPCIÓN 2: Por ahora, retornamos null y usamos el worker como proxy
    // El worker ya tiene la key en env.FOOTBALL_DATA_API_KEY
    return null;
  } catch (e) {
    console.error('Error obteniendo API key:', e);
    return null;
  }
}

// ── FUNCIÓN PROXY: Llamar al worker que ya tiene la key (football-data) ──
async function obtenerPartidosMundialViaWorker(fecha) {
  try {
    const url = `${MUNDIAL_CONFIG.workerUrl}/mundo/partidos?fecha=${fecha}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error('Error en worker:', res.status);
      showToast('❌ Error al obtener partidos');
      return null;
    }

    const data = await res.json();
    
    if (!data.partidos || data.partidos.length === 0) {
      return { 
        fecha, 
        partidos: [], 
        mensaje: 'Sin partidos para esta fecha' 
      };
    }

    return data;
  } catch (e) {
    console.error('Error fetching partidos:', e);
    showToast('❌ Error de conexión');
    return null;
  }
}

// ── FUNCIÓN COMBINADA: Usa ambas APIs ──
async function obtenerPartidosCombinadosViaWorker(fecha) {
  try {
    const url = `${MUNDIAL_CONFIG.workerUrl}/mundo/partidos-combinados?fecha=${fecha}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error('Error en worker (combinado):', res.status);
      // Fallback al endpoint simple
      return obtenerPartidosMundialViaWorker(fecha);
    }

    const data = await res.json();
    
    if (!data.partidos || data.partidos.length === 0) {
      return { 
        fecha, 
        partidos: [], 
        fuentes: data.fuentes || [],
        mensaje: 'Sin partidos para esta fecha' 
      };
    }

    return data;
  } catch (e) {
    console.error('Error fetching partidos combinados:', e);
    // Fallback al endpoint simple
    return obtenerPartidosMundialViaWorker(fecha);
  }
}

// ── Obtener posiciones de grupos ──
async function obtenerPosicionesGrupos() {
  try {
    const url = `${MUNDIAL_CONFIG.workerUrl}/mundo/posiciones`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.grupos || null;
  } catch (e) {
    console.error('Error obteniendo posiciones:', e);
    return null;
  }
}

// ── Obtener bracket de eliminación directa (Zafronix) ──
async function obtenerBracketMundial() {
  try {
    const url = `${MUNDIAL_CONFIG.workerUrl}/mundo/bracket`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.etapas || null;
  } catch (e) {
    console.error('Error obteniendo bracket:', e);
    return null;
  }
}

// ── Obtener planteles del Mundial (Zafronix) ──
async function obtenerPlantelesMundial() {
  try {
    const url = `${MUNDIAL_CONFIG.workerUrl}/mundo/planteles`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.equipos || null;
  } catch (e) {
    console.error('Error obteniendo planteles:', e);
    return null;
  }
}

// ── Obtener estadios del Mundial (Zafronix) ──
async function obtenerEstadiosMundial() {
  try {
    const url = `${MUNDIAL_CONFIG.workerUrl}/mundo/estadios`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.estadios || null;
  } catch (e) {
    console.error('Error obteniendo estadios:', e);
    return null;
  }
}

// ── Obtener goleadores ──
async function obtenerGoleadores() {
  try {
    const url = `${MUNDIAL_CONFIG.workerUrl}/mundo/goleadores`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.goleadores || null;
  } catch (e) {
    console.error('Error obteniendo goleadores:', e);
    return null;
  }
}

// ── Obtener detalle enriquecido de un partido ──
async function obtenerDetallePartido(fixtureId) {
  try {
    const url = `${MUNDIAL_CONFIG.workerUrl}/mundo/detalle-partido?fixtureId=${fixtureId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Error obteniendo detalle:', e);
    return null;
  }
}

// ── Obtener partidos del worker (usa endpoint COMBINADO: football-data + API-Football + TheSportsDB) ──
async function obtenerPartidosMundial(fecha) {
  // Intentar endpoint combinado (datos más ricos: ciudad, árbitro, eventos, HT)
  const combinado = await obtenerPartidosCombinadosViaWorker(fecha);
  if (combinado && !combinado.error) return combinado;
  // Fallback al endpoint simple
  return obtenerPartidosMundialViaWorker(fecha);
}

// ── Fallback: generar títulos sin IA ──
function generarTitulosFallback(tipo, partidos, partidoSingle) {
  if (tipo === 'manana' && partidos.length > 0) {
    const count = partidos.length;
    const primerasHoras = partidos.slice(0, 3).map(p => p.hora).join(', ');
    return {
      titular: `${count} partido${count > 1 ? 's' : ''} del Mundial hoy`,
      bajada: `La acción arranca a las ${primerasHoras} hs`
    };
  }
  if (tipo === 'noche' && partidos.length > 0) {
    const terminados = partidos.filter(p => p.golesLocal !== null);
    return {
      titular: `${terminados.length} resultado${terminados.length > 1 ? 's' : ''} del Mundial`,
      bajada: 'Conocé todos los goles y lo mejor de la jornada'
    };
  }
  if (tipo === 'partido' && partidoSingle) {
    const p = partidoSingle;
    if (p.estado === 'FINISHED') {
      return {
        titular: `${p.local} ${p.golesLocal}-${p.golesVisitante} ${p.visitante}`,
        bajada: (p.estadio || 'Mundial 2026')
      };
    }
    return {
      titular: `${p.local} vs ${p.visitante}`,
      bajada: `${p.hora} hs • ${p.estadio || 'Mundial 2026'}`
    };
  }
  return { titular: 'Mundial 2026', bajada: 'Seguí toda la acción' };
}

// ── Generar placa con IA (Gemini) ──
async function generarPlacaMundial(tipo, partidos, partidoSingle = null) {
  // Si Gemini no está disponible, generar títulos automáticamente
  if (typeof window.callGemini !== 'function') {
    console.log('Gemini no disponible, generando títulos automáticamente');
    return generarTitulosFallback(tipo, partidos, partidoSingle);
  }

  let prompt = '';

  if (tipo === 'manana') {
    const listado = partidos
      .map(p => `${p.banderaLocal} ${p.local} vs ${p.visitante} ${p.banderaVisitante} - ${p.hora} (${p.estadio})`)
      .join('\n');

    prompt = `Generá un titular y bajada para una placa de redes sociales sobre los partidos del Mundial 2026 de hoy:

${listado}

Responde en este formato exacto:
TITULAR: [máximo 80 caracteres]
BAJADA: [máximo 150 caracteres]`;

  } else if (tipo === 'noche') {
    const listado = partidos
      .map(p => {
        const score = `${p.golesLocal !== null ? p.golesLocal : '?'}-${p.golesVisitante !== null ? p.golesVisitante : '?'}`;
        return `${p.banderaLocal} ${p.local} ${score} ${p.visitante} ${p.banderaVisitante}`;
      })
      .join('\n');

    prompt = `Generá un titular y bajada para una placa de redes sobre los resultados del Mundial 2026 de hoy:

${listado}

Responde en este formato exacto:
TITULAR: [máximo 80 caracteres]
BAJADA: [máximo 150 caracteres]`;

  } else if (tipo === 'partido') {
    const p = partidoSingle;
    const info = p.estado === 'FINISHED'
      ? `${p.banderaLocal} ${p.local} ${p.golesLocal}-${p.golesVisitante} ${p.visitante} ${p.banderaVisitante}`
      : `${p.banderaLocal} ${p.local} vs ${p.visitante} ${p.banderaVisitante} - ${p.hora}`;

    prompt = `Generá un titular y bajada para una placa de redes sobre este partido del Mundial 2026:

${info}
Estadio: ${p.estadio}

Responde en este formato exacto:
TITULAR: [máximo 80 caracteres]
BAJADA: [máximo 150 caracteres]`;
  }

  try {
    const respuesta = await window.callGemini(prompt);
    const lines = respuesta.split('\n');
    
    let titular = '', bajada = '';
    lines.forEach(line => {
      if (line.startsWith('TITULAR:')) titular = line.replace('TITULAR:', '').trim();
      if (line.startsWith('BAJADA:')) bajada = line.replace('BAJADA:', '').trim();
    });

    return { titular: titular || 'Titular generado', bajada: bajada || 'Bajada generada' };
  } catch (e) {
    console.error('Error Gemini:', e);
    return { titular: 'Partido del Mundial', bajada: 'Editar título y bajada' };
  }
}

async function cargarPartidosMundial(fecha) {
  showLoading(true);
  const resultado = await obtenerPartidosMundial(fecha);
  showLoading(false);

  if (!resultado) return;

  window._mundialData = resultado;
  window._mundialFechaSeleccionada = fecha;

  return resultado;
}

async function generarPlacaPartidosDelDia(fecha) {
  const resultado = await cargarPartidosMundial(fecha);
  if (!resultado || resultado.partidos.length === 0) {
    showToast('Sin partidos para esta fecha');
    return;
  }

  S.mode = 'futbol';
  S.title = 'PARTIDOS DEL DÍA';
  S.cat = 'MUNDIAL 2026';
  S.tpl = 'futbol-mañana';
  S.mundialTipo = 'partidos-dia';
  resultado.partidos = deduplicarPartidos(resultado.partidos);
  S.mundialData = resultado;
  // Resetear posiciones de bloques para que se ajusten al contenido
  resetElPos('header');
  resetElPos('matches');
  resetElPos('mlogo');
  resetElPos('logo');

  document.getElementById('titIn').value = S.title;
  document.getElementById('catIn').value = S.cat;

  snapShot();
  resizeCanvas();
  render();
  drawPreviews();

  showToast(`✅ Placa generada (${resultado.partidos.length} partido${resultado.partidos.length > 1 ? 's' : ''})`);
  iniciarAutoRefresh();
}

async function generarPlacaResultadosDelDia(fecha) {
  const resultado = await cargarPartidosMundial(fecha);
  if (!resultado || resultado.partidos.length === 0) {
    showToast('Sin partidos para esta fecha');
    return;
  }

  const terminados = resultado.partidos.filter(p => p.golesLocal !== null && p.golesLocal !== undefined);
  if (terminados.length === 0) {
    showToast('Sin partidos finalizados aún');
    return;
  }

  S.mode = 'futbol';
  S.title = 'RESULTADOS DEL DÍA';
  S.cat = 'MUNDIAL 2026';
  S.tpl = 'futbol-noche';
  S.mundialTipo = 'resultados-dia';
  resultado.partidos = deduplicarPartidos(resultado.partidos);
  S.mundialData = resultado;
  // Resetear posiciones de bloques para que se ajusten al contenido
  resetElPos('header');
  resetElPos('matches');
  resetElPos('mlogo');
  resetElPos('logo');

  document.getElementById('titIn').value = S.title;
  document.getElementById('catIn').value = S.cat;

  snapShot();
  resizeCanvas();
  render();
  drawPreviews();

  showToast(`✅ Placa de resultados generada (${terminados.length} partido${terminados.length > 1 ? 's' : ''})`);
  iniciarAutoRefresh();
}

async function generarPlacaPartidoIndividual(fecha, matchId) {
  const resultado = await cargarPartidosMundial(fecha);
  if (!resultado) return;

  const partido = resultado.partidos.find(p => p.id === matchId);
  if (!partido) {
    showToast('Partido no encontrado');
    return;
  }

  // Intentar enriquecer con detalle del partido (eventos, formaciones, stats)
  try {
    // Usar afFixtureId (API-Football) si existe, sino el ID genérico
    const detailId = partido.afFixtureId || matchId;
    const detalle = await obtenerDetallePartido(detailId);
    if (detalle && !detalle.error) {
      // Fusionar datos enriquecidos
      if (detalle.eventos && detalle.eventos.length > 0) partido.eventos = detalle.eventos;
      if (detalle.formacionLocal) partido.formacionLocal = detalle.formacionLocal;
      if (detalle.formacionVisitante) partido.formacionVisitante = detalle.formacionVisitante;
      if (detalle.estadisticas && detalle.estadisticas.length > 0) partido.estadisticas = detalle.estadisticas;
    }
  } catch(e) {
    console.log('Detalle no disponible, usando datos base:', e);
  }

  const localTr = (typeof traducirPais === 'function' ? traducirPais(partido.local) : partido.local).toUpperCase();
  const visitTr = (typeof traducirPais === 'function' ? traducirPais(partido.visitante) : partido.visitante).toUpperCase();

  S.mode = 'futbol';
  S.title = '';
  S.cat = partido.grupo || 'MUNDIAL 2026';
  S.tpl = 'futbol-noche';
  S.mundialTipo = 'partido-individual';
  S.mundialData = { fecha, partidos: [partido] };
  // Resetear posiciones de bloques para que se ajusten al contenido
  resetElPos('header');
  resetElPos('matches');
  resetElPos('mlogo');
  resetElPos('logo');

  document.getElementById('titIn').value = '';
  document.getElementById('catIn').value = S.cat;

  snapShot();
  resizeCanvas();
  render();
  drawPreviews();

  showToast('✅ Placa de partido generada');
}

// ════════════════════════════════════════════════════════════════
// AUTO-REFRESH PARA PARTIDOS EN VIVO
// ════════════════════════════════════════════════════════════════

let _mundialRefreshInterval = null;
const MUNDIAL_REFRESH_MS = 60000; // 60 segundos

function iniciarAutoRefresh() {
  detenerAutoRefresh();
  _mundialRefreshInterval = setInterval(async () => {
    // Solo refrescar si estamos en modo fútbol y hay partidos en juego
    if (S.mode !== 'futbol' || !S.mundialData || !S.mundialData.partidos) return;
    const hayEnVivo = S.mundialData.partidos.some(p => p.estado === 'IN_PLAY');
    if (!hayEnVivo) return;

    const fecha = S.mundialData.fecha || obtenerFechaArgentina();
    const resultado = await obtenerPartidosMundial(fecha);
    if (!resultado || !resultado.partidos) return;

    // Actualizar scores y estados sin perder la referencia
    resultado.partidos.forEach(nuevo => {
      const existente = S.mundialData.partidos.find(p => p.id === nuevo.id);
      if (existente) {
        existente.golesLocal = nuevo.golesLocal;
        existente.golesVisitante = nuevo.golesVisitante;
        existente.golesHTLocal = nuevo.golesHTLocal;
        existente.golesHTVisitante = nuevo.golesHTVisitante;
        existente.estado = nuevo.estado;
        existente.goleadores = nuevo.goleadores || [];
        existente.eventos = nuevo.eventos || [];
        existente.arbitro = nuevo.arbitro || existente.arbitro;
      }
    });

    render();
    drawPreviews();
    // Refrescar calendario si está visible
    if (window._calendario) {
      window._calendario.partidos = resultado.partidos;
      window._calendario.refrescar();
    }
    showToast('🔄 Scores actualizados');
  }, MUNDIAL_REFRESH_MS);
}

function detenerAutoRefresh() {
  if (_mundialRefreshInterval) {
    clearInterval(_mundialRefreshInterval);
    _mundialRefreshInterval = null;
  }
}

// ════════════════════════════════════════════════════════════════
// TABLA DE POSICIONES / GRUPOS (sub-placa opcional)
// ════════════════════════════════════════════════════════════════

async function generarPlacaPosiciones() {
  showLoading(true);
  const grupos = await obtenerPosicionesGrupos();
  showLoading(false);

  if (!grupos || (typeof grupos === 'object' && !Array.isArray(grupos) && Object.keys(grupos).length === 0) || (Array.isArray(grupos) && grupos.length === 0)) {
    showToast('❌ No se pudieron obtener las posiciones');
    return;
  }

  // Leer grupo seleccionado del dropdown
  const sel = document.getElementById('selGrupoPosiciones');
  S.grupoPosiciones = sel ? sel.value : 'all';
  S.posicionesPage = 0;

  S.mode = 'futbol';
  S.cat = 'MUNDIAL 2026';
  S.title = 'POSICIONES';

  S.mundialTipo = 'posiciones';
  S.mundialData = { fecha: obtenerFechaArgentina(), partidos: [], grupos };

  document.getElementById('titIn').value = S.title;
  document.getElementById('catIn').value = S.cat;

  snapShot();
  resizeCanvas();
  render();
  drawPreviews();
  const total = Array.isArray(grupos) ? grupos.length : Object.keys(grupos).length;
  showToast(`✅ Tabla de posiciones generada (${total} grupos)`);
}

async function generarPlacaGoleadores() {
  showLoading(true);
  const goleadores = await obtenerGoleadores();
  showLoading(false);

  if (!goleadores || goleadores.length === 0) {
    showToast('❌ No se pudieron obtener los goleadores');
    return;
  }

  S.mode = 'futbol';
  S.title = 'GOLEADORES DEL MUNDIAL';
  S.cat = 'MUNDIAL 2026';
  S.tpl = 'futbol-premium';
  S.mundialTipo = 'goleadores';
  S.mundialData = { fecha: obtenerFechaArgentina(), partidos: [], goleadores };

  document.getElementById('titIn').value = S.title;
  document.getElementById('catIn').value = S.cat;

  snapShot();
  resizeCanvas();
  render();
  drawPreviews();
  showToast(`✅ Tabla de goleadores generada`);
}

// ── Generar placa de eliminatorias/bracket (Zafronix) ──
async function generarPlacaBracket() {
  showLoading(true);
  const bracket = await obtenerBracketMundial();
  showLoading(false);

  if (!bracket || Object.keys(bracket).length === 0) {
    showToast('❌ No se pudo obtener el bracket (Zafronix API key requerida)');
    return;
  }

  // Leer etapa seleccionada del dropdown
  const selEtapa = document.getElementById('selEtapa');
  S.bracketEtapa = selEtapa ? selEtapa.value : 'all';

  S.mode = 'futbol';
  S.cat = 'MUNDIAL 2026';
  S.tpl = 'futbol-wc26';
  S.mundialTipo = 'bracket';
  S.mundialData = { fecha: obtenerFechaArgentina(), partidos: [], bracket };

  // Título dinámico según etapa
  S.title = S.bracketEtapa === 'all' ? 'ELIMINATORIAS' : S.bracketEtapa.toUpperCase();
  document.getElementById('titIn').value = S.title;
  document.getElementById('catIn').value = S.cat;

  // Resetear posiciones de bloques para que se ajusten al contenido
  resetElPos('header');
  resetElPos('matches');
  resetElPos('mlogo');
  resetElPos('logo');

  snapShot();
  resizeCanvas();
  render();
  drawPreviews();
  const etapaMsg = S.bracketEtapa === 'all' ? 'todas las etapas' : S.bracketEtapa;
  showToast(`✅ Bracket generado: ${etapaMsg}`);
}
