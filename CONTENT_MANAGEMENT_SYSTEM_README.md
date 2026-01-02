# Content Management System

A comprehensive content management system for CreatorNexus that allows users to generate, organize, and manage AI-generated content across multiple social media platforms with advanced scheduling and control features.

## 🚀 Features

### Core Functionality
- **AI Content Generation**: Automatically generate content for each day of a project
- **Daily Organization**: Content organized by days with visual cards
- **Content Actions**: Play, pause, stop, delete, edit, regenerate, and update content
- **Status Management**: Track published, unpublished, draft, scheduled, paused, and stopped content
- **Project Extension**: Add more days to existing projects
- **Calendar View**: Visual calendar with content scheduling and status tracking
- **Bulk Operations**: Perform actions on multiple content pieces at once

### Advanced Features
- **Content Versioning**: Track content regeneration and updates
- **Publishing Control**: Stop unpublished content from being published
- **Platform-Specific Content**: Generate content tailored for different social media platforms
- **Real-time Updates**: Calendar and content views update automatically
- **Action History**: Track all content actions and changes
- **Filtering & Search**: Filter content by status, platform, day, etc.

## 🏗️ Architecture

### Database Schema
The system uses enhanced database tables to support content management:

- **aiGeneratedContent**: Enhanced with day numbers, pause/stop states, versioning
- **projectContentManagement**: Project-level settings and extension tracking
- **contentActionHistory**: Track all content actions and changes
- **aiContentCalendar**: Calendar entries with optimal posting times

### API Endpoints
- `POST /api/content-management/generate` - Generate content for a project
- `GET /api/content-management/project/:id/overview` - Get project content overview
- `GET /api/content-management/project/:id/day/:day` - Get content for specific day
- `POST /api/content-management/content/:id/action` - Perform content actions
- `POST /api/content-management/project/:id/extend` - Extend project with more days
- `POST /api/content-management/project/:id/bulk-action` - Perform bulk actions
- `PUT /api/content-management/project/:id/settings` - Update project settings

### Frontend Components
- **ProjectDetailsView**: Main project view with content cards organized by days
- **ContentCard**: Individual content item with actions and status
- **ContentDayView**: Day-level view with content statistics
- **ContentCalendarView**: Calendar visualization with filtering
- **BulkActionsPanel**: Bulk operations interface
- **ExtendProjectModal**: Project extension interface
- **ProjectSettingsModal**: Project settings management

## 📋 Usage Guide

### 1. Creating a Project
1. Navigate to the Content Management page
2. Click "Create Project" to set up a new AI project
3. Configure project settings (platforms, duration, content type, etc.)
4. Save the project

### 2. Generating Content
1. Select a project from the projects list
2. Click "Generate Content" to create content for the project
3. Specify the number of days and content per day
4. Choose target platforms and content type
5. The system will generate content for each day

### 3. Managing Content
1. View project details to see content organized by days
2. Use content cards to perform individual actions:
   - **Play**: Start/resume content publishing
   - **Pause**: Temporarily pause content
   - **Stop**: Stop content from publishing
   - **Edit**: Modify content text, title, hashtags
   - **Regenerate**: Generate new content using AI
   - **Delete**: Remove content permanently

### 4. Calendar View
1. Switch to calendar view to see content scheduled over time
2. Use filters to show specific content types
3. Click on days to view detailed content
4. Navigate between months to see different time periods

### 5. Bulk Operations
1. Click "Bulk Actions" to perform operations on multiple content pieces
2. Select the action (pause all, stop all, etc.)
3. Apply filters to target specific content
4. Execute the action

### 6. Extending Projects
1. Click "Extend Project" to add more days
2. Specify the number of additional days
3. Choose platforms and content type for new content
4. The system will generate content for the new days

## 🎯 Content States

### Content Status
- **Draft**: Content created but not scheduled
- **Scheduled**: Content scheduled for publishing
- **Published**: Content has been published
- **Paused**: Content is temporarily paused
- **Stopped**: Content is stopped from publishing
- **Failed**: Content publishing failed

### Project States
- **Active**: Project is running normally
- **Paused**: Project is temporarily paused
- **Stopped**: Project is completely stopped

## 🔧 Configuration

### Content Generation Settings
```typescript
interface ContentGenerationRequest {
  projectId: number;
  userId: string;
  totalDays: number;
  contentPerDay?: number;
  startDate?: Date;
  platforms: string[];
  contentType: string;
  aiSettings?: any;
}
```

### Content Actions
```typescript
type ContentAction = 'play' | 'pause' | 'stop' | 'delete' | 'edit' | 'regenerate' | 'update';
```

### Bulk Actions
```typescript
type BulkAction = 'pause_all' | 'stop_all' | 'play_all' | 'stop_unpublished' | 'pause_unpublished';
```

## 📊 Analytics & Monitoring

### Content Statistics
- Total content count
- Published vs unpublished content
- Paused and stopped content
- Content completion rate
- Day-by-day progress

### Project Metrics
- Project duration and progress
- Content generation rate
- Publishing success rate
- Platform performance

## 🚀 Getting Started

### 1. Database Setup
The system requires the enhanced database schema. Run the database migrations to set up the new tables.

### 2. API Integration
Ensure the content management API routes are registered in your Express app:

```typescript
import { registerContentManagementRoutes } from './routes/content-management';
registerContentManagementRoutes(app);
```

### 3. Frontend Integration
Import and use the content management components in your React app:

```typescript
import { ProjectDetailsView } from '@/components/content-management/ProjectDetailsView';
import { ContentCalendarView } from '@/components/content-management/ContentCalendarView';
```

### 4. Authentication
Ensure proper authentication is set up for all API endpoints. The system uses JWT tokens for user authentication.

## 🔒 Security

### Authentication
- All API endpoints require valid JWT tokens
- User can only access their own content
- Project ownership is verified for all operations

### Data Validation
- Input validation on all API endpoints
- Content sanitization before storage
- SQL injection prevention through parameterized queries

## 🧪 Testing

### API Testing
Test the content management API endpoints using the provided test cases:

```bash
# Test content generation
curl -X POST /api/content-management/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"projectId": 1, "totalDays": 30, "platforms": ["instagram"], "contentType": "post"}'

# Test content actions
curl -X POST /api/content-management/content/1/action \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'
```

### Component Testing
Test the React components using React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { ProjectDetailsView } from '@/components/content-management/ProjectDetailsView';

test('renders project details', () => {
  render(<ProjectDetailsView projectId={1} onBack={() => {}} />);
  expect(screen.getByText('Project Details')).toBeInTheDocument();
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Content not generating**
   - Check AI service configuration
   - Verify project settings
   - Check database connections

2. **Calendar not updating**
   - Refresh the page
   - Check API responses
   - Verify content status

3. **Bulk actions not working**
   - Check content filters
   - Verify user permissions
   - Check API error logs

### Debug Mode
Enable debug mode by setting `NODE_ENV=development` to see detailed error messages and API responses.

## 📈 Performance

### Optimization Tips
- Use pagination for large content lists
- Implement content caching
- Optimize database queries
- Use React.memo for component optimization

### Monitoring
- Monitor API response times
- Track content generation performance
- Monitor database query performance
- Set up alerts for failed operations

## 🔄 Updates & Maintenance

### Regular Maintenance
- Clean up old content action history
- Optimize database indexes
- Update AI models and settings
- Monitor system performance

### Version Updates
- Keep track of content versions
- Maintain backward compatibility
- Update API documentation
- Test new features thoroughly

## 📚 API Reference

### Content Management Service
```typescript
class ContentManagementService {
  async generateProjectContent(request: ContentGenerationRequest): Promise<ContentGenerationResult>
  async getProjectContentOverview(projectId: number, userId: string): Promise<ProjectContentOverview>
  async performContentAction(contentId: number, userId: string, action: string, data?: any): Promise<ActionResult>
  async extendProjectContent(projectId: number, userId: string, additionalDays: number, platforms: string[], contentType: string): Promise<ExtensionResult>
  async performBulkAction(projectId: number, userId: string, action: string, filters?: any): Promise<BulkActionResult>
}
```

### Types
```typescript
interface ContentCard {
  id: number;
  title: string;
  description: string;
  content: string;
  platform: string;
  contentType: string;
  status: string;
  dayNumber: number;
  scheduledDate: Date | null;
  publishedAt: Date | null;
  isPaused: boolean;
  isStopped: boolean;
  canPublish: boolean;
  publishOrder: number;
  contentVersion: number;
  lastRegeneratedAt: Date | null;
  hashtags: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies
3. Set up the database
4. Configure environment variables
5. Run the development server

### Code Style
- Follow TypeScript best practices
- Use proper error handling
- Write comprehensive tests
- Document all public APIs

### Pull Requests
- Include tests for new features
- Update documentation
- Follow the existing code style
- Include screenshots for UI changes

## 📄 License

This content management system is part of the CreatorNexus platform and follows the same licensing terms.

---

For more information, please refer to the main CreatorNexus documentation or contact the development team.
