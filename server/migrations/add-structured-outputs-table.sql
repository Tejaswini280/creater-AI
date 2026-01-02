-- Migration to add structured_outputs table
CREATE TABLE IF NOT EXISTS structured_outputs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  schema JSONB NOT NULL,
  response_json JSONB NOT NULL,
  model VARCHAR DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_structured_outputs_user_id ON structured_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_structured_outputs_created_at ON structured_outputs(created_at);