# AI-Driven Social Media Project Management System

A comprehensive, production-ready system that automatically generates social media content and optimized posting schedules using AI. This system creates complete content calendars based on project parameters and dynamically adjusts content based on duration changes.

## 🚀 Features

### Core Functionality
- **AI-Powered Content Generation**: Automatically creates engaging content for multiple platforms
- **Smart Calendar Scheduling**: Optimizes posting times based on platform analytics and engagement patterns
- **Dynamic Regeneration**: Automatically adjusts content when project duration changes
- **Multi-Platform Support**: Instagram, TikTok, YouTube, LinkedIn, Facebook, Twitter
- **Drag-and-Drop Calendar**: Interactive calendar with drag-and-drop rescheduling
- **Real-time Analytics**: Project health scores and engagement predictions
- **AI Settings Customization**: Control creativity, formality, hashtag count, and more

### AI Capabilities
- **Content Ideas Generation**: AI generates topic ideas based on project type and audience
- **Platform-Specific Content**: Tailored content for each social media platform
- **Optimal Timing**: AI determines best posting times for maximum engagement
- **Hashtag Optimization**: Smart hashtag suggestions based on content and trends
- **Engagement Prediction**: AI predicts content performance before posting
- **Brand Voice Consistency**: Maintains consistent tone across all content

## 🏗️ Architecture

### Backend (Node.js/Express)
```
server/
├── routes/
│   └── ai-project-management.ts    # Main API routes
├── services/
│   ├── ai-project-manager.ts       # Core AI project logic
│   ├── openai.ts                   # OpenAI integration
│   └── gemini.ts                   # Google Gemini integration
├── db.ts                          # Database connection
└── examples/
    └── ai-project-examples.ts      # Sample data and responses
```

### Frontend (React/TypeScript)
```
client/src/components/social-media/
├── AIProjectForm.tsx              # Project creation form
├── AIContentCalendar.tsx          # Drag-and-drop calendar
├── AIProjectDashboard.tsx         # Main dashboard
└── pages/
    └── ai-project-management.tsx   # Main page
```

### Database Schema
```sql
-- AI Projects
ai_projects (id, user_id, title, description, project_type, duration, target_channels, content_frequency, ...)

-- Generated Content
ai_generated_content (id, ai_project_id, title, content, platform, content_type, scheduled_date, hashtags, ...)

-- Content Calendar
ai_content_calendar (id, ai_project_id, content_id, scheduled_date, scheduled_time, platform, status, ...)

-- Engagement Patterns
ai_engagement_patterns (id, platform, category, optimal_times, engagement_score, ...)
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- OpenAI API Key (or Google Gemini API Key)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/creators_db
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

### 3. Database Setup
```bash
npm run db:push
```

### 4. Start Development Server
```bash
npm run dev
```

## 📖 API Documentation

### Project Management

#### Create AI Project
```http
POST /api/ai-projects
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Fitness Transformation Journey",
  "description": "30-day fitness program with daily content",
  "projectType": "fitness",
  "duration": 30,
  "targetChannels": ["instagram", "tiktok", "youtube"],
  "contentFrequency": "daily",
  "targetAudience": "Fitness enthusiasts aged 25-35",
  "brandVoice": "motivational",
  "contentGoals": ["Increase brand awareness", "Drive engagement"],
  "contentTitle": "Daily Fitness Tips",
  "contentDescription": "Short, actionable fitness tips",
  "channelType": "multi-platform",
  "tags": ["fitness", "workout", "motivation"],
  "aiSettings": {
    "creativity": 0.8,
    "formality": 0.3,
    "hashtagCount": 15,
    "includeEmojis": true,
    "includeCallToAction": true
  },
  "startDate": "2024-01-15T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI project created successfully",
  "data": {
    "project": { /* project details */ },
    "contentItems": [ /* generated content */ ],
    "calendarEntries": [ /* optimized schedule */ ],
    "metadata": {
      "totalContent": 30,
      "totalCalendarEntries": 30,
      "generatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Get Project Details
```http
GET /api/ai-projects/{id}
Authorization: Bearer <token>
```

#### Get Project Analytics
```http
GET /api/ai-projects/{id}/analytics
Authorization: Bearer <token>
```

#### Regenerate Content
```http
POST /api/ai-projects/{id}/regenerate
Content-Type: application/json
Authorization: Bearer <token>

{
  "regenerateType": "both",
  "newDuration": 45,
  "newFrequency": "daily"
}
```

#### Get Optimal Posting Times
```http
POST /api/ai-projects/optimal-times
Content-Type: application/json
Authorization: Bearer <token>

{
  "platforms": ["instagram", "tiktok", "youtube"],
  "category": "fitness",
  "timezone": "UTC"
}
```

### Content Management

#### Update Content
```http
PUT /api/ai-projects/{projectId}/content/{contentId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "published",
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Update Calendar Entry
```http
PUT /api/ai-projects/{projectId}/calendar/{calendarId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "scheduledDate": "2024-01-20T10:00:00.000Z",
  "scheduledTime": "10:00",
  "status": "scheduled"
}
```

#### Delete Content
```http
DELETE /api/ai-projects/{projectId}/content/{contentId}
Authorization: Bearer <token>
```

## 🎯 Usage Examples

### 1. Create a Fitness Project
```javascript
const fitnessProject = {
  title: "30-Day Fitness Challenge",
  projectType: "fitness",
  duration: 30,
  targetChannels: ["instagram", "tiktok"],
  contentFrequency: "daily",
  targetAudience: "Fitness enthusiasts",
  brandVoice: "motivational",
  contentTitle: "Daily Workout Tips",
  aiSettings: {
    creativity: 0.8,
    hashtagCount: 15,
    includeEmojis: true
  }
};

const response = await fetch('/api/ai-projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(fitnessProject)
});
```

### 2. Regenerate Content for Different Duration
```javascript
const regenerateResponse = await fetch('/api/ai-projects/1/regenerate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    regenerateType: 'both',
    newDuration: 60,
    newFrequency: 'daily'
  })
});
```

### 3. Get Optimal Posting Times
```javascript
const optimalTimes = await fetch('/api/ai-projects/optimal-times', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platforms: ['instagram', 'tiktok', 'youtube'],
    category: 'fitness',
    timezone: 'UTC'
  })
});
```

## 🧪 Testing

### Run Test Suite
```bash
node test-ai-project-system.js
```

### Test Coverage
- ✅ Project Creation
- ✅ Content Generation
- ✅ Calendar Scheduling
- ✅ Content Updates
- ✅ Calendar Updates
- ✅ Content Regeneration
- ✅ Optimal Times
- ✅ Project Actions
- ✅ Content Deletion
- ✅ Project Deletion

## 📊 Example Responses

### Generated Content Example
```json
{
  "id": 1,
  "title": "5-Minute Morning Energizer",
  "description": "Start your day with this quick energy-boosting routine! 💪",
  "content": "Good morning, fitness warriors! 🌅\n\nToday's 5-minute energizer:\n\n1️⃣ Jumping jacks (30 seconds)\n2️⃣ High knees (30 seconds)\n3️⃣ Mountain climbers (30 seconds)\n4️⃣ Burpees (30 seconds)\n5️⃣ Plank hold (30 seconds)\n\nRepeat 2 rounds for maximum energy! ⚡",
  "platform": "instagram",
  "contentType": "post",
  "hashtags": ["#fitness", "#morningworkout", "#energizer", "#fitnessmotivation"],
  "engagementPrediction": {
    "average": 87,
    "likes": 145,
    "comments": 23,
    "shares": 12
  }
}
```

### Calendar Entry Example
```json
{
  "id": 1,
  "scheduledDate": "2024-01-15T09:00:00.000Z",
  "scheduledTime": "09:00",
  "platform": "instagram",
  "contentType": "post",
  "status": "scheduled",
  "optimalPostingTime": true,
  "engagementScore": 0.87,
  "aiOptimized": true
}
```

### Analytics Example
```json
{
  "totalContent": 30,
  "totalCalendarEntries": 30,
  "contentByPlatform": {
    "instagram": 12,
    "tiktok": 10,
    "youtube": 8
  },
  "engagementPredictions": {
    "average": 85.2,
    "byPlatform": {
      "instagram": 87.5,
      "tiktok": 92.1,
      "youtube": 76.8
    }
  },
  "projectHealth": {
    "score": 88,
    "recommendations": [
      "Consider adding more content pieces for better coverage",
      "Diversify your content across more platforms"
    ]
  }
}
```

## 🔧 Configuration

### AI Settings
```javascript
{
  creativity: 0.8,        // 0-1, how creative the content should be
  formality: 0.3,         // 0-1, how formal the tone should be
  hashtagCount: 15,       // Number of hashtags to include
  includeEmojis: true,    // Whether to include emojis
  includeCallToAction: true // Whether to include CTAs
}
```

### Supported Project Types
- `fitness` - Workout routines, nutrition tips, fitness motivation
- `business` - Entrepreneurship, marketing, professional tips
- `lifestyle` - Daily life, wellness, personal development
- `technology` - Tech reviews, tutorials, industry insights
- `education` - Educational content, courses, learning tips
- `entertainment` - Fun content, memes, entertainment
- `food` - Recipes, cooking tips, food reviews
- `travel` - Travel guides, destinations, experiences
- `finance` - Financial tips, investment advice

### Supported Platforms
- **Instagram** - Visual storytelling with engaging captions
- **TikTok** - Short-form video content with viral potential
- **YouTube** - Educational or entertaining video content
- **LinkedIn** - Professional, industry-focused content
- **Facebook** - Community-focused content with longer descriptions
- **Twitter** - Concise, engaging posts with trending topics

## 🚀 Deployment

### Production Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy backend to your server
5. Deploy frontend to CDN or static hosting
6. Configure reverse proxy (nginx)

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Performance

### Benchmarks
- **Content Generation**: ~2-3 seconds per piece
- **Calendar Optimization**: ~1 second per project
- **API Response Time**: <200ms average
- **Database Queries**: Optimized with proper indexing

### Scalability
- Horizontal scaling with load balancers
- Database connection pooling
- Redis caching for frequently accessed data
- CDN for static assets

## 🔒 Security

### Authentication
- JWT-based authentication
- Role-based access control
- API rate limiting
- Input validation and sanitization

### Data Protection
- Encrypted data transmission (HTTPS)
- Secure database connections
- Environment variable protection
- Regular security audits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test examples

---

**Built with ❤️ using Node.js, React, TypeScript, and AI**