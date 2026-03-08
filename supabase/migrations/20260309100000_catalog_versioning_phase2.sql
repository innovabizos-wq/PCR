-- Phase 2: catálogo versionado para precios

CREATE TABLE IF NOT EXISTS catalog_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_tag text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE catalog_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public catalog_versions read" ON catalog_versions;
DROP POLICY IF EXISTS "Public catalog_versions write" ON catalog_versions;
DROP POLICY IF EXISTS "Public catalog_versions update" ON catalog_versions;

CREATE POLICY "Public catalog_versions read"
  ON catalog_versions FOR SELECT
  USING (true);

CREATE POLICY "Public catalog_versions write"
  ON catalog_versions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public catalog_versions update"
  ON catalog_versions FOR UPDATE
  USING (true)
  WITH CHECK (true);

ALTER TABLE inventory_products
  ADD COLUMN IF NOT EXISTS catalog_version_id uuid REFERENCES catalog_versions(id);

CREATE INDEX IF NOT EXISTS idx_inventory_products_catalog_version_id
  ON inventory_products(catalog_version_id);

INSERT INTO catalog_versions(version_tag, is_active, notes)
VALUES ('v1-inicial', true, 'Versión inicial migrada desde catálogo local')
ON CONFLICT (version_tag) DO NOTHING;

WITH active_version AS (
  SELECT id FROM catalog_versions WHERE is_active = true ORDER BY created_at DESC LIMIT 1
)
UPDATE inventory_products
SET catalog_version_id = active_version.id
FROM active_version
WHERE inventory_products.catalog_version_id IS NULL;
