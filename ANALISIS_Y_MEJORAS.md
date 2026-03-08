# Análisis del proyecto y propuestas de mejora

## Resumen ejecutivo

El proyecto es una aplicación **React + Vite + TypeScript** orientada a cotizaciones de materiales (policarbonato, PVC, zacate y WPC), con persistencia parcial en Supabase y una UI con Tailwind.

Estado general observado:
- La base técnica funciona (lint, typecheck y build pasan).
- Hay valor de negocio claro en el motor de cálculo.
- Existe deuda técnica importante en **modularidad**, **seguridad de autenticación** y **estrategia de pruebas**.

## Hallazgos principales

### 1) Componente `App` demasiado grande y con demasiadas responsabilidades
- `src/App.tsx` concentra estado global, autenticación, lógica de módulos, PDF/export y render principal en un solo archivo de 1300+ líneas.
- Esto dificulta pruebas unitarias, mantenimiento y onboarding.

**Riesgo:** cambios pequeños pueden romper áreas no relacionadas.

**Mejora sugerida:**
- Separar por dominios:
  - `features/calculator/`
  - `features/auth/`
  - `features/quotes/`
  - `features/inventory/`
- Extraer hooks como `useAuth`, `useCalculatorState`, `useQuotePersistence`.
- Mantener `App.tsx` como orquestador de rutas/layout.

### 2) Riesgo de seguridad en autenticación local
- Se define un usuario por defecto con credenciales literales (`Admin`/`Admin`) en frontend.
- La validación actual depende de estado local, lo cual no ofrece seguridad real para un sistema con datos comerciales.

**Riesgo:** acceso no autorizado, falsa percepción de seguridad, incumplimiento básico de buenas prácticas.

**Mejora sugerida:**
- Migrar autenticación completamente a Supabase Auth (o backend propio).
- Remover credenciales hardcodeadas del cliente.
- Definir roles/permisos en backend (RLS en Supabase + claims).

### 3) Catálogo y precios hardcodeados en el frontend
- El catálogo base se mantiene en un arreglo estático grande.
- El motor de cálculo consulta estos precios desde el catálogo local.

**Riesgo:** desalineación entre precios reales y app desplegada; cada ajuste requiere redeploy.

**Mejora sugerida:**
- Mover catálogo/precios a Supabase (tabla versionada).
- Añadir estrategia de caché local con invalidación (timestamp o ETag lógico).
- Incorporar historial de precios por fecha para auditoría de cotizaciones.

### 4) Motor de cálculo robusto pero acoplado y sin tests automatizados
- Existe lógica compleja en utilidades de cálculo (tablas, reglas y redondeos).
- No se observan tests unitarios/integración para validar casos límite del cálculo.

**Riesgo:** regresiones silenciosas en fórmulas de negocio.

**Mejora sugerida:**
- Agregar tests con Vitest para:
  - casos nominales por módulo;
  - casos borde (medidas cero, máximos, números inválidos);
  - snapshots de materiales resultantes para configuraciones conocidas.
- Definir contrato de cálculo (inputs/outputs esperados) en fixtures.

### 5) Persistencia de cotizaciones sin capa de servicio
- `SaveQuoteModal` mezcla UI + validación + acceso a Supabase en el mismo componente.

**Riesgo:** difícil reutilización y pruebas; errores de red acoplados al componente visual.

**Mejora sugerida:**
- Extraer un servicio `quoteRepository`/`quoteService`.
- Normalizar manejo de errores y estados asíncronos.
- Validar entrada con esquema (por ejemplo Zod) antes de persistir.

### 6) Falta de observabilidad y calidad operativa
- No hay indicios de monitoreo de errores en cliente (Sentry, LogRocket o similar).
- No hay pipeline de pruebas documentado/automatizado en el repo.

**Riesgo:** baja visibilidad de fallas en producción.

**Mejora sugerida:**
- Integrar error tracking.
- Configurar CI mínimo (lint + typecheck + tests + build).
- Publicar checklist de release.

## Priorización recomendada (impacto vs esfuerzo)

### Fase 1 (rápida, 1-2 semanas)
1. Eliminar autenticación local hardcodeada y bloquear flujos sensibles sin sesión real.
2. Extraer capa de servicios para Supabase (`quotes`, `catalog`).
3. Introducir tests unitarios del motor de cálculo.
4. Configurar CI básico.

### Fase 2 (2-4 semanas)
1. Migrar catálogo/precios a backend con versionado.
2. Refactor modular de `App.tsx` a arquitectura por features.
3. Incorporar manejo de errores estandarizado + toasts y estados vacíos.

### Fase 3 (continuo)
1. Optimización de UX (guardado de borradores, historial, filtros avanzados).
2. Telemetría de uso por módulo para priorizar producto.
3. Mejora de documentación técnica y de negocio.

## Métricas de éxito sugeridas

- **Calidad:** cobertura de tests del motor de cálculo > 80%.
- **Confiabilidad:** tasa de errores en guardado de cotizaciones < 1%.
- **Mantenibilidad:** reducir `App.tsx` a < 250 líneas, moviendo lógica a hooks/servicios.
- **Operación:** CI obligatorio en PRs con validaciones automáticas.

## Checks ejecutados para este análisis

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run build` ✅
