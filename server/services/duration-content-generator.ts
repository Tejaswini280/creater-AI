import { AISuggestionsService, ContentSuggestionsRequest } from './ai-suggestions';
import { addDays, format, isSameDay } from 'date-fns';

export interface DurationContentRequest {
  topic: string;
  duration: number; // in days
  platform: 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok';
  contentType: 'post' | 'reel' | 'short' | 'story' | 'video';
  tone: 'professional' | 'casual' | 'funny' | 'inspirational' | 'educational';
  targetAudience: string;
  startDate: Date;
  timeSlots?: string[]; // Optional time slots for each day
}

export interface GeneratedContentItem {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  scheduledAt: Date;
  platform: string;
  contentType: string;
  tone: string;
  dayNumber: number;
  isApproved: boolean;
  metadata: {
    generatedAt: string;
    model: string;
    topic: string;
    targetAudience: string;
  };
}

export interface DurationContentResult {
  generatedContent: GeneratedContentItem[];
  summary: {
    totalDays: number;
    totalContent: number;
    platforms: string[];
    contentTypes: string[];
    generatedAt: string;
  };
}

export class DurationContentGenerator {
  
  /**
   * Generate unique content for each day within the specified duration
   */
  static async generateDurationContent(request: DurationContentRequest): Promise<DurationContentResult> {
    console.log(`🎯 Starting duration content generation for ${request.duration} days`);
    
    const generatedContent: GeneratedContentItem[] = [];
    const timeSlots = request.timeSlots || this.getDefaultTimeSlots();
    
    // Generate content for each day
    for (let dayIndex = 0; dayIndex < request.duration; dayIndex++) {
      const currentDate = addDays(request.startDate, dayIndex);
      const timeSlot = timeSlots[dayIndex % timeSlots.length];
      
      // Create a unique prompt for each day to ensure variety
      const daySpecificPrompt = this.createDaySpecificPrompt(request, dayIndex + 1);
      
      try {
        // Generate content for this specific day
        const contentRequest: ContentSuggestionsRequest = {
          topic: daySpecificPrompt.topic,
          platform: request.platform,
          contentType: request.contentType,
          tone: request.tone,
          targetAudience: request.targetAudience
        };
        
        const aiResult = await AISuggestionsService.generateSuggestions(contentRequest);
        
        // Create scheduled date with time slot
        const scheduledAt = new Date(currentDate);
        const [hours, minutes] = timeSlot.split(':').map(Number);
        scheduledAt.setHours(hours, minutes, 0, 0);
        
        const contentItem: GeneratedContentItem = {
          id: `duration_${Date.now()}_${dayIndex}`,
          title: aiResult.title || `${daySpecificPrompt.topic} - Day ${dayIndex + 1}`,
          caption: aiResult.caption,
          hashtags: aiResult.hashtags || [],
          scheduledAt,
          platform: request.platform,
          contentType: request.contentType,
          tone: request.tone,
          dayNumber: dayIndex + 1,
          isApproved: false,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: aiResult.metadata?.model || 'ai-generated',
            topic: request.topic,
            targetAudience: request.targetAudience
          }
        };
        
        generatedContent.push(contentItem);
        
        // Add a small delay to ensure variety in AI generation
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to generate content for day ${dayIndex + 1}:`, error);
        
        // Create fallback content for this day
        const fallbackContent = this.createFallbackContent(request, dayIndex + 1, currentDate, timeSlot);
        generatedContent.push(fallbackContent);
      }
    }
    
    // Validate content variety
    this.validateContentVariety(generatedContent);
    
    const result: DurationContentResult = {
      generatedContent,
      summary: {
        totalDays: request.duration,
        totalContent: generatedContent.length,
        platforms: [...new Set(generatedContent.map(item => item.platform))],
        contentTypes: [...new Set(generatedContent.map(item => item.contentType))],
        generatedAt: new Date().toISOString()
      }
    };
    
    console.log(`✅ Generated ${generatedContent.length} content items for ${request.duration} days`);
    return result;
  }
  
  /**
   * Create day-specific prompts to ensure content variety
   */
  private static createDaySpecificPrompt(request: DurationContentRequest, dayNumber: number): { topic: string } {
    const baseTopic = request.topic;
    const dayVariations = [
      `Day ${dayNumber}: Introduction to ${baseTopic}`,
      `Day ${dayNumber}: Advanced tips for ${baseTopic}`,
      `Day ${dayNumber}: Common mistakes in ${baseTopic}`,
      `Day ${dayNumber}: Success stories about ${baseTopic}`,
      `Day ${dayNumber}: Quick wins with ${baseTopic}`,
      `Day ${dayNumber}: Behind the scenes of ${baseTopic}`,
      `Day ${dayNumber}: Expert insights on ${baseTopic}`,
      `Day ${dayNumber}: Community highlights for ${baseTopic}`,
      `Day ${dayNumber}: Future trends in ${baseTopic}`,
      `Day ${dayNumber}: Personal experience with ${baseTopic}`,
      `Day ${dayNumber}: Tools and resources for ${baseTopic}`,
      `Day ${dayNumber}: Challenges and solutions in ${baseTopic}`,
      `Day ${dayNumber}: Best practices for ${baseTopic}`,
      `Day ${dayNumber}: Case studies in ${baseTopic}`,
      `Day ${dayNumber}: Q&A about ${baseTopic}`,
      `Day ${dayNumber}: Tutorial on ${baseTopic}`,
      `Day ${dayNumber}: Industry news about ${baseTopic}`,
      `Day ${dayNumber}: Creative approaches to ${baseTopic}`,
      `Day ${dayNumber}: Data and statistics on ${baseTopic}`,
      `Day ${dayNumber}: Expert interviews about ${baseTopic}`,
      `Day ${dayNumber}: Step-by-step guide for ${baseTopic}`,
      `Day ${dayNumber}: Common questions about ${baseTopic}`,
      `Day ${dayNumber}: Pro tips for ${baseTopic}`,
      `Day ${dayNumber}: Real-world applications of ${baseTopic}`,
      `Day ${dayNumber}: Getting started with ${baseTopic}`,
      `Day ${dayNumber}: Advanced techniques in ${baseTopic}`,
      `Day ${dayNumber}: Troubleshooting ${baseTopic}`,
      `Day ${dayNumber}: Success metrics for ${baseTopic}`,
      `Day ${dayNumber}: Community building around ${baseTopic}`,
      `Day ${dayNumber}: Final thoughts on ${baseTopic}`
    ];
    
    // Cycle through variations to ensure variety
    const variationIndex = (dayNumber - 1) % dayVariations.length;
    return { topic: dayVariations[variationIndex] };
  }
  
  /**
   * Get default time slots for content scheduling
   */
  private static getDefaultTimeSlots(): string[] {
    return [
      '09:00', '12:00', '15:00', '18:00', '21:00'
    ];
  }
  
  /**
   * Create fallback content when AI generation fails
   */
  private static createFallbackContent(
    request: DurationContentRequest, 
    dayNumber: number, 
    date: Date, 
    timeSlot: string
  ): GeneratedContentItem {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);
    
    const fallbackTitles = [
      `${request.topic} - Day ${dayNumber}`,
      `Daily ${request.topic} Tip #${dayNumber}`,
      `${request.topic} Insights - Day ${dayNumber}`,
      `Your ${request.topic} Journey - Day ${dayNumber}`,
      `${request.topic} Focus - Day ${dayNumber}`
    ];
    
    const fallbackCaptions = [
      `Welcome to day ${dayNumber} of our ${request.topic} series! Today we're focusing on practical tips and insights.`,
      `Day ${dayNumber} brings new perspectives on ${request.topic}. Let's dive into what makes this topic so important.`,
      `Continuing our ${request.topic} journey with day ${dayNumber}. Each day brings new learning opportunities.`,
      `Day ${dayNumber} of exploring ${request.topic}. We're building momentum and seeing real progress.`,
      `Today's ${request.topic} focus for day ${dayNumber}. Every step forward counts in this journey.`
    ];
    
    const titleIndex = (dayNumber - 1) % fallbackTitles.length;
    const captionIndex = (dayNumber - 1) % fallbackCaptions.length;
    
    return {
      id: `fallback_${Date.now()}_${dayNumber}`,
      title: fallbackTitles[titleIndex],
      caption: fallbackCaptions[captionIndex],
      hashtags: [`#${request.topic.replace(/\s+/g, '')}`, `#Day${dayNumber}`, `#${request.platform}`, '#ContentSeries'],
      scheduledAt,
      platform: request.platform,
      contentType: request.contentType,
      tone: request.tone,
      dayNumber,
      isApproved: false,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'fallback-generator',
        topic: request.topic,
        targetAudience: request.targetAudience
      }
    };
  }
  
  /**
   * Validate that content has sufficient variety
   */
  private static validateContentVariety(content: GeneratedContentItem[]): void {
    const titles = content.map(item => item.title.toLowerCase());
    const captions = content.map(item => item.caption.toLowerCase());
    
    // Check for duplicate titles
    const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
    if (duplicateTitles.length > 0) {
      console.warn(`⚠️ Found ${duplicateTitles.length} duplicate titles in generated content`);
    }
    
    // Check for similar captions (basic similarity check)
    let similarCaptions = 0;
    for (let i = 0; i < captions.length; i++) {
      for (let j = i + 1; j < captions.length; j++) {
        const similarity = this.calculateSimilarity(captions[i], captions[j]);
        if (similarity > 0.8) {
          similarCaptions++;
        }
      }
    }
    
    if (similarCaptions > 0) {
      console.warn(`⚠️ Found ${similarCaptions} pairs of similar captions in generated content`);
    }
    
    console.log(`✅ Content variety validation completed for ${content.length} items`);
  }
  
  /**
   * Calculate similarity between two strings (simple Jaccard similarity)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Generate content with custom time distribution
   */
  static async generateWithCustomTimeDistribution(
    request: DurationContentRequest,
    timeDistribution: 'morning' | 'afternoon' | 'evening' | 'mixed'
  ): Promise<DurationContentResult> {
    let timeSlots: string[];
    
    switch (timeDistribution) {
      case 'morning':
        timeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00'];
        break;
      case 'afternoon':
        timeSlots = ['12:00', '13:00', '14:00', '15:00', '16:00'];
        break;
      case 'evening':
        timeSlots = ['18:00', '19:00', '20:00', '21:00', '22:00'];
        break;
      case 'mixed':
      default:
        timeSlots = ['09:00', '12:00', '15:00', '18:00', '21:00'];
        break;
    }
    
    return this.generateDurationContent({
      ...request,
      timeSlots
    });
  }
  
  /**
   * Preview generated content without saving
   */
  static async previewDurationContent(request: DurationContentRequest): Promise<{
    preview: GeneratedContentItem[];
    summary: {
      totalDays: number;
      platforms: string[];
      contentTypes: string[];
    };
  }> {
    // Generate only first 3 days for preview
    const previewRequest = {
      ...request,
      duration: Math.min(3, request.duration)
    };
    
    const result = await this.generateDurationContent(previewRequest);
    
    return {
      preview: result.generatedContent,
      summary: {
        totalDays: result.summary.totalDays,
        platforms: result.summary.platforms,
        contentTypes: result.summary.contentTypes
      }
    };
  }
}
