-- XAIVON Chatbot Database Schema (Supabase / PostgreSQL)
-- This is a reference schema. Run these SQL migrations in Supabase Dashboard.
-- See supabase/migrations/ for individual migration files.

-- Leads table: stores contact form submissions from the chatbot
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(20),
  session_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT email_session_unique UNIQUE(email, session_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_session ON leads(session_id);

-- Chat sessions table: tracks individual chat conversations
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(36) PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'active',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT status_check CHECK (status IN ('active', 'closed', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON chat_sessions(created_at);
