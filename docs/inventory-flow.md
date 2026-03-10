# Flujo de inventario

1. UI de inventario recibe `companyId` activo.
2. `getInventoryProducts(companyId)` filtra por empresa.
3. `saveInventoryProducts(products, companyId)` guarda con `company_id`.
4. Texturas se cargan con bucket `textures` y URL pública.

## Nota técnica importante

Para que el guardado funcione correctamente en modo multiempresa, la tabla
`inventory_products` debe tener una llave primaria/única compuesta por
`(id, company_id)`. El `upsert` del frontend usa `ON CONFLICT (id, company_id)`.
