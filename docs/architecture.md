# Arquitectura

- `src/App.tsx` funciona como orquestador: bootstrap de sesión, shell y render principal.
- `src/features/auth` gestiona autenticación real con Supabase Auth (login/logout/sesión).
- `src/features/company` define empresa activa y empresas disponibles por usuario.
- `src/features/app/AppWorkspace.tsx` concentra UI operativa (calculadora, inventario, billing, admin) y consume contextos.
- `src/services/*` mantiene lógica de persistencia y reglas de negocio fuera de componentes presentacionales.
