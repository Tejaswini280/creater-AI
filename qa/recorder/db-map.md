# Recorder Page Database Integration Map

## Overview
The recorder page currently has minimal database integration. Most data is stored client-side with no server persistence for recordings. This document maps current and planned database interactions.

## Current Database Usage

### Authentication Tables
**Status**: Used via authentication system

#### users table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "first_name" VARCHAR NOT NULL,
  "last_name" VARCHAR NOT NULL,
  "profile_image_url" VARCHAR,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
```
**Usage in Recorder**:
- User authentication state
- Profile data display
- Access control

#### sessions table (Replit Auth)
```sql
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
```
**Usage**: Session management for authentication persistence

## Missing Database Integration

### Recording Metadata Storage
**Status**: Not implemented - recordings stored client-side only

#### Proposed: recordings table
```sql
CREATE TABLE recordings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  recording_type VARCHAR NOT NULL, -- camera, audio, screen, screen-camera, slides-camera, slides
  duration INTEGER NOT NULL, -- seconds
  file_size BIGINT, -- bytes
  mime_type VARCHAR,
  storage_url VARCHAR, -- cloud storage URL
  thumbnail_url VARCHAR,
  quality VARCHAR DEFAULT 'high', -- high, medium, low
  status VARCHAR DEFAULT 'completed', -- processing, completed, failed
  metadata JSONB, -- recording settings, device info
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_project_id ON recordings(project_id);
CREATE INDEX idx_recordings_created_at ON recordings(created_at);
CREATE INDEX idx_recordings_type ON recordings(recording_type);
```

### Recording Sessions Table
**Status**: Not implemented - no session tracking

#### Proposed: recording_sessions table
```sql
CREATE TABLE recording_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recording_type VARCHAR NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration INTEGER, -- actual recording duration
  device_info JSONB, -- browser, OS, hardware info
  settings JSONB, -- recording settings used
  status VARCHAR DEFAULT 'active', -- active, completed, interrupted
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
```

### Video Editing History
**Status**: Not implemented - edits not persisted

#### Proposed: recording_edits table
```sql
CREATE TABLE recording_edits (
  id SERIAL PRIMARY KEY,
  recording_id INTEGER NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  edit_type VARCHAR NOT NULL, -- trim, crop, filter, text_overlay
  parameters JSONB NOT NULL, -- edit parameters
  applied_at TIMESTAMP DEFAULT NOW(),
  undo_data JSONB -- data needed to undo the edit
);

-- Indexes
CREATE INDEX idx_edits_recording_id ON recording_edits(recording_id);
CREATE INDEX idx_edits_type ON recording_edits(edit_type);
```

## Content Integration

### Current Content Tables
**Status**: Available but not used by recorder

#### content table
```sql
CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  script TEXT,
  platform VARCHAR NOT NULL,
  content_type VARCHAR NOT NULL, -- video, image, text, reel, short
  status VARCHAR NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  thumbnail_url VARCHAR,
  video_url VARCHAR,
  tags TEXT[],
  metadata JSONB,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Integration Opportunity**: Save recordings as content items

#### content_metrics table
```sql
CREATE TABLE content_metrics (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  platform VARCHAR NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  revenue DECIMAL(10,2) DEFAULT '0',
  last_updated TIMESTAMP DEFAULT NOW()
);
```

## Project Integration

### Current Projects Table
**Status**: Available but not integrated

#### projects table
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL, -- video, audio, image, script, campaign
  template VARCHAR,
  platform VARCHAR,
  target_audience VARCHAR,
  estimated_duration VARCHAR,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  status VARCHAR NOT NULL DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Integration Opportunity**: Associate recordings with projects

## AI Integration Tables

### Current AI Tables
**Status**: Available for future AI features

#### ai_generation_tasks table
```sql
CREATE TABLE ai_generation_tasks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type VARCHAR NOT NULL, -- script, voiceover, video, thumbnail
  prompt TEXT NOT NULL,
  result TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```
**Integration Opportunity**: AI-powered recording analysis, transcription, thumbnail generation

## Social Media Integration

### Current Social Tables
**Status**: Available for publishing workflows

#### social_posts table
```sql
CREATE TABLE social_posts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  caption TEXT,
  hashtags TEXT[],
  emojis TEXT[],
  content_type VARCHAR NOT NULL, -- post, reel, short, story, video
  status VARCHAR NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  thumbnail_url VARCHAR,
  media_urls TEXT[],
  ai_generated BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Database Constraints & Relationships

### Current Constraints
```sql
-- Foreign key constraints
ALTER TABLE social_accounts ADD CONSTRAINT fk_social_accounts_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE content ADD CONSTRAINT fk_content_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE content ADD CONSTRAINT fk_content_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
```

### Missing Constraints for Recordings
```sql
-- Proposed constraints
ALTER TABLE recordings ADD CONSTRAINT fk_recordings_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE recordings ADD CONSTRAINT fk_recordings_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE recording_sessions ADD CONSTRAINT fk_sessions_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE recording_edits ADD CONSTRAINT fk_edits_recording
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE;
```

## Migration Strategy

### Phase 1: Recording Storage
```sql
-- Create recordings table
CREATE TABLE recordings (...);

-- Add indexes
CREATE INDEX CONCURRENTLY idx_recordings_user_id ON recordings(user_id);
CREATE INDEX CONCURRENTLY idx_recordings_created_at ON recordings(created_at);

-- Migrate existing client-side data (if any)
-- Note: Currently no server-side data to migrate
```

### Phase 2: Session Tracking
```sql
-- Create recording sessions table
CREATE TABLE recording_sessions (...);

-- Add indexes
CREATE INDEX CONCURRENTLY idx_sessions_user_id ON sessions(user_id);
```

### Phase 3: Editing History
```sql
-- Create recording edits table
CREATE TABLE recording_edits (...);

-- Add indexes
CREATE INDEX CONCURRENTLY idx_edits_recording_id ON recording_edits(recording_id);
```

## Data Retention Policies

### Recording Data
```sql
-- Delete old recordings after 1 year
CREATE OR REPLACE FUNCTION delete_old_recordings()
RETURNS void AS $$
BEGIN
  DELETE FROM recordings
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job
SELECT cron.schedule('cleanup-old-recordings', '0 2 * * *', 'SELECT delete_old_recordings();');
```

### Session Data
```sql
-- Delete old session data after 30 days
DELETE FROM recording_sessions
WHERE created_at < NOW() - INTERVAL '30 days';
```

## Performance Optimizations

### Indexes
```sql
-- Composite indexes for common queries
CREATE INDEX idx_recordings_user_created ON recordings(user_id, created_at DESC);
CREATE INDEX idx_recordings_user_type ON recordings(user_id, recording_type);
CREATE INDEX idx_sessions_user_started ON recording_sessions(user_id, started_at DESC);

-- Partial indexes for active recordings
CREATE INDEX idx_recordings_active ON recordings(user_id) WHERE status = 'completed';
```

### Partitioning Strategy
```sql
-- Partition recordings by month for better performance
CREATE TABLE recordings_y2024m01 PARTITION OF recordings
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Partition sessions by week
CREATE TABLE recording_sessions_y2024w01 PARTITION OF recording_sessions
  FOR VALUES FROM ('2024-01-01') TO ('2024-01-08');
```

## Backup Strategy

### Recording Assets
- **Storage**: Cloud storage (AWS S3, Cloudinary)
- **Backup**: Cross-region replication
- **Retention**: 7 years for legal compliance
- **Encryption**: Server-side encryption at rest

### Metadata
- **Backup Frequency**: Daily
- **Retention**: 7 years
- **Encryption**: Encrypted backups
- **Recovery**: Point-in-time recovery available

## Monitoring & Alerts

### Database Metrics
```sql
-- Monitor recording storage usage
SELECT
  user_id,
  COUNT(*) as recording_count,
  SUM(file_size) as total_size_mb
FROM recordings
GROUP BY user_id
ORDER BY total_size_mb DESC;

-- Monitor recording activity
SELECT
  DATE(created_at) as date,
  COUNT(*) as recordings_created,
  AVG(duration) as avg_duration
FROM recordings
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

### Alerts
- **Storage Usage**: Alert when user exceeds 80% of storage limit
- **Recording Failures**: Alert on high failure rate
- **Performance**: Alert on slow queries (>5 seconds)
- **Disk Space**: Alert when disk usage >85%

## Security Considerations

### Data Encryption
- **At Rest**: AES-256 encryption for stored recordings
- **In Transit**: TLS 1.3 for all data transfers
- **Key Management**: AWS KMS for encryption keys

### Access Control
- **Row Level Security**: Users can only access their own recordings
- **API Permissions**: Separate permissions for read/write/delete
- **Audit Logging**: All recording operations logged

### Privacy Compliance
- **GDPR**: Data portability and right to erasure
- **CCPA**: Privacy rights and data minimization
- **Retention**: Configurable retention policies

## Migration Scripts

### Database Migration Files
```sql
-- migrations/001_add_recordings_table.sql
-- migrations/002_add_recording_sessions.sql
-- migrations/003_add_recording_edits.sql
-- migrations/004_add_storage_indexes.sql
-- migrations/005_add_partitioning.sql
```

### Data Migration Scripts
```typescript
// scripts/migrate-client-recordings.ts
// Migrate any existing client-side recordings to server
// Handle metadata extraction and file upload
```

This database map provides a comprehensive plan for integrating the recorder component with the backend database system.
