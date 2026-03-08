# Flujo de cotizaciones

1. UI calcula materiales y total.
2. Exportación/registro llama `generateAndStoreQuoteNumber` con `companyId` obligatorio.
3. Persistencia de cotización en Supabase incluye `company_id` y estado.
4. Numeración fallback local aplica aislamiento por empresa.
