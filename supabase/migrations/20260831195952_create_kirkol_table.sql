/*
# Create kirkol table

1. New Tables
- `kirkol` — stores "kirkol" entries (work + price entered manually)
- `id` (uuid, primary key)
- `work` (text, not null) — description of the kirkol work
- `price` (numeric, not null) — price of the kirkol work
- `created_at` (timestamptz, defaults to now)
2. Security
- Enable RLS on `kirkol`.
- Single-tenant no-auth app: allow anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS kirkol (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kirkol ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kirkol" ON kirkol;
CREATE POLICY "anon_select_kirkol" ON kirkol FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_kirkol" ON kirkol;
CREATE POLICY "anon_insert_kirkol" ON kirkol FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_kirkol" ON kirkol;
CREATE POLICY "anon_update_kirkol" ON kirkol FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_kirkol" ON kirkol;
CREATE POLICY "anon_delete_kirkol" ON kirkol FOR DELETE
  TO anon, authenticated USING (true);