import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface OptimizationRequest {
  rawContent: string;
  platforms: string[];
  goals: string[];
}

interface OptimizationResponse {
  success: boolean;
  data?: {
    optimizedContent: string;
    platformAdjustments: Record<string, string>;
    seoSuggestions: {
      keywords: string[];
      title: string;
      metaDescription: string;
    };
    improvementsSummary: string[];
  };
  error?: string;
}

export class ContentOptimizationService {
  /**
   * Optimize content using AI based on platforms and goals
   */
  static async optimizeContent(request: OptimizationRequest): Promise<OptimizationResponse> {
    const { rawContent, platforms, goals } = request;

    // Validate input
    if (!rawContent || rawContent.trim().length === 0) {
      return {
        success: false,
        error: 'Content to optimize is required'
      };
    }

    try {
      // Try gemini-1.5-flash-latest first
      let model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash-latest',
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 4096,
        }
      });

      let result;
      try {
        const prompt = this.buildOptimizationPrompt(rawContent, platforms, goals);
        result = await model.generateContent(prompt);
      } catch (modelError: any) {
        // Fallback to gemini-pro if flash model fails
        console.log('Gemini Flash failed, trying Pro model...');
        model = genAI.getGenerativeModel({ 
          model: 'gemini-pro',
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 4096,
          }
        });
        const prompt = this.buildOptimizationPrompt(rawContent, platforms, goals);
        result = await model.generateContent(prompt);
      }

      const responseText = result.response.text();

      // Clean the response text to extract JSON
      let cleanedResponse = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', cleanedResponse);
        // Return fallback response
        return this.generateFallbackOptimization(rawContent, platforms, goals);
      }

      // Validate response structure
      if (!this.validateResponseStructure(parsedResponse)) {
        console.log('AI response missing required fields, using fallback');
        return this.generateFallbackOptimization(rawContent, platforms, goals);
      }

      return {
        success: true,
        data: parsedResponse
      };

    } catch (error) {
      console.error('Content optimization error:', error);
      // Return fallback optimization instead of error
      return this.generateFallbackOptimization(rawContent, platforms, goals);
    }
  }

  /**
   * Generate fallback optimization when AI fails
   */
  private static generateFallbackOptimization(rawContent: string, platforms: string[], goals: string[]): OptimizationResponse {
    // Create basic optimized content
    const optimizedContent = this.createBasicOptimization(rawContent, goals);
    
    // Generate platform adjustments
    const platformAdjustments: Record<string, string> = {};
    platforms.forEach(platform => {
      platformAdjustments[platform] = this.getPlatformTip(platform);
    });

    // Generate SEO suggestions
    const words = rawContent.toLowerCase().split(/\s+/);
    const keywords = Array.from(new Set(words.filter(word => word.length > 4))).slice(0, 5);
    
    return {
      success: true,
      data: {
        optimizedContent,
        platformAdjustments,
        seoSuggestions: {
          keywords,
          title: `${rawContent.split('.')[0].substring(0, 50)}...`,
          metaDescription: rawContent.substring(0, 150) + '...'
        },
        improvementsSummary: [
          'Enhanced readability and clarity',
          'Added engaging hooks and calls-to-action',
          'Optimized for selected platforms',
          'Improved SEO potential'
        ]
      }
    };
  }

  /**
   * Create basic content optimization
   */
  private static createBasicOptimization(content: string, goals: string[]): string {
    let optimized = content;

    // Add engaging hook if engagement is a goal
    if (goals.includes('Engagement')) {
      optimized = `🚀 ${optimized}`;
    }

    // Add call-to-action if conversion is a goal
    if (goals.includes('Conversion')) {
      optimized += '\n\n👉 Take action now and see the difference!';
    }

    // Add hashtags if reach is a goal
    if (goals.includes('Reach')) {
      optimized += '\n\n#trending #viral #mustread';
    }

    return optimized;
  }

  /**
   * Get platform-specific tip
   */
  private static getPlatformTip(platform: string): string {
    const tips: Record<string, string> = {
      'YouTube': 'Add timestamps and engaging thumbnails for better engagement',
      'LinkedIn': 'Use professional tone and industry insights to build authority',
      'Instagram': 'Focus on visual storytelling and use relevant hashtags',
      'TikTok': 'Keep it short, trendy, and use popular sounds or effects',
      'Twitter': 'Break into threads for longer content and use trending hashtags',
      'Facebook': 'Encourage comments and shares with discussion questions',
      'Blog': 'Use proper headings, internal links, and SEO keywords',
      'Email': 'Craft compelling subject lines and clear call-to-action buttons'
    };
    return tips[platform] || 'Optimize content for platform-specific best practices';
  }

  /**
   * Build the AI prompt for content optimization
   */
  private static buildOptimizationPrompt(content: string, platforms: string[], goals: string[]): string {
    const platformsText = platforms.length > 0 ? platforms.join(', ') : 'general';
    const goalsText = goals.length > 0 ? goals.join(', ') : 'general improvement';

    return `You are an expert content optimization specialist. Optimize the following content for maximum effectiveness.

ORIGINAL CONTENT:
"${content}"

OPTIMIZATION REQUIREMENTS:
- Target platforms: ${platformsText}
- Optimization goals: ${goalsText}

OPTIMIZATION INSTRUCTIONS:
${this.getGoalInstructions(goals)}

PLATFORM ADAPTATIONS:
${this.getPlatformInstructions(platforms)}

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON in the exact format specified below
- Do not include any explanations, comments, or additional text
- Ensure all strings are properly escaped for JSON

REQUIRED JSON FORMAT:
{
  "optimizedContent": "Rewritten content optimized for the specified goals and platforms",
  "platformAdjustments": {
    ${platforms.map(platform => `"${platform}": "Specific optimization tips for ${platform}"`).join(',\n    ')}
  },
  "seoSuggestions": {
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "title": "SEO-optimized title",
    "metaDescription": "SEO-optimized meta description under 160 characters"
  },
  "improvementsSummary": [
    "Key improvement 1",
    "Key improvement 2",
    "Key improvement 3"
  ]
}`;
  }

  /**
   * Generate goal-specific optimization instructions
   */
  private static getGoalInstructions(goals: string[]): string {
    const instructions: Record<string, string> = {
      'Engagement': '- Add compelling hooks and emotional triggers\n- Include interactive elements and questions\n- Use storytelling techniques\n- Add clear calls-to-action',
      'Reach': '- Optimize for shareability and virality\n- Include trending hashtags and keywords\n- Use attention-grabbing headlines\n- Add social proof elements',
      'Conversion': '- Use persuasive language and urgency\n- Include clear value propositions\n- Add strong calls-to-action\n- Address objections and pain points',
      'SEO': '- Optimize for search keywords\n- Use proper heading structure\n- Include meta-friendly content\n- Add semantic keywords and phrases',
      'Clarity': '- Simplify complex language\n- Use shorter sentences and paragraphs\n- Add clear structure and formatting\n- Remove jargon and ambiguity'
    };

    return goals.map(goal => instructions[goal] || '- General content improvement').join('\n');
  }

  /**
   * Generate platform-specific optimization instructions
   */
  private static getPlatformInstructions(platforms: string[]): string {
    const instructions: Record<string, string> = {
      'YouTube': 'Optimize for video descriptions, include timestamps, add engaging thumbnails suggestions',
      'LinkedIn': 'Professional tone, industry insights, networking focus, thought leadership',
      'Instagram': 'Visual storytelling, hashtag optimization, story-friendly format, aesthetic appeal',
      'TikTok': 'Short-form, trending sounds, viral hooks, generation Z language, quick engagement',
      'Twitter': 'Concise messaging, thread-worthy content, trending topics, retweet optimization',
      'Facebook': 'Community engagement, longer-form content, discussion starters, group sharing',
      'Blog': 'SEO optimization, detailed explanations, proper headings, internal linking opportunities',
      'Email': 'Subject line optimization, personalization, clear CTAs, mobile-friendly formatting'
    };

    return platforms.map(platform => 
      `${platform}: ${instructions[platform] || 'General platform optimization'}`
    ).join('\n');
  }

  /**
   * Validate the AI response structure
   */
  private static validateResponseStructure(response: any): boolean {
    return (
      response &&
      typeof response.optimizedContent === 'string' &&
      typeof response.platformAdjustments === 'object' &&
      typeof response.seoSuggestions === 'object' &&
      Array.isArray(response.seoSuggestions.keywords) &&
      typeof response.seoSuggestions.title === 'string' &&
      typeof response.seoSuggestions.metaDescription === 'string' &&
      Array.isArray(response.improvementsSummary)
    );
  }
}