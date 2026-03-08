# Auth y permisos

## Estado actual de autenticación

- El login usa **Supabase Auth real** (`signInWithPassword`, sesión real y `signOut`).
- La app valida `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` al iniciar; si faltan, muestra un error explícito en pantalla.
- Roles base: `super_admin`, `admin_empresa`, `ventas`, `inventario`, `consulta`.
- Acciones base: `ver`, `crear`, `editar`, `eliminar`, `exportar`, `aprobar`, `administrar`.
- Matriz de permisos central en `src/domain/auth/permissions.ts`.

## Variables requeridas en `.env.local`

```bash
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

> El frontend **no** debe incluir `SUPABASE_SERVICE_ROLE_KEY`.

## Tablas auxiliares de auth/perfiles/empresa

Migración: `supabase/migrations/20260313100000_auth_profiles_and_company_access.sql`

- `public.user_profiles`
  - `id` (uuid, FK a `auth.users.id`)
  - `role` (`super_admin`, `admin_empresa`, `ventas`, `inventario`, `consulta`)
- `public.user_company_access`
  - `user_id` (uuid, FK a `auth.users.id`)
  - `company_id` (`oz`, `pt`, `ds`)

El frontend lee estas tablas para resolver rol y empresas del usuario autenticado. Si no encuentra datos, usa fallback al metadata JWT (`app_metadata`/`user_metadata`).

## Verificación rápida de conexión

1. Define `.env.local` con variables `VITE_...`.
2. Arranca app con `npm run dev`.
3. Si faltan variables, la pantalla mostrará “Configuración de Supabase incompleta”.
4. Inicia sesión con un usuario existente en Supabase Auth.
5. Verifica en consola de Supabase:
   - sesión creada en Auth,
   - lectura de `user_profiles` y `user_company_access` para ese usuario.

## Bootstrap seguro de administrador

Variables en shell (script backend):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL` (opcional, por defecto `admin@policarbonatocr.com`)
- `ADMIN_PASSWORD` (obligatoria, mínimo 8 chars)
- `ADMIN_COMPANY_IDS` (opcional, por defecto `oz,pt,ds`)

Ejecuta:

```bash
npm run auth:bootstrap-admin
```

El script crea o actualiza un usuario real en Supabase Auth, lo marca como `super_admin` y sincroniza acceso por empresa tanto en metadata de Auth como en tablas auxiliares (`user_profiles`, `user_company_access`).
