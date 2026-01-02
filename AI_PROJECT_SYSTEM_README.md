# AI Project Management System with Gemini Integration

A comprehensive AI-powered social media content creation and management system that generates content, creates intelligent calendars, and provides advanced project management features.

## 🎯 Key Features

### ✅ Project Creation with Enhanced Fields
- **Content Title**: Main title for generated content
- **Content Description**: Detailed description of content goals
- **Channel Type**: Primary social media platform (YouTube, Instagram, TikTok, etc.)
- **Target Audience**: Specific audience demographics
- **Duration**: Project duration in days
- **Tags**: User-defined tags for content categorization

### 🤖 AI Content Generation
- **Gemini API Integration**: Uses Google Gemini 1.5 Flash API key from environment variables
- **Duration-Based Generation**: Creates content for the entire selected project duration
- **Platform-Specific Content**: Tailored content for each target platform
- **Content Series Creation**: Builds content that flows logically across the project timeline

### 📅 AI Calendar Generation
- **Optimal Posting Times**: AI determines best times for maximum engagement
- **Platform-Specific Scheduling**: Different optimal times for each social platform
- **Content-Aware Scheduling**: Considers content type and audience behavior
- **Intelligent Spacing**: Distributes content based on frequency settings

### 🎛️ Project Management Actions
- **Stop Project**: Immediately halt all content generation and scheduling
- **Pause/Resume**: Temporarily pause or restart project activities
- **Edit Content**: Modify individual content pieces and calendar entries
- **Extend Duration**: Add more days to existing projects with automatic content generation

### 📊 Project Details View
- **Comprehensive Overview**: Project information, progress, and analytics
- **Content Management**: View, edit, and manage all generated content
- **Calendar View**: Interactive calendar with scheduling details
- **Analytics Dashboard**: Engagement predictions and performance metrics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Valid Gemini API key (provided)

### Installation

1. **Clone and setup the project**:
   ```bash
   git clone <repository-url>
   cd CreatorNexus
   npm install
   ```

2. **Database setup**:
   ```bash
   # Create database
   createdb creator_nexus

   # Run migrations
   npm run db:migrate

   # Seed initial data
   npm run db:seed
   ```

3. **Environment configuration**:
   ```bash
   cp .env.example .env
   # Add your Gemini API key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the application**:
   ```bash
   # Start backend
   npm run server

   # Start frontend (in another terminal)
   npm run client
   ```

## 📝 Usage Guide

### Creating a New AI Project

1. **Access Project Creation**:
   - Navigate to AI Project Dashboard
   - Click "Create AI Project" button

2. **Fill Project Details**:
   - **Project Title**: Main project name
   - **Description**: Project overview and goals
   - **Content Title**: Title for generated content
   - **Content Description**: Content focus and objectives
   - **Channel Type**: Primary platform (YouTube, Instagram, etc.)
   - **Project Type**: Category (Fitness, Business, Technology, etc.)
   - **Duration**: Project length in days
   - **Target Channels**: Platforms to publish on
   - **Content Frequency**: Daily, Weekly, Bi-weekly, or Monthly
   - **Target Audience**: Who the content is for
   - **Tags**: Relevant hashtags and keywords

3. **AI Settings**:
   - **Creativity Level**: How creative the AI should be
   - **Formality Level**: Tone of generated content
   - **Hashtag Count**: Number of hashtags to include
   - **Include Emojis**: Add emojis to content
   - **Include Call-to-Action**: Add CTA buttons/links

### Managing Projects

#### Project Cards View
- **View Details**: Click "View Details" to open comprehensive project modal
- **Quick Actions**: Use dropdown menu for fast actions
- **Progress Tracking**: Visual progress bar shows project completion
- **Platform Icons**: See all target platforms at a glance

#### Project Details Modal
- **Overview Tab**: Project information and key metrics
- **Content Tab**: All generated content with edit capabilities
- **Calendar Tab**: Scheduled posts with timing details
- **Analytics Tab**: Engagement predictions and performance data

#### Content Management
- **Edit Content**: Modify titles, descriptions, and hashtags
- **Update Schedule**: Change posting times and dates
- **Delete Content**: Remove unwanted content pieces
- **Regenerate**: Create new content for specific pieces

#### Project Actions
- **Stop Project**: Permanently halt all activities
- **Pause/Resume**: Temporarily stop/restart content generation
- **Extend Duration**: Add more days with automatic content creation

## 🔧 API Endpoints

### Project Management
```http
POST   /api/ai-projects              # Create new project
GET    /api/ai-projects              # List user projects
GET    /api/ai-projects/:id          # Get project details
PUT    /api/ai-projects/:id          # Update project
DELETE /api/ai-projects/:id          # Delete project

POST   /api/ai-projects/:id/regenerate # Regenerate content/calendar
POST   /api/ai-projects/:id/action    # Quick actions (start/pause/stop/resume)

GET    /api/ai-projects/optimal-times # Get optimal posting times
GET    /api/ai-projects/:id/analytics # Project analytics
```

### Content Management
```http
PUT    /api/ai-projects/:id/content/:contentId    # Update content
DELETE /api/ai-projects/:id/content/:contentId    # Delete content
PUT    /api/ai-projects/:id/calendar/:calendarId  # Update calendar entry
```

## 🎨 Frontend Components

### Core Components
- `AIProjectForm`: Enhanced project creation form
- `ProjectCards`: Project cards with management actions
- `ProjectDetailsModal`: Comprehensive project management modal
- `AIContentCalendar`: Calendar view with scheduling

### Key Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live project status and progress
- **Interactive UI**: Drag-and-drop content scheduling
- **Analytics Dashboard**: Visual engagement metrics

## 🤖 AI Integration Details

### Gemini API Usage
- **Model**: Gemini 1.5 Flash
- **API Key**: Uses environment variables for secure key management
- **Features**:
  - Text generation for content creation
  - Content optimization and enhancement
  - Hashtag generation and suggestions
  - Engagement prediction algorithms

### Content Generation Process
1. **Idea Generation**: AI creates content ideas based on project parameters
2. **Platform Adaptation**: Content tailored for each target platform
3. **Schedule Optimization**: AI determines optimal posting times
4. **Engagement Prediction**: Estimates performance metrics

### Calendar Intelligence
- **Audience Analysis**: Considers target audience behavior patterns
- **Platform Algorithms**: Optimizes for each platform's best practices
- **Content Timing**: Spaces content based on engagement patterns
- **Peak Hours**: Identifies optimal posting windows

## 📊 Database Schema

### Key Tables
- `ai_projects`: Main project information
- `ai_generated_content`: Generated content pieces
- `ai_content_calendar`: Scheduled posting calendar
- `ai_engagement_patterns`: Platform-specific engagement data

### New Fields Added
```sql
-- ai_projects table additions
content_title VARCHAR(255),
content_description TEXT,
channel_type VARCHAR(50),
tags TEXT[],

-- Enhanced metadata in calendar
channel_type VARCHAR(50),
content_title VARCHAR(255),
tags TEXT[]
```

## 🧪 Testing

### Test Script
```bash
node test-ai-project-system.js
```

### Manual Testing Steps
1. Create a new AI project with all enhanced fields
2. Verify content generation for selected duration
3. Check calendar creation with optimal times
4. Test project management actions (stop, pause, edit, extend)
5. Validate project details modal functionality

## 🚀 Deployment

### Production Setup
1. **Environment Variables**:
   ```bash
   GEMINI_API_KEY=your_production_key
   DATABASE_URL=your_production_db
   NODE_ENV=production
   ```

2. **Build Commands**:
   ```bash
   npm run build
   npm run start:prod
   ```

3. **Database Migration**:
   ```bash
   npm run db:migrate:prod
   ```

## 📈 Performance Features

- **Lazy Loading**: Components load on demand
- **Caching**: AI responses cached for performance
- **Background Processing**: Content generation in background
- **Optimized Queries**: Efficient database operations

## 🔒 Security Features

- **Authentication**: JWT-based user authentication
- **API Protection**: Protected endpoints with token validation
- **Input Validation**: Zod schema validation for all inputs
- **Rate Limiting**: Prevents API abuse

## 🎯 Future Enhancements

- [ ] Multi-language content generation
- [ ] Advanced analytics and reporting
- [ ] Social media platform integrations
- [ ] A/B testing for content optimization
- [ ] Automated content repurposing
- [ ] Advanced scheduling algorithms

## 📞 Support

For issues or questions:
1. Check the test script for common problems
2. Review server logs for API errors
3. Verify Gemini API key configuration
4. Check database connectivity

## 📝 License

This project is part of the CreatorNexus platform and follows the project's licensing terms.

---

**Built with**: React, TypeScript, Node.js, Express, PostgreSQL, Drizzle ORM, Google Gemini AI
**Key Technologies**: AI-powered content generation, intelligent scheduling, comprehensive project management
