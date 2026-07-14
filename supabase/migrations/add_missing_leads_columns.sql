-- Migration to add missing columns to leads table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Also add the unique constraint if desired
-- ALTER TABLE public.leads ADD CONSTRAINT email_session_unique UNIQUE(email, session_id);
