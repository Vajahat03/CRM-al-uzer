-- Migration: Create SMS Settings, Queue, and Logs tables for Al Uzer CRM
-- Allows Android Phone Gateway & CRM to manage 5-day overdue debt reminders

-- 1. SMS Settings Table
CREATE TABLE IF NOT EXISTS sms_settings (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  min_days_overdue INTEGER DEFAULT 5,
  reminder_frequency_days INTEGER DEFAULT 5,
  reminder_time TEXT DEFAULT '10:00 AM',
  max_reminders INTEGER DEFAULT 3,
  message_template TEXT NOT NULL,
  business_name TEXT DEFAULT 'Al Uzer Common Services',
  gateway_api_key TEXT,
  gateway_device_name TEXT,
  gateway_last_seen TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. SMS Queue Table
CREATE TABLE IF NOT EXISTS sms_queue (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  days_overdue INTEGER DEFAULT 0,
  work_type TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  status TEXT NOT NULL, -- 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON sms_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_customer_id ON sms_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_customer_id ON sms_logs(customer_id);
