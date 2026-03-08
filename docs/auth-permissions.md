# Auth y permisos

- Supabase Auth reemplaza completamente login fake/local.
- Roles base: `super_admin`, `admin_empresa`, `ventas`, `inventario`, `consulta`.
- Acciones base: `ver`, `crear`, `editar`, `eliminar`, `exportar`, `aprobar`, `administrar`.
- Matriz de permisos central en `src/domain/auth/permissions.ts`.
