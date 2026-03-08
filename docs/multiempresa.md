# Multiempresa

- La empresa activa se define en `CompanyContext` y se muestra en el header.
- Flujos críticos (`quoteNumberService`, `quoteService`, `inventoryService`) ahora reciben `companyId` explícito.
- Inventario lee/escribe filtrando por `company_id`.
- Numeración fallback local se separa por `company_id` + categoría.
