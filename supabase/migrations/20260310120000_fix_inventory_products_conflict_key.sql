-- Fix inventory upsert conflict target for multi-company support.
-- saveInventoryProducts uses ON CONFLICT (id, company_id), so the table must expose
-- a matching unique/primary key constraint.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_products_pkey'
      AND conrelid = 'public.inventory_products'::regclass
  ) THEN
    ALTER TABLE public.inventory_products
      DROP CONSTRAINT inventory_products_pkey;
  END IF;

  ALTER TABLE public.inventory_products
    ADD CONSTRAINT inventory_products_pkey PRIMARY KEY (id, company_id);
END
$$;
