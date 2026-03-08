# Fase 5 y Fase 6 - Persistencia robusta y calidad operativa

## Objetivos implementados

### Fase 5 (persistencia robusta de cotizaciones)
- Se reforzó la validación y normalización de entrada en `quoteService` antes de persistir en base de datos.
- Se centralizó el saneamiento de campos (`clientName`, `clientEmail`, `notes`) para evitar inconsistencias entre UI y backend.
- El guardado ahora persiste `client_email` como `null` cuando no se proporciona, mejorando consistencia en Supabase.

### Fase 6 (observabilidad y calidad operativa)
- Se incorporó captura global de errores de cliente (`error` y `unhandledrejection`) enviando eventos a telemetría.
- Se inicializa tracking de errores desde el arranque de la app.
- Se agregó workflow de CI para validaciones automáticas en PR/push (`lint`, `typecheck`, `build`).

## Cambios técnicos
- `src/services/quoteService.ts`
  - `normalizeQuoteInput`
  - validación centralizada y saneamiento de payload
  - inserción de `client_email` nullable
- `src/services/errorTrackingService.ts`
  - `initErrorTracking`
  - listeners globales de runtime y reporte por `trackEvent`
- `src/main.tsx`
  - inicialización de error tracking en bootstrap de la app
- `.github/workflows/ci.yml`
  - pipeline de calidad para PR y `main`

## Validaciones ejecutadas
- `npm run lint`
- `npm run typecheck`
- `npm run build`
