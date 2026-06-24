// ════════════════════════════════════════════════════════════════════
// CALENDARIO Y SELECTOR DE PARTIDOS
// ════════════════════════════════════════════════════════════════════

class CalendarioMundial {
  constructor() {
    this.fechaSeleccionada = obtenerFechaArgentina();
    this.partidos = [];
  }

  // Generar HTML del calendario
  generarCalendario() {
    const [year, month, day] = this.fechaSeleccionada.split('-').map(Number);
    const fechaActual = new Date(year, month - 1, day);
    const primerDia = new Date(year, month - 1, 1);
    const ultimoDia = new Date(year, month, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicio = primerDia.getDay();

    let html = `
      <div class="calendario-header">
        <button onclick="window._calendario.mesAnterior()">←</button>
        <span class="mes-año">${this.nombreMes(month)} ${year}</span>
        <button onclick="window._calendario.mesSiguiente()">→</button>
      </div>
      <div class="calendario-dias">
        <div class="dia-semana">D</div>
        <div class="dia-semana">L</div>
        <div class="dia-semana">M</div>
        <div class="dia-semana">X</div>
        <div class="dia-semana">J</div>
        <div class="dia-semana">V</div>
        <div class="dia-semana">S</div>
    `;

    // Días en blanco antes del inicio
    for (let i = 0; i < diaInicio; i++) {
      html += '<div class="dia-vacio"></div>';
    }

    // Días del mes
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const esSeleccionada = fechaStr === this.fechaSeleccionada ? 'seleccionada' : '';
      const esHoy = fechaStr === obtenerFechaArgentina() ? 'hoy' : '';
      html += `<div class="dia ${esSeleccionada} ${esHoy}" onclick="window._calendario.seleccionar('${fechaStr}')">${d}</div>`;
    }

    html += '</div>';
    return html;
  }

  // HTML para listado de partidos
  generarListadoPartidos() {
    if (this.partidos.length === 0) {
      return '<div class="partidos-empty">Sin partidos esta fecha</div>';
    }

    let html = '<div class="partidos-lista">';
    this.partidos.forEach(p => {
      const score = p.golesLocal !== null ? `${p.golesLocal}-${p.golesVisitante}` : p.hora;
      const estilo = p.golesLocal !== null ? 'finalizado' : 'proximo';
      // Info extra de API-Football
      const infoExtra = [];
      if (p.grupo) {
        // Traducir grupo si viene en inglés
        const g = String(p.grupo).replace(/GROUP_/i, 'Grupo ').replace(/Group /i, 'Grupo ');
        infoExtra.push(g);
      }
      if (p.formacionLocal && p.formacionVisitante) {
        infoExtra.push(`${p.formacionLocal.formacion} vs ${p.formacionVisitante.formacion}`);
      }
      const infoStr = infoExtra.length > 0 ? infoExtra.join(' • ') : '';
      // Madrugada indicator: mostrar a qué día real pertenece
      const madrugadaTag = p.madrugada
        ? `<span class="madrugada-tag" title="Se juega en la madrugada del día siguiente">🌙 Madrugada</span>`
        : '';
      
      html += `
        <div class="partido-item ${estilo}" onclick="window._calendario.seleccionarPartido(${p.id}, '${this.fechaSeleccionada}')">
          <div class="partido-equipos">
            <span class="equipo">${p.banderaLocal} ${p.local}</span>
            <span class="score">${score}</span>
            <span class="equipo">${p.visitante} ${p.banderaVisitante}</span>
          </div>
          <div class="partido-info">${p.estadio || 'Sede por confirmar'}${p.ciudad ? ' • ' + p.ciudad : ''}${infoStr ? ' • ' + infoStr : ''}${madrugadaTag ? ' ' + madrugadaTag : ''}</div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  nombreMes(n) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[n - 1];
  }

  async seleccionar(fechaStr) {
    this.fechaSeleccionada = fechaStr;
    showLoading(true);
    const resultado = await obtenerPartidosMundial(fechaStr);
    showLoading(false);

    if (resultado) {
      this.partidos = resultado.partidos;
      this.refrescar();
    }
  }

  async seleccionarPartido(matchId, fecha) {
    await generarPlacaPartidoIndividual(fecha, matchId);
    // Cerrar panel móvil si está abierto
    if (window._panelOpen) {
      const panel = document.getElementById('mobPanel');
      if (panel) panel.classList.remove('open');
      window._panelOpen = false;
    }
  }

  mesAnterior() {
    const [y, m, d] = this.fechaSeleccionada.split('-').map(Number);
    const nuevaFecha = new Date(y, m - 2, d);
    const str = nuevaFecha.toISOString().split('T')[0];
    this.seleccionar(str);
  }

  mesSiguiente() {
    const [y, m, d] = this.fechaSeleccionada.split('-').map(Number);
    const nuevaFecha = new Date(y, m, d);
    const str = nuevaFecha.toISOString().split('T')[0];
    this.seleccionar(str);
  }

  refrescar() {
    // Refresh ALL containers with class mundial-calendario-content
    const contenedores = document.querySelectorAll('.mundial-calendario-content');
    const html = this.generarCalendario() + this.generarListadoPartidos();
    contenedores.forEach(c => { c.innerHTML = html; });
    // Also try by ID for backwards compatibility
    const byId = document.getElementById('mundialCalendario');
    if (byId && !byId.classList.contains('mundial-calendario-content')) {
      byId.innerHTML = html;
    }
  }

  async cargarFechaActual() {
    this.fechaSeleccionada = obtenerFechaArgentina();
    const resultado = await obtenerPartidosMundial(this.fechaSeleccionada);
    if (resultado) {
      this.partidos = resultado.partidos;
      this.refrescar();
    }
  }
}

// Inicializar calendario global
function inicializarCalendarioMundial() {
  if (!window._calendario) {
    window._calendario = new CalendarioMundial();
    window._calendario.cargarFechaActual();
  }
}

// Función para generar placa "Partidos del día" desde el acordeón
async function generarPlacaDelDia() {
  const fecha = window._calendario?.fechaSeleccionada || obtenerFechaArgentina();
  await generarPlacaPartidosDelDia(fecha);
}

// Función para generar placa "Resultados del día" (Noche) desde el acordeón
async function generarResultadosDelDia() {
  const fecha = window._calendario?.fechaSeleccionada || obtenerFechaArgentina();
  await generarPlacaResultadosDelDia(fecha);
}