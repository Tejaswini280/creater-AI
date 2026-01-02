-- Create AI Projects Management Tables
-- This migration adds the missing AI project management tables

-- AI Projects table
CREATE TABLE IF NOT EXISTS "ai_projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "title" varchar NOT NULL,
  "description" text,
  "project_type" varchar NOT NULL,
  "duration" integer NOT NULL,
  "custom_duration" integer,
  "target_channels" text[] NOT NULL,
  "content_frequency" varchar NOT NULL,
  "target_audience" varchar,
  "brand_voice" varchar,
  "content_goals" text[],
  "content_title" varchar,
  "content_description" text,
  "channel_type" varchar,
  "tags" text[],
  "ai_settings" jsonb,
  "status" varchar DEFAULT 'active' NOT NULL,
  "start_date" timestamp DEFAULT now(),
  "end_date" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- AI Generated Content table
CREATE TABLE IF NOT EXISTS "ai_generated_content" (
  "id" serial PRIMARY KEY NOT NULL,
  "ai_project_id" integer NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "title" varchar NOT NULL,
  "description" text,
  "content" text NOT NULL,
  "platform" varchar NOT NULL,
  "content_type" varchar NOT NULL,
  "status" varchar DEFAULT 'draft' NOT NULL,
  "scheduled_date" timestamp,
  "published_at" timestamp,
  "hashtags" text[],
  "metadata" jsonb,
  "ai_model" varchar DEFAULT 'gemini-1.5-flash',
  "generation_prompt" text,
  "confidence" decimal(3,2),
  "engagement_prediction" jsonb,
  "day_number" integer NOT NULL,
  "is_paused" boolean DEFAULT false,
  "is_stopped" boolean DEFAULT false,
  "can_publish" boolean DEFAULT true,
  "publish_order" integer DEFAULT 0,
  "content_version" integer DEFAULT 1,
  "last_regenerated_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- AI Content Calendar table
CREATE TABLE IF NOT EXISTS "ai_content_calendar" (
  "id" serial PRIMARY KEY NOT NULL,
  "ai_project_id" integer NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "content_id" integer REFERENCES ai_generated_content(id) ON DELETE CASCADE,
  "scheduled_date" timestamp NOT NULL,
  "scheduled_time" varchar,
  "platform" varchar NOT NULL,
  "status" varchar DEFAULT 'scheduled' NOT NULL,
  "published_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- AI Engagement Patterns table
CREATE TABLE IF NOT EXISTS "ai_engagement_patterns" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "platform" varchar NOT NULL,
  "content_type" varchar NOT NULL,
  "optimal_times" text[] NOT NULL,
  "engagement_score" decimal(5,2),
  "sample_size" integer DEFAULT 0,
  "last_updated" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_ai_projects_user_id" ON "ai_projects" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_projects_status" ON "ai_projects" ("status");
CREATE INDEX IF NOT EXISTS "idx_ai_generated_content_project_id" ON "ai_generated_content" ("ai_project_id");
CREATE INDEX IF NOT EXISTS "idx_ai_generated_content_user_id" ON "ai_generated_content" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_generated_content_status" ON "ai_generated_content" ("status");
CREATE INDEX IF NOT EXISTS "idx_ai_content_calendar_project_id" ON "ai_content_calendar" ("ai_project_id");
CREATE INDEX IF NOT EXISTS "idx_ai_content_calendar_scheduled_date" ON "ai_content_calendar" ("scheduled_date");
CREATE INDEX IF NOT EXISTS "idx_ai_engagement_patterns_user_platform" ON "ai_engagement_patterns" ("user_id", "platform");
