const TIME_ZONE = 'America/Argentina/Buenos_Aires';

function partesFecha(iso) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date(iso));
}

function horaArgentina(iso) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function normalizarFixtureAPIFootball(raw, fechaSolicitada) {
  const fixture = raw?.fixture;
  const teams = raw?.teams || {};
  const league = raw?.league || {};
  if (!fixture?.id || !fixture.date) return null;

  const fecha = partesFecha(fixture.date);
  if (fechaSolicitada && fecha !== fechaSolicitada) return null;

  return {
    id: fixture.id,
    local: teams.home?.name || '?',
    visitante: teams.away?.name || '?',
    hora: horaArgentina(fixture.date),
    horaUTC: fixture.date,
    fecha,
    estado: fixture.status?.short || 'NS',
    estadio: fixture.venue?.name || '',
    ciudad: fixture.venue?.city || '',
    competicion: league.name || '',
    jornada: league.round || null,
    golesLocal: raw.goals?.home ?? null,
    golesVisitante: raw.goals?.away ?? null,
    badgeLocal: teams.home?.logo || null,
    badgeVisitante: teams.away?.logo || null,
  };
}

export function deduplicarYOrdenarPartidos(partidos = []) {
  const vistos = new Set();
  return partidos
    .filter(partido => {
      const id = String(partido?.id ?? '');
      if (!id || vistos.has(id)) return false;
      vistos.add(id);
      return true;
    })
    .sort((a, b) => String(a.horaUTC || '').localeCompare(String(b.horaUTC || '')));
}
