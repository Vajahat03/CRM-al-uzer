-- ============================================================================
-- AL UZER COMMON SERVICES CRM - COMPLETE CONSOLIDATED SUPABASE SCHEMA & DATA
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor to set up all tables,
-- columns, indexes, RLS security policies, and import your existing live data.
-- ============================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. WORK TYPES MASTER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_types (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL UNIQUE,
  expense numeric(12,2) NOT NULL DEFAULT 0 CHECK (expense >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. CUSTOMER RECORDS (JOBS & PAYMENTS) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_records (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_name text NOT NULL,
  mobile text NOT NULL DEFAULT '',
  work_type text NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  charges numeric(12,2) NOT NULL DEFAULT 0 CHECK (charges >= 0),
  paid numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid >= 0),
  expense numeric(12,2) NOT NULL DEFAULT 0 CHECK (expense >= 0),
  income numeric(12,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'PENDING',
  work_status text NOT NULL DEFAULT 'Pending',
  payment_mode text NOT NULL DEFAULT 'Cash',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure charges and payment_mode columns exist if table was created previously
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'customer_records' AND column_name = 'charges'
  ) THEN
    ALTER TABLE public.customer_records ADD COLUMN charges numeric(12,2) NOT NULL DEFAULT 0 CHECK (charges >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'customer_records' AND column_name = 'payment_mode'
  ) THEN
    ALTER TABLE public.customer_records ADD COLUMN payment_mode text NOT NULL DEFAULT 'Cash';
  END IF;
END $$;

-- ============================================================================
-- 3. SPENDINGS (BUSINESS EXPENSES) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.spendings (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  expense_name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL DEFAULT 'Business',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. SPENDING CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.spending_categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. WORK STATUSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_statuses (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. KIRKOL (COUNTER REVENUE) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.kirkol (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 7. SMS REMINDER SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_settings (
  id text PRIMARY KEY,
  enabled boolean DEFAULT true,
  min_days_overdue integer DEFAULT 5,
  reminder_frequency_days integer DEFAULT 5,
  reminder_time text DEFAULT '10:00 AM',
  max_reminders integer DEFAULT 3,
  message_template text NOT NULL,
  business_name text DEFAULT 'Al Uzer Common Services',
  gateway_api_key text,
  gateway_device_name text,
  gateway_last_seen timestamptz,
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 8. SMS REMINDER QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_queue (
  id text PRIMARY KEY,
  customer_id text,
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  message text NOT NULL,
  balance numeric DEFAULT 0,
  days_overdue integer DEFAULT 0,
  work_type text,
  status text DEFAULT 'pending',
  scheduled_at timestamptz DEFAULT timezone('utc'::text, now()),
  attempts integer DEFAULT 0,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 9. SMS DISPATCH LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id text PRIMARY KEY,
  customer_id text,
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  message text NOT NULL,
  balance numeric DEFAULT 0,
  status text NOT NULL,
  sent_at timestamptz DEFAULT timezone('utc'::text, now()),
  error_message text,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customer_records_created_at ON public.customer_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_records_work_type ON public.customer_records (work_type);
CREATE INDEX IF NOT EXISTS idx_customer_records_payment_status ON public.customer_records (payment_status);
CREATE INDEX IF NOT EXISTS idx_spendings_created_at ON public.spendings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kirkol_created_at ON public.kirkol (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON public.sms_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_customer_id ON public.sms_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_customer_id ON public.sms_logs(customer_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spendings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kirkol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'work_types', 'customer_records', 'spendings', 'spending_categories', 
    'work_statuses', 'kirkol', 'sms_settings', 'sms_queue', 'sms_logs'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "shared_select_%I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "shared_select_%I" ON public.%I FOR SELECT TO anon, authenticated USING (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "shared_insert_%I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "shared_insert_%I" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "shared_update_%I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "shared_update_%I" ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "shared_delete_%I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "shared_delete_%I" ON public.%I FOR DELETE TO anon, authenticated USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- MASTER WORK TYPES & EXPENSES (FROM YOUR SERVICES)
-- ============================================================================
INSERT INTO public.work_types (name, expense, is_active) VALUES
  ('PAN CARD 500', 320.00, true),
  ('ELECTION', 20.00, true),
  ('PAN CARD 400', 220.00, true),
  ('DRIVING LICENSE (2W+4W TRANSPO', 3500.00, true),
  ('AADHAR PAN LINK', 1000.00, true),
  ('PASSPORT', 2500.00, true),
  ('INCOME', 170.00, true),
  ('PAN CARD 250', 120.00, true),
  ('PAN CARD', 100.00, true),
  ('DOMICILE', 150.00, true),
  ('GAZETTE', 300.00, true),
  ('AADHAR CARD', 50.00, true),
  ('VOTER ID', 30.00, true)
ON CONFLICT (name) DO UPDATE SET expense = EXCLUDED.expense;

-- ============================================================================
-- SPENDING CATEGORIES & WORK STATUSES
-- ============================================================================
INSERT INTO public.spending_categories (name) VALUES 
  ('Business'), ('Utilities'), ('Office supplies'), ('Personal') 
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.work_statuses (name) VALUES 
  ('Pending'), ('In Progress'), ('Payment Pending'), ('Document Required'), ('Completed'), ('Delivered'), ('Rejected'), ('Cancelled') 
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SMS REMINDER DEFAULT SETTINGS
-- ============================================================================
INSERT INTO public.sms_settings (
  id, enabled, min_days_overdue, reminder_frequency_days, reminder_time, max_reminders, 
  message_template, business_name, gateway_api_key, gateway_device_name
) VALUES (
  'sms-default-config', true, 5, 5, '10:00 AM', 3,
  'Dear {customer_name}, your outstanding balance of ₹{balance} for {work_type} has been pending for {days_pending} days. Please clear your pending amount at your earliest convenience. Thank you, {business_name}.',
  'Al Uzer Common Services', 'alz-gateway-sim-sec-key-889', 'Owner SIM Gateway (Android)'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- IMPORT YOUR LIVE CUSTOMER WORK & TRANSACTIONS (11 RECORDS)
-- ============================================================================
INSERT INTO public.customer_records (
  customer_name, mobile, work_type, total_amount, charges, paid, expense, income, payment_status, work_status, created_at
) VALUES
  ('SAHAIL HAKIM SHAIKH TAKARE', '8177808656', 'PAN CARD 500', 450.00, 0.00, 450.00, 320.00, 130.00, 'PAID', 'Pending', '2026-09-03T10:00:00Z'),
  ('ILMODDIN LUKMAN SHAIKH', '9637609072', 'ELECTION', 300.00, 0.00, 300.00, 20.00, 280.00, 'PAID', 'In Progress', '2026-09-03T10:30:00Z'),
  ('SHAHADAT LUKMAN SHAIKH', '9637609072', 'ELECTION', 300.00, 0.00, 300.00, 20.00, 280.00, 'PAID', 'Payment Pending', '2026-09-03T11:00:00Z'),
  ('AYASHA MAZHAR HUSSAIN ANSARI', '7020936678', 'PAN CARD 400', 400.00, 0.00, 400.00, 220.00, 180.00, 'PAID', 'Pending', '2026-09-03T11:30:00Z'),
  ('NASIR RASHID KHAN', '9284217176', 'DRIVING LICENSE (2W+4W TRANSPO', 5500.00, 0.00, 3500.00, 3500.00, 2000.00, 'PARTIAL', 'Pending', '2026-09-03T12:00:00Z'),
  ('YASMEEN ILIYAS SHAIKH', '8888428035', 'AADHAR PAN LINK', 1200.00, 0.00, 1200.00, 1000.00, 200.00, 'PAID', 'In Progress', '2026-09-02T10:00:00Z'),
  ('GULBANO KUTUBODDIN NAGINEWALE', '', 'PASSPORT', 3000.00, 0.00, 2500.00, 2500.00, 500.00, 'PARTIAL', 'Pending', '2026-09-02T11:00:00Z'),
  ('KISHOR RAJARAM TAKARE', '', 'INCOME', 250.00, 0.00, 250.00, 170.00, 80.00, 'PAID', 'In Progress', '2026-09-01T10:00:00Z'),
  ('MADEEHA ASAD SAYYED', '9850578671', 'ELECTION', 300.00, 0.00, 300.00, 20.00, 280.00, 'PAID', 'In Progress', '2026-09-01T11:00:00Z'),
  ('ASAD SULTAN SAYYYED', '985078671', 'ELECTION', 300.00, 0.00, 300.00, 20.00, 280.00, 'PAID', 'In Progress', '2026-09-01T11:30:00Z'),
  ('SABA USMAN KHAN', '9422999478', 'PAN CARD 250', 250.00, 0.00, 250.00, 120.00, 130.00, 'PAID', 'Pending', '2026-09-01T12:00:00Z');

-- ============================================================================
-- IMPORT YOUR LIVE KIRKOL (COUNTER REVENUE) (31 RECORDS)
-- ============================================================================
INSERT INTO public.kirkol (work, price, created_at) VALUES
  ('2000 MT T', 20.00, '2026-09-04T09:00:00Z'),
  ('AADHAAR', 60.00, '2026-09-04T09:15:00Z'),
  ('AADHAAR', 60.00, '2026-09-04T09:30:00Z'),
  ('ADHAAR', 60.00, '2026-09-04T09:45:00Z'),
  ('PVC CARD', 100.00, '2026-09-04T10:00:00Z'),
  ('8000 ONLNE YUKUB BHAI J', 80.00, '2026-09-04T10:15:00Z'),
  ('PHOTO', 50.00, '2026-09-04T10:30:00Z'),
  ('5000 MT', 50.00, '2026-09-04T10:45:00Z'),
  ('2000 MT', 20.00, '2026-09-04T11:00:00Z'),
  ('1000 MJ', 10.00, '2026-09-04T11:15:00Z'),
  ('AADHAAR', 60.00, '2026-09-04T11:30:00Z'),
  ('2000MT T', 20.00, '2026-09-03T09:00:00Z'),
  ('COLOUR PRINT', 10.00, '2026-09-03T09:30:00Z'),
  ('AADHAR', 60.00, '2026-09-03T10:00:00Z'),
  ('850 MT J', 10.00, '2026-09-03T10:30:00Z'),
  ('MHA ID', 100.00, '2026-09-03T11:00:00Z'),
  ('500MT T', 10.00, '2026-09-03T11:30:00Z'),
  ('AADHAR', 120.00, '2026-09-03T12:00:00Z'),
  ('500 MT J', 10.00, '2026-09-03T12:30:00Z'),
  ('12500 MT J', 130.00, '2026-09-03T13:00:00Z'),
  ('2000 MT T', 20.00, '2026-09-03T13:30:00Z'),
  ('500 LADKI BAHEN J', 10.00, '2026-09-03T14:00:00Z'),
  ('400 MT T', 10.00, '2026-09-03T14:30:00Z'),
  ('PHOTO', 50.00, '2026-09-03T15:00:00Z'),
  ('PHOTO', 50.00, '2026-09-03T15:30:00Z'),
  ('MAHA ID', 200.00, '2026-09-03T16:00:00Z'),
  ('LETTER HEAD', 80.00, '2026-09-03T16:30:00Z'),
  ('10000 mt j', 100.00, '2026-09-03T17:00:00Z'),
  ('2200 MT J', 30.00, '2026-09-03T17:30:00Z'),
  ('AADHAR', 60.00, '2026-09-03T18:00:00Z'),
  ('2000 MONEY TRANSFER', 20.00, '2026-09-03T18:30:00Z');
