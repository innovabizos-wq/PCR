# PCR

Aplicación React + TypeScript para cotizaciones, inventario y proformas multiempresa.

## Módulos
- Auth (`src/features/auth`)
- Company context (`src/features/company`)
- Workspace UI (`src/features/app`)
- Servicios (`src/services`)

## Bootstrap de admin de Supabase Auth
```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
ADMIN_EMAIL=admin@policarbonatocr.com \
ADMIN_PASSWORD='CambiaEstaClave123' \
npm run auth:bootstrap-admin
```

## Validación
```bash
npm run typecheck
npm run lint
npm run build
```
