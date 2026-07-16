-- Phase 14: Enterprise Production Data Layer + Authentication + Persistent Memory
-- Incremental Migration for Supabase

-- 1. Users & RBAC
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'client', -- admin, sales, support
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Trigger to automatically create a user profile when a new auth.users signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'admin'); -- Defaulting to admin for this phase to easily login
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Chat Architecture
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, 
  title VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  language VARCHAR(10),
  status VARCHAR(50) DEFAULT 'delivered',
  token_usage INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  content_type VARCHAR(100),
  extraction_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- 3. Leads (CRM) - Upgrade existing leads table or recreate it
-- Note: the original leads table used BIGSERIAL for id, we need UUID to match schema.
-- Instead of dropping, we will create enterprise_leads to avoid destroying legacy data during dual mode.
CREATE TABLE IF NOT EXISTS enterprise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  pipeline_stage VARCHAR(50) DEFAULT 'new',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE enterprise_leads ENABLE ROW LEVEL SECURITY;

-- 4. Knowledge Base (RAG)
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE knowledge_docs ENABLE ROW LEVEL SECURITY;

-- Ensure pgvector exists
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID REFERENCES knowledge_docs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR, 
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for Admin Access
CREATE POLICY "Admins have full access to users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Admins have full access to chat_sessions" ON chat_sessions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'support', 'sales'))
);

CREATE POLICY "Admins have full access to messages" ON messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'support', 'sales'))
);

CREATE POLICY "Admins have full access to enterprise_leads" ON enterprise_leads FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'sales'))
);

CREATE POLICY "Admins have full access to knowledge_docs" ON knowledge_docs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'support'))
);

CREATE POLICY "Admins have full access to knowledge_chunks" ON knowledge_chunks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'support'))
);

CREATE POLICY "Admins have full access to audit_logs" ON audit_logs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'support'))
);

-- 6. Storage Buckets (Step 5)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('chat-attachments', 'chat-attachments', false, 52428800, '{"image/*","application/pdf","text/plain","audio/*"}'),
  ('knowledge-base', 'knowledge-base', false, 104857600, '{"application/pdf","text/plain","text/csv","application/msword"}')
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage Buckets
-- Only admins/support can access knowledge-base
CREATE POLICY "Admins manage knowledge-base" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'knowledge-base' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'support'))
);

-- Users can access their own attachments, or admins can access all
CREATE POLICY "Users manage own attachments" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'chat-attachments' AND (
    (auth.uid() = owner) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'support', 'sales'))
  )
);

-- Public insert access for Chat/Leads via Service Role or specific logic 
-- (Assuming Next.js API routes use Service Role Key for unauthenticated client insertion, RLS isn't strictly necessary for inserts from the server)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message ON attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_leads_email ON enterprise_leads(email);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc ON knowledge_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
