# Database Storage for AI-Generated Content

## Database Information

**Database Type**: PostgreSQL  
**Database Name**: `creators_dev_db`  
**Host**: `localhost:5432`  
**User**: `postgres`  
**Connection**: `postgresql://postgres@localhost:5432/creators_dev_db`

## Primary AI Content Storage Tables

### 1. 📝 `content` Table (Main Content Storage)
**Purpose**: Stores all content including AI-generated content  
**Key AI Fields**:
- `ai_generated` (boolean) - Marks content as AI-generated
- `day_number` (integer) - Day number in AI project sequence
- `is_paused` (boolean) - Individual content pause state
- `is_stopped` (boolean) - Individual content stop state
- `can_publish` (boolean) - Publishing permission flag
- `publish_order` (integer) - Order within the day
- `content_version` (integer) - Version for regeneration tracking
- `last_regenerated_at` (timestamp) - Last regeneration time

**Complete Structure**:
```sql
CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  project_id INTEGER REFERENCES projects(id),
  title VARCHAR NOT NULL,
  description TEXT,
  script TEXT,
  platform VARCHAR NOT NULL,
  content_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  thumbnail_url VARCHAR,
  video_url VARCHAR,
  tags TEXT[],
  metadata JSONB,
  ai_generated BOOLEAN DEFAULT false,
  day_number INTEGER,
  is_paused BOOLEAN DEFAULT false,
  is_stopped BOOLEAN DEFAULT false,
  can_publish BOOLEAN DEFAULT true,
  publish_order INTEGER DEFAULT 0,
  content_version INTEGER DEFAULT 1,
  last_regenerated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 🤖 `ai_generated_content` Table (Dedicated AI Content)
**Purpose**: Specialized storage for AI project content  
**Key Features**:
- Links to AI projects via `ai_project_id`
- Enhanced AI metadata (model, prompt, confidence)
- Engagement predictions
- Advanced content management

**Complete Structure**:
```sql
CREATE TABLE ai_generated_content (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  title VARCHAR NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  platform VARCHAR NOT NULL,
  content_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft',
  scheduled_date TIMESTAMP,
  published_at TIMESTAMP,
  hashtags TEXT[],
  metadata JSONB,
  ai_model VARCHAR DEFAULT 'gemini-1.5-flash',
  generation_prompt TEXT,
  confidence DECIMAL(3,2),
  engagement_prediction JSONB,
  day_number INTEGER NOT NULL,
  is_paused BOOLEAN DEFAULT false,
  is_stopped BOOLEAN DEFAULT false,
  can_publish BOOLEAN DEFAULT true,
  publish_order INTEGER DEFAULT 0,
  content_version INTEGER DEFAULT 1,
  last_regenerated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 📅 `ai_content_calendar` Table (Scheduling)
**Purpose**: Manages AI content scheduling and calendar  
**Features**:
- Links content to specific dates/times
- Platform-specific scheduling
- Engagement optimization
- AI-optimized posting times

### 4. 🎯 `ai_projects` Table (Project Management)
**Purpose**: Manages AI content generation projects  
**Features**:
- Project duration and settings
- Target channels and audience
- Brand voice and content goals
- AI generation preferences

### 5. 📊 `ai_generation_tasks` Table (Task Tracking)
**Purpose**: Tracks individual AI generation tasks  
**Features**:
- Task type (script, voiceover, video, thumbnail)
- Generation prompts and results
- Task status and completion tracking

## Supporting Tables

### 6. 📈 `content_metrics` Table
- Tracks performance metrics for all content
- Links to main content table via `content_id`

### 7. 🔔 `notifications` Table  
- Stores AI-related notifications
- Content ready alerts, AI completion notices

### 8. 👥 `users` Table
- User authentication and profiles
- Links to all AI content via `user_id`

### 9. 📁 `projects` Table
- General project management
- Can be linked to AI projects

## Current AI Content Storage Flow

When you generate AI content via `/api/ai/generate-content`:

1. **Content Creation**: New record created in `content` table
   - `ai_generated` = `true`
   - `user_id` = authenticated user
   - `title`, `content`, `platform`, `content_type` populated
   - `status` = `'draft'`
   - Unique `id` generated (e.g., "qe14L72o66Zlk-qZ8ZJfH")

2. **Metadata Storage**: Additional AI info stored in `metadata` JSONB field:
   ```json
   {
     "tone": "professional",
     "duration": "1-3 minutes", 
     "targetAudience": "young professionals",
     "keywords": "productivity tips",
     "generatedAt": "2025-12-26T05:22:16.804Z"
   }
   ```

3. **Task Tracking**: Optional record in `ai_generation_tasks` for tracking

## Database Access Examples

### Query AI Content for a User
```sql
SELECT * FROM content 
WHERE user_id = 'EAzLepQUX10UODF54_Ge-' 
AND ai_generated = true 
ORDER BY created_at DESC;
```

### Get AI Project Content
```sql
SELECT * FROM ai_generated_content 
WHERE ai_project_id = 1 
AND user_id = 'user_id_here'
ORDER BY day_number, publish_order;
```

### Check Content Status
```sql
SELECT id, title, status, platform, created_at 
FROM content 
WHERE ai_generated = true 
AND status = 'draft';
```

## Environment Configuration

The database connection is configured in `.env`:
```env
DB_NAME=creators_dev_db
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgresql://postgres@localhost:5432/creators_dev_db
```

## Verification Status ✅

All required AI tables have been verified to exist:
- ✅ `content` table with AI fields
- ✅ `ai_generated_content` table  
- ✅ `ai_content_calendar` table
- ✅ `ai_projects` table
- ✅ `ai_generation_tasks` table
- ✅ All supporting tables and relationships

The AI content generation system is fully integrated with the PostgreSQL database and successfully storing generated content with proper relationships and metadata.