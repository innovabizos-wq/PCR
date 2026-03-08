-- Inventory + quote consecutives for calculator PDF flow

CREATE TABLE IF NOT EXISTS inventory_products (
  id text PRIMARY KEY,
  sku text NOT NULL DEFAULT '',
  nombre text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'accesorio',
  descripcion text NOT NULL DEFAULT '',
  precio numeric(12,2) NOT NULL DEFAULT 0,
  impuesto numeric(5,2) NOT NULL DEFAULT 0.13,
  tamano text NOT NULL DEFAULT '',
  estilo_foto text NOT NULL DEFAULT '',
  stock integer NOT NULL DEFAULT 0,
  garantia text NOT NULL DEFAULT '',
  cuenta_cobro text NOT NULL DEFAULT '',
  cuentas_pago jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public inventory read" ON inventory_products;
DROP POLICY IF EXISTS "Public inventory write" ON inventory_products;

CREATE POLICY "Public inventory read"
  ON inventory_products FOR SELECT
  USING (true);

CREATE POLICY "Public inventory write"
  ON inventory_products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public inventory update"
  ON inventory_products FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS quote_sequences (
  category text PRIMARY KEY,
  prefix text NOT NULL,
  last_value integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public quote_sequences read" ON quote_sequences;
DROP POLICY IF EXISTS "Public quote_sequences write" ON quote_sequences;
CREATE POLICY "Public quote_sequences read"
  ON quote_sequences FOR SELECT
  USING (true);
CREATE POLICY "Public quote_sequences write"
  ON quote_sequences FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Public quote_sequences update"
  ON quote_sequences FOR UPDATE
  USING (true)
  WITH CHECK (true);

INSERT INTO quote_sequences(category, prefix, last_value)
VALUES ('policarbonato', 'P', 0), ('wpc', 'W', 0), ('zacate', 'Z', 0)
ON CONFLICT (category) DO NOTHING;

CREATE OR REPLACE FUNCTION next_quote_number(p_category text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix text;
  v_next integer;
BEGIN
  UPDATE quote_sequences
    SET last_value = last_value + 1,
        updated_at = now()
    WHERE category = p_category
    RETURNING prefix, last_value INTO v_prefix, v_next;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Categoría de cotización inválida: %', p_category;
  END IF;

  RETURN v_prefix || '-' || lpad(v_next::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION next_quote_number(text) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('textures', 'textures', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public textures read" ON storage.objects;
DROP POLICY IF EXISTS "Public textures upload" ON storage.objects;
CREATE POLICY "Public textures read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'textures');
CREATE POLICY "Public textures upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'textures');
