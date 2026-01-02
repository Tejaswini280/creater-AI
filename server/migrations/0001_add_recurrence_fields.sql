-- Migration: Add recurrence, timezone, and series_end_date fields to post_schedules table
-- Date: 2024-12-19
-- Description: Adds advanced scheduling features for recurring content

-- Add recurrence field to post_schedules table
ALTER TABLE post_schedules
ADD COLUMN recurrence VARCHAR(50) DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'weekdays'));

-- Add timezone field to post_schedules table
ALTER TABLE post_schedules
ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC';

-- Add series_end_date field to post_schedules table
ALTER TABLE post_schedules
ADD COLUMN series_end_date TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN post_schedules.recurrence IS 'Recurrence pattern: none, daily, weekly, monthly, weekdays';
COMMENT ON COLUMN post_schedules.timezone IS 'Timezone identifier (e.g., America/New_York, Europe/London)';
COMMENT ON COLUMN post_schedules.series_end_date IS 'End date for recurring series (optional)';

-- Create index for better query performance on recurring schedules
CREATE INDEX idx_post_schedules_recurrence ON post_schedules(recurrence) WHERE recurrence != 'none';

-- Create index for timezone-based queries
CREATE INDEX idx_post_schedules_timezone ON post_schedules(timezone) WHERE timezone != 'UTC';
