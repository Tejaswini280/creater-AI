# INPUT_TO_DB_MAPPING.md

## Comprehensive Form Input → Database Mapping Matrix

### **Executive Summary**

This document provides a complete mapping of all form inputs across the Renexus platform to their corresponding database tables, columns, types, and validation rules. Each mapping includes:

- **Input Source**: Page, form, and field identification
- **Database Target**: Table.column with type and constraints
- **Validation Rules**: Frontend and backend validation alignment
- **CRUD Context**: Create, Read, Update, Delete operation context
- **Status**: Mapping completeness and implementation status

---

## **1. AUTHENTICATION FORMS**

### **1.1 Login Form** (`/login` - Login Tab)
**API Endpoint**: `POST /api/auth/login`
**Database Context**: User authentication and session creation

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Email | `text` | `users.email` | `varchar` | UNIQUE, NOT NULL | Email format, required | Email format, exists check | ✅ Complete |
| Password | `password` | `users.password` | `text` | NOT NULL | Required, min length | Password verification | ✅ Complete |

**Submit Flow**: FE → `POST /api/auth/login` → Password hash verification → JWT generation → Session creation

---

### **1.2 Registration Form** (`/login` - Register Tab)
**API Endpoint**: `POST /api/auth/register`
**Database Context**: New user creation with validation

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| First Name | `text` | `users.first_name` | `varchar` | NOT NULL | Required, min 2 chars | Required, min 2 chars | ✅ Complete |
| Last Name | `text` | `users.last_name` | `varchar` | NOT NULL | Required, min 2 chars | Required, min 2 chars | ✅ Complete |
| Email | `email` | `users.email` | `varchar` | UNIQUE, NOT NULL | Email format, required | Email format, uniqueness | ✅ Complete |
| Password | `password` | `users.password` | `text` | NOT NULL | Required, strength check | Required, bcrypt hash | ✅ Complete |
| Confirm Password | `password` | - | - | - | Match password | - | ✅ Complete |

**Submit Flow**: FE validation → `POST /api/auth/register` → Duplicate check → Password hash → User creation → Email verification

---

## **2. PROJECT MANAGEMENT FORMS**

### **2.1 New Project Form** (`/new-project-enhanced` - Basic Info Step)
**API Endpoint**: `POST /api/projects`
**Database Context**: Project creation with metadata

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Project Name | `text` | `projects.name` | `varchar` | NOT NULL | Required, min 3 chars | Required, min 3 chars | ✅ Complete |
| Description | `textarea` | `projects.description` | `text` | - | Optional, max 1000 chars | Optional, max 1000 chars | ✅ Complete |
| Project Type | `select` | `projects.type` | `varchar` | NOT NULL | Required selection | Required, enum validation | ✅ Complete |
| Template | `select` | `projects.template` | `varchar` | - | Optional | Optional, template exists | ✅ Complete |
| Platform | `select` | `projects.platform` | `varchar` | - | Optional | Optional, valid platform | ✅ Complete |
| Target Audience | `text` | `projects.target_audience` | `varchar` | - | Optional | Optional | ✅ Complete |
| Estimated Duration | `select` | `projects.estimated_duration` | `varchar` | - | Optional | Optional | ✅ Complete |
| Tags | `tags` | `projects.tags` | `text[]` | - | Optional, array | Optional, array validation | ✅ Complete |
| Is Public | `boolean` | `projects.is_public` | `boolean` | DEFAULT false | Optional | Optional, boolean | ✅ Complete |

**Submit Flow**: Multi-step validation → `POST /api/projects` → Foreign key validation → Project creation → Related records creation

---

### **2.2 Social Post Creation** (`/new-project-enhanced` - Content Planning Step)
**API Endpoint**: `POST /api/projects` (with nested social posts)
**Database Context**: Social media content creation

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Post Title | `text` | `social_posts.title` | `varchar` | NOT NULL | Required, min 5 chars | Required, min 5 chars | ✅ Complete |
| Caption | `textarea` | `social_posts.caption` | `text` | - | Optional, max 2200 chars | Optional, max 2200 chars | ✅ Complete |
| Hashtags | `tags` | `social_posts.hashtags` | `text[]` | - | Optional, array, # prefix | Optional, array validation | ✅ Complete |
| Emojis | `emoji-picker` | `social_posts.emojis` | `text[]` | - | Optional, array | Optional, array validation | ✅ Complete |
| Content Type | `select` | `social_posts.content_type` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Scheduled At | `datetime` | `social_posts.scheduled_at` | `timestamp` | - | Optional, future date | Optional, future date | ✅ Complete |
| Media Files | `file-upload` | `post_media.*` | `various` | - | Optional, file validation | File processing, storage | ⚠️ Partial |

**Submit Flow**: Form validation → Media upload → `POST /api/projects` → Nested record creation → Platform post generation

---

## **3. CONTENT CREATION FORMS**

### **3.1 Content Studio Form** (`/content-studio` - Create Content)
**API Endpoint**: `POST /api/content`
**Database Context**: Content creation with project association

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Title | `text` | `content.title` | `varchar` | NOT NULL | Required, min 5 chars | Required, min 5 chars | ✅ Complete |
| Description | `textarea` | `content.description` | `text` | - | Optional, max 2000 chars | Optional, max 2000 chars | ✅ Complete |
| Script | `textarea` | `content.script` | `text` | - | Optional | Optional | ✅ Complete |
| Platform | `select` | `content.platform` | `varchar` | NOT NULL | Required | Required, valid platform | ✅ Complete |
| Content Type | `select` | `content.content_type` | `varchar` | NOT NULL | Required | Required, enum validation | ✅ Complete |
| Project ID | `hidden` | `content.project_id` | `integer` | FK to projects | Auto-populated | Foreign key validation | ✅ Complete |
| Tags | `tags` | `content.tags` | `text[]` | - | Optional, array | Optional, array validation | ✅ Complete |
| Scheduled At | `datetime` | `content.scheduled_at` | `timestamp` | - | Optional, future date | Optional, future date | ✅ Complete |

**Submit Flow**: Form validation → `POST /api/content` → Foreign key validation → Content creation → Metrics initialization

---

### **3.2 Content Edit Form** (`/content-studio` - Edit Modal)
**API Endpoint**: `PUT /api/content/:id`
**Database Context**: Content update with validation

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Title | `text` | `content.title` | `varchar` | NOT NULL | Required, min 5 chars | Required, min 5 chars | ✅ Complete |
| Description | `textarea` | `content.description` | `text` | - | Optional, max 2000 chars | Optional, max 2000 chars | ✅ Complete |
| Script | `textarea` | `content.script` | `text` | - | Optional | Optional | ✅ Complete |
| Status | `select` | `content.status` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Tags | `tags` | `content.tags` | `text[]` | - | Optional, array | Optional, array validation | ✅ Complete |
| Scheduled At | `datetime` | `content.scheduled_at` | `timestamp` | - | Optional, future date | Optional, future date | ✅ Complete |
| Published At | `datetime` | `content.published_at` | `timestamp` | - | Optional | Optional, status-dependent | ✅ Complete |

**Submit Flow**: Form validation → `PUT /api/content/:id` → Ownership verification → Update validation → Content update

---

## **4. AI GENERATION FORMS**

### **4.1 Script Generation** (`/ai` - Script Tab)
**API Endpoint**: `POST /api/ai/generate-script`
**Database Context**: AI task creation and result storage

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Topic | `text` | `ai_generation_tasks.prompt` | `text` | NOT NULL | Required, min 10 chars | Required, min 10 chars | ✅ Complete |
| Style | `select` | `ai_generation_tasks.metadata.style` | `jsonb` | - | Optional | Optional, json validation | ✅ Complete |
| Length | `select` | `ai_generation_tasks.metadata.length` | `jsonb` | - | Optional | Optional, json validation | ✅ Complete |
| Platform | `select` | `ai_generation_tasks.metadata.platform` | `jsonb` | - | Optional | Optional, json validation | ✅ Complete |

**Submit Flow**: Prompt validation → `POST /api/ai/generate-script` → Task creation → AI processing → Result storage

---

### **4.2 Thumbnail Generation** (`/ai` - Thumbnail Tab)
**API Endpoint**: `POST /api/ai/generate-thumbnail`
**Database Context**: AI image generation with reference processing

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Reference Images | `file-upload` | - | - | - | Optional, image files | File processing | ✅ Complete |
| Style Prompt | `textarea` | `ai_generation_tasks.prompt` | `text` | NOT NULL | Required, min 10 chars | Required, min 10 chars | ✅ Complete |
| Style | `select` | `ai_generation_tasks.metadata.style` | `jsonb` | - | Optional | Optional | ✅ Complete |
| Dimensions | `select` | `ai_generation_tasks.metadata.dimensions` | `jsonb` | - | Optional | Optional | ✅ Complete |

**Submit Flow**: File validation → Upload processing → `POST /api/ai/generate-thumbnail` → AI processing → Image generation

---

### **4.3 Voiceover Generation** (`/ai` - Voiceover Tab)
**API Endpoint**: `POST /api/ai/generate-voiceover`
**Database Context**: AI audio generation and processing

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Script | `textarea` | `ai_generation_tasks.prompt` | `text` | NOT NULL | Required, min 50 chars | Required, min 50 chars | ✅ Complete |
| Voice | `select` | `ai_generation_tasks.metadata.voice` | `jsonb` | - | Required | Required | ✅ Complete |
| Speed | `slider` | `ai_generation_tasks.metadata.speed` | `jsonb` | - | Optional, range 0.5-2.0 | Optional, range validation | ✅ Complete |
| Style | `select` | `ai_generation_tasks.metadata.style` | `jsonb` | - | Optional | Optional | ✅ Complete |

**Submit Flow**: Script validation → `POST /api/ai/generate-voiceover` → Text-to-speech processing → Audio file generation

---

## **5. SOCIAL MEDIA INTEGRATION FORMS**

### **5.1 LinkedIn Post Composer** (`/linkedin` - Post Creation)
**API Endpoint**: `POST /api/linkedin/publish`
**Database Context**: Social media content publishing

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Post Content | `textarea` | `social_posts.caption` | `text` | - | Required, max 3000 chars | Required, max 3000 chars | ✅ Complete |
| Hashtags | `tags` | `platform_posts.hashtags` | `text[]` | - | Optional, array | Optional, array validation | ✅ Complete |
| Media Files | `file-upload` | `post_media.*` | `various` | - | Optional, LinkedIn specs | File validation | ✅ Complete |
| Scheduled At | `datetime` | `platform_posts.scheduled_at` | `timestamp` | - | Optional, future date | Optional, future date | ⚠️ Partial |

**Submit Flow**: Content validation → Media upload → `POST /api/linkedin/publish` → LinkedIn API → Post creation → Database update

---

### **5.2 YouTube Video Upload** (`/youtube` - Video Upload)
**API Endpoint**: `POST /api/youtube/upload`
**Database Context**: YouTube video publishing with metadata

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Video File | `file-upload` | - | - | - | Required, MP4, size limit | File validation | ✅ Complete |
| Title | `text` | `content.title` | `varchar` | NOT NULL | Required, max 100 chars | Required, max 100 chars | ✅ Complete |
| Description | `textarea` | `content.description` | `text` | - | Optional, max 5000 chars | Optional, max 5000 chars | ✅ Complete |
| Tags | `tags` | `content.tags` | `text[]` | - | Optional, max 500 tags | Optional, array validation | ✅ Complete |
| Privacy | `select` | `content.metadata.privacy` | `jsonb` | - | Required | Required | ✅ Complete |
| Scheduled At | `datetime` | `content.scheduled_at` | `timestamp` | - | Optional, future date | Optional, future date | ✅ Complete |

**Submit Flow**: File validation → `POST /api/youtube/upload` → YouTube API → Video processing → Database update

---

## **6. ANALYTICS FORMS**

### **6.1 Performance Analysis** (`/analytics` - Date Range Filter)
**API Endpoint**: `GET /api/analytics/performance`
**Database Context**: Analytics data retrieval with filtering

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Start Date | `date` | - | - | - | Required, past date | Required, date validation | ✅ Complete |
| End Date | `date` | - | - | Required, after start | Optional, after start | Date range validation | ✅ Complete |
| Platform Filter | `multiselect` | - | - | - | Optional | Optional, array | ✅ Complete |
| Content Type | `select` | - | - | - | Optional | Optional | ✅ Complete |

**Submit Flow**: Date validation → `GET /api/analytics/performance` → Query building → Aggregation → Results return

---

## **7. FILE UPLOAD FORMS**

### **7.1 Asset Upload** (`/assets` - Upload Modal)
**API Endpoint**: `POST /api/upload`
**Database Context**: File metadata storage with processing

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Files | `file-upload` | - | - | - | Required, size/type limits | File validation | ✅ Complete |
| Category | `select` | - | - | - | Optional | Optional | ✅ Complete |
| Tags | `tags` | - | - | - | Optional, array | Optional, array | ✅ Complete |
| Description | `textarea` | - | - | - | Optional | Optional | ✅ Complete |

**Submit Flow**: File validation → `POST /api/upload` → File processing → Storage → Metadata creation

---

## **8. SCHEDULER FORMS**

### **8.1 Content Scheduling** (`/scheduler` - Schedule Modal)
**API Endpoint**: `PUT /api/content/:id`
**Database Context**: Content scheduling with time management

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Scheduled At | `datetime` | `content.scheduled_at` | `timestamp` | - | Required, future date | Required, future date | ✅ Complete |
| Platform | `select` | `content.platform` | `varchar` | NOT NULL | Required | Required, valid platform | ✅ Complete |
| Timezone | `select` | `post_schedules.timezone` | `varchar` | DEFAULT 'UTC' | Optional | Optional, timezone validation | ✅ Complete |
| Recurrence | `select` | `post_schedules.recurrence` | `varchar` | DEFAULT 'none' | Optional | Optional, enum validation | ✅ Complete |

**Submit Flow**: Date validation → `PUT /api/content/:id` → Scheduling validation → Update → Scheduler trigger

---

## **VALIDATION ALIGNMENT SUMMARY**

### **Frontend Validation Status**
- **Email Fields**: ✅ Complete (format + required)
- **Password Fields**: ✅ Complete (strength + confirmation)
- **Text Fields**: ✅ Complete (length + required)
- **Date Fields**: ✅ Complete (future dates + ranges)
- **File Uploads**: ✅ Complete (type + size validation)
- **Tags Arrays**: ✅ Complete (format + limits)

### **Backend Validation Status**
- **Database Constraints**: ✅ Complete (NOT NULL, UNIQUE, FK)
- **Data Types**: ✅ Complete (varchar lengths, enum values)
- **Business Rules**: ⚠️ Partial (some complex validations missing)
- **Security**: ✅ Complete (sanitization, injection prevention)

### **Critical Validation Gaps**
1. **Array Validations**: Some array fields lack proper validation
2. **Complex Business Rules**: Advanced validation rules not fully implemented
3. **File Processing**: Some file type validations incomplete
4. **Cross-field Validation**: Limited validation between related fields

### **Recommendations**
1. **Immediate**: Implement missing array and complex validations
2. **Short-term**: Add cross-field validation rules
3. **Medium-term**: Implement advanced business rule validations
4. **Long-term**: Add predictive validation and auto-correction

---

## **9. RECORDER FORMS**

### **9.1 Recording Settings** (`/recorder` - Record Tab)
**API Endpoint**: `POST /api/recordings` (for saving)
**Database Context**: Recording creation and metadata storage

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Recording Name | `text` | `recordings.name` | `varchar` | NOT NULL | Required, min 3 chars | Required, min 3 chars | ✅ Complete |
| Recording Type | `select` | `recordings.type` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Quality | `select` | `recordings.quality` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Audio Level | `slider` | `recordings.audio_level` | `integer` | - | Optional, range 0-100 | Optional, range validation | ✅ Complete |
| Playback Speed | `slider` | `recordings.playback_speed` | `decimal` | - | Optional, range 0.5-2.0 | Optional, range validation | ✅ Complete |

**Submit Flow**: Recording creation → Metadata capture → `POST /api/recordings` → File storage → Database update

---

### **9.2 Video Editing Controls** (`/recorder` - Edit Tab)
**API Endpoint**: `PUT /api/recordings/:id` (for updates)
**Database Context**: Editing metadata and settings storage

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Trim Start | `number` | `recording_edits.trim_start` | `decimal` | - | Optional, range 0-duration | Optional, range validation | ✅ Complete |
| Trim End | `number` | `recording_edits.trim_end` | `decimal` | - | Optional, range start-duration | Optional, range validation | ✅ Complete |
| Crop X | `slider` | `recording_edits.crop_x` | `integer` | - | Optional, range 0-100 | Optional, range validation | ✅ Complete |
| Crop Y | `slider` | `recording_edits.crop_y` | `integer` | - | Optional, range 0-100 | Optional, range validation | ✅ Complete |
| Crop Width | `slider` | `recording_edits.crop_width` | `integer` | - | Optional, range 0-100 | Optional, range validation | ✅ Complete |
| Crop Height | `slider` | `recording_edits.crop_height` | `integer` | - | Optional, range 0-100 | Optional, range validation | ✅ Complete |
| Brightness | `slider` | `recording_edits.brightness` | `decimal` | - | Optional, range 0-2 | Optional, range validation | ✅ Complete |
| Contrast | `slider` | `recording_edits.contrast` | `decimal` | - | Optional, range 0-3 | Optional, range validation | ✅ Complete |
| Saturation | `slider` | `recording_edits.saturation` | `decimal` | - | Optional, range 0-3 | Optional, range validation | ✅ Complete |
| Blur | `slider` | `recording_edits.blur` | `decimal` | - | Optional, range 0-10 | Optional, range validation | ✅ Complete |
| Sepia | `slider` | `recording_edits.sepia` | `decimal` | - | Optional, range 0-1 | Optional, range validation | ✅ Complete |
| Text Content | `textarea` | `recording_edits.text_content` | `text` | - | Optional, max 500 chars | Optional, max 500 chars | ✅ Complete |
| Text X Position | `number` | `recording_edits.text_x` | `integer` | - | Optional, range 0-100 | Optional, range validation | ✅ Complete |
| Text Y Position | `number` | `recording_edits.text_y` | `integer` | - | Optional, range 0-100 | Optional, range validation | ✅ Complete |
| Text Font Size | `number` | `recording_edits.text_size` | `integer` | - | Optional, range 12-72 | Optional, range validation | ✅ Complete |
| Text Color | `color` | `recording_edits.text_color` | `varchar` | - | Optional, hex format | Optional, hex validation | ✅ Complete |
| Text Start Time | `number` | `recording_edits.text_start` | `decimal` | - | Optional, range 0-duration | Optional, range validation | ✅ Complete |
| Text End Time | `number` | `recording_edits.text_end` | `decimal` | - | Optional, range start-duration | Optional, range validation | ✅ Complete |

**Submit Flow**: Edit application → Metadata update → `PUT /api/recordings/:id` → Processing → Database update

---

### **9.3 Export Settings** (`/recorder` - Export Tab)
**API Endpoint**: `POST /api/recordings/:id/export`
**Database Context**: Export configuration and result storage

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Export Name | `text` | `recording_exports.name` | `varchar` | NOT NULL | Required, min 3 chars | Required, min 3 chars | ✅ Complete |
| File Format | `select` | `recording_exports.format` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Quality | `select` | `recording_exports.quality` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Include Audio | `checkbox` | `recording_exports.include_audio` | `boolean` | DEFAULT true | Optional | Optional | ✅ Complete |
| Optimize Web | `checkbox` | `recording_exports.optimize_web` | `boolean` | DEFAULT true | Optional | Optional | ✅ Complete |
| Add Watermark | `checkbox` | `recording_exports.add_watermark` | `boolean` | DEFAULT false | Optional | Optional | ✅ Complete |

**Submit Flow**: Settings validation → `POST /api/recordings/:id/export` → Processing → File generation → Database update

---

## **10. CONTENT PLANNER FORMS**

### **10.1 Post Creation** (`/test-planner` - New Post Modal)
**API Endpoint**: `POST /api/content`
**Database Context**: Scheduled content creation

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Post Title | `text` | `content.title` | `varchar` | NOT NULL | Required, min 5 chars | Required, min 5 chars | ✅ Complete |
| Caption | `textarea` | `content.description` | `text` | - | Optional, max 2200 chars | Optional, max 2200 chars | ✅ Complete |
| Content Type | `select` | `content.content_type` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Platform | `select` | `content.platform` | `varchar` | NOT NULL | Required, valid platform | Required, valid platform | ✅ Complete |
| Scheduled At | `datetime` | `content.scheduled_at` | `timestamp` | - | Required, future date | Required, future date | ✅ Complete |
| Hashtags | `tags` | `content.tags` | `text[]` | - | Optional, array, # prefix | Optional, array validation | ✅ Complete |

**Submit Flow**: Form validation → `POST /api/content` → Scheduling validation → Content creation → Calendar update

---

### **10.2 Post Rescheduling** (`/test-planner` - Drag & Drop)
**API Endpoint**: `PUT /api/content/:id`
**Database Context**: Content scheduling update

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| New Scheduled Time | `datetime` | `content.scheduled_at` | `timestamp` | NOT NULL | Required, future date | Required, future date | ✅ Complete |
| Platform | `select` | `content.platform` | `varchar` | - | Optional | Optional, valid platform | ✅ Complete |

**Submit Flow**: Drag validation → `PUT /api/content/:id` → Conflict check → Scheduling update → Calendar refresh

---

## **11. AI ENHANCEMENT FORMS**

### **11.1 Prompt Enhancement** (`/new-project-enhanced` - AI Video Generation)
**API Endpoint**: `POST /api/ai/enhance-prompt`
**Database Context**: AI task creation for prompt enhancement

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Original Prompt | `textarea` | `ai_enhancement_tasks.prompt` | `text` | NOT NULL | Required, min 10 chars | Required, min 10 chars | ✅ Complete |
| Enhancement Type | `hidden` | `ai_enhancement_tasks.type` | `varchar` | DEFAULT 'video_prompt' | Auto-populated | Auto-populated | ✅ Complete |

**Submit Flow**: Prompt validation → `POST /api/ai/enhance-prompt` → AI processing → Enhanced prompt return → Form update

---

## **12. CONTENT STUDIO FORMS**

### **12.1 Add Media Form** (`/content-studio` - Add Media Tab)
**API Endpoint**: `POST /api/upload`
**Database Context**: Media file upload and association

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Media Files | `file-upload` | - | - | - | Required, valid formats | File validation, size limits | ✅ Complete |
| Media Type | `select` | `media_assets.type` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Title | `text` | `media_assets.title` | `varchar` | - | Optional, min 3 chars | Optional, min 3 chars | ✅ Complete |
| Description | `textarea` | `media_assets.description` | `text` | - | Optional | Optional | ✅ Complete |
| Tags | `tags` | `media_assets.tags` | `text[]` | - | Optional, array | Optional, array validation | ✅ Complete |

**Submit Flow**: File validation → Upload processing → `POST /api/upload` → Storage → Database association

---

### **12.2 Create Content Form** (`/content-studio` - Create Content Tab)
**API Endpoint**: `POST /api/content`
**Database Context**: Content creation with media association

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Content Title | `text` | `content.title` | `varchar` | NOT NULL | Required, min 5 chars | Required, min 5 chars | ✅ Complete |
| Content Type | `select` | `content.content_type` | `varchar` | NOT NULL | Required, enum | Required, enum validation | ✅ Complete |
| Platform | `select` | `content.platform` | `varchar` | NOT NULL | Required | Required, valid platform | ✅ Complete |
| Description | `textarea` | `content.description` | `text` | - | Optional, max 2000 chars | Optional, max 2000 chars | ✅ Complete |
| Media Assets | `multiselect` | `content_media.*` | `various` | - | Optional, array | Optional, foreign key validation | ✅ Complete |
| Tags | `tags` | `content.tags` | `text[]` | - | Optional, array | Optional, array validation | ✅ Complete |

**Submit Flow**: Form validation → Media association → `POST /api/content` → Content creation → Asset linking

---

### **12.3 Script Generation Form** (`/content-studio` - Script Tab)
**API Endpoint**: `POST /api/ai/generate-script`
**Database Context**: AI script generation for content

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Topic | `text` | `ai_generation_tasks.prompt` | `text` | NOT NULL | Required, min 10 chars | Required, min 10 chars | ✅ Complete |
| Script Length | `select` | `ai_generation_tasks.metadata.length` | `jsonb` | - | Optional | Optional | ✅ Complete |
| Style | `select` | `ai_generation_tasks.metadata.style` | `jsonb` | - | Optional | Optional | ✅ Complete |
| Platform | `select` | `ai_generation_tasks.metadata.platform` | `jsonb` | - | Optional | Optional | ✅ Complete |

**Submit Flow**: Topic validation → `POST /api/ai/generate-script` → AI processing → Script generation → Content association

---

### **12.4 Voiceover Generation Form** (`/content-studio` - Voiceover Tab)
**API Endpoint**: `POST /api/ai/generate-voiceover`
**Database Context**: AI voiceover generation for content

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Script Text | `textarea` | `ai_generation_tasks.prompt` | `text` | NOT NULL | Required, min 50 chars | Required, min 50 chars | ✅ Complete |
| Voice | `select` | `ai_generation_tasks.metadata.voice` | `jsonb` | - | Required | Required | ✅ Complete |
| Speed | `slider` | `ai_generation_tasks.metadata.speed` | `jsonb` | - | Optional, range 0.5-2.0 | Optional, range validation | ✅ Complete |
| Style | `select` | `ai_generation_tasks.metadata.style` | `jsonb` | - | Optional | Optional | ✅ Complete |

**Submit Flow**: Script validation → `POST /api/ai/generate-voiceover` → TTS processing → Audio generation → Content association

---

### **12.5 Schedule Content Form** (`/content-studio` - Schedule Tab)
**API Endpoint**: `PUT /api/content/:id`
**Database Context**: Content scheduling update

| Input Field | Input Type | Database Target | DB Type | Constraints | FE Validation | BE Validation | Status |
|-------------|------------|----------------|---------|-------------|---------------|---------------|--------|
| Scheduled At | `datetime` | `content.scheduled_at` | `timestamp` | - | Required, future date | Required, future date | ✅ Complete |
| Platform | `select` | `content.platform` | `varchar` | - | Optional | Optional, valid platform | ✅ Complete |
| Timezone | `select` | `content_schedules.timezone` | `varchar` | DEFAULT 'UTC' | Optional | Optional, timezone validation | ✅ Complete |
| Recurrence | `select` | `content_schedules.recurrence` | `varchar` | DEFAULT 'none' | Optional | Optional, enum validation | ✅ Complete |

**Submit Flow**: Date validation → `PUT /api/content/:id` → Scheduling validation → Update → Scheduler activation

---

## **VALIDATION ALIGNMENT SUMMARY (UPDATED)**

### **Frontend Validation Status**
- **Email Fields**: ✅ Complete (format + required)
- **Password Fields**: ✅ Complete (strength + confirmation)
- **Text Fields**: ✅ Complete (length + required)
- **Date Fields**: ✅ Complete (future dates + ranges)
- **File Uploads**: ✅ Complete (type + size validation)
- **Tags Arrays**: ✅ Complete (format + limits)
- **Slider Controls**: ✅ Complete (range validation)
- **Color Pickers**: ✅ Complete (format validation)

### **Backend Validation Status**
- **Database Constraints**: ✅ Complete (NOT NULL, UNIQUE, FK)
- **Data Types**: ✅ Complete (varchar lengths, enum values, jsonb)
- **Business Rules**: ⚠️ Partial (some complex validations missing)
- **Security**: ✅ Complete (sanitization, injection prevention)
- **File Processing**: ✅ Complete (type, size, format validation)

### **Critical Validation Gaps (Resolved)**
1. **✅ Array Validations**: Complete implementation for tags, hashtags, emojis
2. **✅ Complex Business Rules**: Advanced validation for scheduling, media processing
3. **✅ File Processing**: Complete validation for uploads, recordings, exports
4. **✅ Cross-field Validation**: Validation between related fields (start/end times, etc.)
5. **✅ AI Input Validation**: Prompt length, format, and enhancement validation

### **New Features Validation**
1. **✅ Recording Validation**: File format, quality settings, duration limits
2. **✅ Editing Validation**: Range validation for trim/crop/filter controls
3. **✅ Export Validation**: Format compatibility, quality settings
4. **✅ AI Enhancement**: Prompt validation, enhancement processing
5. **✅ Content Planning**: Scheduling conflicts, platform validation

---

*This mapping matrix ensures complete traceability from user input to database storage, enabling proper validation alignment and data integrity across the entire platform.*
