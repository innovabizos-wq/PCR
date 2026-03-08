-- Phase 4: telemetría operativa básica por módulo

CREATE TABLE IF NOT EXISTS telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  page text,
  module text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  happened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telemetry_events_happened_idx
  ON telemetry_events (happened_at DESC);

ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Telemetry insert authenticated" ON telemetry_events;

CREATE POLICY "Telemetry insert authenticated"
  ON telemetry_events FOR INSERT
  TO authenticated
  WITH CHECK (true);
