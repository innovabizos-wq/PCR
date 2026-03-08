-- Multiempresa base for quotes and inventory

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'company_id'
  ) THEN
    CREATE TYPE company_id AS ENUM ('oz', 'pt', 'ds');
  END IF;
END
$$;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS company_id company_id NOT NULL DEFAULT 'pt';

CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company_created_at ON quotes(company_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_company_quote_number
  ON quotes(company_id, quote_number);

ALTER TABLE inventory_products
  ADD COLUMN IF NOT EXISTS company_id company_id NOT NULL DEFAULT 'pt';

CREATE INDEX IF NOT EXISTS idx_inventory_products_company_id ON inventory_products(company_id);
