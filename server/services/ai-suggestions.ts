import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use the provided API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Check if API keys are properly configured
const hasValidOpenAIKey = false; // Disabled - using only Gemini
const hasValidGeminiKey = !!GEMINI_API_KEY && GEMINI_API_KEY.length > 20;

// Initialize AI clients
let openai: OpenAI | null = null;
let genAI: GoogleGenerativeAI | null = null;

if (hasValidOpenAIKey) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY
  });
  console.log('✅ AI Suggestions Service - OpenAI initialized');
} else {
  console.warn('⚠️ AI Suggestions Service - OpenAI API key not configured or invalid');
}

if (hasValidGeminiKey) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('✅ AI Suggestions Service - Gemini AI initialized');
} else {
  console.warn('⚠️ AI Suggestions Service - Gemini API key not configured or invalid');
}

export interface ContentSuggestionsRequest {
  topic: string;
  contentType?: 'post' | 'reel' | 'short' | 'story' | 'video';
  platform?: 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok';
  tone?: 'professional' | 'casual' | 'funny' | 'inspirational' | 'educational';
  targetAudience?: string;
}

export interface ContentSuggestionsResult {
  caption: string;
  hashtags: string[];
  postTitle: string;
  emojis: string[];
  suggestions: {
    alternativeCaptions: string[];
    trendingHashtags: string[];
    engagementTips: string[];
  };
  metadata: {
    generatedAt: string;
    model: string;
    platform: string;
    contentType: string;
  };
}

export class AISuggestionsService {
  
  /**
   * Generate AI-powered hashtag suggestions
   */
  static async generateHashtagSuggestions(request: {
    topic: string;
    contentType?: string;
    platform?: string;
    currentHashtags?: string[];
  }): Promise<{
    suggestedHashtags: string[];
    metadata: {
      generatedAt: string;
      model: string;
      platform: string;
      contentType: string;
    };
  }> {
    console.log('✨ Generating hashtag suggestions using Gemini AI for topic:', request.topic);
    
    if (!hasValidGeminiKey || !genAI) {
      throw new Error('Gemini API key is not configured or invalid. Please check your API key configuration.');
    }

    try {
          return await this.generateHashtagSuggestionsWithGemini(request);
    } catch (error) {
      console.error('❌ Gemini hashtag generation failed:', error);
      throw new Error(`Failed to generate hashtag suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate AI-powered content suggestions
   */
  static async generateSuggestions(request: ContentSuggestionsRequest): Promise<ContentSuggestionsResult> {
    console.log('✨ Generating content suggestions using Gemini AI for topic:', request.topic);
    
    if (!hasValidGeminiKey || !genAI) {
      throw new Error('Gemini API key is not configured or invalid. Please check your API key configuration.');
    }

    try {
      return await this.generateWithGemini(request);
    } catch (error) {
      console.error('❌ Gemini content generation failed:', error);
      throw new Error(`Failed to generate AI suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate AI-powered target audience suggestions
   */
  static async generateTargetAudienceSuggestions(request: {
    projectName: string;
    contentName: string;
    contentTypes: string[];
    contentCategories: string[];
    channelTypes: string[];
  }): Promise<{
    suggestions: string[];
    metadata: {
      generatedAt: string;
      model: string;
    };
  }> {
    console.log('✨ Generating target audience suggestions using Gemini AI...');
    
    if (!hasValidGeminiKey || !genAI) {
      throw new Error('Gemini API key is not configured or invalid. Please check your API key configuration.');
    }

    try {
      const prompt = `Based on the following project details, generate 5-7 specific target audience suggestions for social media content:

Project Name: ${request.projectName}
Content Name: ${request.contentName}
Content Types: ${request.contentTypes.join(', ')}
Content Categories: ${request.contentCategories.join(', ')}
Channel Types: ${request.channelTypes.join(', ')}

Please provide specific, actionable target audience descriptions that would be most interested in this content. Each suggestion should be 2-4 words and describe a specific demographic or interest group.

Format the response as a JSON array of strings:
["Audience 1", "Audience 2", "Audience 3", "Audience 4", "Audience 5"]

Make the suggestions specific and relevant to the content type and platform.`;

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('No response from Gemini');
      }

      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini');
      }

      const suggestions = JSON.parse(jsonMatch[0]);
      
      return {
        suggestions,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gemini-pro'
        }
      };
    } catch (error) {
      console.error('❌ Gemini target audience generation failed:', error);
      throw new Error(`Failed to generate target audience suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate AI-powered project content
   */
  static async generateProjectContent(request: {
    projectName: string;
    contentName: string;
    contentDescription: string;
    contentType: string;
    channelType: string;
    targetAudience: string;
    startDate: string;
    endDate: string;
    totalDays: number;
  }): Promise<{
    contentItems: Array<{
      id: string;
      title: string;
      description: string;
      content: string;
      hashtags: string[];
      platform: string;
      contentType: string;
      scheduledDate: string;
      scheduledTime: string;
      status: string;
      dayNumber: number;
      aiGenerated: boolean;
      engagementPrediction: {
        likes: number;
        comments: number;
        shares: number;
        reach: number;
      };
    }>;
    metadata: {
      generatedAt: string;
      model: string;
      totalItems: number;
    };
  }> {
    console.log('✨ Generating project content using Gemini AI...');
    
    if (!hasValidGeminiKey || !genAI) {
      console.warn('⚠️ Gemini API key not configured, using fallback content generation');
      // Generate fallback content instead of throwing error
      const fallbackContent = this.generateFallbackContent(request);
      return {
        contentItems: fallbackContent,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'fallback',
          totalItems: fallbackContent.length
        }
      };
    }

    try {
      const contentItems = [];
      const startDate = new Date(request.startDate);
      
      for (let i = 0; i < request.totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const prompt = `Generate social media content for day ${i + 1} of a ${request.totalDays}-day content series.

Project Details:
- Project Name: ${request.projectName}
- Content Name: ${request.contentName}
- Content Description: ${request.contentDescription}
- Content Type: ${request.contentType}
- Platform: ${request.channelType}
- Target Audience: ${request.targetAudience}
- Day: ${i + 1} of ${request.totalDays}

Generate engaging content that:
1. Has a compelling title (include day number and relevant emoji)
2. Has an engaging description (2-3 sentences)
3. Has full content (3-4 paragraphs with actionable tips)
4. Includes 8-12 relevant hashtags
5. Predicts realistic engagement metrics

Format as JSON:
{
  "title": "Day X: [Compelling Title]",
  "description": "Engaging description...",
  "content": "Full content with actionable tips...",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "engagementPrediction": {
    "likes": 150,
    "comments": 25,
    "shares": 12,
    "reach": 500
  }
}`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
          throw new Error(`No response from Gemini for day ${i + 1}`);
        }

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`Invalid JSON response from Gemini for day ${i + 1}`);
        }

        const contentData = JSON.parse(jsonMatch[0]);
        
        // Generate optimal posting time (6 PM as default)
        const scheduledTime = "18:00";
        
        contentItems.push({
          id: `${request.channelType}-${request.contentType}-day-${i + 1}`,
          title: contentData.title,
          description: contentData.description,
          content: contentData.content,
          hashtags: contentData.hashtags || [],
          platform: request.channelType,
          contentType: request.contentType,
          scheduledDate: currentDate.toISOString().split('T')[0],
          scheduledTime: scheduledTime,
          status: 'draft',
          dayNumber: i + 1,
          aiGenerated: true,
          engagementPrediction: contentData.engagementPrediction || {
            likes: 100,
            comments: 15,
            shares: 8,
            reach: 300
          }
        });
      }

      return {
        contentItems,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gemini-pro',
          totalItems: contentItems.length
        }
      };
    } catch (error) {
      console.error('❌ Gemini project content generation failed:', error);
      
      // Generate fallback content if AI fails
      console.log('🔄 Generating fallback content...');
      const fallbackContent = this.generateFallbackContent(request);
      
      return {
        contentItems: fallbackContent,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'fallback',
          totalItems: fallbackContent.length
        }
      };
    }
  }

  /**
   * Generate fallback content when AI fails
   */
  static generateFallbackContent(request: {
    projectName: string;
    contentName: string;
    contentDescription: string;
    contentType: string;
    channelType: string;
    targetAudience: string;
    startDate: string;
    endDate: string;
    totalDays: number;
  }): Array<{
    id: string;
    title: string;
    description: string;
    content: string;
    hashtags: string[];
    platform: string;
    contentType: string;
    scheduledDate: string;
    scheduledTime: string;
    status: string;
    dayNumber: number;
    aiGenerated: boolean;
    engagementPrediction: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
    };
  }> {
    const contentItems = [];
    const startDate = new Date(request.startDate);
    
    for (let i = 0; i < request.totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayNumber = i + 1;
      const contentItem = {
        id: `${request.channelType}-${request.contentType}-day-${dayNumber}-fallback`,
        title: `Day ${dayNumber}: ${request.contentName}`,
        description: `Content for day ${dayNumber} of ${request.projectName}. ${request.contentDescription}`,
        content: `Welcome to day ${dayNumber} of ${request.projectName}!\n\n${request.contentDescription}\n\nThis content is designed for ${request.targetAudience} and will be posted on ${request.channelType}. Stay tuned for more engaging content!`,
        hashtags: [
          `#${request.projectName.replace(/\s+/g, '')}`,
          `#day${dayNumber}`,
          `#${request.contentType}`,
          `#${request.channelType}`,
          '#content',
          '#socialmedia',
          '#engagement',
          '#community'
        ],
        platform: request.channelType,
        contentType: request.contentType,
        scheduledDate: currentDate.toISOString().split('T')[0],
        scheduledTime: "18:00",
        status: 'draft',
        dayNumber: dayNumber,
        aiGenerated: false,
        engagementPrediction: {
          likes: Math.floor(Math.random() * 100) + 50,
          comments: Math.floor(Math.random() * 20) + 5,
          shares: Math.floor(Math.random() * 15) + 3,
          reach: Math.floor(Math.random() * 200) + 100
        }
      };
      
      contentItems.push(contentItem);
    }
    
    return contentItems;
  }
  
  /**
   * Generate suggestions using OpenAI
   */
  private static async generateWithOpenAI(request: ContentSuggestionsRequest): Promise<ContentSuggestionsResult> {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = this.buildPrompt(request);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional social media content creator and marketing expert. Generate engaging, platform-optimized content suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return this.parseOpenAIResponse(response, request);
  }
  
  /**
   * Generate suggestions using Gemini
   */
  private static async generateWithGemini(request: ContentSuggestionsRequest): Promise<ContentSuggestionsResult> {
    if (!genAI) {
      throw new Error('Gemini client not initialized');
    }

    const prompt = this.buildPrompt(request);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No response from Gemini');
    }

    return this.parseGeminiResponse(text, request);
  }
  
  /**
   * Build the prompt for AI generation
   */
  private static buildPrompt(request: ContentSuggestionsRequest): string {
    const platform = request.platform || 'instagram';
    const contentType = request.contentType || 'post';
    const tone = request.tone || 'casual';
    const audience = request.targetAudience || 'general audience';
    
    return `Generate engaging social media content for ${platform} ${contentType} with a ${tone} tone for ${audience}.

Topic: ${request.topic}

Please provide:
1. A compelling caption (2-3 sentences, engaging and platform-optimized)
2. 5-8 relevant hashtags (trending and niche-specific)
3. A catchy post title (short and attention-grabbing)
4. 4-6 relevant emojis that match the content
5. 2 alternative caption variations
6. 3 trending hashtag suggestions
7. 2 engagement tips

Format the response as JSON:
{
  "caption": "main caption here",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "postTitle": "Post Title Here",
  "emojis": ["emoji1", "emoji2"],
  "suggestions": {
    "alternativeCaptions": ["alt1", "alt2"],
    "trendingHashtags": ["#trending1", "#trending2"],
    "engagementTips": ["tip1", "tip2"]
  }
}

Make sure the content is engaging, platform-appropriate, and optimized for maximum reach and engagement.`;
  }
  
  /**
   * Parse OpenAI response
   */
  private static parseOpenAIResponse(response: string, request: ContentSuggestionsRequest): ContentSuggestionsResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndFormatResult(parsed, request, 'OpenAI GPT-4');
      }
      
      // Fallback parsing if JSON extraction fails
      return this.parseFallbackResponse(response, request, 'OpenAI GPT-4');
    } catch (error) {
      console.warn('Failed to parse OpenAI response as JSON, using fallback parsing:', error);
      return this.parseFallbackResponse(response, request, 'OpenAI GPT-4');
    }
  }
  
  /**
   * Parse Gemini response
   */
  private static parseGeminiResponse(response: string, request: ContentSuggestionsRequest): ContentSuggestionsResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndFormatResult(parsed, request, 'Gemini Pro');
      }
      
      // Fallback parsing if JSON extraction fails
      return this.parseFallbackResponse(response, request, 'Gemini Pro');
    } catch (error) {
      console.warn('Failed to parse Gemini response as JSON, using fallback parsing:', error);
      return this.parseFallbackResponse(response, request, 'Gemini Pro');
    }
  }
  
  /**
   * Parse fallback response when JSON parsing fails
   */
  private static parseFallbackResponse(response: string, request: ContentSuggestionsRequest, model: string): ContentSuggestionsResult {
    // Extract content using regex patterns
    const captionMatch = response.match(/caption["\s:]+([^"\n]+)/i);
    const hashtagsMatch = response.match(/#\w+/g);
    const titleMatch = response.match(/title["\s:]+([^"\n]+)/i);
    // Simple emoji detection - just look for common emojis
    const emojisMatch = response.match(/[😀😁😂🤣😃😄😅😆😇😈😉😊😋😌😍😎😏😐😑😒😓😔😕😖😗😘😙😚😛😜😝😞😟😠😡😢😣😤😥😦😧😨😩😪😫😬😭😮😯😰😱😲😳😴😵😶😷]/g) || [];
    
    return {
      caption: captionMatch?.[1] || this.generateFallbackCaption(request.topic),
      hashtags: hashtagsMatch || this.generateFallbackHashtags(request.topic),
      postTitle: titleMatch?.[1] || this.generateFallbackTitle(request.topic),
      emojis: emojisMatch || this.generateFallbackEmojis(request.topic),
      suggestions: {
        alternativeCaptions: [
          this.generateFallbackCaption(request.topic, 'alternative1'),
          this.generateFallbackCaption(request.topic, 'alternative2')
        ],
        trendingHashtags: ['#trending', '#viral', '#fyp'],
        engagementTips: [
          'Ask a question to encourage comments',
          'Use relevant hashtags for better discoverability'
        ]
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        model: model,
        platform: request.platform || 'instagram',
        contentType: request.contentType || 'post'
      }
    };
  }
  
  /**
   * Validate and format the parsed result
   */
  private static validateAndFormatResult(parsed: any, request: ContentSuggestionsRequest, model: string): ContentSuggestionsResult {
    return {
      caption: parsed.caption || this.generateFallbackCaption(request.topic),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : this.generateFallbackHashtags(request.topic),
      postTitle: parsed.postTitle || this.generateFallbackTitle(request.topic),
      emojis: Array.isArray(parsed.emojis) ? parsed.emojis : this.generateFallbackEmojis(request.topic),
      suggestions: {
        alternativeCaptions: Array.isArray(parsed.suggestions?.alternativeCaptions) 
          ? parsed.suggestions.alternativeCaptions 
          : [this.generateFallbackCaption(request.topic, 'alternative1'), this.generateFallbackCaption(request.topic, 'alternative2')],
        trendingHashtags: Array.isArray(parsed.suggestions?.trendingHashtags) 
          ? parsed.suggestions.trendingHashtags 
          : ['#trending', '#viral', '#fyp'],
        engagementTips: Array.isArray(parsed.suggestions?.engagementTips) 
          ? parsed.suggestions.engagementTips 
          : ['Ask a question to encourage comments', 'Use relevant hashtags for better discoverability']
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        model: model,
        platform: request.platform || 'instagram',
        contentType: request.contentType || 'post'
      }
    };
  }
  
  /**
   * Generate fallback suggestions when AI services fail
   */
  private static async generateFallbackSuggestions(request: ContentSuggestionsRequest): Promise<ContentSuggestionsResult> {
    console.log('✨ Generating fallback suggestions...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      caption: this.generateFallbackCaption(request.topic),
      hashtags: this.generateFallbackHashtags(request.topic),
      postTitle: this.generateFallbackTitle(request.topic),
      emojis: this.generateFallbackEmojis(request.topic),
      suggestions: {
        alternativeCaptions: [
          this.generateFallbackCaption(request.topic, 'alternative1'),
          this.generateFallbackCaption(request.topic, 'alternative2')
        ],
        trendingHashtags: ['#trending', '#viral', '#fyp', '#content', '#creative'],
        engagementTips: [
          'Ask a question to encourage comments',
          'Use relevant hashtags for better discoverability',
          'Post at optimal times for your audience'
        ]
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'Fallback Generator',
        platform: request.platform || 'instagram',
        contentType: request.contentType || 'post'
      }
    };
  }
  
  /**
   * Generate fallback caption
   */
  private static generateFallbackCaption(topic: string, variation?: string): string {
    const captions = [
      `🚀 Exciting new content about ${topic}! Stay tuned for amazing insights and behind-the-scenes moments. #innovation #creativity #content`,
      `✨ Discover the latest trends in ${topic}! From tips to tricks, we've got you covered. #trending #viral #fyp`,
      `💡 Ready to dive deep into ${topic}? This is going to be epic! #content #creative #innovation`,
      `🎯 Your ultimate guide to ${topic} is here! Let's explore together and create something amazing. #content #creative #innovation`
    ];
    
    if (variation === 'alternative1') {
      return `🔥 New ${topic} content dropping soon! Get ready for some serious value and insights. #trending #viral #content`;
    } else if (variation === 'alternative2') {
      return `🌟 Exploring ${topic} like never before! This content will change the game. #innovation #creativity #trending`;
    }
    
    return captions[Math.floor(Math.random() * captions.length)];
  }
  
  /**
   * Generate fallback hashtags
   */
  private static generateFallbackHashtags(topic: string): string[] {
    const baseHashtags = ['#trending', '#viral', '#fyp', '#content', '#creative', '#innovation'];
    const topicHashtags = [`#${topic.replace(/\s+/g, '')}`, `#${topic.replace(/\s+/g, '').toLowerCase()}`];
    
    return [...baseHashtags, ...topicHashtags];
  }
  
  /**
   * Generate fallback title
   */
  private static generateFallbackTitle(topic: string): string {
    const titles = [
      `Ultimate Guide to ${topic}`,
      `${topic} Masterclass`,
      `${topic} Secrets Revealed`,
      `${topic} - Everything You Need to Know`,
      `${topic} Deep Dive`
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }
  
  /**
   * Generate fallback emojis
   */
  private static generateFallbackEmojis(topic: string): string[] {
    const emojiSets = [
      ['🚀', '✨', '💡', '🎯', '🔥', '💪'],
      ['🌟', '💫', '🎨', '🎭', '📚', '🎪'],
      ['🎬', '📱', '💻', '🎵', '🎮', '🏆'],
      ['🌈', '⭐', '🎊', '🎉', '🎁', '🎈']
    ];
    
    return emojiSets[Math.floor(Math.random() * emojiSets.length)];
  }
  
  /**
   * Generate hashtag suggestions using OpenAI
   */
  private static async generateHashtagSuggestionsWithOpenAI(request: {
    topic: string;
    contentType?: string;
    platform?: string;
    currentHashtags?: string[];
  }): Promise<{
    suggestedHashtags: string[];
    metadata: {
      generatedAt: string;
      model: string;
      platform: string;
      contentType: string;
    };
  }> {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    const currentHashtagsText = request.currentHashtags && request.currentHashtags.length > 0
      ? ` Current hashtags: ${request.currentHashtags.join(', ')}`
      : '';

    const prompt = `Generate 15-20 relevant and trending hashtags for social media content about: "${request.topic}"

Platform: ${request.platform || 'instagram'}
Content Type: ${request.contentType || 'post'}
${currentHashtagsText}

Requirements:
- Include trending hashtags for the topic
- Mix of niche-specific and popular hashtags
- Include platform-specific hashtags
- Avoid duplicates
- All hashtags should start with #

Format your response as a JSON array of strings:
["#hashtag1", "#hashtag2", "#hashtag3", ...]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a social media marketing expert specializing in hashtag strategies. Generate relevant, trending hashtags that will maximize reach and engagement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return this.parseHashtagResponse(response, request, 'OpenAI GPT-4');
  }

  /**
   * Generate hashtag suggestions using Gemini
   */
  private static async generateHashtagSuggestionsWithGemini(request: {
    topic: string;
    contentType?: string;
    platform?: string;
    currentHashtags?: string[];
  }): Promise<{
    suggestedHashtags: string[];
    metadata: {
      generatedAt: string;
      model: string;
      platform: string;
      contentType: string;
    };
  }> {
    if (!genAI) {
      throw new Error('Gemini client not initialized');
    }

    const currentHashtagsText = request.currentHashtags && request.currentHashtags.length > 0
      ? ` Current hashtags: ${request.currentHashtags.join(', ')}`
      : '';

    const prompt = `Generate 15-20 relevant and trending hashtags for social media content about: "${request.topic}"

Platform: ${request.platform || 'instagram'}
Content Type: ${request.contentType || 'post'}
${currentHashtagsText}

Requirements:
- Include trending hashtags for the topic
- Mix of niche-specific and popular hashtags
- Include platform-specific hashtags
- Avoid duplicates
- All hashtags should start with #

Format your response as a JSON array of strings:
["#hashtag1", "#hashtag2", "#hashtag3", ...]`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini');
    }

    return this.parseHashtagResponse(text, request, 'Gemini Pro');
  }

  /**
   * Parse hashtag response from AI
   */
  private static parseHashtagResponse(response: string, request: {
    topic: string;
    contentType?: string;
    platform?: string;
    currentHashtags?: string[];
  }, model: string): {
    suggestedHashtags: string[];
    metadata: {
      generatedAt: string;
      model: string;
      platform: string;
      contentType: string;
    };
  } {
    try {
      // Try to extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          const suggestedHashtags = parsed.filter((item: any) =>
            typeof item === 'string' && item.startsWith('#')
          );

          return {
            suggestedHashtags: this.filterUniqueHashtags(suggestedHashtags, request.currentHashtags || []),
            metadata: {
              generatedAt: new Date().toISOString(),
              model: model,
              platform: request.platform || 'instagram',
              contentType: request.contentType || 'post'
            }
          };
        }
      }

      // Fallback: extract hashtags using regex
      const hashtags = response.match(/#\w+/g) || [];
      return {
        suggestedHashtags: this.filterUniqueHashtags(hashtags, request.currentHashtags || []),
        metadata: {
          generatedAt: new Date().toISOString(),
          model: model,
          platform: request.platform || 'instagram',
          contentType: request.contentType || 'post'
        }
      };
    } catch (error) {
      console.warn('Failed to parse hashtag response as JSON, using fallback parsing:', error);
      const hashtags = response.match(/#\w+/g) || [];
      return {
        suggestedHashtags: this.filterUniqueHashtags(hashtags, request.currentHashtags || []),
        metadata: {
          generatedAt: new Date().toISOString(),
          model: model,
          platform: request.platform || 'instagram',
          contentType: request.contentType || 'post'
        }
      };
    }
  }

  /**
   * Generate fallback hashtag suggestions
   */
  private static async generateFallbackHashtagSuggestions(request: {
    topic: string;
    contentType?: string;
    platform?: string;
    currentHashtags?: string[];
  }): Promise<{
    suggestedHashtags: string[];
    metadata: {
      generatedAt: string;
      model: string;
      platform: string;
      contentType: string;
    };
  }> {
    console.log('✨ Generating fallback hashtag suggestions...');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const baseHashtags = [
      '#trending', '#viral', '#fyp', '#content', '#creative', '#innovation',
      '#socialmedia', '#marketing', '#digital', '#online', '#community'
    ];

    const topicHashtags = [
      `#${request.topic.replace(/\s+/g, '')}`,
      `#${request.topic.replace(/\s+/g, '').toLowerCase()}`,
      `#${request.topic.replace(/\s+/g, ' ').split(' ').join('')}`,
    ];

    const platformHashtags = {
      instagram: ['#instagood', '#photooftheday', '#beautiful', '#art', '#design'],
      facebook: ['#facebook', '#social', '#community', '#share', '#connect'],
      linkedin: ['#professional', '#business', '#networking', '#career', '#leadership'],
      youtube: ['#youtube', '#video', '#tutorial', '#education', '#entertainment'],
      tiktok: ['#tiktok', '#dance', '#music', '#fun', '#challenge']
    };

    const platformSpecific = platformHashtags[request.platform as keyof typeof platformHashtags] || platformHashtags.instagram;

    const allHashtags = [...baseHashtags, ...topicHashtags, ...platformSpecific];
    const filteredHashtags = this.filterUniqueHashtags(allHashtags, request.currentHashtags || []);

    return {
      suggestedHashtags: filteredHashtags.slice(0, 20),
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'Fallback Generator',
        platform: request.platform || 'instagram',
        contentType: request.contentType || 'post'
      }
    };
  }

  /**
   * Filter out duplicate hashtags
   */
  private static filterUniqueHashtags(hashtags: string[], currentHashtags: string[]): string[] {
    const existing = new Set(currentHashtags.map(h => h.toLowerCase()));
    return hashtags.filter(hashtag => !existing.has(hashtag.toLowerCase()));
  }

  /**
   * Generate unique AI content for each day
   */
  static async generateUniqueDayContent(request: {
    baseProject: string;
    baseContent: string;
    contentDescription: string;
    category: string;
    platform: string;
    contentType: string;
    targetAudience: string;
    dayNumber: number;
    totalDays: number;
    aiSettings: {
      creativity: number;
      uniqueness: number;
      engagement: number;
      hashtagCount: number;
      includeEmojis: boolean;
      includeCallToAction: boolean;
    };
  }): Promise<{
    title: string;
    description: string;
    content: string;
    hashtags: string[];
  }> {
    console.log(`✨ Generating unique AI content for Day ${request.dayNumber}...`);
    
    if (!hasValidGeminiKey || !genAI) {
      console.warn('⚠️ Gemini API key not configured, using fallback content generation');
      return this.generateFallbackUniqueContent(request);
    }

    try {
      const prompt = `Generate completely unique social media content for Day ${request.dayNumber} of a ${request.totalDays}-day content series.

Project Context:
- Project Name: ${request.baseProject}
- Base Content Theme: ${request.baseContent}
- Content Description: ${request.contentDescription}
- Category: ${request.category}
- Platform: ${request.platform}
- Content Type: ${request.contentType}
- Target Audience: ${request.targetAudience}
- Day: ${request.dayNumber} of ${request.totalDays}

Requirements:
1. Create a COMPLETELY UNIQUE title that's different from any other day
2. Write an engaging description (2-3 sentences)
3. Create full content (3-4 paragraphs with actionable tips)
4. Generate ${request.aiSettings.hashtagCount} relevant hashtags
5. Make it specific to Day ${request.dayNumber} and the ${request.category} category
6. Ensure high creativity (${request.aiSettings.creativity}) and uniqueness (${request.aiSettings.uniqueness})
7. Optimize for engagement (${request.aiSettings.engagement})
8. Include emojis: ${request.aiSettings.includeEmojis}
9. Include call-to-action: ${request.aiSettings.includeCallToAction}

The content should be:
- Unique and different from other days
- Engaging and platform-optimized
- Relevant to the target audience
- Actionable and valuable
- Fresh and original

Format as JSON:
{
  "title": "Unique Day ${request.dayNumber} Title with Emoji",
  "description": "Engaging 2-3 sentence description...",
  "content": "Full content with actionable tips and insights...",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`;

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error(`No response from Gemini for Day ${request.dayNumber}`);
      }

      // Parse the JSON response
      let parsedContent;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        throw new Error(`Invalid response format from AI for Day ${request.dayNumber}`);
      }

      // Validate the response structure
      if (!parsedContent.title || !parsedContent.description || !parsedContent.content || !parsedContent.hashtags) {
        throw new Error(`Incomplete response from AI for Day ${request.dayNumber}`);
      }

      return {
        title: parsedContent.title,
        description: parsedContent.description,
        content: parsedContent.content,
        hashtags: Array.isArray(parsedContent.hashtags) ? parsedContent.hashtags : []
      };

    } catch (error) {
      console.error(`Error generating unique content for Day ${request.dayNumber}:`, error);
      return this.generateFallbackUniqueContent(request);
    }
  }

  /**
   * Fallback function to generate unique content when AI service fails
   */
  private static generateFallbackUniqueContent(request: {
    baseProject: string;
    baseContent: string;
    contentDescription: string;
    category: string;
    platform: string;
    contentType: string;
    targetAudience: string;
    dayNumber: number;
    totalDays: number;
  }): {
    title: string;
    description: string;
    content: string;
    hashtags: string[];
  } {
    const dayThemes = {
      fitness: [
        { theme: 'Morning Motivation', emoji: '🌅', focus: 'Starting your day with energy' },
        { theme: 'Workout Wednesday', emoji: '💪', focus: 'Mid-week fitness boost' },
        { theme: 'Nutrition Tips', emoji: '🥗', focus: 'Fueling your body right' },
        { theme: 'Recovery & Rest', emoji: '💤', focus: 'Rest is part of the process' },
        { theme: 'Goal Setting', emoji: '🎯', focus: 'Planning your fitness journey' },
        { theme: 'High Intensity', emoji: '🔥', focus: 'Pushing your limits' },
        { theme: 'Mindful Movement', emoji: '🧘‍♀️', focus: 'Connecting body and mind' },
        { theme: 'Strength Training', emoji: '🏋️‍♂️', focus: 'Building power and muscle' }
      ],
      tech: [
        { theme: 'Tech Tutorial', emoji: '💻', focus: 'Learning new skills' },
        { theme: 'Innovation Spotlight', emoji: '🚀', focus: 'Latest tech breakthroughs' },
        { theme: 'Tool Review', emoji: '🔧', focus: 'Testing new tools' },
        { theme: 'App Feature', emoji: '📱', focus: 'Discovering app capabilities' },
        { theme: 'AI Insights', emoji: '🤖', focus: 'Artificial intelligence trends' },
        { theme: 'Quick Tips', emoji: '⚡', focus: 'Fast tech solutions' },
        { theme: 'Deep Dive', emoji: '🔍', focus: 'In-depth analysis' },
        { theme: 'Future Tech', emoji: '🌟', focus: 'What\'s coming next' }
      ],
      education: [
        { theme: 'Study Tips', emoji: '📚', focus: 'Effective learning strategies' },
        { theme: 'Learning Strategy', emoji: '🎓', focus: 'Planning your education' },
        { theme: 'Note Taking', emoji: '📝', focus: 'Capturing knowledge' },
        { theme: 'Memory Techniques', emoji: '🧠', focus: 'Remembering better' },
        { theme: 'Study Hacks', emoji: '💡', focus: 'Smart learning shortcuts' },
        { theme: 'Focus Methods', emoji: '🎯', focus: 'Concentrating effectively' },
        { theme: 'Reading Tips', emoji: '📖', focus: 'Reading efficiently' },
        { theme: 'Writing Skills', emoji: '✍️', focus: 'Expressing ideas clearly' }
      ],
      business: [
        { theme: 'Business Strategy', emoji: '💼', focus: 'Planning for success' },
        { theme: 'Growth Tips', emoji: '📈', focus: 'Scaling your business' },
        { theme: 'Networking', emoji: '🤝', focus: 'Building connections' },
        { theme: 'Innovation', emoji: '💡', focus: 'Creative problem solving' },
        { theme: 'Analytics', emoji: '📊', focus: 'Data-driven decisions' },
        { theme: 'Goal Setting', emoji: '🎯', focus: 'Defining objectives' },
        { theme: 'Leadership', emoji: '💪', focus: 'Leading teams effectively' },
        { theme: 'Startup Tips', emoji: '🚀', focus: 'Launching new ventures' }
      ],
      lifestyle: [
        { theme: 'Daily Inspiration', emoji: '✨', focus: 'Finding motivation daily' },
        { theme: 'Morning Routine', emoji: '🌅', focus: 'Starting your day right' },
        { theme: 'Evening Wind-down', emoji: '🌙', focus: 'Relaxing and unwinding' },
        { theme: 'Home Life', emoji: '🏠', focus: 'Creating comfort at home' },
        { theme: 'Relationships', emoji: '👥', focus: 'Building connections' },
        { theme: 'Creative Living', emoji: '🎨', focus: 'Expressing creativity' },
        { theme: 'Wellness', emoji: '🌱', focus: 'Holistic health approach' },
        { theme: 'Coffee Culture', emoji: '☕', focus: 'Enjoying life\'s moments' }
      ]
    };

    const categoryThemes = dayThemes[request.category as keyof typeof dayThemes] || dayThemes.lifestyle;
    const themeIndex = (request.dayNumber - 1) % categoryThemes.length;
    const selectedTheme = categoryThemes[themeIndex];

    const title = `${selectedTheme.emoji} Day ${request.dayNumber}: ${selectedTheme.theme} - ${request.baseContent}`;
    const description = `${selectedTheme.focus} for ${request.targetAudience}. ${request.contentDescription}`;
    
    const content = `Welcome to Day ${request.dayNumber} of your ${request.baseProject} journey! 

${selectedTheme.focus} is essential for success in ${request.category}. Today, we're focusing on ${selectedTheme.theme.toLowerCase()} to help you achieve your goals.

Key points to remember:
• Stay consistent with your daily routine
• Track your progress and celebrate small wins
• Connect with others who share your interests
• Take time to reflect on your journey

Remember: Every expert was once a beginner. Keep pushing forward! 💪

What's your biggest challenge today? Share your thoughts in the comments below! 👇`;

    const hashtags = [
      `#${request.category}`,
      `#Day${request.dayNumber}`,
      `#${selectedTheme.theme.replace(/\s+/g, '')}`,
      `#${request.platform}`,
      `#${request.contentType}`,
      `#Motivation`,
      `#Progress`,
      `#Goals`,
      `#Success`,
      `#${request.baseProject.replace(/\s+/g, '')}`,
      `#${request.targetAudience.replace(/\s+/g, '')}`,
      `#Inspiration`
    ];

    return {
      title,
      description,
      content,
      hashtags
    };
  }

  /**
   * Check if the service is properly configured
   */
  static isConfigured(): boolean {
    return hasValidOpenAIKey || hasValidGeminiKey;
  }
}
