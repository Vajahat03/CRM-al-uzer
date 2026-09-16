/*
# Create cyber cafe management tables

1. New Tables
- `work_types` stores the editable work-type to expense master list.
- `customer_records` stores customer work transactions and snapshots the expense used at entry time.
- `spendings` stores separate business spending entries.

2. Security
- Row level security is enabled on every table.
- This is a single-tenant app without sign-in, so the anon and authenticated roles receive explicit CRUD access.

3. Important Notes
- Historical customer expenses are stored on each transaction and do not change when the master work type is edited.
- Dashboard totals are derived from customer records and spending records.
*/

CREATE TABLE IF NOT EXISTS public.work_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  expense numeric(12,2) NOT NULL DEFAULT 0 CHECK (expense >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  mobile text NOT NULL DEFAULT '',
  work_type text NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid >= 0),
  expense numeric(12,2) NOT NULL DEFAULT 0 CHECK (expense >= 0),
  income numeric(12,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'PENDING',
  work_status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spendings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL DEFAULT 'Business',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spendings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shared_select_work_types" ON public.work_types;
CREATE POLICY "shared_select_work_types" ON public.work_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_work_types" ON public.work_types;
CREATE POLICY "shared_insert_work_types" ON public.work_types FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_work_types" ON public.work_types;
CREATE POLICY "shared_update_work_types" ON public.work_types FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_work_types" ON public.work_types;
CREATE POLICY "shared_delete_work_types" ON public.work_types FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_customer_records" ON public.customer_records;
CREATE POLICY "shared_select_customer_records" ON public.customer_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_customer_records" ON public.customer_records;
CREATE POLICY "shared_insert_customer_records" ON public.customer_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_customer_records" ON public.customer_records;
CREATE POLICY "shared_update_customer_records" ON public.customer_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_customer_records" ON public.customer_records;
CREATE POLICY "shared_delete_customer_records" ON public.customer_records FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_spendings" ON public.spendings;
CREATE POLICY "shared_select_spendings" ON public.spendings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_spendings" ON public.spendings;
CREATE POLICY "shared_insert_spendings" ON public.spendings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_spendings" ON public.spendings;
CREATE POLICY "shared_update_spendings" ON public.spendings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_spendings" ON public.spendings;
CREATE POLICY "shared_delete_spendings" ON public.spendings FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS customer_records_created_at_idx ON public.customer_records (created_at DESC);
CREATE INDEX IF NOT EXISTS customer_records_work_type_idx ON public.customer_records (work_type);
CREATE INDEX IF NOT EXISTS spendings_created_at_idx ON public.spendings (created_at DESC);