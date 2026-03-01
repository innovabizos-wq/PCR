/*
  # Create quotes table for polycarbonate calculator

  1. New Tables
    - `quotes`
      - `id` (uuid, primary key)
      - `quote_number` (text, unique) - Auto-generated quote reference
      - `client_name` (text) - Name of the client
      - `client_email` (text) - Client email address
      - `width` (numeric) - Width in meters
      - `height` (numeric) - Height/drop in meters
      - `sheet_type` (text) - Type of polycarbonate sheet
      - `sheet_thickness` (text) - Thickness of sheet
      - `sheet_color` (text) - Color of sheet
      - `num_sheets` (integer) - Number of sheets calculated
      - `materials` (jsonb) - Array of materials with quantities and prices
      - `subtotal` (numeric) - Subtotal before tax
      - `tax` (numeric) - Tax amount
      - `total` (numeric) - Final total
      - `rounding_amount` (numeric) - Rounding adjustment
      - `created_at` (timestamptz) - Quote creation date
      - `updated_at` (timestamptz) - Last update date
      - `status` (text) - Quote status (draft, sent, accepted, rejected)
      - `notes` (text) - Additional notes

  2. Security
    - Enable RLS on `quotes` table
    - Add policies for authenticated users to manage their quotes
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  client_name text DEFAULT '',
  client_email text DEFAULT '',
  width numeric(10, 2) NOT NULL,
  height numeric(10, 2) NOT NULL,
  sheet_type text NOT NULL DEFAULT 'alveolar',
  sheet_thickness text NOT NULL DEFAULT '8mm',
  sheet_color text NOT NULL DEFAULT 'bronze',
  num_sheets integer NOT NULL DEFAULT 0,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  tax numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  rounding_amount numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'draft',
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);