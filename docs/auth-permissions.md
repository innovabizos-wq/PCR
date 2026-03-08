# Auth y permisos

- La autenticación principal usa **Supabase Auth** (`signInWithPassword`, sesión real y `signOut`).
- Ya no se usa usuario fake local ni sesión inventada en `localStorage` como fuente principal.
- Roles base: `super_admin`, `admin_empresa`, `ventas`, `inventario`, `consulta`.
- Acciones base: `ver`, `crear`, `editar`, `eliminar`, `exportar`, `aprobar`, `administrar`.
- Matriz de permisos central en `src/domain/auth/permissions.ts`.

## Bootstrap seguro de administrador

1. Configura variables de entorno en tu shell:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL` (opcional, por defecto `admin@policarbonatocr.com`)
   - `ADMIN_PASSWORD` (obligatoria)
   - `ADMIN_COMPANY_IDS` (opcional, por defecto `oz,pt,ds`)
2. Ejecuta:

```bash
npm run auth:bootstrap-admin
```

El script crea (o actualiza) un usuario real en Supabase con rol `super_admin` y `company_ids` en `app_metadata`.
