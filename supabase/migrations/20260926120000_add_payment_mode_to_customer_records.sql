/*
# Add payment_mode column to customer_records

1. Modified Tables
- `customer_records` — adds a new `payment_mode` text column (default 'Cash') to track
  whether payment was made via Cash or Online.
2. Security
- No policy changes needed. Existing CRUD policies cover all columns.
3. Idempotent DO block.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'customer_records' AND column_name = 'payment_mode'
  ) THEN
    ALTER TABLE public.customer_records ADD COLUMN payment_mode text NOT NULL DEFAULT 'Cash';
  END IF;
END $$;
