import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export class CleanGeminiService {
  private static model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  });

  static async generateWithGemini(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      return text.trim();
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw error;
    }
  }

  // Instagram Content Generation
  static async generateInstagramContent(topic: string): Promise<string> {
    const prompt = `You are a professional social media content creator.

Generate a FINAL, READY-TO-POST Instagram script.

Topic: ${topic}
Platform: Instagram
Duration: About 30 seconds when spoken
Tone: Conversational and friendly
Audience: Beginners

Rules:
- Output ONLY the final Instagram script
- Do NOT include headings, explanations, bullet points, or meta text
- Do NOT include phrases like "Key Points", "Tips", "Here is"
- Do NOT mention AI, prompts, API keys, or configuration
- Use emojis naturally
- End with a clear call to action
- Include relevant hashtags at the end

Return only the final script text.`;

    return await this.generateWithGemini(prompt);
  }

  // YouTube Content Generation
  static async generateYouTubeContent(topic: string, duration: string = "60 seconds"): Promise<string> {
    const prompt = `You are a professional YouTube content creator.

Generate a FINAL, READY-TO-USE YouTube script.

Topic: ${topic}
Duration: ${duration}
Platform: YouTube
Tone: Engaging and informative
Audience: General audience

Rules:
- Output ONLY the final YouTube script
- Include a strong hook in the first 5 seconds
- Structure with clear beginning, middle, and end
- Include natural transitions
- End with subscribe call-to-action
- Do NOT include meta text, explanations, or instructions
- Make it conversational and engaging

Return only the final script text.`;

    return await this.generateWithGemini(prompt);
  }

  // TikTok Content Generation
  static async generateTikTokContent(topic: string): Promise<string> {
    const prompt = `You are a professional TikTok content creator.

Generate a FINAL, READY-TO-POST TikTok script.

Topic: ${topic}
Platform: TikTok
Duration: 15-30 seconds
Tone: Energetic and trendy
Audience: Gen Z and Millennials

Rules:
- Output ONLY the final TikTok script
- Start with an attention-grabbing hook
- Use trending language and phrases
- Include natural pauses for visual elements
- End with engagement call-to-action
- Do NOT include explanations or meta text
- Make it punchy and fast-paced

Return only the final script text.`;

    return await this.generateWithGemini(prompt);
  }

  // Content Ideas Generation
  static async generateContentIdeas(niche: string, platform: string, count: number = 5): Promise<string[]> {
    const prompt = `Generate ${count} viral content ideas for ${niche} on ${platform}.

Rules:
- Return ONLY a simple list of content ideas
- Each idea should be one clear, actionable title
- Make them engaging and click-worthy
- No explanations, no meta text
- No numbering or bullet points
- Just the raw ideas, one per line

Format: Just list the ideas separated by newlines.`;

    const result = await this.generateWithGemini(prompt);
    return result.split('\n').filter(line => line.trim().length > 0).slice(0, count);
  }

  // Thumbnail Ideas Generation
  static async generateThumbnailIdeas(title: string): Promise<string[]> {
    const prompt = `Generate 3 compelling thumbnail concepts for: "${title}"

Rules:
- Return ONLY thumbnail descriptions
- Each description should be one clear sentence
- Focus on visual elements, colors, and composition
- No explanations or meta text
- Make them click-worthy and attention-grabbing

Format: Just list the concepts separated by newlines.`;

    const result = await this.generateWithGemini(prompt);
    return result.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
  }

  // Hashtag Generation
  static async generateHashtags(content: string, platform: string): Promise<string[]> {
    const prompt = `Generate relevant hashtags for this ${platform} content: "${content.substring(0, 200)}"

Rules:
- Return ONLY hashtags
- Include # symbol
- Mix popular and niche hashtags
- Maximum 10 hashtags
- No explanations or meta text

Format: Just list hashtags separated by spaces.`;

    const result = await this.generateWithGemini(prompt);
    return result.split(/\s+/).filter(tag => tag.startsWith('#')).slice(0, 10);
  }

  // Caption Generation
  static async generateCaption(topic: string, platform: string): Promise<string> {
    const prompt = `Write a compelling ${platform} caption for: ${topic}

Rules:
- Output ONLY the final caption
- Make it engaging and platform-appropriate
- Include relevant emojis naturally
- End with call-to-action
- No meta text or explanations

Return only the caption text.`;

    return await this.generateWithGemini(prompt);
  }
}