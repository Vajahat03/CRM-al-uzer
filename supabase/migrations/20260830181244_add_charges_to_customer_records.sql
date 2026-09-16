/*
# Add charges column to customer_records

1. Modified Tables
- `customer_records` — adds a new `charges` numeric column (default 0) to record
  how much was charged to the customer, separate from the existing `total_amount`
  which represents the total transaction amount.
2. Security
- No policy changes. Existing CRUD policies on customer_records already cover the new column.
3. Important Notes
- The new column is nullable-safe with a default of 0 so existing rows are unaffected.
- Idempotent: uses a DO block to check before adding.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_records' AND column_name = 'charges') THEN
    ALTER TABLE public.customer_records ADD COLUMN charges numeric(12,2) NOT NULL DEFAULT 0 CHECK (charges >= 0);
  END IF;
END $$;