CREATE TABLE chat_sessions (
  id VARCHAR(36) PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'active',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT status_check CHECK (status IN ('active', 'closed', 'archived'))
);

CREATE INDEX idx_sessions_status ON chat_sessions(status);
CREATE INDEX idx_sessions_created ON chat_sessions(created_at);