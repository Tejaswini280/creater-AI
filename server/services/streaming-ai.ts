import { OpenAIService } from './openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API keys from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Check if API keys are properly configured
const hasValidGeminiKey = !!GEMINI_API_KEY && GEMINI_API_KEY.length > 10 && (GEMINI_API_KEY.startsWith('AIza') || GEMINI_API_KEY.includes('placeholder') === false);
const hasValidOpenAIKey = !!OPENAI_API_KEY && OPENAI_API_KEY.length > 10 && OPENAI_API_KEY.startsWith('sk-');

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;
if (hasValidGeminiKey) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('✅ StreamingAI - Gemini initialized with real API key');
} else {
  console.warn('⚠️ StreamingAI - Gemini API key not configured or invalid');
}

export interface StreamingOptions {
  model?: 'gemini' | 'openai';
  temperature?: number;
  maxTokens?: number;
  streamSpeed?: 'slow' | 'normal' | 'fast';
}

export interface StreamingResult {
  content: string;
  streamData: {
    chunks: string[];
    timing: number[];
  };
  metadata: {
    model: string;
    tokensUsed: number;
    responseTime: number;
    streamSpeed: string;
  };
}

export class StreamingAIService {
  static async generateStreamingContent(
    prompt: string, 
    options: StreamingOptions = {}
  ): Promise<StreamingResult> {
    const startTime = Date.now();
    
    // Default options
    const {
      model = 'gemini',
      temperature = 0.7,
      maxTokens = 1000,
      streamSpeed = 'normal'
    } = options;

    console.log('🤖 StreamingAIService generating content with model:', model);

    try {
      // For now, we'll try Gemini first, then fallback to OpenAI service
      let content: string;
      
      // Try direct Gemini API call first for better performance
      if (hasValidGeminiKey && genAI && model === 'gemini') {
        try {
          console.log('🤖 Using direct Gemini API for streaming content...');
          const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await geminiModel.generateContent(prompt);
          content = result.response.text();
          console.log('✅ Direct Gemini API successful');
        } catch (geminiError) {
          console.warn('❌ Direct Gemini failed, falling back to OpenAI service...', geminiError);
          // Fall back to OpenAI service methods
          content = await this.generateContentViaOpenAIService(prompt);
        }
      } else {
        // Use OpenAI service methods as fallback
        content = await this.generateContentViaOpenAIService(prompt);
      }

      // Simulate streaming chunks
      const chunks = this.simulateStreamingChunks(content, streamSpeed);
      const timing = this.generateStreamingTiming(chunks.length, streamSpeed);
      
      const responseTime = Date.now() - startTime;
      
      return {
        content,
        streamData: {
          chunks,
          timing
        },
        metadata: {
          model: hasValidGeminiKey && genAI && model === 'gemini' ? 'gemini' : 'openai-service',
          tokensUsed: Math.floor(content.length / 4), // Rough token estimate
          responseTime,
          streamSpeed
        }
      };
    } catch (error) {
      console.error('StreamingAIService error:', error);
      
      // Return fallback content on error
      const fallbackContent = this.generateFallbackContent(prompt);
      const chunks = this.simulateStreamingChunks(fallbackContent, streamSpeed);
      const timing = this.generateStreamingTiming(chunks.length, streamSpeed);
      const responseTime = Date.now() - startTime;
      
      return {
        content: fallbackContent,
        streamData: {
          chunks,
          timing
        },
        metadata: {
          model: 'fallback',
          tokensUsed: Math.floor(fallbackContent.length / 4),
          responseTime,
          streamSpeed
        }
      };
    }
  }

  private static extractTopicFromPrompt(prompt: string): string {
    // Extract topic from prompts like "Create a script about X"
    const topicMatch = prompt.match(/about\s+"([^"]+)"/i) || 
                     prompt.match(/about\s+([^.]+)/i) ||
                     prompt.match(/topic[:\s]+([^.]+)/i);
    
    return topicMatch ? topicMatch[1].trim() : 'general content';
  }

  private static extractPlatformFromPrompt(prompt: string): string | null {
    const platforms = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'linkedin'];
    const lowerPrompt = prompt.toLowerCase();
    
    for (const platform of platforms) {
      if (lowerPrompt.includes(platform)) {
        return platform;
      }
    }
    
    return null;
  }

  private static extractDurationFromPrompt(prompt: string): string | null {
    const durationMatch = prompt.match(/(\d+)\s*(second|minute|min)s?/i);
    return durationMatch ? `${durationMatch[1]} ${durationMatch[2]}s` : null;
  }

  private static extractNicheFromPrompt(prompt: string): string {
    // Extract niche from prompts
    const nicheMatch = prompt.match(/for\s+([^.]+)\s+niche/i) ||
                      prompt.match(/about\s+([^.]+)/i) ||
                      prompt.match(/niche[:\s]+([^.]+)/i);
    
    return nicheMatch ? nicheMatch[1].trim() : 'general';
  }

  private static formatIdeasAsContent(ideas: string[], niche: string, platform: string): string {
    return `# Content Ideas for ${niche} on ${platform}

Here are some engaging content ideas for your ${niche} niche:

${ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n')}

These ideas are designed to:
- Capture attention in the first few seconds
- Provide value to your audience
- Encourage engagement and sharing
- Align with current trends on ${platform}

Remember to adapt each idea to your unique voice and style!`;
  }

  private static generateFallbackContent(prompt: string): string {
    return `# AI-Generated Content

Based on your prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"

Here's some engaging content tailored to your needs:

## Key Points:
- Attention-grabbing opening that hooks your audience
- Clear structure with valuable information
- Engaging storytelling elements
- Strong call-to-action to drive engagement

## Content Structure:
1. **Hook** - Start with a compelling question or statement
2. **Value** - Provide useful information or entertainment
3. **Engagement** - Encourage interaction with your audience
4. **Action** - Clear next steps for your viewers

## Tips for Success:
- Keep your content authentic and true to your brand
- Use trending hashtags and keywords
- Post at optimal times for your audience
- Engage with comments and build community

This content is optimized for maximum engagement and reach across social media platforms.

*Note: For full AI capabilities, please configure your OpenAI and Gemini API keys in the environment settings.*`;
  }

  private static simulateStreamingChunks(content: string, speed: string): string[] {
    const words = content.split(' ');
    const chunkSize = speed === 'fast' ? 8 : speed === 'slow' ? 2 : 4;
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
    }
    
    return chunks;
  }

  private static generateStreamingTiming(chunkCount: number, speed: string): number[] {
    const baseDelay = speed === 'fast' ? 50 : speed === 'slow' ? 200 : 100;
    const timing: number[] = [];
    
    for (let i = 0; i < chunkCount; i++) {
      timing.push(baseDelay + Math.random() * 50);
    }
    
    return timing;
  }

  private static async generateContentViaOpenAIService(prompt: string): Promise<string> {
    if (prompt.toLowerCase().includes('script')) {
      // Use script generation for script-related prompts
      const topic = this.extractTopicFromPrompt(prompt);
      const platform = this.extractPlatformFromPrompt(prompt) || 'youtube';
      const duration = this.extractDurationFromPrompt(prompt) || '60 seconds';
      
      return await OpenAIService.generateScript(topic, platform, duration);
    } else if (prompt.toLowerCase().includes('content ideas') || prompt.toLowerCase().includes('ideas')) {
      // Use content ideas generation
      const niche = this.extractNicheFromPrompt(prompt);
      const platform = this.extractPlatformFromPrompt(prompt) || 'youtube';
      
      const ideas = await OpenAIService.generateContentIdeas(niche, platform);
      return this.formatIdeasAsContent(ideas, niche, platform);
    } else {
      // For other prompts, create a fallback response
      return this.generateFallbackContent(prompt);
    }
  }
}