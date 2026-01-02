import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Real API keys provided by user - use environment variables with fallbacks
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Check if API keys are properly configured (more lenient validation)
const hasValidOpenAIKey = !!OPENAI_API_KEY && OPENAI_API_KEY.length > 10 && OPENAI_API_KEY.startsWith('sk-');
const hasValidGeminiKey = !!GEMINI_API_KEY && GEMINI_API_KEY.length > 10 && (GEMINI_API_KEY.startsWith('AIza') || GEMINI_API_KEY.includes('placeholder') === false);

// Initialize OpenAI client with real API key
let openai: OpenAI | null = null;
if (hasValidOpenAIKey) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY
  });
  console.log('✅ OpenAI Service - OpenAI initialized with real API key');
} else {
  console.warn('⚠️ OpenAI Service - OpenAI API key not configured or invalid');
}

// Initialize Gemini client with real API key
let genAI: GoogleGenerativeAI | null = null;
if (hasValidGeminiKey) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('✅ OpenAI Service - Gemini AI initialized with real API key');
} else {
  console.warn('⚠️ OpenAI Service - Gemini API key not configured or invalid');
}

export class OpenAIService {
  private static extractIdeasFromText(text: string): string[] {
    if (!text) return [];
    // Try to parse a JSON object with ideas property
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const obj = JSON.parse(text.slice(firstBrace, lastBrace + 1));
        if (Array.isArray(obj?.ideas)) return obj.ideas.map((s: any) => String(s)).filter(Boolean);
      }
    } catch {}
    // Try to parse a raw JSON array
    try {
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const arr = JSON.parse(text.slice(firstBracket, lastBracket + 1));
        if (Array.isArray(arr)) return arr.map((s: any) => String(s)).filter(Boolean);
      }
    } catch {}
    // Fallback: split into lines and clean bullets/numbers
    const lines = text
      .split(/\r?\n|\d+\.|\n-\s|\*\s|•\s|–\s|—\s/g)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 200);
    // Return up to 10 concise lines that look like ideas
    return lines.slice(0, 10);
  }
  static async generateScript(topic: string, platform: string = 'youtube', duration: string = '60 seconds'): Promise<string> {
    console.log('🤖 Generating script for:', topic, 'on', platform);
    console.log('Gemini API Key valid:', hasValidGeminiKey, 'Gemini client:', !!genAI);
    console.log('OpenAI API Key valid:', hasValidOpenAIKey, 'OpenAI client:', !!openai);
    
    // Try Gemini first, then OpenAI as fallback
    if (hasValidGeminiKey && genAI) {
      try {
        console.log('🤖 Trying Gemini for script generation...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `Create an engaging ${platform} script about "${topic}" that should be approximately ${duration} long.

        Requirements:
        - Hook the viewer in the first 3 seconds
        - Include engaging transitions and call-to-actions
        - Make it conversational and energetic
        - Structure it for ${platform === 'youtube' ? 'YouTube Shorts' : platform}
        - Include suggestions for visual elements in [brackets]
        
        Format the response as a complete script with timing cues.`;

        const result = await model.generateContent(prompt);
        console.log('✅ Gemini script generated successfully');
        return result.response.text();
      } catch (geminiError: any) {
        console.warn('❌ Gemini failed, trying OpenAI...', geminiError.message || 'Unknown error');
      }
    }

    // Try OpenAI as fallback
    if (hasValidOpenAIKey && openai) {
      try {
        console.log('🤖 Trying OpenAI for script generation...');
        const prompt = `Create an engaging ${platform} script about "${topic}" that should be approximately ${duration} long.

        Requirements:
        - Hook the viewer in the first 3 seconds
        - Include engaging transitions and call-to-actions
        - Make it conversational and energetic
        - Structure it for ${platform === 'youtube' ? 'YouTube Shorts' : platform}
        - Include suggestions for visual elements in [brackets]
        
        Format the response as a complete script with timing cues.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a professional content creator and script writer specializing in viral social media content. Create engaging, trendy scripts that capture attention and drive engagement."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.8,
        });

        console.log('✅ OpenAI script generated successfully');
        return response.choices[0].message.content || "Failed to generate script";
      } catch (openaiError: any) {
        console.warn('❌ OpenAI also failed:', openaiError.message || 'Unknown error');
      }
    }

    // If both AI services fail, return an explicit error to avoid hardcoded placeholders
    console.warn('⚠️ Both AI services failed for generateScript');
    throw new Error('AI services unavailable for script generation');
  }

  static async generateContentIdeas(niche: string, platform: string = 'youtube'): Promise<string[]> {
    console.log('🤖 Generating content ideas for:', niche, 'on', platform);
    console.log('Gemini API Key valid:', hasValidGeminiKey, 'Gemini client:', !!genAI);
    console.log('OpenAI API Key valid:', hasValidOpenAIKey, 'OpenAI client:', !!openai);
    console.log('Gemini API Key length:', GEMINI_API_KEY?.length);
    console.log('Gemini API Key starts with:', GEMINI_API_KEY?.substring(0, 10) + '...');
    
    // Try Gemini first, then OpenAI as fallback
    if (hasValidGeminiKey && genAI) {
      try {
        console.log('🤖 Trying Gemini for content ideas...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `Generate 10 viral content ideas for the "${niche}" niche on ${platform}.

        Each idea should be:
        - Trending and attention-grabbing
        - Optimized for ${platform}
        - Include specific angle or hook
        - Be actionable and clear
        
        Respond with a JSON array of content idea strings in this format:
        {"ideas": ["idea1", "idea2", "idea3", ...]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = this.extractIdeasFromText(text);
        console.log('✅ Gemini content ideas generated successfully');
        if (parsed.length === 0) throw new Error('Empty ideas from Gemini');
        return parsed;
      } catch (geminiError: any) {
        console.warn('❌ Gemini failed, trying OpenAI...', geminiError.message || 'Unknown error');
      }
    }

    // Try OpenAI as fallback
    if (hasValidOpenAIKey && openai) {
      try {
        console.log('🤖 Trying OpenAI for content ideas...');
        const prompt = `Generate 10 viral content ideas for the "${niche}" niche on ${platform}.

        Each idea should be:
        - Trending and attention-grabbing
        - Optimized for ${platform}
        - Include specific angle or hook
        - Be actionable and clear
        
        Respond with a JSON array of content idea strings.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a viral content strategist. Generate trending content ideas that get millions of views. Respond with JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 800,
          temperature: 0.9,
        });

        console.log('✅ OpenAI content ideas generated successfully');
        const result = JSON.parse(response.choices[0].message.content || "{}");
        return result.ideas || [];
      } catch (openaiError: any) {
        console.warn('❌ OpenAI also failed:', openaiError.message || 'Unknown error');
      }
    }

    // If both AI services fail, return fallback data instead of throwing error
    console.warn('⚠️ Both AI services failed for generateContentIdeas');
    console.log('🔄 Returning fallback content ideas for development');
    
    // Return fallback ideas based on keywords
    const fallbackIdeas = [
      "Top 10 Tips for Beginners",
      "Common Mistakes to Avoid",
      "Step-by-Step Tutorial Guide",
      "Behind the Scenes Content",
      "Q&A Session with Audience",
      "Product Review and Comparison",
      "Industry Trends Analysis",
      "Success Stories and Case Studies",
      "Quick Tips and Tricks",
      "Educational How-To Content"
    ];
    
    return fallbackIdeas;
  }

  static async analyzeNiche(keywords: string[]): Promise<{
    profitability: 'low' | 'medium' | 'high';
    difficulty: 'easy' | 'medium' | 'hard';
    trendScore: number;
    opportunities: string[];
  }> {
    console.log('🤖 OpenAIService.analyzeNiche called with keywords:', keywords);
    console.log('🔑 Gemini API Key valid:', hasValidGeminiKey, 'Gemini client:', !!genAI);
    console.log('🔑 OpenAI API Key valid:', hasValidOpenAIKey, 'OpenAI client:', !!openai);
    
    const prompt = `Analyze this niche based on keywords: ${keywords.join(', ')}

    Evaluate:
    1. Profitability potential (low/medium/high)
    2. Competition difficulty (easy/medium/hard)  
    3. Trend score (1-100)
    4. Top 5 content opportunities

    Respond with JSON in this format:
    {
      "profitability": "medium",
      "difficulty": "easy", 
      "trendScore": 75,
      "opportunities": ["opportunity1", "opportunity2", ...]
    }`;

    // Try Gemini first
    if (hasValidGeminiKey && genAI) {
      try {
        console.log('🚀 Making Gemini API call for niche analysis...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Try to parse JSON from Gemini response
        try {
          const parsed = JSON.parse(text);
          console.log('✅ Gemini niche analysis successful:', parsed);
          return parsed;
        } catch (parseError) {
          // If JSON parsing fails, try to extract data manually
          console.warn('⚠️ Gemini response not valid JSON, trying OpenAI...');
        }
      } catch (geminiError) {
        console.warn('❌ Gemini failed for niche analysis, trying OpenAI...', geminiError);
      }
    }

    // Try OpenAI as fallback
    if (hasValidOpenAIKey && openai) {
      try {
        console.log('🚀 Making OpenAI API call for niche analysis...');
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a market research expert specializing in content creator niches. Provide data-driven analysis."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 500,
          temperature: 0.3,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        console.log('✅ OpenAI niche analysis successful:', result);
        return result;
      } catch (error) {
        console.error("❌ Error analyzing niche with OpenAI:", error);
      }
    }

    // Fallback if both services fail
    console.log('🔄 Returning fallback analysis due to both AI services failing');
    return {
      profitability: 'medium',
      difficulty: 'medium',
      trendScore: 50,
      opportunities: ["General content opportunities", "Educational content", "Entertainment content"]
    };
  }

  static async enhancePrompt(originalPrompt: string): Promise<string> {
    console.log('🤖 Enhancing video prompt:', originalPrompt.substring(0, 100) + '...');
    console.log('Gemini API Key valid:', hasValidGeminiKey, 'Gemini client:', !!genAI);
    console.log('OpenAI API Key valid:', hasValidOpenAIKey, 'OpenAI client:', !!openai);

    const prompt = `Enhance this video generation prompt to be more effective and engaging:

Original prompt: "${originalPrompt}"

Please improve this prompt by:
1. Making it more specific and detailed
2. Adding descriptive elements that will improve AI video generation quality
3. Including visual style suggestions
4. Adding technical specifications (resolution, aspect ratio, etc.)
5. Making it more creative and compelling
6. Ensuring it's optimized for the best possible AI video output

Return only the enhanced prompt text, nothing else. Make it comprehensive but concise.`;

    // Try Gemini first, then OpenAI as fallback
    if (hasValidGeminiKey && genAI) {
      try {
        console.log('🤖 Trying Gemini for prompt enhancement...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(prompt);
        console.log('✅ Gemini prompt enhancement successful');
        return result.response.text().trim() || originalPrompt;
      } catch (geminiError: any) {
        console.warn('❌ Gemini failed for prompt enhancement, trying OpenAI...', geminiError.message || 'Unknown error');
      }
    }

    // Try OpenAI as fallback
    if (hasValidOpenAIKey && openai) {
      try {
        console.log('🤖 Trying OpenAI for prompt enhancement...');
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a professional AI video prompt engineer. Your task is to enhance video generation prompts to produce the highest quality AI-generated videos. Focus on specificity, visual details, technical parameters, and creative elements."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });

        console.log('✅ OpenAI prompt enhancement successful');
        return response.choices[0].message.content?.trim() || originalPrompt;
      } catch (openaiError: any) {
        console.warn('❌ OpenAI also failed for prompt enhancement:', openaiError.message || 'Unknown error');
      }
    }

    // If both AI services fail, return original prompt with a simple enhancement
    console.warn('⚠️ Both AI services failed for prompt enhancement, returning simple enhancement');
    return `Enhanced: ${originalPrompt} - High quality, cinematic, 4K resolution, professional production, engaging visuals, smooth motion, vibrant colors`;
  }

  static async generateThumbnailIdeas(title: string): Promise<string[]> {
    console.log('🤖 Generating thumbnail ideas for:', title);
    console.log('Gemini API Key valid:', hasValidGeminiKey, 'Gemini client:', !!genAI);
    console.log('OpenAI API Key valid:', hasValidOpenAIKey, 'OpenAI client:', !!openai);

    const prompt = `Generate 5 compelling thumbnail ideas for a video titled: "${title}"

    Each idea should describe:
    - Visual elements and composition
    - Text overlay suggestions
    - Color scheme recommendations
    - Facial expressions or emotions to convey

    Respond with JSON array of thumbnail description strings.`;

    // Try Gemini first
    if (hasValidGeminiKey && genAI) {
      try {
        console.log('🤖 Trying Gemini for thumbnail ideas...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Try to parse JSON from response
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            console.log('✅ Gemini thumbnail ideas generated successfully');
            return parsed;
          } else if (parsed.ideas && Array.isArray(parsed.ideas)) {
            console.log('✅ Gemini thumbnail ideas generated successfully');
            return parsed.ideas;
          }
        } catch (parseError) {
          console.warn('⚠️ Gemini response not valid JSON, trying OpenAI...');
        }
      } catch (geminiError) {
        console.warn('❌ Gemini failed for thumbnail ideas, trying OpenAI...', geminiError);
      }
    }

    // Try OpenAI as fallback
    if (hasValidOpenAIKey && openai) {
      try {
        console.log('🤖 Trying OpenAI for thumbnail ideas...');
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a thumbnail designer expert. Create descriptions for high-CTR thumbnails. Respond with JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 600,
          temperature: 0.8,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        console.log('✅ OpenAI thumbnail ideas generated successfully');
        return result.ideas || [];
      } catch (error) {
        console.error("❌ Error generating thumbnail ideas with OpenAI:", error);
      }
    }

    // Return fallback ideas if both services fail
    console.log('🔄 Returning fallback thumbnail ideas');
    return ["Bright colors with bold text overlay", "Split screen comparison design", "Reaction face with arrow pointing"];
  }
}
