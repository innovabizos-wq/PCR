-- Endurecer RLS por autenticación + empresa
-- Corrección: validar company_ids (JWT app_metadata) con jsonb_array_elements_text

alter table if exists public.quotes enable row level security;
alter table if exists public.inventory_products enable row level security;
alter table if exists public.quote_sequences enable row level security;

drop policy if exists "quotes_select_all" on public.quotes;
drop policy if exists "quotes_insert_all" on public.quotes;
drop policy if exists "quotes_update_all" on public.quotes;

create policy "quotes_authenticated_company_select"
on public.quotes
for select
to authenticated
using (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = quotes.company_id
  )
);

create policy "quotes_authenticated_company_insert"
on public.quotes
for insert
to authenticated
with check (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = quotes.company_id
  )
);

create policy "quotes_authenticated_company_update"
on public.quotes
for update
to authenticated
using (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = quotes.company_id
  )
)
with check (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = quotes.company_id
  )
);
