-- Migration to add generated_code table
CREATE TABLE IF NOT EXISTS generated_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  language VARCHAR NOT NULL,
  framework VARCHAR,
  code TEXT NOT NULL,
  explanation TEXT,
  dependencies TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_code_user_id ON generated_code(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_code_language ON generated_code(language);
CREATE INDEX IF NOT EXISTS idx_generated_code_created_at ON generated_code(created_at);