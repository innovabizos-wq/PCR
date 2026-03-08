# Auth y permisos

- Supabase Auth reemplaza completamente login fake/local.
- Hay un usuario bootstrap local para acceso inicial/offline: `prueba@correo.com` / `Prueba1234` con rol `super_admin`.
- Además del flujo Supabase Auth, existe fallback local en `localStorage` para crear y autenticar usuarios desde el panel de administración.
- Roles base: `super_admin`, `admin_empresa`, `ventas`, `inventario`, `consulta`.
- Acciones base: `ver`, `crear`, `editar`, `eliminar`, `exportar`, `aprobar`, `administrar`.
- Matriz de permisos central en `src/domain/auth/permissions.ts`.

## Checklist de verificación manual de acceso

1. En Supabase Dashboard, abrir **Authentication → Users** y confirmar que exista el email exacto.
2. Si no existe, crear el usuario con email verificado y asignar la contraseña correspondiente.
3. Validar inicio de sesión en la app para confirmar que `signInWithPassword` responde sin error.
4. Antes de merge, ejecutar `git status`, `npm run lint` y `npm run typecheck` para detectar conflictos locales y errores de integración.
