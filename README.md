# PCR

Aplicación React + TypeScript para cotizaciones, inventario y proformas multiempresa.

## Módulos
- Auth (`src/features/auth`)
- Company context (`src/features/company`)
- Workspace UI (`src/features/app`)
- Servicios (`src/services`)

## Configuración de Supabase (frontend)

1. Copia `.env.example` a `.env.local`.
2. Define al menos:

```bash
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Si estas variables faltan, la app muestra un error de configuración al arrancar.

## Bootstrap del primer admin (Supabase Auth)

Script disponible:

```bash
npm run auth:bootstrap-admin
```

Variables requeridas para ejecutarlo (en tu shell, no en frontend):

```bash
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
ADMIN_EMAIL=admin@policarbonatocr.com
ADMIN_PASSWORD='CambiaEstaClave123'
ADMIN_COMPANY_IDS=oz,pt,ds
```

Ejemplo directo:

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
ADMIN_EMAIL=admin@policarbonatocr.com \
ADMIN_PASSWORD='CambiaEstaClave123' \
ADMIN_COMPANY_IDS=oz,pt,ds \
npm run auth:bootstrap-admin
```

Al terminar, ese usuario puede iniciar sesión con el `ADMIN_EMAIL` y `ADMIN_PASSWORD` indicados y queda con rol `super_admin` + acceso a las empresas configuradas.

## Validación técnica
```bash
npm run typecheck
npm run lint
npm run build
```

## Nota de migración RLS
- Se corrigió `supabase/migrations/20260312110000_harden_rls_company_scope.sql` para validar `app_metadata.company_ids` desde JWT con `jsonb_array_elements_text(...)`, evitando el cast inválido de `jsonb` a `text[]`.
