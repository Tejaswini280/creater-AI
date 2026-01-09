-- Fix missing day_number column in content table
-- This addresses the scheduler service error

-- Add day_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'day_number'
  ) THEN
    ALTER TABLE content ADD COLUMN day_number INTEGER;
    RAISE NOTICE '✅ Added day_number column to content table';
  ELSE
    RAISE NOTICE 'ℹ️ day_number column already exists in content table';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'content' AND column_name = 'day_number';