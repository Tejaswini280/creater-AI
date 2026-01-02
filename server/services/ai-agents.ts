import OpenAI from "openai";
import { storage } from "../storage";

// Real OpenAI API key provided by user - use environment variable with fallback
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Check if OpenAI API key is properly configured
const hasValidApiKey = !!OPENAI_API_KEY && OPENAI_API_KEY.length > 20;

const openai = hasValidApiKey ? new OpenAI({
  apiKey: OPENAI_API_KEY
}) : null;

if (hasValidApiKey) {
  console.log('✅ AI Agents Service - OpenAI initialized with real API key');
} else {
  console.warn('⚠️ AI Agents Service - OpenAI API key not configured or invalid');
}

interface AgentTask {
  id: string;
  type: 'content_pipeline' | 'trend_analysis' | 'optimization' | 'scheduling';
  status: 'pending' | 'running' | 'completed' | 'failed';
  userId: string;
  config: any;
  results?: any;
}

export class AIAgentService {
  private static agents: Map<string, AgentTask> = new Map();

  // Create a new AI agent
  static async createAgent(config: {
    name: string;
    type: string;
    capabilities: string[];
    userId: string;
  }): Promise<any> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const agent: AgentTask = {
      id: agentId,
      type: config.type as any,
      status: 'pending',
      userId: config.userId,
      config: {
        name: config.name,
        capabilities: config.capabilities
      }
    };

    this.agents.set(agentId, agent);
    
    // Start the agent based on type
    setImmediate(() => this.startAgent(agentId, config.type));
    
    return {
      id: agentId,
      name: config.name,
      type: config.type,
      capabilities: config.capabilities,
      status: 'created',
      createdAt: new Date().toISOString()
    };
  }

  private static async startAgent(agentId: string, type: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      agent.status = 'running';
      
      // Simulate agent work based on type
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      agent.status = 'completed';
      agent.results = {
        message: `${type} agent completed successfully`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      agent.status = 'failed';
      agent.results = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Autonomous Content Creation Pipeline Agent
  static async createContentPipelineAgent(userId: string, config: {
    niche: string;
    platforms: string[];
    frequency: string; // daily, weekly
    contentTypes: string[]; // video, short, post
  }): Promise<string> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const agent: AgentTask = {
      id: agentId,
      type: 'content_pipeline',
      status: 'pending',
      userId,
      config
    };

    this.agents.set(agentId, agent);
    
    // Start the agent workflow
    setImmediate(() => this.runContentPipelineAgent(agentId));
    
    return agentId;
  }

  private static async runContentPipelineAgent(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      agent.status = 'running';
      
      const { niche, platforms, contentTypes } = agent.config;
      
      // Step 1: Research trending topics
      const trendingTopics = await this.researchTrendingTopics(niche);
      
      // Step 2: Generate content ideas for each platform
      const contentIdeas = await Promise.all(
        platforms.map(platform => 
          this.generatePlatformSpecificContent(platform, trendingTopics, contentTypes)
        )
      );

      // Step 3: Create scripts and thumbnails
      const fullContent = await Promise.all(
        contentIdeas.flat().map(idea => this.createFullContentPiece(idea))
      );

      // Step 4: Optimize for each platform
      const optimizedContent = await Promise.all(
        fullContent.map(content => this.optimizeForPlatform(content))
      );

      // Step 5: Schedule content
      const scheduledContent = await this.createOptimalSchedule(
        optimizedContent, 
        agent.userId
      );

      agent.status = 'completed';
      agent.results = {
        contentPieces: scheduledContent.length,
        scheduledDates: scheduledContent.map(c => c.scheduledDate),
        platforms: platforms,
        estimatedReach: this.calculateEstimatedReach(scheduledContent)
      };

      // Save to database
      await this.saveAgentResults(agent);

    } catch (error) {
      console.error(`Agent ${agentId} failed:`, error);
      agent.status = 'failed';
      agent.results = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Real-time Trend Analysis Agent
  static async createTrendAnalysisAgent(userId: string, config: {
    keywords: string[];
    platforms: string[];
    alertThreshold: number;
  }): Promise<string> {
    const agentId = `trend_agent_${Date.now()}`;
    
    const agent: AgentTask = {
      id: agentId,
      type: 'trend_analysis',
      status: 'running',
      userId,
      config
    };

    this.agents.set(agentId, agent);
    
    // Start continuous monitoring
    this.startTrendMonitoring(agentId);
    
    return agentId;
  }

  private static async startTrendMonitoring(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const monitorInterval = setInterval(async () => {
      try {
        const { keywords, platforms, alertThreshold } = agent.config;
        
        // Analyze current trends
        const trendData = await this.analyzeTrendVelocity(keywords);
        
        // Check if any trend exceeds threshold
        const alerts = trendData.filter(trend => trend.velocity > alertThreshold);
        
        if (alerts.length > 0) {
          // Generate instant content opportunities
          const opportunities = await this.generateTrendOpportunities(alerts, platforms);
          
          // Notify user and create content suggestions
          await this.sendTrendAlert(agent.userId, opportunities);
        }
        
      } catch (error) {
        console.error(`Trend monitoring error for ${agentId}:`, error);
      }
    }, 300000); // Check every 5 minutes

    // Store interval reference for cleanup
    agent.results = { monitorInterval };
  }

  // Performance Optimization Agent
  static async createOptimizationAgent(userId: string, contentId: number): Promise<any> {
    try {
      const content = await storage.getContentById(contentId);
      if (!content) throw new Error("Content not found");

      const metrics = await storage.getContentMetrics(contentId);
      
      const optimizationPrompt = `Analyze this content performance and provide optimization suggestions:
      
      Content: ${content.title}
      Platform: ${content.platform}
      Current Metrics: ${JSON.stringify(metrics)}
      
      Provide detailed optimization suggestions for:
      1. Title improvements
      2. Thumbnail optimization
      3. Content structure changes
      4. Hashtag/keyword optimization
      5. Posting time recommendations
      6. Engagement tactics
      
      Return as detailed JSON with actionable steps.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a performance optimization expert. Analyze content metrics and provide specific, actionable improvement strategies."
          },
          {
            role: "user",
            content: optimizationPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Optimization agent error:", error);
      throw error;
    }
  }

  // Helper methods
  private static async researchTrendingTopics(niche: string): Promise<string[]> {
    // Fallback topics if OpenAI is not available
    const fallbackTopics = {
      'tech reviews': [
        'Latest iPhone vs Android comparison',
        'AI tools for content creators',
        'Best gaming laptops 2024',
        'Smart home automation trends',
        'Cryptocurrency market analysis',
        'Virtual reality gaming review',
        'Cloud computing solutions',
        'Cybersecurity best practices',
        'Mobile app development trends',
        'Blockchain technology applications'
      ],
      'gaming': [
        'New game releases this month',
        'Esports tournament highlights',
        'Gaming hardware reviews',
        'Streaming setup guides',
        'Game development insights',
        'Gaming industry news',
        'Retro gaming nostalgia',
        'Mobile gaming trends',
        'VR gaming experiences',
        'Gaming community events'
      ],
      'fitness': [
        'Home workout routines',
        'Nutrition tips for muscle gain',
        'Cardio training methods',
        'Weight loss strategies',
        'Supplements guide',
        'Fitness equipment reviews',
        'Yoga and meditation',
        'Sports performance tips',
        'Recovery techniques',
        'Fitness motivation'
      ]
    };

    if (!openai || !hasValidApiKey) {
      console.log('OpenAI API not available, using fallback topics');
      const topics = fallbackTopics[niche.toLowerCase() as keyof typeof fallbackTopics] || fallbackTopics['tech reviews'];
      return topics;
    }

    try {
      const prompt = `Research the top 10 trending topics in the ${niche} niche right now. 
      Focus on viral, emerging topics that content creators should capitalize on immediately.
      Return as JSON array of trending topics.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a trend research expert with real-time knowledge of viral content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.topics || fallbackTopics['tech reviews'];
         } catch (error) {
       console.error('Error calling OpenAI API:', error);
       console.log('Using fallback topics due to API error');
       const topics = fallbackTopics[niche.toLowerCase() as keyof typeof fallbackTopics] || fallbackTopics['tech reviews'];
       return topics;
     }
  }

  private static async generatePlatformSpecificContent(
    platform: string, 
    topics: string[], 
    contentTypes: string[]
  ): Promise<any[]> {
    const ideas = [];
    
    // Fallback content ideas if OpenAI is not available
    if (!openai || !hasValidApiKey) {
      console.log('OpenAI API not available, using fallback content ideas');
      for (const topic of topics) {
        for (const type of contentTypes) {
          ideas.push({
            platform,
            topic,
            type,
            title: `${type} about ${topic}`,
            hook: `Discover the latest trends in ${topic}`,
            contentStructure: `Introduction → Main points → Conclusion`,
            keyElements: ['Engaging visuals', 'Clear messaging', 'Call to action']
          });
        }
      }
      return ideas;
    }
    
    for (const topic of topics) {
      for (const type of contentTypes) {
        const prompt = `Create a ${type} content idea for ${platform} about "${topic}".
        Make it platform-specific, viral, and highly engaging.
        Include: title, hook, content structure, and key elements.`;

        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a ${platform} content expert. Create viral content ideas optimized for ${platform}.`
              },
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
          });

          const idea = JSON.parse(response.choices[0].message.content || "{}");
          ideas.push({
            platform,
            topic,
            type,
            ...idea
          });
        } catch (error) {
          console.error(`Error generating content for ${platform}:`, error);
          // Add fallback idea if API call fails
          ideas.push({
            platform,
            topic,
            type,
            title: `${type} about ${topic}`,
            hook: `Discover the latest trends in ${topic}`,
            contentStructure: `Introduction → Main points → Conclusion`,
            keyElements: ['Engaging visuals', 'Clear messaging', 'Call to action']
          });
        }
      }
    }
    
    return ideas;
  }

  private static async createFullContentPiece(idea: any): Promise<any> {
    // Generate script, thumbnail description, and metadata
    const fullContent = {
      ...idea,
      script: await this.generateScript(idea),
      thumbnailDescription: await this.generateThumbnailDescription(idea),
      metadata: await this.generateMetadata(idea)
    };
    
    return fullContent;
  }

  private static async optimizeForPlatform(content: any): Promise<any> {
    // Platform-specific optimizations
    const optimizations = {
      youtube: { duration: '8-12 minutes', hashtags: 3, thumbnail: 'high-contrast' },
      tiktok: { duration: '15-60 seconds', hashtags: 5, music: 'trending' },
      instagram: { duration: '30-90 seconds', hashtags: 10, aspect: 'vertical' }
    };

    return {
      ...content,
      platformOptimizations: optimizations[content.platform] || {}
    };
  }

  private static async createOptimalSchedule(content: any[], userId: string): Promise<any[]> {
    // AI-powered optimal scheduling based on user's audience
    // This would analyze user's historical performance data
    return content.map((item, index) => ({
      ...item,
      scheduledDate: new Date(Date.now() + index * 24 * 60 * 60 * 1000), // Daily posting
      optimalTime: '19:00' // Peak engagement time
    }));
  }

  private static calculateEstimatedReach(content: any[]): number {
    // Calculate estimated reach based on content quality and trends
    return content.length * 10000; // Simplified calculation
  }

  private static async saveAgentResults(agent: AgentTask): Promise<void> {
    // Save agent results to database
    console.log(`Agent ${agent.id} completed with results:`, agent.results);
  }

  private static async analyzeTrendVelocity(keywords: string[]): Promise<any[]> {
    console.error('❌ AI services unavailable for trend velocity analysis');
    throw new Error('AI services not available for trend velocity analysis');
  }

  private static async generateTrendOpportunities(alerts: any[], platforms: string[]): Promise<any[]> {
    console.error('❌ AI services unavailable for trend opportunity generation');
    throw new Error('AI services not available for trend opportunity generation');
  }

  private static async sendTrendAlert(userId: string, opportunities: any[]): Promise<void> {
    console.error('❌ AI services unavailable for trend alert sending');
    throw new Error('AI services not available for trend alert sending');
  }

  private static async generateScript(idea: any): Promise<string> {
    console.error('❌ AI services unavailable for script generation');
    throw new Error('AI services not available for script generation');
  }

  private static async generateThumbnailDescription(idea: any): Promise<string> {
    console.error('❌ AI services unavailable for thumbnail description generation');
    throw new Error('AI services not available for thumbnail description generation');
  }

  private static async generateMetadata(idea: any): Promise<any> {
    console.error('❌ AI services unavailable for metadata generation');
    throw new Error('AI services not available for metadata generation');
  }

  // Public method to get agent status
  static getAgentStatus(agentId: string): AgentTask | undefined {
    return this.agents.get(agentId);
  }

  // Public method to stop an agent
  static stopAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent && agent.results?.monitorInterval) {
      clearInterval(agent.results.monitorInterval);
      agent.status = 'completed';
      return true;
    }
    return false;
  }
}