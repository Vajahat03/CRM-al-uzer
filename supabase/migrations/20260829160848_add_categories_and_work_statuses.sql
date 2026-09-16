/*
# Add spending categories and work statuses tables

1. New Tables
- `spending_categories` stores editable spending category names.
- `work_statuses` stores editable work status options for customer records.

2. Security
- Row level security enabled on both tables.
- Single-tenant app without sign-in, so anon and authenticated roles get full CRUD.

3. Notes
- Seeds default categories (Business, Utilities, Office supplies, Personal).
- Seeds default work statuses (Pending, In Progress, Completed, Delivered, Cancelled).
*/

CREATE TABLE IF NOT EXISTS public.spending_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.work_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spending_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shared_select_spending_categories" ON public.spending_categories;
CREATE POLICY "shared_select_spending_categories" ON public.spending_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_spending_categories" ON public.spending_categories;
CREATE POLICY "shared_insert_spending_categories" ON public.spending_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_spending_categories" ON public.spending_categories;
CREATE POLICY "shared_update_spending_categories" ON public.spending_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_spending_categories" ON public.spending_categories;
CREATE POLICY "shared_delete_spending_categories" ON public.spending_categories FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_work_statuses" ON public.work_statuses;
CREATE POLICY "shared_select_work_statuses" ON public.work_statuses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_work_statuses" ON public.work_statuses;
CREATE POLICY "shared_insert_work_statuses" ON public.work_statuses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_work_statuses" ON public.work_statuses;
CREATE POLICY "shared_update_work_statuses" ON public.work_statuses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_work_statuses" ON public.work_statuses;
CREATE POLICY "shared_delete_work_statuses" ON public.work_statuses FOR DELETE TO anon, authenticated USING (true);

INSERT INTO public.spending_categories (name) VALUES ('Business'), ('Utilities'), ('Office supplies'), ('Personal') ON CONFLICT DO NOTHING;
INSERT INTO public.work_statuses (name) VALUES ('Pending'), ('In Progress'), ('Completed'), ('Delivered'), ('Cancelled') ON CONFLICT DO NOTHING;