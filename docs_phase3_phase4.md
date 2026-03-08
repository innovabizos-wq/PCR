# Fase 3 y Fase 4 - UX continua y telemetría operativa

## Objetivos implementados

### Fase 3 (UX continua)
- Se agregó persistencia local de borradores de cálculo para recuperar el contexto tras recargar la app.
- Se añadió migración de base de datos `quote_drafts` para soportar borradores persistentes por usuario/empresa en backend.

### Fase 4 (telemetría por módulo)
- Se incorporó una capa de telemetría cliente con cola local resiliente.
- Se registran eventos base de navegación, cambio de módulo y exportación de PDF.
- Se añadió migración de base de datos `telemetry_events` para capturar eventos operativos.

## Cambios técnicos
- Nuevo servicio `src/services/calculatorDraftService.ts`:
  - `loadCalculatorDraft`
  - `saveCalculatorDraft`
  - `clearCalculatorDraft`
- Nuevo servicio `src/services/telemetryService.ts`:
  - `trackEvent`
  - Cola local en `localStorage` con retención acotada.
- `src/App.tsx`:
  - Inicializa estado con borrador local cuando existe.
  - Persiste automáticamente cambios de estado relevantes del cálculo.
  - Emite eventos de telemetría en navegación, cambio de módulo y ciclo de exportación PDF.
- Nuevas migraciones de Supabase:
  - `20260310110000_quote_drafts_phase3.sql`
  - `20260310113000_telemetry_phase4.sql`

## Validaciones ejecutadas
- `npm run lint`
- `npm run typecheck`
- `npm run build`
