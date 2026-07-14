-- Migration to add missing columns to leads table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Add unique constraint safely if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_session_unique'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT email_session_unique UNIQUE(email, session_id);
  END IF;
END $$;

-- Reload PostgREST schema cache so the API recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
