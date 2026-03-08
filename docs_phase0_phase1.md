# Fase 0 y Fase 1 - Diagnóstico y estabilización

## Hallazgos ejecutables
- `src/App.tsx` concentra autenticación, navegación, cálculo, exportación PDF y renderizado principal.
- Existía login local con credenciales hardcodeadas (`Admin/Admin`) sin control de sesión persistente.
- El modelo de cotización no tenía un identificador formal de empresa en frontend ni en servicios.
- Las migraciones de Supabase no incluían columna `company_id` para aislamiento multiempresa.

## Cambios de estabilización aplicados
- Se extrajo autenticación básica a `src/features/auth/authService.ts`.
- Se movió configuración sensible de credenciales por defecto a variables de entorno opcionales (`src/config/env.ts`).
- Se agregó persistencia de sesión local mínima para evitar estados inconsistentes de login.
- Se formalizó el dominio multiempresa base (`src/domain/company/company.ts`, `src/types/company.ts`).
- Se adaptó guardado de cotizaciones para incluir `company_id`.
- Se agregó migración para `company_id` en `quotes` e `inventory_products`.

## Validaciones ejecutadas
- `npm run lint`
- `npm run typecheck`
- `npm run build`
