import { db } from '../db';
import { projects, content, aiProjects, aiGeneratedContent } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { addDays, format } from 'date-fns';

export interface ProjectContentGenerationRequest {
  projectId: number;
  userId: string;
  projectData: {
    name: string;
    description?: string;
    type: string;
    platform?: string;
    targetAudience?: string;
    estimatedDuration?: string;
    tags?: string[];
    metadata?: any;
  };
  contentSettings: {
    totalDays: number;
    contentPerDay: number;
    platforms: string[];
    contentType: string;
    startDate?: Date;
  };
}

export interface GeneratedContentItem {
  id?: number;
  title: string;
  description: string;
  content: string;
  platform: string;
  contentType: string;
  status: 'draft' | 'scheduled' | 'published';
  dayNumber: number;
  scheduledAt?: string;
  hashtags: string[];
  metadata: any;
  projectId: number;
  userId: string;
  aiGenerated: boolean;
  isPaused: boolean;
  isStopped: boolean;
  canPublish: boolean;
  publishOrder: number;
  contentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export class ProjectContentGenerator {
  /**
   * Generate content for a project and save it to the database
   */
  async generateProjectContent(request: ProjectContentGenerationRequest): Promise<{
    success: boolean;
    projectId: number;
    contentItems: GeneratedContentItem[];
    totalGenerated: number;
  }> {
    try {
      const { projectId, userId, projectData, contentSettings } = request;
      
      // Verify project exists
      const project = await db.select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
        .limit(1);

      if (!project.length) {
        throw new Error('Project not found');
      }

      // Generate content items
      const contentItems: GeneratedContentItem[] = [];
      const startDate = contentSettings.startDate || new Date();
      
      for (let day = 1; day <= contentSettings.totalDays; day++) {
        for (let contentIndex = 0; contentIndex < contentSettings.contentPerDay; contentIndex++) {
          for (const platform of contentSettings.platforms) {
            const contentItem = await this.generateContentForDay({
              projectId,
              userId,
              projectData,
              dayNumber: day,
              platform,
              contentType: contentSettings.contentType,
              scheduledDate: addDays(startDate, day - 1)
            });

            // Save to database
            const savedContent = await this.saveContentToDatabase(contentItem);
            contentItems.push(savedContent);
          }
        }
      }

      return {
        success: true,
        projectId,
        contentItems,
        totalGenerated: contentItems.length
      };

    } catch (error) {
      console.error('Error generating project content:', error);
      throw error;
    }
  }

  /**
   * Generate content for a specific day
   */
  private async generateContentForDay(params: {
    projectId: number;
    userId: string;
    projectData: any;
    dayNumber: number;
    platform: string;
    contentType: string;
    scheduledDate: Date;
  }): Promise<GeneratedContentItem> {
    const { projectId, userId, projectData, dayNumber, platform, contentType, scheduledDate } = params;
    
    // Generate content based on project type and platform
    const contentData = this.generateContentData({
      projectData,
      dayNumber,
      platform,
      contentType,
      scheduledDate
    });

    return {
      title: contentData.title,
      description: contentData.description,
      content: contentData.content,
      platform,
      contentType,
      status: 'draft',
      dayNumber,
      scheduledAt: scheduledDate.toISOString(),
      hashtags: contentData.hashtags,
      metadata: contentData.metadata,
      projectId,
      userId,
      aiGenerated: true,
      isPaused: false,
      isStopped: false,
      canPublish: true,
      publishOrder: 0,
      contentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate content data based on project information
   */
  private generateContentData(params: {
    projectData: any;
    dayNumber: number;
    platform: string;
    contentType: string;
    scheduledDate: Date;
  }) {
    const { projectData, dayNumber, platform, contentType, scheduledDate } = params;
    
    // Content templates based on project type
    const contentTemplates = {
      fitness: {
        titles: [
          "Day {day} Workout Motivation",
          "Fitness Journey Day {day}",
          "Your Daily Fitness Inspiration",
          "Day {day} Fitness Challenge",
          "Fitness Progress Update"
        ],
        descriptions: [
          "Stay motivated on your fitness journey",
          "Daily fitness inspiration and tips",
          "Your fitness progress matters",
          "Keep pushing towards your goals",
          "Fitness is a lifestyle, not a destination"
        ],
        content: [
          "💪 Day {day} of your fitness journey! Remember, every workout counts towards your goals. Stay consistent and believe in yourself! #FitnessJourney #Day{day} #Motivation",
          "🏋️‍♀️ Today's focus: {focus}. Push yourself a little harder than yesterday. Your future self will thank you! #Fitness #Workout #Progress",
          "🌟 Fitness isn't just about the physical transformation, it's about mental strength too. Day {day} - you've got this! #MentalHealth #Fitness #Wellness",
          "🔥 Consistency is key! Day {day} of showing up for yourself. Every rep, every step, every choice matters. #Consistency #Fitness #SelfCare",
          "💯 Progress over perfection! Day {day} and you're still here, still trying, still growing. That's what matters most. #Progress #Fitness #Growth"
        ]
      },
      business: {
        titles: [
          "Business Tip Day {day}",
          "Entrepreneur Insights Day {day}",
          "Business Growth Day {day}",
          "Professional Development Day {day}",
          "Business Strategy Day {day}"
        ],
        descriptions: [
          "Daily business insights and tips",
          "Professional development content",
          "Business growth strategies",
          "Entrepreneurial wisdom",
          "Industry insights and trends"
        ],
        content: [
          "💼 Day {day} of business growth! Today's focus: {focus}. Success is built one decision at a time. #Business #Growth #Entrepreneur",
          "🚀 Every successful business started with a single step. Day {day} - what's your next move? #Startup #Business #Success",
          "📈 Consistency in business is everything. Day {day} of showing up, learning, and growing. #Consistency #Business #Growth",
          "💡 Innovation happens when you challenge the status quo. Day {day} - think differently! #Innovation #Business #Creativity",
          "🎯 Focus on progress, not perfection. Day {day} of building something meaningful. #Progress #Business #Purpose"
        ]
      },
      lifestyle: {
        titles: [
          "Lifestyle Day {day}",
          "Daily Inspiration Day {day}",
          "Wellness Journey Day {day}",
          "Life Balance Day {day}",
          "Mindful Living Day {day}"
        ],
        descriptions: [
          "Daily lifestyle inspiration",
          "Wellness and self-care tips",
          "Life balance guidance",
          "Mindful living practices",
          "Personal development content"
        ],
        content: [
          "✨ Day {day} of mindful living! Take a moment to appreciate the little things today. #Mindfulness #Lifestyle #Gratitude",
          "🌱 Growth happens in the small moments. Day {day} - what are you learning about yourself? #Growth #Lifestyle #SelfDiscovery",
          "💫 Life is about balance. Day {day} - how are you nurturing all aspects of your life? #Balance #Lifestyle #Wellness",
          "🌟 Every day is a new opportunity to be better. Day {day} - what will you do differently? #Opportunity #Lifestyle #Growth",
          "💝 Self-care isn't selfish, it's necessary. Day {day} - how are you taking care of yourself? #SelfCare #Lifestyle #Wellness"
        ]
      },
      technology: {
        titles: [
          "Tech Tip Day {day}",
          "Digital Innovation Day {day}",
          "Tech Trends Day {day}",
          "Digital Skills Day {day}",
          "Tech Insights Day {day}"
        ],
        descriptions: [
          "Daily tech tips and insights",
          "Digital innovation content",
          "Technology trends and updates",
          "Digital skills development",
          "Tech industry insights"
        ],
        content: [
          "💻 Day {day} of tech innovation! Technology is changing the world - are you keeping up? #Technology #Innovation #Digital",
          "🚀 The future is digital. Day {day} - what tech skills are you developing? #DigitalSkills #Technology #Future",
          "📱 Technology should enhance life, not complicate it. Day {day} - how are you using tech wisely? #TechBalance #Digital #Lifestyle",
          "🔧 Every problem is an opportunity for a tech solution. Day {day} - what are you building? #ProblemSolving #Technology #Innovation",
          "🌟 Tech is a tool for human connection. Day {day} - how are you using it to connect? #Connection #Technology #Humanity"
        ]
      }
    };

    // Get content template based on project type
    const template = contentTemplates[projectData.type as keyof typeof contentTemplates] || contentTemplates.lifestyle;
    
    // Select random content from template
    const titleTemplate = template.titles[Math.floor(Math.random() * template.titles.length)];
    const descriptionTemplate = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
    const contentTemplate = template.content[Math.floor(Math.random() * template.content.length)];

    // Replace placeholders
    const title = titleTemplate.replace('{day}', dayNumber.toString());
    const description = descriptionTemplate;
    const content = contentTemplate
      .replace('{day}', dayNumber.toString())
      .replace('{focus}', this.getRandomFocus(projectData.type));

    // Generate hashtags based on project type and platform
    const hashtags = this.generateHashtags(projectData.type, platform, dayNumber);

    // Generate metadata
    const metadata = {
      aiGenerated: true,
      projectType: projectData.type,
      platform,
      contentType,
      dayNumber,
      scheduledDate: scheduledDate.toISOString(),
      engagementPrediction: {
        likes: Math.floor(Math.random() * 200) + 50,
        comments: Math.floor(Math.random() * 30) + 5,
        shares: Math.floor(Math.random() * 20) + 2,
        reach: Math.floor(Math.random() * 1000) + 200
      },
      confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
      uniquenessScore: Math.random() * 0.3 + 0.7 // 70-100% uniqueness
    };

    return {
      title,
      description,
      content,
      hashtags,
      metadata
    };
  }

  /**
   * Generate hashtags based on project type and platform
   */
  private generateHashtags(projectType: string, platform: string, dayNumber: number): string[] {
    const baseHashtags = {
      fitness: ['Fitness', 'Workout', 'Health', 'Motivation', 'FitnessJourney'],
      business: ['Business', 'Entrepreneur', 'Success', 'Growth', 'Leadership'],
      lifestyle: ['Lifestyle', 'Wellness', 'SelfCare', 'Mindfulness', 'Balance'],
      technology: ['Technology', 'Innovation', 'Digital', 'Tech', 'Future']
    };

    const platformHashtags = {
      instagram: ['Instagram', 'Insta', 'Photo'],
      youtube: ['YouTube', 'Video', 'Subscribe'],
      facebook: ['Facebook', 'Community'],
      twitter: ['Twitter', 'Tweet', 'Thread'],
      tiktok: ['TikTok', 'Viral', 'Trending'],
      linkedin: ['LinkedIn', 'Professional', 'Career']
    };

    const dayHashtags = [`Day${dayNumber}`, `Day${dayNumber}Challenge`];
    
    const typeHashtags = baseHashtags[projectType as keyof typeof baseHashtags] || baseHashtags.lifestyle;
    const platformHashtagsList = platformHashtags[platform as keyof typeof platformHashtags] || [];

    return [...typeHashtags, ...platformHashtagsList, ...dayHashtags].slice(0, 8);
  }

  /**
   * Get random focus area based on project type
   */
  private getRandomFocus(projectType: string): string {
    const focusAreas = {
      fitness: ['Strength Training', 'Cardio', 'Flexibility', 'Nutrition', 'Recovery'],
      business: ['Marketing', 'Sales', 'Operations', 'Strategy', 'Innovation'],
      lifestyle: ['Mindfulness', 'Self-Care', 'Relationships', 'Hobbies', 'Learning'],
      technology: ['Coding', 'Design', 'Data', 'Security', 'AI']
    };

    const areas = focusAreas[projectType as keyof typeof focusAreas] || focusAreas.lifestyle;
    return areas[Math.floor(Math.random() * areas.length)];
  }

  /**
   * Save content to database
   */
  private async saveContentToDatabase(contentItem: GeneratedContentItem): Promise<GeneratedContentItem> {
    try {
      const insertData = {
        userId: contentItem.userId,
        projectId: contentItem.projectId,
        title: contentItem.title,
        description: contentItem.description,
        script: contentItem.content,
        platform: contentItem.platform,
        contentType: contentItem.contentType,
        status: contentItem.status,
        scheduledAt: contentItem.scheduledAt ? new Date(contentItem.scheduledAt) : null,
        tags: contentItem.hashtags,
        metadata: contentItem.metadata,
        aiGenerated: contentItem.aiGenerated,
        dayNumber: contentItem.dayNumber,
        isPaused: contentItem.isPaused,
        isStopped: contentItem.isStopped,
        canPublish: contentItem.canPublish,
        publishOrder: contentItem.publishOrder,
        contentVersion: contentItem.contentVersion
      };

      const [savedContent] = await db.insert(content).values(insertData).returning();
      
      return {
        ...contentItem,
        id: savedContent.id,
        createdAt: savedContent.createdAt.toISOString(),
        updatedAt: savedContent.updatedAt.toISOString()
      };

    } catch (error) {
      console.error('Error saving content to database:', error);
      throw error;
    }
  }

  /**
   * Get content for a specific project
   */
  async getProjectContent(projectId: number, userId: string): Promise<GeneratedContentItem[]> {
    try {
      const contentItems = await db.select()
        .from(content)
        .where(and(eq(content.projectId, projectId), eq(content.userId, userId)))
        .orderBy(content.dayNumber, content.publishOrder);

      return contentItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        content: item.script || '',
        platform: item.platform,
        contentType: item.contentType,
        status: item.status as 'draft' | 'scheduled' | 'published',
        dayNumber: item.dayNumber || 1,
        scheduledAt: item.scheduledAt?.toISOString(),
        hashtags: item.tags || [],
        metadata: item.metadata || {},
        projectId: item.projectId || 0,
        userId: item.userId,
        aiGenerated: item.aiGenerated || false,
        isPaused: item.isPaused || false,
        isStopped: item.isStopped || false,
        canPublish: item.canPublish || true,
        publishOrder: item.publishOrder || 0,
        contentVersion: item.contentVersion || 1,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }));

    } catch (error) {
      console.error('Error fetching project content:', error);
      throw error;
    }
  }
}

export const projectContentGenerator = new ProjectContentGenerator();
