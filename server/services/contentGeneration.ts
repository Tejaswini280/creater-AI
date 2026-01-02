import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ContentGenerationRequest {
  contentType: string;
  topic: string;
  targetAudience: string;
  tone: string;
  length: string;
  platforms: string[];
  brandVoice?: string;
}

export interface ContentGenerationResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export class ContentGenerationService {
  /**
   * Generate content using Gemini AI
   */
  static async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    console.log('🤖 Starting content generation with Gemini:', {
      contentType: request.contentType,
      topic: request.topic.substring(0, 50) + '...',
      targetAudience: request.targetAudience,
      tone: request.tone,
      length: request.length,
      platforms: request.platforms,
      hasApiKey: !!GEMINI_API_KEY
    });

    // Validate required fields
    const validation = this.validateRequest(request);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // If no API key, return fallback content
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
      console.warn('⚠️ No valid GEMINI_API_KEY found, using fallback content');
      return this.generateFallbackContent(request);
    }

    try {
      // Try gemini-1.5-flash first (higher quota)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 4096,
        }
      });

      const prompt = this.buildPrompt(request);
      console.log('🤖 Sending prompt to Gemini Flash...');
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log('✅ Gemini response received, length:', responseText.length);
      
      return {
        success: true,
        content: responseText.trim()
      };
    } catch (error: unknown) {
      console.error('❌ Gemini content generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for specific error types
      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        console.log('🔄 Quota exceeded, trying gemini-1.5-pro...');
        
        try {
          const proModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 4096,
            }
          });
          
          const prompt = this.buildPrompt(request);
          const result = await proModel.generateContent(prompt);
          const responseText = result.response.text();
          
          console.log('✅ Gemini Pro response received, length:', responseText.length);
          return {
            success: true,
            content: responseText.trim()
          };
        } catch (proError: unknown) {
          console.error('❌ Gemini Pro also failed:', proError);
        }
      }
      
      console.log('🔄 Falling back to template content');
      return this.generateFallbackContent(request);
    }
  }

  /**
   * Build the prompt for content generation
   */
  private static buildPrompt(request: ContentGenerationRequest): string {
    const { contentType, topic, targetAudience, tone, length, platforms, brandVoice } = request;
    
    const platformsText = platforms.length > 0 ? platforms.join(', ') : 'general';
    const brandVoiceText = brandVoice || 'neutral and professional';
    
    return `You are a professional content creator and copywriter with expertise in ${contentType} creation.

Generate a ${contentType} for the topic: "${topic}"

Content Requirements:
- Target audience: ${targetAudience}
- Tone: ${tone}
- Length: ${length}
- Platforms: ${platformsText}
- Brand voice: ${brandVoiceText}

Content Structure Guidelines:
- Start with a compelling hook that grabs attention immediately
- Use clear, engaging language appropriate for ${targetAudience}
- Structure content with proper flow and transitions
- Include relevant examples or stories when appropriate
- End with a strong call-to-action
- Optimize for ${platformsText} platform(s)

Writing Style:
- Be ${tone} in tone throughout
- Write in ${brandVoiceText} brand voice
- Make it ${length} in length
- Ensure content is ready-to-use without editing
- No placeholder text or TODO items

Generate ONLY the final content - no explanations, no meta-commentary, no formatting instructions. Start directly with the content.`;
  }

  /**
   * Generate fallback content when AI service fails
   */
  private static generateFallbackContent(request: ContentGenerationRequest): ContentGenerationResponse {
    console.log('🔄 Generating fallback content for:', request.contentType);
    
    const { contentType, topic, targetAudience, tone, length, platforms } = request;
    
    const contentTemplates: Record<string, string> = {
      'video script': this.generateVideoScriptFallback(topic, targetAudience, tone, length),
      'blog post': this.generateBlogPostFallback(topic, targetAudience, tone, length),
      'social media post': this.generateSocialPostFallback(topic, targetAudience, tone, platforms),
      'email newsletter': this.generateEmailFallback(topic, targetAudience, tone, length),
      'presentation': this.generatePresentationFallback(topic, targetAudience, tone, length),
      'script': this.generateVideoScriptFallback(topic, targetAudience, tone, length),
      'blog': this.generateBlogPostFallback(topic, targetAudience, tone, length),
      'social': this.generateSocialPostFallback(topic, targetAudience, tone, platforms),
      'email': this.generateEmailFallback(topic, targetAudience, tone, length)
    };
    
    const template = contentTemplates[contentType.toLowerCase()] || 
                    contentTemplates['blog post'];
    
    return {
      success: true,
      content: template
    };
  }

  private static generateVideoScriptFallback(topic: string, audience: string, tone: string, length: string): string {
    return `# Video Script: ${topic}

## Hook (0-5 seconds)
Did you know that ${topic} could completely change how ${audience} approach their daily challenges? Stay tuned because what I'm about to share will transform your perspective.

## Introduction (5-15 seconds)
Hey everyone! Today we're diving deep into ${topic} - something that's been on everyone's mind lately. Whether you're a beginner or already familiar with this space, I guarantee you'll learn something new.

## Main Content
Let me break this down into three key points that every ${audience} should understand:

**Point 1: The Foundation**
${topic} isn't just a trend - it's a fundamental shift that's reshaping entire industries. For ${audience}, this means new opportunities and challenges that require a fresh approach.

**Point 2: Practical Applications**
Here's where it gets interesting. The real-world applications of ${topic} are already impacting how we work, learn, and connect. I've seen firsthand how this affects ${audience} in their daily routines.

**Point 3: Future Implications**
Looking ahead, ${topic} will continue evolving. The ${audience} who adapt early will have a significant advantage in the coming years.

## Call to Action
What's your experience with ${topic}? Drop a comment below and let me know your thoughts. Don't forget to subscribe for more insights like this, and hit that notification bell so you never miss an update.

## Closing
Thanks for watching! Remember, understanding ${topic} is just the first step - the real magic happens when you take action. See you in the next video!

---
*Video Length: ${length}*
*Tone: ${tone}*`;
  }

  private static generateBlogPostFallback(topic: string, audience: string, tone: string, length: string): string {
    return `# The Complete Guide to ${topic}: What Every ${audience} Needs to Know

## Introduction

In today's rapidly evolving landscape, ${topic} has emerged as a game-changing force that no ${audience} can afford to ignore. Whether you're just starting your journey or looking to deepen your understanding, this comprehensive guide will provide you with the insights and strategies you need to succeed.

## Why ${topic} Matters Now More Than Ever

The significance of ${topic} extends far beyond surface-level trends. For ${audience}, understanding this concept is crucial for staying competitive and relevant in an increasingly complex world.

### The Current Landscape

Recent developments have shown that ${topic} is not just a passing phenomenon. Industry leaders and experts consistently highlight its importance, and the data supports this growing emphasis.

### Impact on ${audience}

Specifically for ${audience}, ${topic} presents both opportunities and challenges:

- **Opportunities**: New avenues for growth, innovation, and competitive advantage
- **Challenges**: The need to adapt existing strategies and learn new approaches
- **Long-term Benefits**: Sustainable success and future-proofing your approach

## Key Strategies for Success

### Strategy 1: Foundation Building
Start with a solid understanding of the fundamentals. ${topic} requires a strong foundation before you can implement advanced techniques.

### Strategy 2: Practical Implementation
Theory is important, but practical application is where real results happen. Focus on actionable steps that you can implement immediately.

### Strategy 3: Continuous Learning
The landscape around ${topic} is constantly evolving. Stay updated with the latest developments and be ready to adapt your approach.

## Common Mistakes to Avoid

Many ${audience} make these critical errors when approaching ${topic}:

1. **Rushing the Process**: Taking time to understand the fundamentals is essential
2. **Ignoring Best Practices**: Learn from others who have succeeded in this area
3. **Lack of Consistency**: Success requires sustained effort and commitment

## Looking Forward

As we move into the future, ${topic} will continue to evolve and shape how ${audience} operate. The key is to stay informed, remain adaptable, and always be ready to learn.

## Conclusion

${topic} represents a significant opportunity for ${audience} who are willing to invest the time and effort to understand it properly. By following the strategies outlined in this guide and avoiding common pitfalls, you'll be well-positioned to leverage ${topic} for long-term success.

What's your experience with ${topic}? Share your thoughts and questions in the comments below - I'd love to hear from you and continue this important conversation.

---
*Article Length: ${length}*
*Written in ${tone} tone for ${audience}*`;
  }

  private static generateSocialPostFallback(topic: string, audience: string, tone: string, platforms: string[]): string {
    const platformOptimized = platforms.includes('twitter') || platforms.includes('tiktok');
    
    if (platformOptimized) {
      return `🚀 ${topic} is changing everything for ${audience}!

Here's what you need to know:

✅ It's not just a trend - it's the future
✅ Early adopters are seeing real results
✅ The learning curve is manageable
✅ The ROI speaks for itself

Ready to dive in? 

Drop a 💡 if you want to learn more about ${topic}!

#${topic.replace(/\s+/g, '')} #${audience.replace(/\s+/g, '')} #Innovation #Future`;
    }
    
    return `The future of ${topic} is here, and it's transforming how ${audience} approach their work and life.

I've been exploring this space for months, and the potential is incredible. What started as curiosity has turned into a deep conviction that ${topic} will be essential for anyone serious about staying ahead.

Key insights I've discovered:
• The fundamentals are more accessible than most people think
• Real-world applications are already showing impressive results
• The community around ${topic} is incredibly supportive and knowledgeable
• Early adoption provides significant competitive advantages

For ${audience}, this represents both an opportunity and a responsibility. The opportunity to lead in your field, and the responsibility to stay informed and adaptable.

What's your take on ${topic}? Are you already exploring this space, or are you still on the fence? I'd love to hear your perspective in the comments.

#${topic.replace(/\s+/g, '')} #${audience.replace(/\s+/g, '')} #ProfessionalDevelopment #Innovation`;
  }

  private static generateEmailFallback(topic: string, audience: string, tone: string, length: string): string {
    return `Subject: The ${topic} Revolution: What ${audience} Need to Know Right Now

Dear Subscriber,

I hope this email finds you well and thriving in your endeavors.

Today, I want to share something that's been on my mind lately - ${topic} and its profound impact on ${audience} like yourself.

**Why This Matters to You**

In recent months, I've witnessed a significant shift in how ${topic} is reshaping entire industries. For ${audience}, this isn't just another trend to watch from the sidelines - it's a fundamental change that requires attention and action.

**What I've Learned**

Through extensive research and real-world observation, three key insights have emerged:

1. **Accessibility**: ${topic} is more approachable than many initially believed
2. **Impact**: The effects are already visible across multiple sectors
3. **Timing**: Early adoption provides substantial advantages

**Your Next Steps**

I encourage you to:
- Stay informed about developments in ${topic}
- Consider how it might apply to your specific situation
- Connect with others who are exploring this space
- Take small, experimental steps to gain hands-on experience

**Looking Ahead**

The landscape around ${topic} will continue evolving rapidly. Those who invest time in understanding it now will be best positioned for future opportunities.

I'm committed to keeping you updated on the most important developments. If you have specific questions or topics you'd like me to explore, simply reply to this email - I read every response.

Thank you for being part of this community. Your engagement and curiosity make these conversations meaningful and valuable.

Best regards,
[Your Name]

P.S. What's your current perspective on ${topic}? I'd love to hear your thoughts and experiences.

---
*Email Length: ${length}*
*Tone: ${tone}*
*Audience: ${audience}*`;
  }

  private static generatePresentationFallback(topic: string, audience: string, tone: string, length: string): string {
    return `# Presentation: ${topic} for ${audience}

## Slide 1: Title Slide
**${topic}: A Comprehensive Overview**
*Presented for ${audience}*
*[Date]*

---

## Slide 2: Agenda
1. Introduction and Context
2. Current State of ${topic}
3. Key Opportunities and Challenges
4. Strategic Recommendations
5. Implementation Roadmap
6. Q&A Discussion

---

## Slide 3: Opening Hook
**"The future belongs to those who understand ${topic} today."**

*Why this presentation matters for ${audience}*

---

## Slide 4: Context Setting
### The Current Landscape
- Rapid evolution in the ${topic} space
- Increasing relevance for ${audience}
- Market forces driving adoption
- Competitive implications

---

## Slide 5: Key Statistics
### By the Numbers
- Market growth projections
- Adoption rates among ${audience}
- ROI indicators
- Industry benchmarks

*[Note: Include relevant data and charts]*

---

## Slide 6: Opportunities
### What This Means for ${audience}
✅ **Growth Potential**: New avenues for expansion
✅ **Competitive Advantage**: Early mover benefits
✅ **Efficiency Gains**: Streamlined processes
✅ **Innovation Catalyst**: Creative possibilities

---

## Slide 7: Challenges
### Potential Obstacles
⚠️ **Learning Curve**: Initial investment in education
⚠️ **Resource Requirements**: Time and budget considerations
⚠️ **Change Management**: Organizational adaptation
⚠️ **Risk Factors**: Uncertainty and volatility

---

## Slide 8: Strategic Framework
### Our Recommended Approach
1. **Assessment Phase**: Current state analysis
2. **Planning Phase**: Strategy development
3. **Pilot Phase**: Small-scale implementation
4. **Scale Phase**: Full deployment
5. **Optimization Phase**: Continuous improvement

---

## Slide 9: Implementation Timeline
### 90-Day Action Plan
**Days 1-30**: Foundation and Planning
**Days 31-60**: Pilot Implementation
**Days 61-90**: Evaluation and Scaling

---

## Slide 10: Success Metrics
### How We'll Measure Progress
- Quantitative indicators
- Qualitative assessments
- Milestone achievements
- ROI calculations

---

## Slide 11: Next Steps
### Immediate Actions Required
1. Stakeholder alignment
2. Resource allocation
3. Team formation
4. Timeline confirmation
5. Communication plan

---

## Slide 12: Call to Action
**"The question isn't whether ${topic} will impact ${audience} - it's whether we'll lead or follow."**

*Let's discuss how to move forward together.*

---

## Slide 13: Thank You
**Questions and Discussion**

*Contact Information*
*Follow-up Resources*

---

*Presentation Length: ${length}*
*Tone: ${tone}*
*Target Audience: ${audience}*`;
  }

  /**
   * Validate content generation request
   */
  static validateRequest(request: Partial<ContentGenerationRequest>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.contentType || typeof request.contentType !== 'string' || request.contentType.trim().length === 0) {
      errors.push('Content type is required');
    }

    if (!request.topic || typeof request.topic !== 'string' || request.topic.trim().length === 0) {
      errors.push('Topic is required');
    }

    if (!request.targetAudience || typeof request.targetAudience !== 'string' || request.targetAudience.trim().length === 0) {
      errors.push('Target audience is required');
    }

    if (!request.tone || typeof request.tone !== 'string' || request.tone.trim().length === 0) {
      errors.push('Tone is required');
    }

    if (!request.length || typeof request.length !== 'string' || request.length.trim().length === 0) {
      errors.push('Length is required');
    }

    if (!request.platforms || !Array.isArray(request.platforms)) {
      errors.push('Platforms must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}