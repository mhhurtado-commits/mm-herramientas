# Agenda Fase 2 — Pauta diaria + Integración suite + Recordatorios in-app

**Fecha:** 2026-08-31
**Enfoque:** A Incremental vanilla (sin calendario externo)
**Archivos tocados:** `agenda/index.html`, `worker/worker.js` (copia manual al dash)

## 1. Objetivo
Hacer que `/agenda` se abra todos los días: pauta con estados, vista semana/día, salto directo a Redacción/Placas/WhatsApp/Resumen y recordatorios solo in-app. Sin export .ics/Google.

## 2. Arquitectura
- SPA vanilla existente. Nuevos modos de render (`renderSemana`, `renderDia`) sin framework.
- KV actual: `agenda:evento:{id}` JSON. Se agrega campo `estado: "pendiente"|"en_curso"|"publicado"` (default `pendiente`). Migración lazy: si falta, se asume `pendiente`.
- KV `agenda:efemeride:{id}` sin cambios.
- Sin nuevos bindings. Reusa `listarObjetosKV` paginado de Fase 0.
- Worker: `handleGetAgendaEventos` ya soporta `?year/?desde/?hasta` — reutilizado para semana/día. Nuevo `PATCH` no necesario: `POST /agenda/evento` ya acepta `estado`.

## 3. Modelo de datos
```json
// agenda:evento
{
  "id": "ag_...",
  "titulo": "...",
  "fecha": "2026-09-10",
  "hora": "10:00",
  "tipo": "evento|cobertura|alerta",
  "alcance": "local|provincial|nacional",
  "estado": "pendiente|en_curso|publicado",
  "descripcion": "...",
  "periodista": "...",
  "creado": 123
}
```

## 4. UI — 3 vistas + agenda del día
- Toolbar: tabs `[Mes] [Semana] [Lista]` — `VISTA = mes|semana|lista`. Persistido en `localStorage mm-agenda-vista`.
- **Vista Mes:** existente.
- **Vista Semana:** grid 7 columnas (lun-dom) con `semanaActual` (Date). Navegación `‹ Semana ›` + `Hoy`. Reusa `eventosDelDia` y pool `EVENTOS_ALL`/`EVENTOS_KV`.
- **Vista Lista:** existente (año completo).
- **Agenda del día:** panel superior en semana/mes que muestra eventos del día seleccionado con quick actions.
- **Estados:** badge color (`pendiente gris`, `en_curso amarillo`, `publicado verde`), filtro opcional por estado en toolbar, select en modal evento.
- **Periodista:** `evPeriodista` sigue text; sugerencia: datalist con valores previos (sin backend nuevo).

## 5. Integración suite (query params)
Desde `renderPanelDia` y `abrirDetalle` agregar botones:
- `→ Redacción` → `/redaccion/?agenda_titulo=...&agenda_desc=...&agenda_fecha=...`
- `→ Placa` → `/placas-v2/?agenda_titulo=...`
- `→ WhatsApp` → `/whatsapp/?agenda_titulo=...&agenda_url=...` (si hay url en descripción)
- `→ Resumen` → `POST /resumen/agregar` vía fetch (si existe) o link a `/resumen/` con query; fallback toast "Copiado para Resumen"

No se tocan esas apps en esta fase salvo que ya lean query params; si no, quedan como deep links y se completan en fase siguiente.

## 6. Recordatorios solo in-app
- Badge `Hoy: N` en header de agenda (`mm-header-label` o nuevo `mm-badge`) calculado como `eventosDelDia(hoyActual()).length`.
- Sección `Próximos 7 días` ya existe — se realza con conteo por estado y click `irADia`.
- Opcional: `localStorage mm-agenda-vistos` para marcar "nuevo" si `creado > ultimoVisto`.

## 7. Cambios Worker
- `handlePostAgendaEvento`: persistir `estado` (validar enum, default `pendiente`).
- Sin nuevo endpoint; `handleGetAgendaEventos` ya cubre rangos para semana.

## 8. Testing
- Manual QA (5 min): crear evento con estado, cambiar estado, filtrar, navegar mes/semana/lista, búsqueda con debounce, botones suite abren con params correctos, badge Hoy, móvil 375px, caracteres especiales no rompen.
- `node --check worker/worker.js` + verificación inline JS (`JSON.stringify` 0).
- Sin tests automáticos nuevos en esta fase (vanilla HTML).

## 9. Rollout
- Commit `agenda/index.html` + `worker/worker.js`.
- Usuario copia `worker/worker.js` al dash Cloudflare manualmente (flujo actual).
- Feature flag: si `estado` no existe en item viejo, UI muestra `pendiente` sin migrar datos.

## 10. Fuera de scope
- Export .ics / Google Calendar / import
- Notificaciones push/email/WhatsApp
- RBAC o auth nueva
- Refactor `shared/agenda.js`
