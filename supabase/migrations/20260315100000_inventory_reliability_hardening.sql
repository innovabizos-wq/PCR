-- Production hardening for inventory writes, optimistic concurrency, idempotency, audit and event logs.

alter table public.inventory_products
  add column if not exists version bigint not null default 1,
  add column if not exists updated_by uuid null references auth.users(id),
  add column if not exists last_idempotency_key text null;

alter table public.inventory_products
  alter column precio type numeric(12,2) using precio::numeric,
  alter column impuesto type numeric(5,4) using impuesto::numeric,
  alter column stock type integer using stock::integer;

alter table public.inventory_products
  add constraint inventory_products_precio_non_negative check (precio >= 0),
  add constraint inventory_products_stock_non_negative check (stock >= 0),
  add constraint inventory_products_tax_range check (impuesto >= 0 and impuesto <= 1),
  add constraint inventory_products_sku_not_blank check (length(btrim(sku)) > 0),
  add constraint inventory_products_nombre_not_blank check (length(btrim(nombre)) > 0);

create index if not exists idx_inventory_products_company_updated_at
  on public.inventory_products(company_id, updated_at desc);

create table if not exists public.audit_inventory_changes (
  id bigserial primary key,
  inventory_id text not null,
  company_id company_id not null,
  action text not null check (action in ('insert', 'update')),
  changed_by uuid null references auth.users(id),
  changed_at timestamptz not null default now(),
  idempotency_key text null,
  before_data jsonb,
  after_data jsonb
);

create index if not exists idx_audit_inventory_company_changed_at
  on public.audit_inventory_changes(company_id, changed_at desc);

create table if not exists public.business_event_log (
  id bigserial primary key,
  company_id company_id not null,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  actor_id uuid null references auth.users(id),
  idempotency_key text null,
  payload jsonb not null default '{}'::jsonb,
  happened_at timestamptz not null default now()
);

create index if not exists idx_business_event_company_happened_at
  on public.business_event_log(company_id, happened_at desc);

create table if not exists public.command_idempotency_keys (
  idempotency_key text primary key,
  company_id company_id not null,
  command_name text not null,
  command_hash text not null,
  status text not null check (status in ('processing', 'applied', 'rejected')),
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  response_payload jsonb
);

create index if not exists idx_command_idempotency_company_created
  on public.command_idempotency_keys(company_id, created_at desc);

alter table public.audit_inventory_changes enable row level security;
alter table public.business_event_log enable row level security;
alter table public.command_idempotency_keys enable row level security;

-- Strict company RLS with authenticated users only.
drop policy if exists "inventory_authenticated_company_select" on public.inventory_products;
drop policy if exists "inventory_authenticated_company_insert" on public.inventory_products;
drop policy if exists "inventory_authenticated_company_update" on public.inventory_products;

create policy "inventory_authenticated_company_select"
on public.inventory_products
for select
to authenticated
using (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = inventory_products.company_id
  )
);

create policy "inventory_authenticated_company_insert"
on public.inventory_products
for insert
to authenticated
with check (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = inventory_products.company_id
  )
);

create policy "inventory_authenticated_company_update"
on public.inventory_products
for update
to authenticated
using (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = inventory_products.company_id
  )
)
with check (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = inventory_products.company_id
  )
);

drop policy if exists "audit_inventory_company_select" on public.audit_inventory_changes;
create policy "audit_inventory_company_select"
on public.audit_inventory_changes
for select
to authenticated
using (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = audit_inventory_changes.company_id
  )
);

drop policy if exists "business_event_company_select" on public.business_event_log;
create policy "business_event_company_select"
on public.business_event_log
for select
to authenticated
using (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = business_event_log.company_id
  )
);

drop policy if exists "command_idempotency_company_select" on public.command_idempotency_keys;
create policy "command_idempotency_company_select"
on public.command_idempotency_keys
for select
to authenticated
using (
  exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = command_idempotency_keys.company_id
  )
);

create or replace function public.inventory_bulk_upsert(
  p_company_id company_id,
  p_items jsonb,
  p_expected_updated_at timestamptz,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing command_idempotency_keys%rowtype;
  v_row jsonb;
  v_id text;
  v_current inventory_products%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_conflicts jsonb := '[]'::jsonb;
  v_hash text := md5(coalesce(p_items::text, '') || '|' || coalesce(p_expected_updated_at::text, '') || '|' || coalesce(p_company_id::text, ''));
begin
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) < 8 then
    raise exception 'idempotency key inválida';
  end if;

  select * into v_existing
  from command_idempotency_keys
  where idempotency_key = p_idempotency_key;

  if found then
    if v_existing.command_hash <> v_hash then
      raise exception 'idempotency key reutilizada con payload distinto';
    end if;

    update command_idempotency_keys
      set last_seen_at = now()
      where idempotency_key = p_idempotency_key;

    if v_existing.status = 'applied' then
      return coalesce(v_existing.response_payload, jsonb_build_object('status', 'already_applied'));
    end if;
  else
    insert into command_idempotency_keys (
      idempotency_key,
      company_id,
      command_name,
      command_hash,
      status,
      created_by,
      response_payload
    ) values (
      p_idempotency_key,
      p_company_id,
      'inventory_bulk_upsert',
      v_hash,
      'processing',
      v_user_id,
      null
    );
  end if;

  for v_row in select * from jsonb_array_elements(p_items)
  loop
    v_id := v_row->>'id';

    if v_id is null or length(btrim(v_id)) = 0 then
      raise exception 'item sin id en inventory_bulk_upsert';
    end if;

    select * into v_current
      from inventory_products
      where id = v_id and company_id = p_company_id
      for update;

    if found and p_expected_updated_at is not null and v_current.updated_at > p_expected_updated_at then
      v_conflicts := v_conflicts || jsonb_build_array(jsonb_build_object(
        'id', v_id,
        'db_updated_at', v_current.updated_at,
        'db_version', v_current.version
      ));
      continue;
    end if;

    v_before := case when found then to_jsonb(v_current) else null end;

    insert into inventory_products (
      id, company_id, sku, nombre, categoria, descripcion,
      precio, impuesto, tamano, estilo_foto, stock, garantia,
      cuenta_cobro, cuentas_pago, catalog_version_id,
      updated_by, last_idempotency_key, version
    ) values (
      v_id,
      p_company_id,
      coalesce(v_row->>'sku', ''),
      coalesce(v_row->>'nombre', ''),
      coalesce(v_row->>'categoria', 'accesorio'),
      coalesce(v_row->>'descripcion', ''),
      coalesce((v_row->>'precio')::numeric, 0),
      coalesce((v_row->>'impuesto')::numeric, 0.13),
      coalesce(v_row->>'tamano', ''),
      coalesce(v_row->>'estilo_foto', ''),
      coalesce((v_row->>'stock')::integer, 0),
      coalesce(v_row->>'garantia', ''),
      coalesce(v_row->>'cuenta_cobro', ''),
      coalesce(v_row->'cuentas_pago', '[]'::jsonb),
      nullif(v_row->>'catalog_version_id', '')::uuid,
      v_user_id,
      p_idempotency_key,
      coalesce(v_current.version, 0) + 1
    )
    on conflict (id, company_id) do update set
      sku = excluded.sku,
      nombre = excluded.nombre,
      categoria = excluded.categoria,
      descripcion = excluded.descripcion,
      precio = excluded.precio,
      impuesto = excluded.impuesto,
      tamano = excluded.tamano,
      estilo_foto = excluded.estilo_foto,
      stock = excluded.stock,
      garantia = excluded.garantia,
      cuenta_cobro = excluded.cuenta_cobro,
      cuentas_pago = excluded.cuentas_pago,
      catalog_version_id = excluded.catalog_version_id,
      updated_by = excluded.updated_by,
      last_idempotency_key = excluded.last_idempotency_key,
      version = inventory_products.version + 1,
      updated_at = now()
    returning to_jsonb(inventory_products.*) into v_after;

    insert into audit_inventory_changes (
      inventory_id,
      company_id,
      action,
      changed_by,
      idempotency_key,
      before_data,
      after_data
    ) values (
      v_id,
      p_company_id,
      case when v_before is null then 'insert' else 'update' end,
      v_user_id,
      p_idempotency_key,
      v_before,
      v_after
    );

    insert into business_event_log (
      company_id,
      event_type,
      aggregate_type,
      aggregate_id,
      actor_id,
      idempotency_key,
      payload
    ) values (
      p_company_id,
      'inventory.product.upserted',
      'inventory_product',
      v_id,
      v_user_id,
      p_idempotency_key,
      jsonb_build_object('before', coalesce(v_before, '{}'::jsonb), 'after', v_after)
    );
  end loop;

  if jsonb_array_length(v_conflicts) > 0 then
    update command_idempotency_keys
      set status = 'rejected', response_payload = jsonb_build_object('status', 'conflict', 'conflicts', v_conflicts)
      where idempotency_key = p_idempotency_key;
    return jsonb_build_object('status', 'conflict', 'conflicts', v_conflicts);
  end if;

  update command_idempotency_keys
    set status = 'applied', response_payload = jsonb_build_object('status', 'ok', 'updated_count', jsonb_array_length(p_items))
    where idempotency_key = p_idempotency_key;

  return jsonb_build_object('status', 'ok', 'updated_count', jsonb_array_length(p_items));
exception when others then
  update command_idempotency_keys
    set status = 'rejected', response_payload = jsonb_build_object('status', 'error', 'message', sqlerrm)
    where idempotency_key = p_idempotency_key;
  raise;
end;
$$;

grant execute on function public.inventory_bulk_upsert(company_id, jsonb, timestamptz, text) to authenticated;


create or replace view public.inventory_operational_health as
select
  company_id,
  count(*) filter (where status = 'rejected') as rejected_commands,
  count(*) filter (where status = 'processing') as processing_commands,
  count(*) filter (where status = 'applied') as applied_commands,
  max(last_seen_at) as last_command_seen_at
from public.command_idempotency_keys
group by company_id;
