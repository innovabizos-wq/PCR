-- Phase 3: borradores de cotización para UX continua

CREATE TABLE IF NOT EXISTS quote_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  created_by uuid NOT NULL,
  module text NOT NULL,
  width numeric NOT NULL,
  height numeric NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_drafts_company_updated_idx
  ON quote_drafts (company_id, updated_at DESC);

ALTER TABLE quote_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own drafts" ON quote_drafts;
DROP POLICY IF EXISTS "Users can insert own drafts" ON quote_drafts;
DROP POLICY IF EXISTS "Users can update own drafts" ON quote_drafts;

CREATE POLICY "Users can read own drafts"
  ON quote_drafts FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert own drafts"
  ON quote_drafts FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own drafts"
  ON quote_drafts FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
