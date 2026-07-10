CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(20),
  session_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT email_unique UNIQUE(email, session_id)
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_session ON leads(session_id);