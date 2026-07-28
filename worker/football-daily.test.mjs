import assert from 'node:assert/strict';
import {
  normalizarFixtureAPIFootball,
  deduplicarYOrdenarPartidos,
} from './football-daily.mjs';

async function run() {
{
  const fixture = {
    fixture: {
      id: 123,
      date: '2026-07-28T22:00:00+00:00',
      status: { short: 'NS' },
      venue: { name: 'Estadio', city: 'Mendoza' },
    },
    teams: {
      home: { name: 'Local', logo: 'local.png' },
      away: { name: 'Visitante', logo: 'visitante.png' },
    },
    goals: { home: null, away: null },
    league: { id: 128, name: 'Liga Profesional Argentina', round: 'Regular Season - 2' },
  };

  const partido = normalizarFixtureAPIFootball(fixture, '2026-07-28');

  assert.equal(partido.id, 123);
  assert.equal(partido.fecha, '2026-07-28');
  assert.equal(partido.hora, '19:00');
  assert.equal(partido.local, 'Local');
  assert.equal(partido.visitante, 'Visitante');
  assert.equal(partido.estadio, 'Estadio');
}

{
  const fixture = {
    fixture: { id: 456, date: '2026-07-29T03:30:00+00:00', status: { short: 'NS' } },
    teams: { home: { name: 'A' }, away: { name: 'B' } },
    goals: { home: null, away: null },
    league: { id: 13, name: 'Copa Libertadores' },
  };

  assert.equal(normalizarFixtureAPIFootball(fixture, '2026-07-28'), null);
}

{
  const partidos = [
    { id: 2, horaUTC: '2026-07-28T23:00:00Z' },
    { id: 1, horaUTC: '2026-07-28T20:00:00Z' },
    { id: 2, horaUTC: '2026-07-28T23:00:00Z' },
  ];

  assert.deepEqual(deduplicarYOrdenarPartidos(partidos).map(p => p.id), [1, 2]);
}

console.log('football-daily tests: PASS');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
