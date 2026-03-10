-- Evita "éxito falso": inventory_bulk_upsert corría como security definer sin validar company_ids del JWT.
-- Esto permitía escribir en una empresa no autorizada y luego no poder leer por RLS.

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
  if not exists (
    select 1
    from jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)) as company(value)
    where company.value = p_company_id
  ) then
    raise exception 'jwt_company_access_denied: token sin acceso a company_id=%', p_company_id;
  end if;

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
